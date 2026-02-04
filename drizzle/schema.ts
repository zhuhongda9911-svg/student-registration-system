import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Activities table - stores research study activity information
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  contactPerson: varchar("contactPerson", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactWechat: varchar("contactWechat", { length: 100 }),
  itinerary: text("itinerary"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Registrations table - stores student registration information
 */
export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(),
  
  // Student information
  studentName: varchar("studentName", { length: 100 }).notNull(),
  studentGender: mysqlEnum("studentGender", ["男", "女"]).notNull(),
  studentSchool: varchar("studentSchool", { length: 200 }).notNull(),
  studentGrade: varchar("studentGrade", { length: 50 }).notNull(),
  studentClass: varchar("studentClass", { length: 50 }).notNull(),
  studentIdCard: varchar("studentIdCard", { length: 18 }),
  
  // Guardian information
  guardianName: varchar("guardianName", { length: 100 }).notNull(),
  guardianPhone: varchar("guardianPhone", { length: 20 }).notNull(),
  
  // Emergency contact
  emergencyContactName: varchar("emergencyContactName", { length: 100 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  
  // Additional notes
  remarks: text("remarks"),
  
  // Payment status
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  paymentAmount: decimal("paymentAmount", { precision: 10, scale: 2 }).notNull(),
  
  // IP and location
  ipAddress: varchar("ipAddress", { length: 50 }),
  location: varchar("location", { length: 200 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

/**
 * Payments table - stores payment transaction details
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull().unique(),
  
  // Payment details
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // stripe, wechat, alipay
  transactionId: varchar("transactionId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("CNY").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  
  // Additional payment info
  paymentData: text("paymentData"), // JSON string for additional payment details
  
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
