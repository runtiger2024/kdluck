import { eq, and, like, desc, asc, sql, gte, lte, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  categories, InsertCategory,
  instructors, InsertInstructor,
  courses, InsertCourse,
  chapters, InsertChapter,
  lessons, InsertLesson,
  orders, InsertOrder,
  enrollments, InsertEnrollment,
  learningProgress, InsertLearningProgress,
  reviews, InsertReview,
  coupons, InsertCoupon,
  siteConfig, InsertSiteConfig,
  notificationTemplates, InsertNotificationTemplate,
  invoices, InsertInvoice,
  linePushHistory, InsertLinePushHistory,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "avatarUrl", "lineUserId"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    (values as any)[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Categories ───
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Instructors ───
export async function getAllInstructors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(instructors).orderBy(desc(instructors.createdAt));
}

export async function createInstructor(data: InsertInstructor) {
  const db = await getDb();
  if (!db) return;
  await db.insert(instructors).values(data);
}

export async function updateInstructor(id: number, data: Partial<InsertInstructor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(instructors).set(data).where(eq(instructors.id, id));
}

export async function deleteInstructor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(instructors).where(eq(instructors.id, id));
}

// ─── Courses ───
export async function getPublishedCourses(opts: { categoryId?: number; search?: string; page?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { categoryId, search, page = 1, limit = 12 } = opts;
  const offset = (page - 1) * limit;
  const conditions = [eq(courses.status, "published")];
  if (categoryId) conditions.push(eq(courses.categoryId, categoryId));
  if (search) conditions.push(or(like(courses.title, `%${search}%`), like(courses.subtitle, `%${search}%`))!);
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];
  const [items, countResult] = await Promise.all([
    db.select().from(courses).where(where).orderBy(desc(courses.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(courses).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getAllCourses(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(courses),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0];
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return result[0];
}

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(courses).values(data);
  return result[0].insertId;
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) return;
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.courseId, id));
  await db.delete(chapters).where(eq(chapters.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));
}

// ─── Chapters ───
export async function getChaptersByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chapters).where(eq(chapters.courseId, courseId)).orderBy(asc(chapters.sortOrder));
}

export async function createChapter(data: InsertChapter) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(chapters).values(data);
  return result[0].insertId;
}

export async function updateChapter(id: number, data: Partial<InsertChapter>) {
  const db = await getDb();
  if (!db) return;
  await db.update(chapters).set(data).where(eq(chapters.id, id));
}

export async function deleteChapter(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.chapterId, id));
  await db.delete(chapters).where(eq(chapters.id, id));
}

// ─── Lessons ───
export async function getLessonsByChapter(chapterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.chapterId, chapterId)).orderBy(asc(lessons.sortOrder));
}

export async function getLessonsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.sortOrder));
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result[0];
}

export async function createLesson(data: InsertLesson) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(lessons).values(data);
  return result[0].insertId;
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set(data).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.id, id));
}

// ─── Orders ───
export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) return;
  await db.insert(orders).values(data);
}

export async function getOrderByNo(orderNo: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNo, orderNo)).limit(1);
  return result[0];
}

export async function getOrdersByUser(userId: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = eq(orders.userId, userId);
  const [items, countResult] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getAllOrders(page = 1, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions: any[] = [];
  if (status && status !== "all") conditions.push(eq(orders.paymentStatus, status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function updateOrderStatus(orderNo: string, status: "pending" | "paid" | "failed" | "refunded", paymentId?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { paymentStatus: status };
  if (status === "paid") updateData.paidAt = new Date();
  if (paymentId) updateData.paymentId = paymentId;
  await db.update(orders).set(updateData).where(eq(orders.orderNo, orderNo));
}

// ─── Enrollments ───
export async function createEnrollment(data: InsertEnrollment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(enrollments).values(data);
  // increment enrollment count
  await db.update(courses).set({ enrollmentCount: sql`enrollmentCount + 1` }).where(eq(courses.id, data.courseId));
}

export async function isEnrolled(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))).limit(1);
  return result.length > 0;
}

export async function getEnrolledCourses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const enrolled = await db.select().from(enrollments).where(eq(enrollments.userId, userId)).orderBy(desc(enrollments.enrolledAt));
  if (enrolled.length === 0) return [];
  const courseIds = enrolled.map(e => e.courseId);
  return db.select().from(courses).where(inArray(courses.id, courseIds));
}

// ─── Learning Progress ───
export async function upsertProgress(data: InsertLearningProgress) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(learningProgress)
    .where(and(eq(learningProgress.userId, data.userId), eq(learningProgress.lessonId, data.lessonId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(learningProgress).set({
      progressSeconds: data.progressSeconds,
      completed: data.completed,
      lastWatchedAt: new Date(),
    }).where(eq(learningProgress.id, existing[0].id));
  } else {
    await db.insert(learningProgress).values({ ...data, lastWatchedAt: new Date() });
  }
}

export async function getProgressByCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.courseId, courseId)));
}

export async function getProgressByLesson(userId: number, lessonId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.lessonId, lessonId)))
    .limit(1);
  return result[0];
}

// ─── Reviews ───
export async function getReviewsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.courseId, courseId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data);
  // Update course avg rating
  const allReviews = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.courseId, data.courseId));
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db.update(courses).set({ avgRating: avg.toFixed(2), ratingCount: allReviews.length }).where(eq(courses.id, data.courseId));
}

// ─── Coupons ───
export async function getAllCoupons(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select().from(coupons).orderBy(desc(coupons.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(coupons),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  return result[0];
}

export async function createCoupon(data: InsertCoupon) {
  const db = await getDb();
  if (!db) return;
  await db.insert(coupons).values(data);
}

export async function updateCoupon(id: number, data: Partial<InsertCoupon>) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set(data).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function incrementCouponUsage(couponId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set({ usedCount: sql`usedCount + 1` }).where(eq(coupons.id, couponId));
}

// ─── Site Config ───
export async function getSiteConfig() {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(siteConfig);
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.configKey] = row.configValue ?? "";
  }
  return config;
}

export async function updateSiteConfig(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(siteConfig).where(eq(siteConfig.configKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteConfig).set({ configValue: value }).where(eq(siteConfig.configKey, key));
  } else {
    await db.insert(siteConfig).values({ configKey: key, configValue: value });
  }
}

// ─── Notification Templates ───
export async function getAllNotificationTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationTemplates);
}

export async function updateNotificationTemplate(id: number, data: Partial<InsertNotificationTemplate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificationTemplates).set(data).where(eq(notificationTemplates.id, id));
}

// ─── Analytics ───
export async function getSalesStats() {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalOrders: 0, paidOrders: 0, totalUsers: 0, totalCourses: 0 };
  const [revenueResult, orderCountResult, paidCountResult, userCountResult, courseCountResult] = await Promise.all([
    db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(courses),
  ]);
  return {
    totalRevenue: revenueResult[0]?.total ?? 0,
    totalOrders: orderCountResult[0]?.count ?? 0,
    paidOrders: paidCountResult[0]?.count ?? 0,
    totalUsers: userCountResult[0]?.count ?? 0,
    totalCourses: courseCountResult[0]?.count ?? 0,
  };
}

export async function getMonthlySales() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(amount) as revenue, COUNT(*) as orderCount
    FROM orders WHERE paymentStatus = 'paid' AND paidAt IS NOT NULL
    GROUP BY DATE_FORMAT(paidAt, '%Y-%m')
    ORDER BY month DESC LIMIT 12
  `);
  return (result[0] as unknown as any[]) ?? [];
}

export async function getUserGrowth() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as userCount
    FROM users
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month DESC LIMIT 12
  `);
  return (result[0] as unknown as any[]) ?? [];
}

export async function getInstructorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(instructors).where(eq(instructors.id, id)).limit(1);
  return result[0];
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

// ─── Invoices (光貿電子發票) ───
export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(invoices).values(data);
  return result[0].insertId;
}

export async function getInvoiceByOrderNo(orderNo: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.orderNo, orderNo)).limit(1);
  return result[0];
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice> & { status?: string; invoiceNumber?: string; invoiceDate?: string; randomNumber?: string; rawResponse?: string; errorMessage?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set(data as any).where(eq(invoices.id, id));
}

export async function getAllInvoices(page = 1, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions: any[] = [];
  if (status && status !== "all") conditions.push(eq(invoices.status, status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(invoices).where(where).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(invoices).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

// ─── LINE Push History ───
export async function createLinePush(data: InsertLinePushHistory) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(linePushHistory).values(data);
  return result[0].insertId;
}

export async function updateLinePush(id: number, data: Partial<InsertLinePushHistory> & { status?: string; sentCount?: number; errorMessage?: string; sentAt?: Date }) {
  const db = await getDb();
  if (!db) return;
  await db.update(linePushHistory).set(data as any).where(eq(linePushHistory.id, id));
}

export async function getLinePushHistory(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select().from(linePushHistory).orderBy(desc(linePushHistory.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(linePushHistory),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

// ─── Reviews (Admin) ───
export async function getAllReviews(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(reviews),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(reviews).where(eq(reviews.id, id));
}

// ─── Users with LINE ───
export async function getUsersWithLineId() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, lineUserId: users.lineUserId })
    .from(users)
    .where(sql`lineUserId IS NOT NULL AND lineUserId != ''`);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ─── API Config (從 DB 讀取，fallback 到環境變數) ───
export interface ApiConfig {
  ecpayMerchantId: string;
  ecpayHashKey: string;
  ecpayHashIv: string;
  ecpayIsProduction: boolean;
  amegoInvoiceNumber: string;
  amegoAppKey: string;
  lineChannelId: string;
  lineChannelSecret: string;
  lineMessagingToken: string;
}

/**
 * 從 DB site_config 讀取 API 金鑰，若 DB 無值則 fallback 到環境變數
 * 這讓管理員可以直接在管理後台設定金鑰，無需接觸環境變數
 */
export async function getApiConfig(): Promise<ApiConfig> {
  const config = await getSiteConfig();
  return {
    ecpayMerchantId: config.ecpay_merchant_id || process.env.ECPAY_MERCHANT_ID || "",
    ecpayHashKey: config.ecpay_hash_key || process.env.ECPAY_HASH_KEY || "",
    ecpayHashIv: config.ecpay_hash_iv || process.env.ECPAY_HASH_IV || "",
    ecpayIsProduction: (config.ecpay_is_production || process.env.ECPAY_IS_PRODUCTION || "false") === "true",
    amegoInvoiceNumber: config.amego_invoice_number || process.env.AMEGO_INVOICE_NUMBER || "",
    amegoAppKey: config.amego_app_key || process.env.AMEGO_APP_KEY || "",
    lineChannelId: config.line_channel_id || process.env.LINE_CHANNEL_ID || "",
    lineChannelSecret: config.line_channel_secret || process.env.LINE_CHANNEL_SECRET || "",
    lineMessagingToken: config.line_messaging_token || process.env.LINE_MESSAGING_TOKEN || "",
  };
}
