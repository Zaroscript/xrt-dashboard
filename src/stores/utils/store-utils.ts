import { create } from "zustand";
import { StateStorage, persist, createJSONStorage } from "zustand/middleware";

/**
 * Custom storage implementation that can be used with persist middleware
 */
export const createCustomStorage = (storage: Storage): StateStorage => ({
  getItem: (name: string) => {
    try {
      return storage.getItem(name);
    } catch (error) {
      console.error(`Error getting item ${name} from storage:`, error);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      storage.setItem(name, value);
    } catch (error) {
      console.error(`Error setting item ${name} in storage:`, error);
    }
  },
  removeItem: (name: string) => {
    try {
      storage.removeItem(name);
    } catch (error) {
      console.error(`Error removing item ${name} from storage:`, error);
    }
  },
});

/**
 * Middleware for logging store actions in development
 */
export const logger =
  <T>(config: any) =>
  (set: any, get: any, api: any) =>
    config(
      (args: any) => {
        if (process.env.NODE_ENV === "development") {
          // console.group('Store Update');
          // console.log('Previous State:', get());
          // console.log('Action:', args);
          set(args);
          // console.log('Next State:', get());
          // console.groupEnd();
        } else {
          set(args);
        }
      },
      get,
      api
    );

/**
 * Helper to create a store with common middleware
 */
export const createStore = <T extends object>(
  name: string,
  config: any,
  options?: {
    persist?: boolean;
    storage?: Storage;
    version?: number;
    partialize?: (state: T) => Partial<T>;
  }
) => {
  const {
    persist: shouldPersist = true,
    storage = localStorage,
    version = 1,
    partialize,
  } = options || {};

  let storeConfig = config;

  // Add devtools in development
  if (process.env.NODE_ENV === "development") {
    storeConfig = (set: any, get: any, api: any) =>
      config(
        (args: any) => {
          set(args);
          if (process.env.NODE_ENV === "development") {
            // console.log(`[${name}] State Update:`, get());
          }
        },
        get,
        api
      );
  }

  // Add persistence if needed
  if (shouldPersist) {
    return create<T>()(
      persist(storeConfig, {
        name: `${name}-storage`,
        storage: createJSONStorage(() => storage),
        version,
        partialize,
      })
    );
  }

  return create<T>()(storeConfig);
};
