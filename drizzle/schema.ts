import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  lineUserId: varchar("lineUserId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  iconUrl: text("iconUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Instructors ───
export const instructors = mysqlTable("instructors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  title: varchar("title", { length: 256 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = typeof instructors.$inferInsert;

// ─── Courses ───
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  subtitle: text("subtitle"),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  previewVideoUrl: text("previewVideoUrl"),
  categoryId: int("categoryId"),
  instructorId: int("instructorId"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  totalDuration: int("totalDuration").default(0).notNull(), // seconds
  totalLessons: int("totalLessons").default(0).notNull(),
  enrollmentCount: int("enrollmentCount").default(0).notNull(),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: int("ratingCount").default(0).notNull(),
  seoTitle: varchar("seoTitle", { length: 256 }),
  seoDescription: text("seoDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ─── Chapters (sections of a course) ───
export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

// ─── Lessons (videos within a chapter) ───
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: int("chapterId").notNull(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  videoKey: text("videoKey"), // S3 key
  videoUrl: text("videoUrl"), // direct URL or HLS URL
  duration: int("duration").default(0).notNull(), // seconds
  sortOrder: int("sortOrder").default(0).notNull(),
  isFreePreview: boolean("isFreePreview").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// ─── Orders ───
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal("originalAmount", { precision: 10, scale: 2 }),
  couponId: int("couponId"),
  couponCode: varchar("couponCode", { length: 64 }),
  paymentMethod: mysqlEnum("paymentMethod", ["stripe", "ecpay", "bank_transfer", "free"]).default("stripe").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paymentId: varchar("paymentId", { length: 256 }), // external payment ID
  paidAt: timestamp("paidAt"),
  // 付款憑證相關
  paymentProofUrl: text("paymentProofUrl"), // 付款憑證圖片 URL
  paymentProofKey: text("paymentProofKey"), // S3 key
  paymentNote: text("paymentNote"), // 用戶備註（轉帳後五碼等）
  proofUploadedAt: timestamp("proofUploadedAt"), // 上傳時間
  reviewStatus: mysqlEnum("reviewStatus", ["none", "pending_review", "approved", "rejected"]).default("none").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // 審核管理員 ID
  reviewNote: text("reviewNote"), // 審核備註（駁回原因等）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Enrollments (course access) ───
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  orderId: int("orderId"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ─── Learning Progress ───
export const learningProgress = mysqlTable("learning_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  courseId: int("courseId").notNull(),
  progressSeconds: int("progressSeconds").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  lastWatchedAt: timestamp("lastWatchedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;

// ─── Reviews ───
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Coupons ───
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["fixed", "percentage"]).default("fixed").notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }).default("0.00"),
  maxUses: int("maxUses").default(0).notNull(), // 0 = unlimited
  usedCount: int("usedCount").default(0).notNull(),
  courseId: int("courseId"), // null = all courses
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ─── Site Config (key-value store) ───
export const siteConfig = mysqlTable("site_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 128 }).notNull().unique(),
  configValue: text("configValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteConfig = typeof siteConfig.$inferSelect;
export type InsertSiteConfig = typeof siteConfig.$inferInsert;

// ─── LINE Notification Templates ───
export const notificationTemplates = mysqlTable("notification_templates", {
  id: int("id").autoincrement().primaryKey(),
  templateKey: varchar("templateKey", { length: 128 }).notNull().unique(),
  templateName: varchar("templateName", { length: 256 }).notNull(),
  templateBody: text("templateBody").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;

// ─── Invoices (光貿電子發票) ───
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderNo: varchar("orderNo", { length: 64 }).notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 20 }), // 發票號碼 (光貿回傳)
  invoiceDate: varchar("invoiceDate", { length: 20 }), // 發票日期
  randomNumber: varchar("randomNumber", { length: 10 }), // 隨機碼
  buyerIdentifier: varchar("buyerIdentifier", { length: 10 }).default("0000000000").notNull(), // 買方統編
  buyerName: varchar("buyerName", { length: 128 }).default("消費者").notNull(),
  buyerEmail: varchar("buyerEmail", { length: 320 }),
  carrierType: varchar("carrierType", { length: 20 }), // 載具類別
  carrierId: varchar("carrierId", { length: 128 }), // 載具號碼
  npoban: varchar("npoban", { length: 10 }), // 捐贈碼
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "issued", "voided", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  rawResponse: text("rawResponse"), // 光貿原始回傳 JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── LINE Push History ───
export const linePushHistory = mysqlTable("line_push_history", {
  id: int("id").autoincrement().primaryKey(),
  templateKey: varchar("templateKey", { length: 128 }),
  targetType: mysqlEnum("targetType", ["all", "user", "enrolled"]).default("all").notNull(),
  targetUserId: int("targetUserId"),
  messageContent: text("messageContent").notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LinePushHistory = typeof linePushHistory.$inferSelect;
export type InsertLinePushHistory = typeof linePushHistory.$inferInsert;
