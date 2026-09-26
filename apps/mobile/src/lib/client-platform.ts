import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import type { ClientPlatform, ClientStorage } from "@word-lock/client";

const storage: ClientStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

function generateId(): string {
  return Crypto.randomUUID();
}

export const nativePlatform: ClientPlatform = { storage, generateId };
