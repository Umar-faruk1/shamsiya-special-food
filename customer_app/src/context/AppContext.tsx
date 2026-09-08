import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  MOCK_CATEGORIES,
  MOCK_FOOD_ITEMS,
  MOCK_ORDERS,
  MOCK_USER,
  MOCK_NOTIFICATIONS,
  MOCK_RECENT_SCANS,
  MOCK_RIDER,
} from "../data/mockData";
import {
  FoodItem,
  CartItem,
  Order,
  FoodScanResult,
  UserProfile,
  UserAddress,
  PaymentMethod,
  FoodOptionAddon,
} from "../types";
import { supabase } from "../api/supabase";

/**
 * This context is the direct port of the state + handlers that used to
 * live at the top of App.tsx in the web project. Screens previously
 * received these via props; in the RN version they pull them from
 * this context instead, while React Navigation now owns screen routing.
 */

interface CartOptions {
  size?: string;
  spiceLevel?: string;
  addons: FoodOptionAddon[];
  specialInstructions?: string;
}

interface AppContextValue {
  // Domain data
  foodItems: FoodItem[];
  categories: typeof MOCK_CATEGORIES;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  cartItems: CartItem[];
  orders: Order[];
  favorites: string[];
  notifications: typeof MOCK_NOTIFICATIONS;
  recentScans: FoodScanResult[];
  latestScanResult: FoodScanResult | null;
  activeTrackingOrder: Order | null;
  setActiveTrackingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  authUser: SupabaseUser | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (args: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<{ error: string | null; requiresConfirmation: boolean }>;
  signOut: () => Promise<string | null>;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Cart ops
  handleAddToCartQuick: (food: FoodItem) => void;
  handleAddToCartWithOptions: (
    food: FoodItem,
    quantity: number,
    options: CartOptions,
  ) => void;
  handleUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  handleRemoveCartItem: (cartItemId: string) => void;
  handleClearCart: () => void;
  cartTotalItems: number;

  // Favorites
  handleToggleFavorite: (food: FoodItem) => void;

  // Scanner
  handleScanCompleted: (result: FoodScanResult, onDone?: () => void) => void;

  // Orders
  handlePlaceOrder: (orderData: Partial<Order>, onDone?: () => void) => void;

  // Notifications
  unreadNotificationsCount: number;
  handleMarkAllNotificationsRead: () => void;

  // Addresses & payments
  handleAddAddress: (addr: UserAddress) => void;
  handleDeleteAddress: (id: string) => void;
  handleSetDefaultAddress: (id: string) => void;
  handleAddPayment: (pm: PaymentMethod) => void;
  handleSetDefaultPayment: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [foodItems] = useState<FoodItem[]>(MOCK_FOOD_ITEMS);
  const [categories] = useState(MOCK_CATEGORIES);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [favorites, setFavorites] = useState<string[]>([
    "food-1",
    "food-3",
    "food-9",
  ]);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [recentScans, setRecentScans] =
    useState<FoodScanResult[]>(MOCK_RECENT_SCANS);
  const [latestScanResult, setLatestScanResult] =
    useState<FoodScanResult | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(
    MOCK_ORDERS[0],
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getAuthErrorMessage = useCallback((message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("invalid login credentials")) {
      return "The email or password is incorrect.";
    }
    if (normalized.includes("user already registered")) {
      return "An account with this email already exists.";
    }
    if (normalized.includes("password") && normalized.includes("characters")) {
      return "Your password is too weak. Please use at least 6 characters.";
    }
    if (normalized.includes("email not confirmed")) {
      return "Please confirm your email before signing in.";
    }
    if (normalized.includes("network") || normalized.includes("fetch")) {
      return "Unable to connect. Check your internet connection and try again.";
    }
    return "Authentication failed. Please try again.";
  }, []);

  const loadCustomerProfile = useCallback(
    async (nextAuthUser: SupabaseUser | null) => {
      if (!nextAuthUser) {
        setAuthUser(null);
        setIsAuthenticated(false);
        setAuthLoading(false);
        return null;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,email,phone,avatar_url,role,status,created_at,updated_at",
        )
        .eq("id", nextAuthUser.id)
        .maybeSingle();

      if (error || !profile) {
        await supabase.auth.signOut();
        setAuthUser(null);
        setIsAuthenticated(false);
        setAuthLoading(false);
        return "Your account profile is unavailable. Please contact support.";
      }

      if (profile.role !== "customer") {
        await supabase.auth.signOut();
        setAuthUser(null);
        setIsAuthenticated(false);
        setAuthLoading(false);
        return "This account cannot access the customer app.";
      }

      if (profile.status !== "active") {
        await supabase.auth.signOut();
        setAuthUser(null);
        setIsAuthenticated(false);
        setAuthLoading(false);
        return "This account is inactive. Please contact support.";
      }

      setAuthUser(nextAuthUser);
      setUser((previous) => ({
        ...previous,
        id: profile.id,
        name:
          profile.full_name ||
          nextAuthUser.user_metadata.full_name ||
          "Customer",
        email: profile.email || nextAuthUser.email || "",
        phone: profile.phone || "",
        avatar: profile.avatar_url || previous.avatar,
      }));
      setIsAuthenticated(true);
      setAuthLoading(false);
      return null;
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) void loadCustomerProfile(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) void loadCustomerProfile(session?.user ?? null);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCustomerProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return getAuthErrorMessage(error.message);

      const { data } = await supabase.auth.getUser();
      return loadCustomerProfile(data.user);
    },
    [getAuthErrorMessage, loadCustomerProfile],
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      fullName,
      phone,
    }: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
    }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedFullName = fullName.trim();
      const normalizedPhone = phone.trim();

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedFullName,
            phone: normalizedPhone,
          },
        },
      });

      if (error) {
        return {
          error: getAuthErrorMessage(error.message),
          requiresConfirmation: false,
        };
      }

      if (!data.user) {
        return {
          error: "We could not create your account. Please try again.",
          requiresConfirmation: false,
        };
      }

      const requiresConfirmation = Boolean(data.user && !data.session);

      if (data.session) {
        if (normalizedPhone) {
          const { error: phoneError } = await supabase
            .from("profiles")
            .update({ phone: normalizedPhone })
            .eq("id", data.user.id);

          if (phoneError) {
            console.error(
              "Unable to update customer profile phone:",
              phoneError,
            );
          }
        }

        await loadCustomerProfile(data.user);
      }

      return {
        error: null,
        requiresConfirmation,
      };
    },
    [getAuthErrorMessage, loadCustomerProfile],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return getAuthErrorMessage(error.message);
    setAuthUser(null);
    setIsAuthenticated(false);
    return null;
  }, [getAuthErrorMessage]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  }, []);

  const handleAddToCartQuick = useCallback(
    (food: FoodItem) => {
      setCartItems((prev) => {
        const existingIndex = prev.findIndex(
          (it) => it.food.id === food.id && it.options.addons.length === 0,
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
            itemTotalPrice: (updated[existingIndex].quantity + 1) * food.price,
          };
          return updated;
        }
        const newItem: CartItem = {
          cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          food,
          quantity: 1,
          options: {
            size: food.availableSizes?.[0]?.name || "Standard",
            spiceLevel: "Medium",
            addons: [],
          },
          itemTotalPrice: food.price,
        };
        return [newItem, ...prev];
      });
      showToast(`Added 1x ${food.name} to your cart`);
    },
    [showToast],
  );

  const handleAddToCartWithOptions = useCallback(
    (food: FoodItem, quantity: number, options: CartOptions) => {
      const sizeExtra =
        food.availableSizes?.find((s) => s.name === options.size)?.extraPrice ||
        0;
      const addonsExtra = options.addons.reduce((a, b) => a + b.price, 0);
      const unitPrice = food.price + sizeExtra + addonsExtra;
      const itemTotalPrice = unitPrice * quantity;

      const newItem: CartItem = {
        cartItemId: `cart-${Date.now()}`,
        food,
        quantity,
        options,
        itemTotalPrice,
      };

      setCartItems((prev) => [newItem, ...prev]);
      showToast(`Added ${quantity}x ${food.name} to your feast!`);
    },
    [showToast],
  );

  const handleUpdateQuantity = useCallback(
    (cartItemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        setCartItems((prev) =>
          prev.filter((it) => it.cartItemId !== cartItemId),
        );
        showToast("Item removed from cart");
        return;
      }
      setCartItems((prev) =>
        prev.map((it) => {
          if (it.cartItemId === cartItemId) {
            const unitPrice = it.itemTotalPrice / it.quantity;
            return {
              ...it,
              quantity: newQuantity,
              itemTotalPrice: Number((unitPrice * newQuantity).toFixed(2)),
            };
          }
          return it;
        }),
      );
    },
    [showToast],
  );

  const handleRemoveCartItem = useCallback(
    (cartItemId: string) => {
      setCartItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
      showToast("Item removed from cart");
    },
    [showToast],
  );

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    showToast("Cart cleared");
  }, [showToast]);

  const handleToggleFavorite = useCallback(
    (food: FoodItem) => {
      setFavorites((prev) => {
        if (prev.includes(food.id)) {
          showToast(`Removed ${food.name} from favorites`);
          return prev.filter((id) => id !== food.id);
        }
        showToast(`Saved ${food.name} to favorites`);
        return [...prev, food.id];
      });
    },
    [showToast],
  );

  const handleScanCompleted = useCallback(
    (result: FoodScanResult, onDone?: () => void) => {
      setLatestScanResult(result);
      setRecentScans((prev) => [
        result,
        ...prev.filter((r) => r.id !== result.id),
      ]);
      onDone?.();
    },
    [],
  );

  const handlePlaceOrder = useCallback(
    (orderData: Partial<Order>, onDone?: () => void) => {
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `SF-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: "Just now",
        status: "preparing",
        items: orderData.items || cartItems,
        subtotal: orderData.subtotal || 0,
        deliveryFee: orderData.deliveryFee || 0,
        tax: orderData.tax || 0,
        tip: orderData.tip || 0,
        discount: orderData.discount || 0,
        promoCode: orderData.promoCode,
        total: orderData.total || 0,
        deliveryAddress: orderData.deliveryAddress || user.savedAddresses[0],
        paymentMethod: orderData.paymentMethod || user.savedPaymentMethods[0],
        estimatedDeliveryTime:
          orderData.estimatedDeliveryTime || "25 - 35 mins",
        rider: MOCK_RIDER,
        timeline: [
          {
            status: "placed",
            label: "Order Placed",
            description: "Received by Shamsiya kitchen",
            timestamp: "Just now",
            completed: true,
            current: false,
          },
          {
            status: "preparing",
            label: "Kitchen Cooking",
            description: "Chef is freshly preparing your feast in clay pots",
            timestamp: "Now",
            completed: true,
            current: true,
          },
          {
            status: "picked_up",
            label: "Courier Pickup",
            description: "Dispatched in heated thermal food box",
            timestamp: "Est in 10 mins",
            completed: false,
            current: false,
          },
          {
            status: "on_the_way",
            label: "On the Way",
            description: "Rider navigating to your doorstep",
            timestamp: "Est in 20 mins",
            completed: false,
            current: false,
          },
          {
            status: "delivered",
            label: "Delivered",
            description: "Delivered fresh & hot",
            timestamp: "Est in 30 mins",
            completed: false,
            current: false,
          },
        ],
        includeCutlery: orderData.includeCutlery ?? true,
        deliveryNotes: orderData.deliveryNotes,
      };

      setOrders((prev) => [newOrder, ...prev]);
      setActiveTrackingOrder(newOrder);
      setCartItems([]);
      onDone?.();
    },
    [cartItems, user],
  );

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications marked as read");
  }, [showToast]);

  const handleAddAddress = useCallback(
    (newAddr: UserAddress) => {
      setUser((prev) => ({
        ...prev,
        savedAddresses: [newAddr, ...prev.savedAddresses],
      }));
      showToast("New delivery address added");
    },
    [showToast],
  );

  const handleDeleteAddress = useCallback(
    (id: string) => {
      setUser((prev) => ({
        ...prev,
        savedAddresses: prev.savedAddresses.filter((a) => a.id !== id),
      }));
      showToast("Address deleted");
    },
    [showToast],
  );

  const handleSetDefaultAddress = useCallback(
    (id: string) => {
      setUser((prev) => ({
        ...prev,
        savedAddresses: prev.savedAddresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        })),
      }));
      showToast("Default address updated");
    },
    [showToast],
  );

  const handleAddPayment = useCallback(
    (newPm: PaymentMethod) => {
      setUser((prev) => ({
        ...prev,
        savedPaymentMethods: [newPm, ...prev.savedPaymentMethods],
      }));
      showToast("Payment method saved");
    },
    [showToast],
  );

  const handleSetDefaultPayment = useCallback(
    (id: string) => {
      setUser((prev) => ({
        ...prev,
        savedPaymentMethods: prev.savedPaymentMethods.map((p) => ({
          ...p,
          isDefault: p.id === id,
        })),
      }));
      showToast("Default payment set");
    },
    [showToast],
  );

  const cartTotalItems = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const value: AppContextValue = {
    foodItems,
    categories,
    user,
    setUser,
    cartItems,
    orders,
    favorites,
    notifications,
    recentScans,
    latestScanResult,
    activeTrackingOrder,
    setActiveTrackingOrder,
    isAuthenticated,
    setIsAuthenticated,
    authUser,
    authLoading,
    signIn,
    signUp,
    signOut,
    toastMessage,
    showToast,
    handleAddToCartQuick,
    handleAddToCartWithOptions,
    handleUpdateQuantity,
    handleRemoveCartItem,
    handleClearCart,
    cartTotalItems,
    handleToggleFavorite,
    handleScanCompleted,
    handlePlaceOrder,
    unreadNotificationsCount,
    handleMarkAllNotificationsRead,
    handleAddAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleAddPayment,
    handleSetDefaultPayment,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
