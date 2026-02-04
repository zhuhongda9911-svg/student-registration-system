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

/**
 * News table - stores admission news and policy updates
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 政策解读、招生信息、考试动态等
  coverImage: varchar("coverImage", { length: 500 }),
  author: varchar("author", { length: 100 }),
  source: varchar("source", { length: 200 }),
  publishDate: timestamp("publishDate").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * Competitions table - stores competition information
 */
export const competitions = mysqlTable("competitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organizer: varchar("organizer", { length: 200 }),
  category: varchar("category", { length: 100 }), // 学科类别
  level: mysqlEnum("level", ["国家级", "省级", "市级", "校级"]),
  description: text("description"),
  requirements: text("requirements"), // 参赛要求
  awards: text("awards"), // 奖项设置
  registrationStartDate: timestamp("registrationStartDate"),
  registrationEndDate: timestamp("registrationEndDate"),
  competitionDate: timestamp("competitionDate"),
  resultAnnouncementDate: timestamp("resultAnnouncementDate"),
  officialWebsite: varchar("officialWebsite", { length: 500 }),
  contactInfo: text("contactInfo"),
  status: mysqlEnum("status", ["即将开始", "报名中", "进行中", "已结束"]).default("即将开始").notNull(),
  isWhitelisted: boolean("isWhitelisted").default(false).notNull(), // 是否为白名单竞赛
  viewCount: int("viewCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = typeof competitions.$inferInsert;

/**
 * Courses table - stores teacher course information
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  teacherName: varchar("teacherName", { length: 100 }).notNull(),
  teacherTitle: varchar("teacherTitle", { length: 100 }), // 教师职称
  teacherSchool: varchar("teacherSchool", { length: 200 }), // 所在学校
  teacherIntro: text("teacherIntro"), // 教师简介
  subject: varchar("subject", { length: 100 }).notNull(), // 科目
  grade: varchar("grade", { length: 50 }).notNull(), // 适合年级
  description: text("description"),
  syllabus: text("syllabus"), // 课程大纲
  schedule: text("schedule"), // 上课时间安排
  location: varchar("location", { length: 200 }), // 上课地点
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxStudents: int("maxStudents"), // 最大学生数
  currentStudents: int("currentStudents").default(0).notNull(), // 当前学生数
  courseType: mysqlEnum("courseType", ["一对一", "小班课", "大班课"]).notNull(),
  duration: varchar("duration", { length: 100 }), // 课程时长
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactWechat: varchar("contactWechat", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
