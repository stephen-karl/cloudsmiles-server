import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./app/schemas/neon/schema.ts",
  out: "./app/generated",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});