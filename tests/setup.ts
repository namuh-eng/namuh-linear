import { beforeEach } from "vitest";

function installMemoryStorage(name: "localStorage" | "sessionStorage") {
  const store = new Map<string, string>();
  const storage = {
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  } satisfies Storage;

  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value: storage,
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, name, {
      configurable: true,
      writable: true,
      value: storage,
    });
  }
}

function installBrowserStorage() {
  installMemoryStorage("localStorage");
  installMemoryStorage("sessionStorage");
}

installBrowserStorage();
beforeEach(() => {
  installBrowserStorage();
});
