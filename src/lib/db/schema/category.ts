import { transactionTypeEnum } from "@/lib/db/enums";
import { user } from "@/lib/db/schema/auth";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";

export const category = pgTable("category", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    type: transactionTypeEnum("type"),
    color: varchar("color", { length: 7 }),
    icon: varchar("icon", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
});

export type Category = typeof category;

// Schema for categories - used to validate API requests
export const insertCategorySchema = createSelectSchema(category).extend({}).omit({
    id: true,
    createdAt: true,
});

// Type for categories - used to type API request params and within Components
export type NewCategoryParams = z.infer<typeof insertCategorySchema>;