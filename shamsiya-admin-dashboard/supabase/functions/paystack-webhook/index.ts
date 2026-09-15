import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

type PaystackPayload = {
  event?: unknown;
  data?: {
    reference?: unknown;
    amount?: unknown;
    currency?: unknown;
    status?: unknown;
  };
};

type PaymentRow = {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number | string;
  method: string;
  status: string;
  transaction_id: string | null;
  provider: string | null;
};

type OrderRow = {
  id: string;
  customer_id: string;
  payment_method: string | null;
};

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function serviceClient() {
  return createClient(
    requiredEnvironment("SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(left: string, right: string) {
  const leftBytes = hexToBytes(left);
  const rightBytes = hexToBytes(right);
  if (!leftBytes || !rightBytes || leftBytes.length !== rightBytes.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

async function verifySignature(rawBody: string, signature: string) {
  const secret = requiredEnvironment("PAYSTACK_SECRET_KEY");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  return timingSafeEqual(bytesToHex(digest), signature.trim().toLowerCase());
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ success: false, error: "Method Not Allowed" }, 405);
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) {
    return json({ success: false, error: "Invalid signature" }, 401);
  }

  try {
    if (!(await verifySignature(rawBody, signature))) {
      return json({ success: false, error: "Invalid signature" }, 401);
    }
  } catch (error) {
    console.error("Paystack signature verification failed:", error);
    return json(
      { success: false, error: "Unable to verify webhook signature" },
      500,
    );
  }

  let payload: PaystackPayload;
  try {
    payload = JSON.parse(rawBody) as PaystackPayload;
  } catch {
    return json({ success: false, error: "Invalid webhook payload" }, 400);
  }

  if (payload.event !== "charge.success") {
    console.log("Paystack event ignored:", payload.event ?? "unknown");
    return json({ success: true, processed: false });
  }

  const data = payload.data;
  const reference = typeof data?.reference === "string" ? data.reference : "";
  const amount = Number(data?.amount);
  const currency = data?.currency;
  const paystackStatus = data?.status;

  if (
    !reference ||
    !Number.isFinite(amount) ||
    currency !== "GHS" ||
    paystackStatus !== "success"
  ) {
    return json({ success: false, error: "Invalid webhook payload" }, 400);
  }

  try {
    const client = serviceClient();
    const { data: payment, error: paymentLookupError } = await client
      .from("payments")
      .select(
        "id,order_id,customer_id,amount,method,status,transaction_id,provider",
      )
      .eq("transaction_id", reference)
      .eq("provider", "paystack")
      .eq("method", "mobile_money")
      .maybeSingle();

    if (paymentLookupError) {
      console.error("Payment lookup failed:", paymentLookupError);
      return json({ success: false, error: "Unable to process webhook" }, 500);
    }
    if (!payment) {
      console.log("Paystack payment reference not found:", reference);
      return json({ success: true, processed: false });
    }

    const typedPayment = payment as PaymentRow;
    if (typedPayment.transaction_id !== reference) {
      console.error("Payment reference mismatch:", typedPayment.id);
      return json({ success: false, error: "Invalid webhook payload" }, 400);
    }

    const expectedAmount = Math.round(Number(typedPayment.amount) * 100);
    if (!Number.isFinite(expectedAmount) || expectedAmount !== amount) {
      console.error("Paystack amount mismatch:", typedPayment.id, reference);
      return json({ success: false, error: "Payment amount mismatch" }, 400);
    }

    const { data: order, error: orderLookupError } = await client
      .from("orders")
      .select("id,customer_id,payment_method")
      .eq("id", typedPayment.order_id)
      .maybeSingle();

    if (orderLookupError) {
      console.error("Order lookup failed:", orderLookupError);
      return json({ success: false, error: "Unable to process webhook" }, 500);
    }
    if (!order) {
      console.error("Payment order not found:", typedPayment.id);
      return json({ success: false, error: "Invalid webhook payload" }, 400);
    }

    const typedOrder = order as OrderRow;
    if (
      typedPayment.order_id !== typedOrder.id ||
      typedOrder.customer_id !== typedPayment.customer_id ||
      typedOrder.payment_method !== "mobile_money"
    ) {
      console.error("Payment/order relationship invalid:", typedPayment.id);
      return json({ success: false, error: "Invalid webhook payload" }, 400);
    }

    if (typedPayment.status === "successful") {
      console.log("Paystack payment already processed:", typedPayment.id);
      return json({
        success: true,
        processed: false,
        message: "Payment already processed",
      });
    }

    const { error: paymentUpdateError } = await client
      .from("payments")
      .update({ status: "successful", paid_at: new Date().toISOString() })
      .eq("id", typedPayment.id);

    if (paymentUpdateError) {
      console.error("Payment update failed:", paymentUpdateError);
      return json({ success: false, error: "Unable to process webhook" }, 500);
    }

    const { error: orderUpdateError } = await client
      .from("orders")
      .update({ payment_status: "successful" })
      .eq("id", typedOrder.id);

    if (orderUpdateError) {
      console.error("Order payment status update failed:", orderUpdateError);
      return json({ success: false, error: "Unable to process webhook" }, 500);
    }

    console.log("Paystack payment processed:", {
      reference,
      paymentId: typedPayment.id,
      orderId: typedOrder.id,
    });
    return json({ success: true, processed: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);
    return json({ success: false, error: "Unable to process webhook" }, 500);
  }
});
