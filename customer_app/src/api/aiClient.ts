import { supabase } from "./supabase";

export type AIChatRequest = {
  conversation_id?: string | null;
  message: string;
};

export type AIRecommendation = {
  menu_item_id: string;
  name: string;
  reason: string;
  price?: number;
};

export type AIMessageResponse = {
  id: string;
  conversation_id: string;
  role: "assistant";
  message: string;
  recommendations: AIRecommendation[];
  created_at: string;
};

export type AIChatResponse = {
  success: boolean;
  conversation_id: string;
  message: AIMessageResponse;
  recommendations?: AIRecommendation[];
};

export async function sendAIChatMessage(
  message: string,
  conversationId?: string | null,
): Promise<AIChatResponse> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) throw new Error("Message is required.");

  const { data, error } = await supabase.functions.invoke<AIChatResponse>(
    "ai-chat",
    {
      body: {
        conversation_id: conversationId ?? null,
        message: trimmedMessage,
      } satisfies AIChatRequest,
    },
  );

  if (error) throw error;
  if (!data?.success || !data.message?.message) {
    throw new Error("The AI service returned an empty response.");
  }

  return {
    ...data,
    message: {
      ...data.message,
      recommendations: data.message.recommendations ?? [],
    },
  };
}

export async function sendAIFoodScan(
  imageUri: string,
  hint?: string,
): Promise<any> {
  const response = await fetch("https://your-backend.example.com/api/ai/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUri, hint }),
  });
  if (!response.ok)
    throw new Error(`AI scan request failed: ${response.status}`);
  return response.json();
}
