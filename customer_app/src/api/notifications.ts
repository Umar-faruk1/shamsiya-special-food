import { supabase } from "./supabase";

export type CustomerNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

const notificationColumns =
  "id,user_id,title,message,type,related_id,is_read,created_at";

export async function fetchCustomerNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select(notificationColumns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerNotification[];
}

export async function markCustomerNotificationRead(
  notificationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select(notificationColumns)
    .single();
  if (error) throw error;
  return data as CustomerNotification;
}

export async function markAllCustomerNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}
