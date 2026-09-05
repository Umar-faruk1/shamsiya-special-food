import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Sparkles,
  Send,
  RotateCcw,
  Star,
  Plus,
  ChevronRight,
  ShoppingBag,
} from "lucide-react-native";
import { FoodItem } from "../types";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";
import { sendAIChatMessage } from "../api/aiClient";

interface RecommendationItem {
  food: FoodItem;
  reason: string;
  priceGhc: number;
}

interface MessageItem {
  id: string;
  role: "assistant" | "user" | "system";
  text: string;
  timestamp: string;
  recommendations?: RecommendationItem[];
  followUpQuestion?: {
    prompt: string;
    options: { label: string; action: string }[];
  };
  orderHistoryPrompt?: { dishName: string; orderDate: string; food: FoodItem };
  quickActions?: string[];
}

// Direct port of AIAssistantScreen.tsx. The backend fetch("/api/ai/chat")
// call in the web version is routed through a backend per the requested
// architecture — swap the mock fallback below for your real endpoint.
export default function AIAssistantScreen() {
  const navigation = useRouter();
  const { foodItems, handleAddToCartQuick, user } = useApp();

  const initialMessages: MessageItem[] = [
    {
      id: "msg-0",
      role: "assistant",
      text: "Hi! 👋 What are you craving today?",
      timestamp: "Just now",
      quickActions: [
        "Something spicy",
        "Under GH₵30",
        "Chicken meals",
        "Healthy food",
        "Popular today",
      ],
    },
    {
      id: "msg-history-hint",
      role: "assistant",
      text: "You ordered Jollof Rice last week. Would you like to order it again?",
      timestamp: "Just now",
      orderHistoryPrompt: {
        dishName: "Shamsiya Special Jollof Rice",
        orderDate: "Last week",
        food: foodItems[1] || foodItems[0],
      },
    },
  ];

  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeExcludedMeat, setActiveExcludedMeat] = useState<string | null>(
    null,
  );
  const scrollRef = useRef<ScrollView>(null);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, role: "user", text, timestamp: now() },
    ]);
    setInputMessage("");
    setIsLoading(true);

    const lower = text.toLowerCase();

    if (
      lower.includes("don't like chicken") ||
      lower.includes("no chicken") ||
      lower.includes("hate chicken")
    ) {
      setTimeout(() => {
        setActiveExcludedMeat("chicken");
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            text: "Got it! I have saved your preference. I will exclude chicken from all recommendations.",
            timestamp: now(),
            recommendations: [
              {
                food: foodItems[2] || foodItems[0],
                reason:
                  "100% Chicken-free tender prime beef suya with authentic Yaji spices.",
                priceGhc: 45,
              },
              {
                food: foodItems[6] || foodItems[0],
                reason:
                  "Delicious vegetarian option with spiced chickpeas & mint chutney.",
                priceGhc: 28,
              },
            ],
            followUpQuestion: {
              prompt: "Would you like something spicy instead?",
              options: [
                { label: "Yes, show spicy food", action: "ask_spicy" },
                { label: "No, keep these", action: "keep_these" },
              ],
            },
          },
        ]);
        setIsLoading(false);
      }, 700);
      return;
    }

    if (
      lower.includes("under gh") ||
      lower.includes("under 50") ||
      lower.includes("under 30") ||
      lower.includes("filling")
    ) {
      setTimeout(() => {
        const recList: RecommendationItem[] = [
          {
            food: foodItems[1] || foodItems[0],
            reason: "Popular and filling.",
            priceGhc: 35,
          },
          {
            food: foodItems[2] || foodItems[0],
            reason: "Rich in protein, charcoal grilled, and deeply satisfying.",
            priceGhc: 45,
          },
          {
            food: foodItems[6] || foodItems[0],
            reason: "Budget-friendly, savory, and quick to prepare.",
            priceGhc: 25,
          },
        ];
        const filtered =
          activeExcludedMeat === "chicken"
            ? recList.filter(
                (r) => !r.food.name.toLowerCase().includes("chicken"),
              )
            : recList;

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            text: "Absolutely! Here are some filling meals under GH₵50.",
            timestamp: now(),
            recommendations: filtered,
            followUpQuestion: {
              prompt: "Would you like something spicy instead?",
              options: [
                { label: "Yes, show spicy food", action: "ask_spicy" },
                { label: "No, keep these", action: "keep_these" },
              ],
            },
          },
        ]);
        setIsLoading(false);
      }, 650);
      return;
    }

    if (
      lower.includes("spicy") ||
      lower.includes("hot") ||
      lower.includes("pepper")
    ) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            text: "Here are our top spicy favorites packed with authentic northern and west African heat:",
            timestamp: now(),
            recommendations: [
              {
                food: foodItems[2] || foodItems[0],
                reason: "Fiery Yaji pepper rub and flame-grilled skewers.",
                priceGhc: 42,
              },
              {
                food: foodItems[7] || foodItems[0],
                reason: "Wok-tossed with scotch bonnet chili oil glaze.",
                priceGhc: 48,
              },
            ],
            followUpQuestion: {
              prompt:
                "Would you like a cooling drink like Mango Lassi to pair with it?",
              options: [
                { label: "Yes, add Mango Lassi", action: "pair_drink" },
                { label: "No, just the food", action: "keep_these" },
              ],
            },
          },
        ]);
        setIsLoading(false);
      }, 650);
      return;
    }

    // Fallback: routed through the app's own backend (see src/api/aiClient.ts),
    // which proxies to Gemini rather than calling it directly from the client.
    try {
      const { reply } = await sendAIChatMessage(text, user.dietaryPreferences);
      let pickedFoods: RecommendationItem[] = [
        {
          food: foodItems[0],
          reason: "Chef's signature slow-cooked masterpiece.",
          priceGhc: 55,
        },
        { food: foodItems[1], reason: "Popular and filling.", priceGhc: 35 },
      ];
      if (activeExcludedMeat === "chicken") {
        pickedFoods = pickedFoods.filter(
          (f) => !f.food.name.toLowerCase().includes("chicken"),
        );
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          text: reply || "Here are some delicious choices tailored for you!",
          timestamp: now(),
          recommendations: pickedFoods,
          followUpQuestion: {
            prompt: "Would you like something spicy instead?",
            options: [
              { label: "Yes, show spicy food", action: "ask_spicy" },
              { label: "No, keep these", action: "keep_these" },
            ],
          },
        },
      ]);
    } catch (err) {
      // Backend not reachable yet — fall back to a friendly canned response.
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          text: "Here are some popular options freshly cooked today:",
          timestamp: now(),
          recommendations: [
            {
              food: foodItems[1],
              reason: "Popular and filling.",
              priceGhc: 35,
            },
            {
              food: foodItems[2],
              reason: "Smoky charcoal spiced skewers.",
              priceGhc: 45,
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpAction = (action: string) => {
    if (action === "ask_spicy") handleSendMessage("Yes, show spicy food");
    else if (action === "pair_drink")
      handleSendMessage("Add a cooling Alphonso Mango Lassi");
    else if (action === "keep_these") {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          text: "Perfect! You can tap 'View' to customize or 'Add' to place it in your basket.",
          timestamp: "Just now",
        },
      ]);
    }
  };

  const handleOrderAgain = (food: FoodItem) => {
    handleAddToCartQuick(food);
    navigation.push("/cart");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F7F4EE]"
    >
      <AppHeader currentScreen="AIAssistant" title="Shamsiya AI" showBack />

      {/* AI HEADER CARD */}
      <View className="mx-4 mt-3 mb-1 rounded-3xl overflow-hidden p-3.5 border border-[#E86A17]/30">
        <LinearGradient
          colors={["#2D1810", "#3D1E13", "#4A2417"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", inset: 0 }}
        />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <LinearGradient
                colors={["#E86A17", "#FFA028"]}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles width={20} height={20} color="#fff" />
              </LinearGradient>
              <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#2D1810]" />
            </View>

            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-black text-white">
                  Shamsiya AI
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <Text className="text-[10px] font-extrabold text-emerald-400">
                    Online
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                "Your personal food assistant."
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              setMessages(initialMessages);
              setActiveExcludedMeat(null);
            }}
            className="p-2 rounded-2xl bg-white/10"
            accessibilityLabel="Reset conversation"
          >
            <RotateCcw width={16} height={16} color="#D4D4D4" />
          </Pressable>
        </View>
      </View>

      {/* CHAT MESSAGES */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 8, gap: 16 }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <View key={msg.id} className={isUser ? "items-end" : "items-start"}>
              <View
                className={`flex-row items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
                style={{ maxWidth: "92%" }}
              >
                <View
                  className={`w-7 h-7 rounded-xl items-center justify-center ${
                    isUser ? "bg-[#613D2D]" : "bg-[#E86A17]"
                  }`}
                >
                  <Sparkles width={14} height={14} color="#fff" />
                </View>

                <View className={isUser ? "items-end" : "items-start"}>
                  <View
                    className={`p-3.5 rounded-3xl ${
                      isUser
                        ? "bg-[#2D1810]"
                        : "bg-white border border-[#613D2D]/12"
                    }`}
                  >
                    <Text
                      className={`text-xs leading-relaxed ${
                        isUser ? "text-white" : "text-[#2D1810]"
                      }`}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  <Text className="text-[9px] text-neutral-400 font-medium mt-1 px-1">
                    {msg.timestamp}
                  </Text>
                </View>
              </View>

              {/* Quick actions */}
              {msg.quickActions ? (
                <View
                  className="flex-row flex-wrap gap-1.5 mt-2.5"
                  style={{ paddingLeft: 36 }}
                >
                  {msg.quickActions.map((qa, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSendMessage(qa)}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#613D2D]/15"
                    >
                      <Text className="text-xs font-bold text-[#2D1810]">
                        {qa}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* Order history prompt */}
              {msg.orderHistoryPrompt ? (
                <View
                  className="mt-3 w-full"
                  style={{ paddingLeft: 36, maxWidth: 340 }}
                >
                  <View className="p-3.5 bg-white rounded-3xl border-2 border-[#E86A17]/25 gap-2.5">
                    <View className="flex-row items-center gap-2.5">
                      <Image
                        source={{ uri: msg.orderHistoryPrompt.food.image }}
                        style={{ width: 48, height: 48, borderRadius: 12 }}
                      />
                      <View>
                        <Text className="text-[10px] font-extrabold text-[#E86A17] uppercase tracking-wider">
                          Previous Order
                        </Text>
                        <Text className="text-xs font-bold text-[#2D1810]">
                          {msg.orderHistoryPrompt.dishName}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 pt-1 border-t border-neutral-100">
                      <Pressable
                        onPress={() =>
                          handleOrderAgain(msg.orderHistoryPrompt!.food)
                        }
                        className="flex-1 py-2 rounded-xl bg-[#E86A17] flex-row items-center justify-center gap-1"
                      >
                        <ShoppingBag width={12} height={12} color="#fff" />
                        <Text className="text-white text-xs font-black">
                          Order Again
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          handleSendMessage(
                            "Show me something completely new and exciting!",
                          )
                        }
                        className="flex-1 py-2 rounded-xl bg-[#F4EFE6] items-center"
                      >
                        <Text className="text-[#2D1810] text-xs font-bold">
                          Show Something New
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Recommendation cards */}
              {msg.recommendations && msg.recommendations.length > 0 ? (
                <View
                  className="mt-3 gap-2.5 w-full"
                  style={{ paddingLeft: 36, maxWidth: 360 }}
                >
                  {msg.recommendations.map((rec, rIdx) => (
                    <View
                      key={rIdx}
                      className="p-3 bg-white rounded-3xl border border-[#613D2D]/15 gap-2.5"
                    >
                      <View className="flex-row gap-3">
                        <Image
                          source={{ uri: rec.food.image }}
                          style={{ width: 64, height: 64, borderRadius: 16 }}
                        />
                        <View className="flex-1">
                          <View className="flex-row items-start justify-between">
                            <Text
                              numberOfLines={1}
                              className="text-xs font-black text-[#2D1810] flex-1"
                            >
                              {rec.food.name}
                            </Text>
                            <Text className="text-xs font-black text-[#E86A17]">
                              GH₵{rec.priceGhc}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Star
                              width={12}
                              height={12}
                              color="#FBBF24"
                              fill="#FBBF24"
                            />
                            <Text className="text-[11px] font-bold text-[#2D1810]">
                              {rec.food.rating}
                            </Text>
                            <Text className="text-[10px] text-[#8E7668]">
                              • {rec.food.prepTime}
                            </Text>
                          </View>

                          <View className="mt-1 flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 self-start">
                            <Sparkles width={10} height={10} color="#E86A17" />
                            <Text
                              numberOfLines={1}
                              className="text-[10px] font-semibold text-amber-800"
                            >
                              AI Reason: "{rec.reason}"
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2 pt-1 border-t border-neutral-100">
                        <Pressable
                          onPress={() =>
                            navigation.push({
                              pathname: "/food-details-modal",
                              params: { foodId: rec.food.id },
                            })
                          }
                          className="flex-1 py-2 rounded-xl bg-[#F4EFE6] flex-row items-center justify-center gap-1"
                        >
                          <Text className="text-[#2D1810] text-xs font-bold">
                            View
                          </Text>
                          <ChevronRight
                            width={14}
                            height={14}
                            color="#2D1810"
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleAddToCartQuick(rec.food)}
                          className="flex-1 py-2 rounded-xl bg-[#E86A17] flex-row items-center justify-center gap-1"
                        >
                          <Plus
                            width={14}
                            height={14}
                            color="#fff"
                            strokeWidth={3}
                          />
                          <Text className="text-white text-xs font-black">
                            Add
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Follow-up prompt */}
              {msg.followUpQuestion ? (
                <View
                  className="mt-2.5 gap-1.5 w-full"
                  style={{ paddingLeft: 36, maxWidth: 340 }}
                >
                  <Text className="text-[11px] font-bold text-[#613D2D]">
                    {msg.followUpQuestion.prompt}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {msg.followUpQuestion.options.map((opt, oIdx) => (
                      <Pressable
                        key={oIdx}
                        onPress={() => handleFollowUpAction(opt.action)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#613D2D]/20"
                      >
                        <Text className="text-xs font-bold text-[#2D1810]">
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        {isLoading ? (
          <View
            className="flex-row items-center gap-2 bg-white p-3 rounded-2xl border border-[#613D2D]/10 self-start"
            style={{ marginLeft: 36 }}
          >
            <View className="flex-row gap-1">
              <View className="w-2 h-2 rounded-full bg-[#E86A17]" />
              <View className="w-2 h-2 rounded-full bg-[#E86A17]" />
              <View className="w-2 h-2 rounded-full bg-[#E86A17]" />
            </View>
            <Text className="text-xs font-bold text-[#2D1810]">
              Shamsiya AI is thinking...
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* CHAT INPUT */}
      <View className="px-4 pb-3 pt-2 bg-[#FDFBF7]">
        <View className="flex-row items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#613D2D]/15">
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask AI: 'I want something filling under GH₵50'..."
            placeholderTextColor="rgba(142,118,104,0.7)"
            className="flex-1 px-3 py-2 text-xs text-[#2D1810] font-medium"
            onSubmitEditing={() => handleSendMessage()}
          />
          <Pressable
            onPress={() => handleSendMessage()}
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
