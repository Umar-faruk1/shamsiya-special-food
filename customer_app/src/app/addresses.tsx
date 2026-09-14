import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import { Address } from "../types";
import { useApp } from "../context/AppContext";
import {
  AddressInput,
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "../api/addresses";

const emptyForm: AddressInput = {
  label: "Home",
  address: "",
  city: null,
  latitude: null,
  longitude: null,
  delivery_instructions: null,
  is_default: false,
};

function toInput(address: Address): AddressInput {
  return {
    label: address.label,
    address: address.address,
    city: address.city,
    latitude: address.latitude,
    longitude: address.longitude,
    delivery_instructions: address.delivery_instructions,
    is_default: address.is_default,
  };
}

export default function AddressesScreen() {
  const { authUser } = useApp();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadAddresses = useCallback(async () => {
    if (!authUser) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAddresses(await getAddresses());
    } catch (loadError) {
      console.error("Unable to load addresses:", loadError);
      setError("Unable to load your addresses.");
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const setField = (field: keyof AddressInput, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: field === "is_default" ? value : value || null,
    }));
  };

  const save = async () => {
    if (!form.label?.trim() || !form.address?.trim()) {
      Alert.alert("Address details missing", "Label and address are required.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        ...form,
        label: form.label.trim(),
        address: form.address.trim(),
        city: form.city?.trim() || null,
        delivery_instructions: form.delivery_instructions?.trim() || null,
      };
      if (editingId) await updateAddress(editingId, input);
      else await createAddress(input);
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      await loadAddresses();
    } catch (saveError) {
      console.error("Unable to save address:", saveError);
      Alert.alert("Could not save address", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (address: Address) =>
    Alert.alert(
      "Delete this address?",
      "This saved address will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              await loadAddresses();
            } catch (deleteError) {
              console.error("Unable to delete address:", deleteError);
              Alert.alert("Could not delete address", "Please try again.");
            }
          },
        },
      ],
    );

  const beginAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };
  const beginEdit = (address: Address) => {
    setEditingId(address.id);
    setForm(toInput(address));
    setShowForm(true);
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
          gap: 14,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-black text-[#2D1810]">
              Saved addresses
            </Text>
            <Text className="text-xs text-[#8E7668]">
              Choose where your order should arrive.
            </Text>
          </View>
          <Pressable
            onPress={beginAdd}
            className="flex-row items-center gap-1 rounded-xl bg-[#2D1810] px-3 py-2"
          >
            <Plus width={14} height={14} color="#fff" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </Pressable>
        </View>
        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <View className="items-center rounded-2xl bg-red-50 p-4">
            <Text className="text-xs text-red-800">{error}</Text>
            <Pressable onPress={() => void loadAddresses()} className="mt-3">
              <Text className="text-xs font-bold text-red-700">Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error && !addresses.length ? (
          <View className="items-center rounded-3xl border border-[#613D2D]/10 bg-white p-7">
            <MapPin width={30} height={30} color="#E86A17" />
            <Text className="mt-3 text-base font-black text-[#2D1810]">
              No saved addresses
            </Text>
            <Text className="mt-1 text-center text-xs text-[#8E7668]">
              Add your first delivery address to make checkout faster.
            </Text>
          </View>
        ) : null}
        <View className="gap-3">
          {addresses.map((address) => (
            <View
              key={address.id}
              className="rounded-3xl border border-[#613D2D]/12 bg-white p-4"
            >
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE6]">
                  <MapPin width={18} height={18} color="#E86A17" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-black text-[#2D1810]">
                      {address.label}
                    </Text>
                    {address.is_default ? (
                      <Text className="rounded-md bg-[#2D1810] px-2 py-0.5 text-[9px] font-bold text-white">
                        Default
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-1 text-xs font-semibold text-[#2D1810]">
                    {address.address}
                  </Text>
                  {address.city ? (
                    <Text className="mt-0.5 text-xs text-[#8E7668]">
                      {address.city}
                    </Text>
                  ) : null}
                  {address.delivery_instructions ? (
                    <Text className="mt-2 text-[11px] text-[#613D2D]">
                      Delivery: {address.delivery_instructions}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="mt-3 flex-row items-center justify-end gap-4 border-t border-neutral-100 pt-3">
                <Pressable
                  onPress={async () => {
                    if (!address.is_default) {
                      try {
                        await setDefaultAddress(address.id);
                        await loadAddresses();
                      } catch (defaultError) {
                        console.error(
                          "Unable to set default address:",
                          defaultError,
                        );
                        Alert.alert(
                          "Could not update default",
                          "Please try again.",
                        );
                      }
                    }
                  }}
                  className="flex-row items-center gap-1"
                >
                  <Star
                    width={14}
                    height={14}
                    color={address.is_default ? "#E86A17" : "#8E7668"}
                    fill={address.is_default ? "#E86A17" : "none"}
                  />
                  <Text className="text-xs font-bold text-[#613D2D]">
                    {address.is_default ? "Default" : "Set default"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => beginEdit(address)}
                  className="flex-row items-center gap-1"
                >
                  <Pencil width={14} height={14} color="#2D1810" />
                  <Text className="text-xs font-bold text-[#2D1810]">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(address)}
                  className="flex-row items-center gap-1"
                >
                  <Trash2 width={14} height={14} color="#B91C1C" />
                  <Text className="text-xs font-bold text-red-700">Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        {showForm ? (
          <View className="gap-3 rounded-3xl border border-[#E86A17]/30 bg-white p-4">
            <Text className="text-sm font-black text-[#2D1810]">
              {editingId ? "Edit address" : "Add address"}
            </Text>
            {(
              ["label", "address", "city", "delivery_instructions"] as const
            ).map((field) => (
              <View key={field} className="gap-1">
                <Text className="text-[11px] font-bold text-[#613D2D]">
                  {field === "delivery_instructions"
                    ? "Delivery instructions"
                    : field[0].toUpperCase() + field.slice(1)}
                </Text>
                <TextInput
                  value={(form[field] ?? "") as string}
                  onChangeText={(value) => setField(field, value)}
                  placeholder={
                    field === "address" ? "Street and house number" : "Optional"
                  }
                  placeholderTextColor="#A9998F"
                  className="rounded-xl border border-[#613D2D]/15 bg-[#FDFBF7] px-3 py-2.5 text-xs text-[#2D1810]"
                />
              </View>
            ))}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-[#2D1810]">
                Set as default address
              </Text>
              <Switch
                value={form.is_default}
                onValueChange={(value) => setField("is_default", value)}
                trackColor={{ false: "#D6CCC3", true: "#E86A17" }}
              />
            </View>
            <View className="flex-row gap-2">
              <SecondaryButton
                fullWidth
                onPress={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setShowForm(false);
                }}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                fullWidth
                loading={saving}
                onPress={() => void save()}
              >
                Save Address
              </PrimaryButton>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
