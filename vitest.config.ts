import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

// Load env from home directory where webdev_request_secrets stores them
config({ path: path.resolve("/home/ubuntu", ".env") });

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
  },
});
