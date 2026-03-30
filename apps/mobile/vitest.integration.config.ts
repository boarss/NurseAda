import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

/** Integration tests: real `fetch` to a local server; no Supabase mocks (omit setupTests). */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["test/integration/**/*.test.ts"],
  },
});
