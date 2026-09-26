import { createContext, useContext } from "react";

export interface ClientStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface ClientPlatform {
  storage: ClientStorage;
  generateId: () => string;
}

export const ClientPlatformContext = createContext<ClientPlatform | null>(null);

export function useClientPlatform(): ClientPlatform {
  const platform = useContext(ClientPlatformContext);
  if (!platform) {
    throw new Error(
      "No ClientPlatform in context. Wrap the app in <ClientPlatformProvider> " +
        "(web: localStorage + crypto.randomUUID; native: AsyncStorage + expo-crypto).",
    );
  }
  return platform;
}
