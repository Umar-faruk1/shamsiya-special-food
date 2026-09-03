import { supabase } from "@/lib/supabase/client";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationRecipient = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export type NotificationWithRecipient = Notification & {
  recipient: NotificationRecipient | null;
};

export type NotificationInput = {
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  related_id: string | null;
  is_read: boolean;
};

type NotificationQueryRow = Omit<NotificationWithRecipient, "recipient"> & {
  recipient: NotificationRecipient[] | NotificationRecipient | null;
};

const notificationSelect = `
  id,
  user_id,
  title,
  message,
  type,
  related_id,
  is_read,
  created_at,
  recipient:profiles!notifications_user_id_fkey (
    id,
    full_name,
    email,
    role
  )
`;

function notificationError(error: { code?: string; message?: string }) {
  if (error.code === "42501") {
    return new Error(
      "You do not have permission to manage notifications. Confirm that your profile is an active admin.",
    );
  }
  return new Error(error.message || "Unable to manage notifications.");
}

function normalizeNotification(
  row: NotificationQueryRow,
): NotificationWithRecipient {
  return {
    ...row,
    recipient: Array.isArray(row.recipient)
      ? (row.recipient[0] ?? null)
      : row.recipient,
  };
}

export async function getNotifications(): Promise<NotificationWithRecipient[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(notificationSelect)
    .order("created_at", { ascending: false });

  if (error) throw notificationError(error);
  return (data ?? []).map((row) =>
    normalizeNotification(row as NotificationQueryRow),
  );
}

export async function getNotification(
  id: string,
): Promise<NotificationWithRecipient | null> {
  const { data, error } = await supabase
    .from("notifications")
    .select(notificationSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw notificationError(error);
  return data ? normalizeNotification(data as NotificationQueryRow) : null;
}

export async function getNotificationRecipients(): Promise<
  NotificationRecipient[]
> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name", { ascending: true });

  if (error) throw notificationError(error);
  return (data ?? []) as NotificationRecipient[];
}

export async function createNotification(input: NotificationInput) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type,
      related_id: input.related_id,
      is_read: false,
    })
    .select(notificationSelect)
    .single();

  if (error) throw notificationError(error);
  return normalizeNotification(data as NotificationQueryRow);
}

export async function updateNotificationReadStatus(
  id: string,
  isRead: boolean,
) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: isRead })
    .eq("id", id)
    .select(notificationSelect)
    .single();

  if (error) throw notificationError(error);
  return normalizeNotification(data as NotificationQueryRow);
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw notificationError(error);
}
