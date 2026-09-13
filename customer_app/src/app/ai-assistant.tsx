import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Plus,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";
import { AIRecommendation, sendAIChatMessage } from "../api/aiClient";
import type { FoodItem } from "../types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at?: string;
  recommendations?: AIRecommendation[];
};

const quickPrompts = [
  "What do you recommend for lunch?",
  "What can I get for GH₵40?",
  "Do you have chicken meals?",
  "What is the cheapest meal?",
];

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("401")
  )
    return "Please sign in to use Shamsiya AI.";
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connect")
  )
    return "Unable to connect to Shamsiya AI. Please check your internet connection and try again.";
  return "We could not process your message right now. Please try again.";
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const { foodItems, handleAddToCartQuick, authUser } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (value?: string) => {
    const message = (value ?? inputMessage).trim();
    if (!message || isLoading) return;
    if (!authUser) {
      setError("Please sign in to use Shamsiya AI.");
      return;
    }

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", message, created_at: now() },
    ]);
    setInputMessage("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await sendAIChatMessage(message, conversationId);
      setConversationId(response.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: response.message.id,
          role: "assistant",
          message: response.message.message,
          created_at: response.message.created_at,
          recommendations:
            response.message.recommendations ?? response.recommendations ?? [],
        },
      ]);
    } catch (requestError) {
      console.error("Unable to send AI chat message:", requestError);
      setError(errorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    if (isLoading) return;
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const findFood = (recommendation: AIRecommendation): FoodItem | undefined =>
    foodItems.find((food) => food.id === recommendation.menu_item_id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F7F4EE]"
    >
      <AppHeader currentScreen="AIAssistant" title="Shamsiya AI" showBack />
      <View className="mx-4 mt-3 mb-1 rounded-3xl overflow-hidden p-3.5 border border-[#E86A17]/30">
        <LinearGradient
          colors={["#2D1810", "#3D1E13", "#4A2417"]}
          style={{ position: "absolute", inset: 0 }}
        />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-[#E86A17] items-center justify-center">
              <Sparkles width={20} height={20} color="#fff" />
            </View>
            <View>
              <Text className="text-sm font-black text-white">Shamsiya AI</Text>
              <Text className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                Ask about the current menu.
              </Text>
            </View>
          </View>
          <Pressable
            onPress={resetConversation}
            disabled={isLoading}
            className="p-2 rounded-2xl bg-white/10"
            accessibilityLabel="Start new conversation"
          >
            <RotateCcw width={16} height={16} color="#D4D4D4" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 8, gap: 16 }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {!messages.length ? (
          <View className="gap-3 py-4">
            <Text className="text-center text-sm font-bold text-[#2D1810]">
              What would you like to discover?
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => void sendMessage(prompt)}
                  className="rounded-full border border-[#613D2D]/15 bg-white px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-[#2D1810]">
                    {prompt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {messages.map((item) => {
          const isUser = item.role === "user";
          return (
            <View
              key={item.id}
              className={isUser ? "items-end" : "items-start"}
            >
              <View
                className={`flex-row items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
                style={{ maxWidth: "92%" }}
              >
                <View
                  className={`w-7 h-7 rounded-xl items-center justify-center ${isUser ? "bg-[#613D2D]" : "bg-[#E86A17]"}`}
                >
                  <Sparkles width={14} height={14} color="#fff" />
                </View>
                <View className="flex-1">
                  <View
                    className={`p-3.5 rounded-3xl ${isUser ? "bg-[#2D1810]" : "bg-white border border-[#613D2D]/12"}`}
                  >
                    <Text
                      className={`text-xs leading-relaxed ${isUser ? "text-white" : "text-[#2D1810]"}`}
                    >
                      {item.message}
                    </Text>
                  </View>
                  <Text className="text-[9px] text-neutral-400 font-medium mt-1 px-1">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : now()}
                  </Text>
                </View>
              </View>
              {!isUser && item.recommendations?.length ? (
                <View
                  className="mt-3 gap-2.5 w-full"
                  style={{ paddingLeft: 36, maxWidth: 380 }}
                >
                  <Text className="text-xs font-extrabold uppercase tracking-wider text-[#2D1810]">
                    Recommended for you
                  </Text>
                  {item.recommendations.map((recommendation) => {
                    const food = findFood(recommendation);
                    return (
                      <View
                        key={recommendation.menu_item_id}
                        className="gap-2.5 rounded-3xl border border-[#613D2D]/15 bg-white p-3"
                      >
                        <View className="flex-row gap-3">
                          {food?.image ? (
                            <Image
                              source={{ uri: food.image }}
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                              }}
                            />
                          ) : (
                            <View className="h-16 w-16 rounded-2xl bg-[#F4EFE6] items-center justify-center">
                              <ShoppingBag
                                width={20}
                                height={20}
                                color="#E86A17"
                              />
                            </View>
                          )}
                          <View className="flex-1">
                            <View className="flex-row items-start justify-between gap-2">
                              <Text className="flex-1 text-xs font-black text-[#2D1810]">
                                {recommendation.name}
                              </Text>
                              {recommendation.price !== undefined ? (
                                <Text className="text-xs font-black text-[#E86A17]">
                                  GH₵{recommendation.price}
                                </Text>
                              ) : null}
                            </View>
                            {food ? (
                              <View className="flex-row items-center gap-1.5 mt-0.5">
                                <Star
                                  width={12}
                                  height={12}
                                  color="#FBBF24"
                                  fill="#FBBF24"
                                />
                                <Text className="text-[11px] font-bold text-[#2D1810]">
                                  {food.rating}
                                </Text>
                              </View>
                            ) : null}
                            <Text className="mt-1 text-[10px] leading-relaxed text-amber-800">
                              {recommendation.reason}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2 border-t border-neutral-100 pt-1">
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: "/food-details-modal",
                                params: { foodId: recommendation.menu_item_id },
                              })
                            }
                            className="flex-1 rounded-xl bg-[#F4EFE6] py-2 flex-row items-center justify-center gap-1"
                          >
                            <Text className="text-xs font-bold text-[#2D1810]">
                              View
                            </Text>
                            <ChevronRight
                              width={14}
                              height={14}
                              color="#2D1810"
                            />
                          </Pressable>
                          {food ? (
                            <Pressable
                              onPress={() => handleAddToCartQuick(food)}
                              className="flex-1 rounded-xl bg-[#E86A17] py-2 flex-row items-center justify-center gap-1"
                            >
                              <Plus width={14} height={14} color="#fff" />
                              <Text className="text-xs font-black text-white">
                                Add
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
        {isLoading ? (
          <View
            className="flex-row items-center gap-2 self-start rounded-2xl border border-[#613D2D]/10 bg-white p-3"
            style={{ marginLeft: 36 }}
          >
            <View className="flex-row gap-1">
              <View className="h-2 w-2 rounded-full bg-[#E86A17]" />
              <View className="h-2 w-2 rounded-full bg-[#E86A17]" />
              <View className="h-2 w-2 rounded-full bg-[#E86A17]" />
            </View>
            <Text className="text-xs font-bold text-[#2D1810]">
              Shamsiya AI is thinking...
            </Text>
          </View>
        ) : null}
        {error ? (
          <View className="rounded-2xl bg-red-50 p-3">
            <Text className="text-xs text-red-800">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pb-3 pt-2 bg-[#FDFBF7]">
        <View className="flex-row items-center gap-2 rounded-2xl border border-[#613D2D]/15 bg-white p-1.5">
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask about the menu..."
            placeholderTextColor="rgba(142,118,104,0.7)"
            className="flex-1 px-3 py-2 text-xs text-[#2D1810] font-medium"
            onSubmitEditing={() => void sendMessage()}
            editable={!isLoading}
          />
          <Pressable
            onPress={() => void sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            style={{ opacity: !inputMessage.trim() || isLoading ? 0.4 : 1 }}
            className="w-9 h-9 rounded-xl bg-[#E86A17] items-center justify-center"
            accessibilityLabel="Send message"
          >
            <Send width={16} height={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
