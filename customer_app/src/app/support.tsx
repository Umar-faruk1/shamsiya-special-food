import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Plus,
  Trash2,
  MessageSquare,
  Phone,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ShoppingBag,
  CreditCard,
  Truck,
  UserRound,
  Ticket,
  Headphones,
} from "lucide-react-native";
import { UserAddress, PaymentMethod } from "../types";
import {
  AddressCard,
  PaymentMethodCard,
  BottomSheet,
} from "../components/CommonModalsAndCards";
import { PrimaryButton } from "../components/Buttons";
import { AppHeader } from "../components/AppHeader";
import { useApp } from "../context/AppContext";

// Direct port of SupportScreens.tsx (6 screens). Each is wrapped with
// AppHeader + ScrollView since they're pushed as standalone stack screens.

// ---------- ADDRESSES ----------
export function AddressesScreen() {
  const {
    user,
    handleAddAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
  } = useApp();
  const addresses = user.savedAddresses;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [label, setLabel] = useState<UserAddress["label"]>("Home");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Downtown");
  const [phone, setPhone] = useState("+1 (555) 019-2834");

  const handleSave = () => {
    if (!street.trim()) return;
    const newAddr: UserAddress = {
      id: `addr-${Date.now()}`,
      label,
      recipientName: user.name,
      street,
      apartment,
      city,
      postalCode: "75001",
      phone,
      isDefault: addresses.length === 0,
    };
    handleAddAddress(newAddr);
    setIsAddOpen(false);
    setStreet("");
    setApartment("");
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Addresses"
        title="Delivery Addresses"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Delivery Locations ({addresses.length})
          </Text>
          <Pressable
            onPress={() => setIsAddOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#2D1810] flex-row items-center gap-1"
          >
            <Plus width={14} height={14} color="#fff" />
            <Text className="text-white text-xs font-bold">Add Address</Text>
          </Pressable>
        </View>

        <View className="gap-2.5">
          {addresses.map((addr) => (
            <View key={addr.id} className="relative">
              <AddressCard
                address={addr}
                isSelected={addr.isDefault}
                onSelect={() => handleSetDefaultAddress(addr.id)}
              />
              {addresses.length > 1 ? (
                <Pressable
                  onPress={() => handleDeleteAddress(addr.id)}
                  className="absolute top-3 right-3 p-1"
                  accessibilityLabel="Delete address"
                >
                  <Trash2 width={14} height={14} color="#A3A3A3" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Delivery Address"
      >
        <View className="gap-3">
          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Address Label (e.g. Home, Work, Gym)
            </Text>
            <TextInput
              value={label}
              onChangeText={(value) => {
                if (
                  value === "Home" ||
                  value === "Work" ||
                  value === "Partner" ||
                  value === "Other"
                ) {
                  setLabel(value);
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Street Address
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="e.g. 742 Evergreen Terrace"
              placeholderTextColor="rgba(142,118,104,0.6)"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Apartment / Suite / Floor
            </Text>
            <TextInput
              value={apartment}
              onChangeText={setApartment}
              placeholder="e.g. Apt 4B, 4th Floor"
              placeholderTextColor="rgba(142,118,104,0.6)"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Contact Phone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <PrimaryButton fullWidth onPress={handleSave}>
            Save Address
          </PrimaryButton>
        </View>
      </BottomSheet>
    </View>
  );
}

// ---------- PAYMENT METHODS ----------
export function PaymentMethodsScreen() {
  const { user, handleAddPayment, handleSetDefaultPayment } = useApp();
  const paymentMethods = user.savedPaymentMethods;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState("Faruk Ahmed");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("09/27");

  const handleSaveCard = () => {
    if (!cardNumber.trim()) return;
    const last4 = cardNumber.slice(-4) || "8832";
    const newPm: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: "card",
      title: "Visa Premium Debit",
      last4,
      expiry,
      isDefault: false,
    };
    handleAddPayment(newPm);
    setIsAddOpen(false);
    setCardNumber("");
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="PaymentMethods"
        title="Payment Methods"
        showBack
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Payment Methods ({paymentMethods.length})
          </Text>
          <Pressable
            onPress={() => setIsAddOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#2D1810] flex-row items-center gap-1"
          >
            <Plus width={14} height={14} color="#fff" />
            <Text className="text-white text-xs font-bold">Add Card</Text>
          </Pressable>
        </View>

        <View className="gap-2.5">
          {paymentMethods.map((pm) => (
            <PaymentMethodCard
              key={pm.id}
              payment={pm}
              isSelected={pm.isDefault}
              onSelect={() => handleSetDefaultPayment(pm.id)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Credit / Debit Card"
      >
        <View className="gap-3">
          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Cardholder Name
            </Text>
            <TextInput
              value={cardHolder}
              onChangeText={setCardHolder}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View>
            <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
              Card Number
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="4111 2222 3333 4444"
              placeholderTextColor="rgba(142,118,104,0.6)"
              keyboardType="number-pad"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
            />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
                Expiry (MM/YY)
              </Text>
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="12/28"
                placeholderTextColor="rgba(142,118,104,0.6)"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-[#8E7668] mb-1">
                CVV
              </Text>
              <TextInput
                defaultValue="829"
                maxLength={4}
                secureTextEntry
                keyboardType="number-pad"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#613D2D]/15 text-[#2D1810]"
              />
            </View>
          </View>

          <PrimaryButton fullWidth onPress={handleSaveCard}>
            Save Secure Card
          </PrimaryButton>
        </View>
      </BottomSheet>
    </View>
  );
}

// ---------- SETTINGS ----------
export function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);

  const Row = ({
    title,
    subtitle,
    value,
    onValueChange,
    isLast,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    isLast?: boolean;
  }) => (
    <View
      className={`flex-row items-center justify-between ${
        !isLast ? "pt-0 pb-3 border-b border-neutral-100" : ""
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-xs font-bold text-[#2D1810]">{title}</Text>
        <Text className="text-[10px] text-[#8E7668]">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D4D4D4", true: "#E86A17" }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Settings" title="App Settings" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <Text className="text-sm font-extrabold text-[#2D1810]">
          App & Privacy Preferences
        </Text>

        <View className="bg-white rounded-3xl border border-[#613D2D]/12 p-4 gap-4">
          <Row
            title="Realtime Order Notifications"
            subtitle="Receive rider updates & cooking progress"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <Row
            title="AI Camera Vision Scanner"
            subtitle="Enable Gemini Multimodal vision food recognition"
            value={aiSuggestionsEnabled}
            onValueChange={setAiSuggestionsEnabled}
          />
          <Row
            title="Precise GPS Delivery Pin"
            subtitle="Accurate doorstep coordinates for riders"
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- HELP & SUPPORT ----------
const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse the menu, open a dish to choose any available options, add it to your cart, then continue to Checkout to select your address and payment method.",
  },
  {
    q: "How can I track my order?",
    a: "Open Orders from the bottom navigation, select an active order, and choose Track Order to view its current delivery status.",
  },
  {
    q: "How do I cancel an order?",
    a: "Open the order details as soon as possible and contact support. Cancellation depends on whether the kitchen has started preparing your order.",
  },
  {
    q: "What payment methods are available?",
    a: "Checkout currently supports Cash, Mobile Money, and Card payment methods. Mobile Money payments require approval on your phone.",
  },
  {
    q: "What should I do if my payment fails?",
    a: "Check your payment details and try again. For Mobile Money, confirm that the phone number and provider are correct, then retry from Checkout.",
  },
  {
    q: "How does the AI Food Scanner work?",
    a: "The scanner analyzes your selected food image and matches it against available Shamsiya menu items. Results are AI-assisted and may be uncertain.",
  },
  {
    q: "How do I apply a promotion code?",
    a: "Enter your code in the Promo Code section during Checkout and tap Apply. Valid promotions are checked against your current subtotal.",
  },
  {
    q: "How do I contact customer support?",
    a: "Use the support actions on this page. If a contact channel is not configured, the app will let you know when that option becomes available.",
  },
];

export function HelpSupportScreen() {
  const router = useRouter();
  const { showToast } = useApp();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const showUnavailableMessage = (label: string) => {
    showToast(`${label} will be available soon.`);
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="HelpSupport" title="Help & Support" showBack />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <View className="p-4 rounded-3xl overflow-hidden border border-[#E86A17]/30">
          <LinearGradient
            colors={["#2D1810", "#45271D"]}
            style={{ position: "absolute", inset: 0 }}
          />
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-2xl bg-[#E86A17] items-center justify-center">
              <Headphones width={20} height={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-white">
                Shamsiya Customer Care
              </Text>
              <Text className="text-xs text-amber-200 mt-0.5 leading-relaxed">
                We&apos;re here to help with orders, payments, deliveries, and
                more.
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2 mt-3">
            <Pressable
              onPress={() => showUnavailableMessage("Live chat")}
              className="flex-1 py-2.5 rounded-xl bg-[#E86A17] flex-row items-center justify-center gap-1"
            >
              <MessageSquare width={14} height={14} color="#fff" />
              <Text className="text-white text-xs font-bold">
                Contact Support
              </Text>
            </Pressable>
            <Pressable
              onPress={() => showUnavailableMessage("Call support")}
              className="flex-1 py-2.5 rounded-xl bg-white/20 flex-row items-center justify-center gap-1"
            >
              <Phone width={14} height={14} color="#fff" />
              <Text className="text-white text-xs font-bold">Call Support</Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Quick Help
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              {
                title: "Orders",
                subtitle: "Questions about your order",
                icon: ShoppingBag,
              },
              {
                title: "Payments",
                subtitle: "Payment and transaction issues",
                icon: CreditCard,
              },
              {
                title: "Delivery",
                subtitle: "Delivery and rider questions",
                icon: Truck,
              },
              {
                title: "Account",
                subtitle: "Profile and account help",
                icon: UserRound,
              },
            ].map((category) => {
              const Icon = category.icon;
              return (
                <Pressable
                  key={category.title}
                  onPress={() => showUnavailableMessage(category.title)}
                  className="w-[48%] rounded-2xl border border-[#613D2D]/12 bg-white p-3"
                >
                  <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl bg-[#F4EFE6]">
                    <Icon width={16} height={16} color="#E86A17" />
                  </View>
                  <Text className="text-xs font-extrabold text-[#2D1810]">
                    {category.title}
                  </Text>
                  <Text className="mt-1 text-[10px] leading-relaxed text-[#8E7668]">
                    {category.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Frequently Asked Questions
          </Text>

          <View className="gap-2">
            {faqs.map((faq, i) => {
              const isExpanded = expandedFaq === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setExpandedFaq(isExpanded ? null : i)}
                  className="bg-white p-3.5 rounded-2xl border border-[#613D2D]/12 gap-1"
                >
                  <View className="flex-row items-center gap-2">
                    <CircleHelp width={15} height={15} color="#E86A17" />
                    <Text className="flex-1 text-xs font-bold text-[#2D1810]">
                      {faq.q}
                    </Text>
                    <ChevronDown
                      width={16}
                      height={16}
                      color="#8E7668"
                      style={{
                        transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                      }}
                    />
                  </View>
                  {isExpanded ? (
                    <Text className="mt-2 pl-6 text-xs leading-relaxed text-[#613D2D]">
                      {faq.a}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-extrabold text-[#2D1810] uppercase tracking-wider">
            Need more help?
          </Text>
          <Text className="text-xs leading-relaxed text-[#8E7668]">
            Our support team can help you with your order or account.
          </Text>
          <Pressable
            onPress={() => router.push("/support-tickets")}
            className="flex-row items-center gap-3 rounded-3xl border border-[#E86A17]/30 bg-white p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE6]">
              <Ticket width={19} height={19} color="#E86A17" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-[#2D1810]">
                Support Tickets
              </Text>
              <Text className="mt-1 text-[11px] text-[#8E7668]">
                Create a ticket or check an existing request
              </Text>
            </View>
            <ChevronRight width={18} height={18} color="#8E7668" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export default HelpSupportScreen;
