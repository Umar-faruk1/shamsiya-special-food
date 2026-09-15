import { supabase } from "./supabase";
import { CustomerOrderForSupport, SupportTicket } from "../types";

const ticketColumns =
  "id,user_id,order_id,subject,description,category,status,attachment_path,created_at,updated_at";
const orderColumns = "id,order_number,status,total,created_at";

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to use support tickets.");
  return data.user.id;
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(ticketColumns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupportTicket[];
}

export async function getSupportTicket(id: string): Promise<SupportTicket> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(ticketColumns)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Support ticket not found.");
  return data as SupportTicket;
}

export async function getCustomerOrdersForSupport(): Promise<
  CustomerOrderForSupport[]
> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("orders")
    .select(orderColumns)
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerOrderForSupport[];
}

export async function createSupportTicket(input: {
  order_id: string | null;
  subject: string;
  description: string;
  category: string | null;
}): Promise<SupportTicket> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: userId, ...input })
    .select(ticketColumns)
    .single();
  if (error) throw error;
  return data as SupportTicket;
}

export async function getSupportOrder(
  orderId: string,
): Promise<CustomerOrderForSupport | null> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("orders")
    .select(orderColumns)
    .eq("id", orderId)
    .eq("customer_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as CustomerOrderForSupport | null) ?? null;
}
