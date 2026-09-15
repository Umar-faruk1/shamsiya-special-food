import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const providers = new Set(["mtn", "atl", "vod"]);

type Provider = "mtn" | "atl" | "vod";

type OrderRow = {
  id: string;
  customer_id: string;
  total: number | string;
  payment_method: string | null;
  payment_status: string;
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

type PaystackResponse = {
  status?: boolean;
  message?: string;
  data?: {
    reference?: string;
    status?: string;
    display_text?: string;
  };
};

function getEnvironment(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function getAuthenticatedClient(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const url = getEnvironment("SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!anonKey) throw new Error("Missing SUPABASE_ANON_KEY.");

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getServiceClient() {
  return createClient(
    getEnvironment("SUPABASE_URL"),
    getEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function safePaystackMessage(payload: PaystackResponse) {
  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message.trim()
    : "Paystack could not initiate the payment.";
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const authenticatedClient = getAuthenticatedClient(request);
    if (!authenticatedClient) {
      return json(
        { success: false, error: "Missing or invalid Authorization header." },
        401,
      );
    }

    const {
      data: { user },
      error: userError,
    } = await authenticatedClient.auth.getUser();
    if (userError || !user) {
      return json({ success: false, error: "Authentication failed." }, 401);
    }

    let body: { order_id?: unknown; phone?: unknown; provider?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json(
        { success: false, error: "Request body must be valid JSON." },
        400,
      );
    }

    if (typeof body.order_id !== "string" || !uuidPattern.test(body.order_id)) {
      return json(
        { success: false, error: "A valid order_id is required." },
        400,
      );
    }
    if (typeof body.phone !== "string" || !body.phone.trim()) {
      return json(
        { success: false, error: "A phone number is required." },
        400,
      );
    }
    if (typeof body.provider !== "string" || !providers.has(body.provider)) {
      return json(
        { success: false, error: "Provider must be mtn, atl, or vod." },
        400,
      );
    }

    const provider = body.provider as Provider;
    const serviceClient = getServiceClient();
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id,customer_id,total,payment_method,payment_status")
      .eq("id", body.order_id)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error("Unable to load payment order:", orderError);
      return json({ success: false, error: "Unable to load the order." }, 500);
    }
    if (!order) {
      return json({ success: false, error: "Order not found." }, 404);
    }

    const typedOrder = order as OrderRow;
    if (typedOrder.payment_method !== "mobile_money") {
      return json(
        { success: false, error: "This order is not a mobile money order." },
        400,
      );
    }

    const { data: payment, error: paymentError } = await serviceClient
      .from("payments")
      .select(
        "id,order_id,customer_id,amount,method,status,transaction_id,provider",
      )
      .eq("order_id", typedOrder.id)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (paymentError) {
      console.error("Unable to load payment:", paymentError);
      return json(
        { success: false, error: "Unable to load the payment." },
        500,
      );
    }
    if (!payment) {
      return json({ success: false, error: "Payment record not found." }, 404);
    }

    const typedPayment = payment as PaymentRow;
    if (typedPayment.method !== "mobile_money") {
      return json(
        {
          success: false,
          error: "This payment is not a mobile money payment.",
        },
        400,
      );
    }
    if (
      typedPayment.status === "successful" ||
      typedOrder.payment_status === "successful"
    ) {
      return json({
        success: true,
        payment: {
          order_id: typedOrder.id,
          payment_id: typedPayment.id,
          reference: typedPayment.transaction_id,
          status: "successful",
          paystack_status: "success",
          display_text: "This payment has already been completed.",
        },
      });
    }
    if (typedPayment.status === "processing" && typedPayment.transaction_id) {
      return json({
        success: true,
        payment: {
          order_id: typedOrder.id,
          payment_id: typedPayment.id,
          reference: typedPayment.transaction_id,
          status: "processing",
          paystack_status: "processing",
          display_text: "This payment is already being processed.",
        },
      });
    }

    const amount = Number(typedPayment.amount);
    const orderTotal = Number(typedOrder.total);
    if (
      !Number.isFinite(amount) ||
      !Number.isFinite(orderTotal) ||
      amount !== orderTotal
    ) {
      return json(
        { success: false, error: "Payment amount does not match the order." },
        400,
      );
    }
    if (amount <= 0) {
      return json(
        { success: false, error: "Payment amount must be greater than zero." },
        400,
      );
    }

    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      console.error("Unable to load customer profile:", profileError);
      return json(
        { success: false, error: "Unable to load customer details." },
        500,
      );
    }
    if (!profile?.email || typeof profile.email !== "string") {
      return json(
        { success: false, error: "A customer email is required for payment." },
        400,
      );
    }

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      console.error("PAYSTACK_SECRET_KEY is not configured.");
      return json(
        { success: false, error: "Payment service is not configured." },
        500,
      );
    }

    let paystackResponse: Response;
    try {
      paystackResponse = await fetch("https://api.paystack.co/charge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: profile.email,
          amount: Math.round(amount * 100),
          currency: "GHS",
          mobile_money: { phone: body.phone.trim(), provider },
        }),
      });
    } catch (paystackError) {
      console.error("Paystack request failed:", paystackError);
      return json(
        { success: false, error: "Unable to reach the payment provider." },
        502,
      );
    }

    let paystackPayload: PaystackResponse;
    try {
      paystackPayload = (await paystackResponse.json()) as PaystackResponse;
    } catch (parseError) {
      console.error("Malformed Paystack response:", parseError);
      return json(
        {
          success: false,
          error: "The payment provider returned an invalid response.",
        },
        502,
      );
    }

    const reference = paystackPayload.data?.reference;
    if (!paystackResponse.ok || paystackPayload.status !== true || !reference) {
      console.error(
        "Paystack charge failed:",
        paystackResponse.status,
        safePaystackMessage(paystackPayload),
      );
      return json(
        { success: false, error: safePaystackMessage(paystackPayload) },
        502,
      );
    }

    const paystackStatus = paystackPayload.data?.status ?? "processing";
    const displayText =
      paystackPayload.data?.display_text ??
      "Authorize the payment on your phone.";
    const { error: paymentUpdateError } = await serviceClient
      .from("payments")
      .update({
        transaction_id: reference,
        provider: "paystack",
        status: "processing",
      })
      .eq("id", typedPayment.id)
      .eq("customer_id", user.id);
    if (paymentUpdateError) {
      console.error(
        "Unable to update payment after Paystack initiation:",
        paymentUpdateError,
      );
      return json(
        {
          success: false,
          error: "Payment was initiated but could not be saved.",
        },
        500,
      );
    }

    const { error: orderUpdateError } = await serviceClient
      .from("orders")
      .update({ payment_status: "processing" })
      .eq("id", typedOrder.id)
      .eq("customer_id", user.id);
    if (orderUpdateError) {
      console.error("Unable to update order payment status:", orderUpdateError);
      return json(
        {
          success: false,
          error: "Payment was initiated but order status could not be saved.",
        },
        500,
      );
    }

    return json({
      success: true,
      payment: {
        order_id: typedOrder.id,
        payment_id: typedPayment.id,
        reference,
        status: "processing",
        paystack_status: paystackStatus,
        display_text: displayText,
      },
    });
  } catch (error) {
    console.error("Paystack initiation failed:", error);
    return json({ success: false, error: "Unable to initiate payment." }, 500);
  }
});
