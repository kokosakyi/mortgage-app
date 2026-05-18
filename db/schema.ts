import { pgTable, text, timestamp, uuid, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable("account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_token", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const mortgages = pgTable("mortgage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"), // Optional for anonymous use - can be null
  principalAmount: decimal("principal_amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }).notNull(),
  amortizationYears: integer("amortization_years").notNull(),
  paymentFrequency: text("payment_frequency").notNull(), // 'monthly', 'biweekly', 'accelerated-biweekly'
  downPayment: decimal("down_payment", { precision: 12, scale: 2 }),
  downPaymentPercent: decimal("down_payment_percent", { precision: 5, scale: 2 }),
  cmhcInsurance: decimal("cmhc_insurance", { precision: 12, scale: 2 }),
  homePrice: decimal("home_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const payments = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  mortgageId: uuid("mortgage_id")
    .notNull()
    .references(() => mortgages.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date", { mode: "date" }).notNull(),
  principalPaid: decimal("principal_paid", { precision: 12, scale: 2 }),
  interestPaid: decimal("interest_paid", { precision: 12, scale: 2 }),
  extraPrincipal: decimal("extra_principal", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  mortgages: many(mortgages),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const mortgagesRelations = relations(mortgages, ({ one, many }) => ({
  user: one(users, {
    fields: [mortgages.userId],
    references: [users.id],
    relationName: "user_mortgages",
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  mortgage: one(mortgages, {
    fields: [payments.mortgageId],
    references: [mortgages.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
