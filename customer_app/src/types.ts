export type ScreenType =
  | "splash"
  | "onboarding"
  | "login"
  | "register"
  | "forgot_password"
  | "location_setup"
  | "home"
  | "explore"
  | "scanner"
  | "orders"
  | "profile"
  | "search"
  | "ai_assistant"
  | "ai_recommendations"
  | "scan_results"
  | "cart"
  | "checkout"
  | "payment"
  | "order_confirmation"
  | "order_tracking"
  | "favorites"
  | "preferences"
  | "notifications"
  | "addresses"
  | "payment_methods"
  | "reviews"
  | "settings"
  | "help_support";

export interface NutritionalInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
}

export interface FoodOptionAddon {
  id: string;
  name: string;
  price: number;
}

export interface FoodItem {
  id: string;
  name: string;
  nativeName?: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  prepTime: string; // e.g. "20-25 min"
  calories: number;
  spicyLevel: 0 | 1 | 2 | 3; // 0 = mild, 1 = medium, 2 = hot, 3 = extra hot
  isHalal: boolean;
  isVegetarian: boolean;
  isChefSpecial?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  tags: string[];
  image: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  nutrition: NutritionalInfo;
  availableSizes?: { name: string; extraPrice: number }[];
  spiceCustomizable?: boolean;
  addons?: FoodOptionAddon[];
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  image: string;
  itemCount: number;
  description: string;
}

export interface CartItemOption {
  size?: string;
  spiceLevel?: string;
  addons: FoodOptionAddon[];
  specialInstructions?: string;
}

export interface CartItem {
  cartItemId: string;
  food: FoodItem;
  quantity: number;
  options: CartItemOption;
  itemTotalPrice: number;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export interface RiderInfo {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  vehicle: string;
  plateNumber: string;
  rating: number;
  totalDeliveries: number;
  currentLocationName: string;
  coordinates: { lat: number; lng: number };
}

export interface OrderStatusStep {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  discount: number;
  promoCode?: string;
  total: number;
  status: OrderStatus;
  estimatedDeliveryTime: string;
  deliveryAddress: UserAddress;
  paymentMethod: PaymentMethod;
  rider?: RiderInfo;
  timeline: OrderStatusStep[];
  includeCutlery: boolean;
  deliveryNotes?: string;
}

export interface FoodScanResult {
  id: string;
  timestamp: string;
  scannedImageUrl: string;
  recognizedDishName: string;
  confidence: number;
  detectedCuisine: string;
  description: string;
  detectedIngredients: string[];
  nutritionEstimate: NutritionalInfo;
  flavorProfile: string[];
  matchedMenuDish: FoodItem;
  matchPercentage: number;
  alternativeMatches?: { dish: FoodItem; matchPercentage: number }[];
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  suggestedDishes?: FoodItem[];
  quickActions?: { label: string; action: string; payload?: any }[];
}

export interface UserAddress {
  id: string;
  label: "Home" | "Work" | "Partner" | "Other";
  recipientName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "apple_pay" | "google_pay" | "cash" | "mobile_money";
  title: string;
  subtitle?: string;
  last4?: string;
  expiry?: string;
  brand?: "visa" | "mastercard" | "amex";
  isDefault: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "order" | "promo" | "ai" | "system";
  read: boolean;
  orderId?: string;
}

export interface Review {
  id: string;
  foodId: string;
  foodName: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
  helpfulCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  loyaltyPoints: number;
  savedAddresses: UserAddress[];
  savedPaymentMethods: PaymentMethod[];
  dietaryPreferences: string[];
}
