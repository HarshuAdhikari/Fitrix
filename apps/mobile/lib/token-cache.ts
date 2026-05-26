import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/clerk-expo/dist/cache";

/**
 * Secure token cache for Clerk using expo-secure-store.
 * Clerk calls `getToken` / `saveToken` at runtime to persist
 * the session across app launches.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error("SecureStore getToken error", err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore saveToken error", err);
    }
  },
};
