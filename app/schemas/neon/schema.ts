import { uuid, text, boolean, pgTable } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

export const userSchema = pgTable("users", {
  id: uuid("id").primaryKey(),
  nickname: text("nickname"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false),
});



const requestsSchema = pgTable("requests", {
  id: uuid("id").primaryKey(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
