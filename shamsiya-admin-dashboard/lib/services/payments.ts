import { supabase } from "@/lib/supabase/client";

export type PaymentMethod = "cash" | "mobile_money" | "card";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "refunded";

export type Payment = {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id: string | null;
  provider: string | null;
  paid_at: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  order: {
    id: string;
    order_number: string | null;
    status: string | null;
    total: number | null;
    created_at: string | null;
  } | null;
};

const paymentSelect = `
  *,
  customer:profiles!payments_customer_id_fkey (
    id,
    full_name,
    email,
    phone
  ),
  order:orders!payments_order_id_fkey (
    id,
    order_number,
    status,
    total,
    created_at
  )
`;

export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(paymentSelect)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function getPayment(id: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from("payments")
    .select(paymentSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Payment | null) ?? null;
}
