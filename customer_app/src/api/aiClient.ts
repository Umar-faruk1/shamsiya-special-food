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
  imagePath: string,
): Promise<FoodRecognitionResponse> {
  const imageResponse = await fetch(imageUri);
  if (!imageResponse.ok)
    throw new Error("The selected image could not be read.");
  const blob = await imageResponse.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  const mimeType = blob.type || getMimeType(imageUri);
  const imageBase64 = btoa(binary);
  const { error: uploadError } = await supabase.storage
    .from("food-scans")
    .upload(imagePath, blob, { contentType: mimeType, upsert: false });

  if (uploadError)
    throw new Error(
      "We couldn't upload your image. Please check your connection and try again.",
    );

  const { data, error } =
    await supabase.functions.invoke<FoodRecognitionResponse>(
      "food-recognition",
      {
        body: {
          image_base64: imageBase64,
          mime_type: mimeType,
          image_path: imagePath,
        },
      },
    );
  if (error) {
    await supabase.storage.from("food-scans").remove([imagePath]);
    const message = error.message?.toLowerCase() || "";
    if (
      message.includes("401") ||
      message.includes("unauthorized") ||
      message.includes("auth")
    ) {
      throw new Error("Please sign in again to use Food Scan.");
    }
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connect")
    ) {
      throw new Error("Please check your internet connection and try again.");
    }
    throw new Error(
      "We couldn't recognize the food right now. Please try another photo.",
    );
  }
  if (!data?.success || !data.recognition || !data.scan) {
    await supabase.storage.from("food-scans").remove([imagePath]);
    throw new Error(
      "We couldn't recognize the food right now. Please try another photo.",
    );
  }
  return data;
}

function getMimeType(uri: string) {
  const extension = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

export type MatchedMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: string[] | null;
  available?: boolean;
  featured?: boolean;
  review_count?: number;
  preparation_time: number | null;
  rating: number | null;
  calories?: number | null;
};

export type FoodScan = {
  id: string;
  user_id: string;
  image_path: string | null;
  recognized_food: string | null;
  confidence: number | null;
  matched_menu_item_ids: string[] | null;
  created_at: string;
};

export type RecognitionResult = {
  recognized_food: string | null;
  confidence: number;
  matched_menu_item_ids: string[];
  reason: string;
};

export type FoodRecognitionResponse = {
  success: boolean;
  scan: FoodScan;
  recognition: RecognitionResult;
  matched_menu_items: MatchedMenuItem[];
};
