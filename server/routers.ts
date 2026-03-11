import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";
import { storagePut, storageGet } from "./storage";
import { invokeLLM } from "./_core/llm";
import { issueInvoice, voidInvoice } from "./amego";
import { pushMessage, multicastMessage, broadcastMessage } from "./line";
import { getApiConfig } from "./db";
import { notifyPurchaseSuccess, notifyProofReviewResult, notifyCertificateIssued, notifyNewCourse } from "./notificationService";

// ─── Auth Router ───
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Category Router ───
const categoryRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllCategories();
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    iconUrl: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.createCategory(input);
    return { success: true };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    iconUrl: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCategory(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCategory(input.id);
    return { success: true };
  }),
});

// ─── Instructor Router ───
const instructorRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllInstructors();
  }),
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getInstructorById(input.id);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    title: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.createInstructor(input);
    return { success: true };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    title: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateInstructor(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteInstructor(input.id);
    return { success: true };
  }),
});

// ─── Course Router ───
const courseRouter = router({
  published: publicProcedure.input(z.object({
    categoryId: z.number().optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getPublishedCourses(input ?? {});
  }),
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllCourses(input?.page, input?.limit);
  }),
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getCourseById(input.id);
  }),
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return db.getCourseBySlug(input.slug);
  }),
  create: adminProcedure.input(z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    coverImageUrl: z.string().optional(),
    previewVideoUrl: z.string().optional(),
    categoryId: z.number().optional(),
    instructorId: z.number().optional(),
    price: z.string().optional(),
    originalPrice: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createCourse(input);
    return { success: true, id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    slug: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    coverImageUrl: z.string().optional(),
    previewVideoUrl: z.string().optional(),
    categoryId: z.number().nullable().optional(),
    instructorId: z.number().nullable().optional(),
    price: z.string().optional(),
    originalPrice: z.string().nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCourse(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCourse(input.id);
    return { success: true };
  }),
});

// ─── Chapter Router ───
const chapterRouter = router({
  listByCourse: publicProcedure.input(z.object({ courseId: z.number() })).query(async ({ input }) => {
    return db.getChaptersByCourse(input.courseId);
  }),
  create: adminProcedure.input(z.object({
    courseId: z.number(),
    title: z.string().min(1),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createChapter(input);
    return { success: true, id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateChapter(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteChapter(input.id);
    return { success: true };
  }),
});

// ─── Lesson Router ───
const lessonRouter = router({
  listByChapter: publicProcedure.input(z.object({ chapterId: z.number() })).query(async ({ input }) => {
    return db.getLessonsByChapter(input.chapterId);
  }),
  listByCourse: publicProcedure.input(z.object({ courseId: z.number() })).query(async ({ input }) => {
    return db.getLessonsByCourse(input.courseId);
  }),
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getLessonById(input.id);
  }),
  create: adminProcedure.input(z.object({
    chapterId: z.number(),
    courseId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    videoKey: z.string().optional(),
    videoUrl: z.string().optional(),
    duration: z.number().optional(),
    sortOrder: z.number().optional(),
    isFreePreview: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createLesson(input);
    // Update course total lessons count
    const allLessons = await db.getLessonsByCourse(input.courseId);
    const totalDuration = allLessons.reduce((sum, l) => sum + l.duration, 0);
    await db.updateCourse(input.courseId, { totalLessons: allLessons.length + 1, totalDuration: totalDuration + (input.duration ?? 0) });
    return { success: true, id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    videoKey: z.string().optional(),
    videoUrl: z.string().optional(),
    duration: z.number().optional(),
    sortOrder: z.number().optional(),
    isFreePreview: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateLesson(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number(), courseId: z.number() })).mutation(async ({ input }) => {
    await db.deleteLesson(input.id);
    const allLessons = await db.getLessonsByCourse(input.courseId);
    const totalDuration = allLessons.reduce((sum, l) => sum + l.duration, 0);
    await db.updateCourse(input.courseId, { totalLessons: allLessons.length, totalDuration });
    return { success: true };
  }),
  // Signed URL for video access
  getSignedUrl: protectedProcedure.input(z.object({ lessonId: z.number() })).query(async ({ input, ctx }) => {
    const lesson = await db.getLessonById(input.lessonId);
    if (!lesson) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    // If free preview, allow access
    if (lesson.isFreePreview) {
      if (lesson.videoKey) {
        const { url } = await storageGet(lesson.videoKey);
        return { url };
      }
      return { url: lesson.videoUrl };
    }
    // Check enrollment
    const enrolled = await db.isEnrolled(ctx.user.id, lesson.courseId);
    if (!enrolled && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "You need to purchase this course" });
    }
    if (lesson.videoKey) {
      const { url } = await storageGet(lesson.videoKey);
      return { url };
    }
    return { url: lesson.videoUrl };
  }),
});

// ─── Order Router ───
const orderRouter = router({
  create: protectedProcedure.input(z.object({
    courseId: z.number(),
    paymentMethod: z.enum(["ecpay", "bank_transfer", "free"]),
    couponCode: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    // Check if already enrolled
    const enrolled = await db.isEnrolled(ctx.user.id, input.courseId);
    if (enrolled) throw new TRPCError({ code: "BAD_REQUEST", message: "您已購買此課程" });

    const course = await db.getCourseById(input.courseId);
    if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });

    let amount = parseFloat(course.price);
    let couponId: number | undefined;
    let couponCode: string | undefined;

    // Apply coupon
    if (input.couponCode) {
      const coupon = await db.getCouponByCode(input.couponCode);
      if (!coupon) throw new TRPCError({ code: "BAD_REQUEST", message: "無效的優惠券" });
      if (!coupon.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "優惠券已停用" });
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) throw new TRPCError({ code: "BAD_REQUEST", message: "優惠券已用完" });
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "優惠券已過期" });
      if (coupon.courseId && coupon.courseId !== input.courseId) throw new TRPCError({ code: "BAD_REQUEST", message: "此優惠券不適用於此課程" });
      if (coupon.minOrderAmount && amount < parseFloat(coupon.minOrderAmount)) throw new TRPCError({ code: "BAD_REQUEST", message: "未達最低消費金額" });

      if (coupon.discountType === "fixed") {
        amount = Math.max(0, amount - parseFloat(coupon.discountValue));
      } else {
        amount = Math.max(0, amount * (1 - parseFloat(coupon.discountValue) / 100));
      }
      couponId = coupon.id;
      couponCode = coupon.code;
    }

    const orderNo = `KD${Date.now()}${nanoid(6)}`;

    // If free, auto-enroll
    if (amount <= 0 || input.paymentMethod === "free") {
      await db.createOrder({
        orderNo,
        userId: ctx.user.id,
        courseId: input.courseId,
        amount: "0.00",
        originalAmount: course.price,
        couponId,
        couponCode,
        paymentMethod: "free",
        paymentStatus: "paid",
        paidAt: new Date(),
      });
      await db.createEnrollment({ userId: ctx.user.id, courseId: input.courseId });
      if (couponId) await db.incrementCouponUsage(couponId);

      // 通知用戶（站內 + LINE + Email）
      try {
        const origin = ctx.req.headers.origin as string | undefined;
        await notifyPurchaseSuccess(ctx.user.id, course.title, orderNo, origin);
      } catch (e) {
        console.warn("[Order] Free order notification failed:", e);
      }

      return { orderNo, amount: 0, status: "paid" };
    }

    await db.createOrder({
      orderNo,
      userId: ctx.user.id,
      courseId: input.courseId,
      amount: amount.toFixed(2),
      originalAmount: course.price,
      couponId,
      couponCode,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
    });

    return { orderNo, amount, status: "pending" };
  }),
  myOrders: protectedProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getOrdersByUser(ctx.user.id, input?.page, input?.limit);
  }),
  getByNo: protectedProcedure.input(z.object({ orderNo: z.string() })).query(async ({ input, ctx }) => {
    const order = await db.getOrderByNo(input.orderNo);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return order;
  }),
  // Admin: list all orders
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllOrders(input?.page, input?.limit, input?.status);
  }),
  // 用戶上傳付款憑證
  uploadProof: protectedProcedure.input(z.object({
    orderNo: z.string(),
    base64Data: z.string(),
    contentType: z.string(),
    fileName: z.string(),
    note: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const order = await db.getOrderByNo(input.orderNo);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
    if (order.paymentMethod !== "bank_transfer") throw new TRPCError({ code: "BAD_REQUEST", message: "僅限銀行轉帳訂單" });
    if (order.paymentStatus === "paid") throw new TRPCError({ code: "BAD_REQUEST", message: "訂單已付款" });
    const buffer = Buffer.from(input.base64Data, "base64");
    const key = `payment-proofs/${order.orderNo}-${nanoid(8)}.${input.fileName.split(".").pop() || "jpg"}`;
    const { url } = await storagePut(key, buffer, input.contentType);
    await db.uploadPaymentProof(input.orderNo, url, key, input.note);
    return { success: true, proofUrl: url };
  }),
  // Admin: confirm bank transfer payment
  confirmPayment: adminProcedure.input(z.object({
    orderNo: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const order = await db.getOrderByNo(input.orderNo);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.paymentStatus === "paid") throw new TRPCError({ code: "BAD_REQUEST", message: "已付款" });
    await db.updateOrderStatus(input.orderNo, "paid", "manual_confirm");
    await db.createEnrollment({ userId: order.userId, courseId: order.courseId });
    if (order.couponId) await db.incrementCouponUsage(order.couponId);

    // 通知用戶購買成功（站內 + LINE + Email）
    try {
      const course = await db.getCourseById(order.courseId);
      const origin = ctx.req.headers.origin as string | undefined;
      await notifyPurchaseSuccess(order.userId, course?.title ?? "線上課程", input.orderNo, origin);
    } catch (e) {
      console.warn("[Order] Confirm payment notification failed:", e);
    }

    return { success: true };
  }),
  // Admin: 審核付款憑證
  reviewProof: adminProcedure.input(z.object({
    orderNo: z.string(),
    approved: z.boolean(),
    reviewNote: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const order = await db.getOrderByNo(input.orderNo);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.reviewStatus !== "pending_review") throw new TRPCError({ code: "BAD_REQUEST", message: "此訂單無待審核憑證" });
    await db.reviewPaymentProof(input.orderNo, input.approved, ctx.user.id, input.reviewNote);
    if (input.approved) {
      await db.createEnrollment({ userId: order.userId, courseId: order.courseId });
      if (order.couponId) await db.incrementCouponUsage(order.couponId);
    }

    // 通知用戶審核結果（站內 + LINE）
    try {
      const origin = ctx.req.headers.origin as string | undefined;
      await notifyProofReviewResult(order.userId, input.orderNo, input.approved, input.reviewNote, origin);
    } catch (e) {
      console.warn("[Order] Proof review notification failed:", e);
    }

    return { success: true };
  }),
  // Admin: 待審核憑證列表
  pendingReviews: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getOrdersWithPendingReview(input?.page, input?.limit);
  }),
  // Admin: 待審核數量（輕量查詢，供側邊欄徽章使用）
  pendingReviewCount: adminProcedure.query(async () => {
    return { count: await db.getPendingReviewCount() };
  }),
});

// ─── Enrollment Router ───
const enrollmentRouter = router({
  check: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ input, ctx }) => {
    return { enrolled: await db.isEnrolled(ctx.user.id, input.courseId) };
  }),
  myCourses: protectedProcedure.query(async ({ ctx }) => {
    return db.getEnrolledCourses(ctx.user.id);
  }),
});

// ─── Progress Router ───
const progressRouter = router({
  update: protectedProcedure.input(z.object({
    lessonId: z.number(),
    courseId: z.number(),
    progressSeconds: z.number(),
    completed: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    await db.upsertProgress({
      userId: ctx.user.id,
      lessonId: input.lessonId,
      courseId: input.courseId,
      progressSeconds: input.progressSeconds,
      completed: input.completed ?? false,
    });
    return { success: true };
  }),
  getByCourse: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ input, ctx }) => {
    return db.getProgressByCourse(ctx.user.id, input.courseId);
  }),
  getByLesson: protectedProcedure.input(z.object({ lessonId: z.number() })).query(async ({ input, ctx }) => {
    return db.getProgressByLesson(ctx.user.id, input.lessonId);
  }),
});

// ─── Review Router ───
const reviewRouter = router({
  listByCourse: publicProcedure.input(z.object({ courseId: z.number() })).query(async ({ input }) => {
    return db.getReviewsByCourse(input.courseId);
  }),
  create: protectedProcedure.input(z.object({
    courseId: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    // Check enrollment
    const enrolled = await db.isEnrolled(ctx.user.id, input.courseId);
    if (!enrolled) throw new TRPCError({ code: "FORBIDDEN", message: "需購買課程才能評價" });
    await db.createReview({ userId: ctx.user.id, courseId: input.courseId, rating: input.rating, comment: input.comment });
    return { success: true };
  }),
});

// ─── Coupon Router ───
const couponRouter = router({
  validate: publicProcedure.input(z.object({ code: z.string(), courseId: z.number().optional() })).query(async ({ input }) => {
    const coupon = await db.getCouponByCode(input.code);
    if (!coupon) return { valid: false, message: "無效的優惠券" };
    if (!coupon.isActive) return { valid: false, message: "優惠券已停用" };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { valid: false, message: "優惠券已用完" };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, message: "優惠券已過期" };
    if (coupon.courseId && input.courseId && coupon.courseId !== input.courseId) return { valid: false, message: "此優惠券不適用於此課程" };
    return { valid: true, coupon };
  }),
  // Admin
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllCoupons(input?.page, input?.limit);
  }),
  create: adminProcedure.input(z.object({
    code: z.string().min(1),
    discountType: z.enum(["fixed", "percentage"]),
    discountValue: z.string(),
    minOrderAmount: z.string().optional(),
    maxUses: z.number().optional(),
    courseId: z.number().nullable().optional(),
    startsAt: z.date().nullable().optional(),
    expiresAt: z.date().nullable().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    await db.createCoupon(input);
    return { success: true };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    code: z.string().optional(),
    discountType: z.enum(["fixed", "percentage"]).optional(),
    discountValue: z.string().optional(),
    minOrderAmount: z.string().optional(),
    maxUses: z.number().optional(),
    courseId: z.number().nullable().optional(),
    startsAt: z.date().nullable().optional(),
    expiresAt: z.date().nullable().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCoupon(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCoupon(input.id);
    return { success: true };
  }),
});

// ─── Site Config Router ───
const siteConfigRouter = router({
  get: publicProcedure.query(async () => {
    return db.getSiteConfig();
  }),
  getBankInfo: publicProcedure.query(async () => {
    const config = await db.getSiteConfig();
    if (config.bank_transfer_enabled !== "true") return { enabled: false };
    return {
      enabled: true,
      bankName: config.bank_name || "",
      bankCode: config.bank_code || "",
      bankAccount: config.bank_account || "",
      bankHolder: config.bank_holder || "",
    };
  }),
  update: adminProcedure.input(z.object({
    key: z.string(),
    value: z.string(),
  })).mutation(async ({ input }) => {
    await db.updateSiteConfig(input.key, input.value);
    return { success: true };
  }),
  updateBatch: adminProcedure.input(z.array(z.object({
    key: z.string(),
    value: z.string(),
  }))).mutation(async ({ input }) => {
    for (const item of input) {
      await db.updateSiteConfig(item.key, item.value);
    }
    return { success: true };
  }),
});

// ─── Notification Template Router ───
const notificationRouter = router({
  templates: adminProcedure.query(async () => {
    return db.getAllNotificationTemplates();
  }),
  updateTemplate: adminProcedure.input(z.object({
    id: z.number(),
    templateName: z.string().optional(),
    templateBody: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateNotificationTemplate(id, data);
    return { success: true };
  }),
});

// ─── User Management Router (Admin) ───
const userRouter = router({
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllUsers(input?.page, input?.limit);
  }),
  // 管理員搜尋用戶
  search: adminProcedure.input(z.object({
    query: z.string().min(1),
    page: z.number().optional(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.searchUsers(input.query, input.page, input.limit);
  }),
  // 管理員查看用戶帳號詳情
  accountDetail: adminProcedure.input(z.object({
    userId: z.number(),
  })).query(async ({ input }) => {
    return db.getUserAccountDetail(input.userId);
  }),
  updateRole: adminProcedure.input(z.object({
    userId: z.number(),
    role: z.enum(["user", "admin"]),
  })).mutation(async ({ input }) => {
    await db.updateUserRole(input.userId, input.role);
    return { success: true };
  }),
  // 用戶自行更新個人資料
  updateProfile: protectedProcedure.input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    birthday: z.string().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    avatarUrl: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateUserProfile(ctx.user.id, input);
    return { success: true };
  }),
  // 取得完整個人資料
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserById(ctx.user.id);
  }),
  // 帳號安全資訊（用戶自己查看）
  accountSecurity: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      loginMethod: user.loginMethod ?? "manus",
      hasEmail: !!user.email,
      email: user.email ? `${user.email.slice(0, 3)}***${user.email.slice(user.email.indexOf("@"))}` : null,
      hasLineBinding: !!user.lineUserId,
      hasPhone: !!user.phone,
      phone: user.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : null,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),
  // 公開帳號查詢（透過 Email 查詢帳號狀態，不需登入）
  lookupByEmail: publicProcedure.input(z.object({
    email: z.string().email(),
  })).query(async ({ input }) => {
    const found = await db.findUserByEmail(input.email);
    if (found.length === 0) {
      return { found: false, accounts: [] };
    }
    // 只回傳脱敏資訊
    return {
      found: true,
      accounts: found.map(u => ({
        loginMethod: u.loginMethod ?? "manus",
        hasLineBinding: !!u.lineUserId,
        maskedName: u.name ? `${u.name.charAt(0)}${'*'.repeat(Math.max(0, (u.name.length || 1) - 1))}` : null,
        createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn,
      })),
    };
  }),
});

// ─── Analytics Router ───
const analyticsRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getSalesStats();
  }),
  monthlySales: adminProcedure.query(async () => {
    return db.getMonthlySales();
  }),
  userGrowth: adminProcedure.query(async () => {
    return db.getUserGrowth();
  }),
});

// ─── Upload Router ───
const uploadRouter = router({
  getPresignedUrl: adminProcedure.input(z.object({
    fileName: z.string(),
    contentType: z.string(),
    folder: z.string().optional(),
  })).mutation(async ({ input }) => {
    const folder = input.folder ?? "uploads";
    const key = `${folder}/${nanoid(12)}-${input.fileName}`;
    return { key, uploadUrl: key };
  }),
  uploadFile: adminProcedure.input(z.object({
    key: z.string(),
    base64Data: z.string(),
    contentType: z.string(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.base64Data, "base64");
    const { url } = await storagePut(input.key, buffer, input.contentType);
    return { url, key: input.key };
  }),
});

// ─── LLM Recommendation Router ───
const recommendRouter = router({
  getCourseRecommendations: protectedProcedure.query(async ({ ctx }) => {
    // Get user's enrolled courses and progress
    const enrolledCourses = await db.getEnrolledCourses(ctx.user.id);
    const allPublished = await db.getPublishedCourses({ limit: 50 });

    const enrolledIds = new Set(enrolledCourses.map(c => c.id));
    const availableCourses = allPublished.items.filter(c => !enrolledIds.has(c.id));

    if (availableCourses.length === 0) return { recommendations: [], reason: "您已購買所有課程！" };

    const enrolledInfo = enrolledCourses.map(c => `${c.title} (${c.level})`).join(", ");
    const availableInfo = availableCourses.map(c => `ID:${c.id} ${c.title} (${c.level}, $${c.price})`).join("\n");

    try {
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "你是一個課程推薦助手。根據用戶已學習的課程，推薦最適合的新課程。回傳 JSON 格式。" },
          { role: "user", content: `用戶已學習：${enrolledInfo || "無"}\n\n可推薦課程：\n${availableInfo}\n\n請推薦最多3門課程，回傳 JSON: { "ids": [課程ID], "reason": "推薦理由" }` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                ids: { type: "array", items: { type: "number" } },
                reason: { type: "string" },
              },
              required: ["ids", "reason"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      if (typeof content === "string") {
        const parsed = JSON.parse(content);
        const recommended = availableCourses.filter(c => parsed.ids.includes(c.id));
        return { recommendations: recommended, reason: parsed.reason };
      }
    } catch (e) {
      console.error("LLM recommendation error:", e);
    }

    // Fallback: return first 3 available courses
    return { recommendations: availableCourses.slice(0, 3), reason: "為您推薦熱門課程" };
  }),
});

// ─── Invoice Router (光貿電子發票) ───
const invoiceRouter = router({
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllInvoices(input?.page, input?.limit, input?.status);
  }),
  getByOrderNo: adminProcedure.input(z.object({ orderNo: z.string() })).query(async ({ input }) => {
    return db.getInvoiceByOrderNo(input.orderNo);
  }),
  issue: adminProcedure.input(z.object({
    orderId: z.number(),
    orderNo: z.string(),
    buyerIdentifier: z.string().optional(),
    buyerName: z.string().optional(),
    buyerEmail: z.string().optional(),
    carrierType: z.string().optional(),
    carrierId: z.string().optional(),
    npoban: z.string().optional(),
    itemName: z.string(),
    amount: z.number(),
  })).mutation(async ({ input }) => {
    // Create invoice record
    const invoiceId = await db.createInvoice({
      orderId: input.orderId,
      orderNo: input.orderNo,
      buyerIdentifier: input.buyerIdentifier || "0000000000",
      buyerName: input.buyerName || "消費者",
      buyerEmail: input.buyerEmail,
      carrierType: input.carrierType,
      carrierId: input.carrierId,
      npoban: input.npoban,
      amount: input.amount.toFixed(2),
      taxAmount: "0.00",
      totalAmount: input.amount.toFixed(2),
    });

    try {
      const apiConfig = await getApiConfig();
      const amegoCredentials = { invoiceNumber: apiConfig.amegoInvoiceNumber, appKey: apiConfig.amegoAppKey };
      const result = await issueInvoice({
        orderId: input.orderNo,
        buyerIdentifier: input.buyerIdentifier,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        carrierType: input.carrierType,
        carrierId1: input.carrierId,
        carrierId2: input.carrierId,
        npoban: input.npoban,
        items: [{ name: input.itemName, quantity: 1, unitPrice: input.amount, amount: input.amount }],
        totalAmount: input.amount,
      }, amegoCredentials);

      if (result && result.Status === "Success") {
        await db.updateInvoice(invoiceId!, {
          status: "issued",
          invoiceNumber: result.InvoiceNumber,
          invoiceDate: result.InvoiceDate,
          randomNumber: result.RandomNumber,
          rawResponse: JSON.stringify(result),
        });
        return { success: true, invoiceNumber: result.InvoiceNumber };
      } else {
        await db.updateInvoice(invoiceId!, {
          status: "failed",
          errorMessage: result?.Message || "開立失敗",
          rawResponse: JSON.stringify(result),
        });
        return { success: false, error: result?.Message || "開立失敗" };
      }
    } catch (error: any) {
      await db.updateInvoice(invoiceId!, {
        status: "failed",
        errorMessage: error.message,
      });
      return { success: false, error: error.message };
    }
  }),
  void: adminProcedure.input(z.object({
    id: z.number(),
    invoiceNumber: z.string(),
    invoiceDate: z.string(),
    reason: z.string().optional(),
  })).mutation(async ({ input }) => {
    try {
      const apiConfig = await getApiConfig();
      const amegoCredentials = { invoiceNumber: apiConfig.amegoInvoiceNumber, appKey: apiConfig.amegoAppKey };
      const result = await voidInvoice(input.invoiceNumber, input.invoiceDate, amegoCredentials, input.reason);
      if (result && result.Status === "Success") {
        await db.updateInvoice(input.id, { status: "voided", rawResponse: JSON.stringify(result) });
        return { success: true };
      } else {
        return { success: false, error: result?.Message || "作廢失敗" };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),
});

// ─── LINE Push Router ───
const linePushRouter = router({
  history: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getLinePushHistory(input?.page, input?.limit);
  }),
  send: adminProcedure.input(z.object({
    targetType: z.enum(["all", "user", "enrolled"]),
    targetUserId: z.number().optional(),
    messageContent: z.string().min(1),
    templateKey: z.string().optional(),
  })).mutation(async ({ input }) => {
    const pushId = await db.createLinePush({
      templateKey: input.templateKey,
      targetType: input.targetType,
      targetUserId: input.targetUserId,
      messageContent: input.messageContent,
    });

    try {
      let result: { success: number; failed: number } = { success: 0, failed: 0 };

      const apiConfig = await getApiConfig();
      const lineToken = apiConfig.lineMessagingToken;

      if (input.targetType === "all") {
        const ok = await broadcastMessage(input.messageContent, lineToken);
        result = ok ? { success: 1, failed: 0 } : { success: 0, failed: 1 };
      } else if (input.targetType === "user" && input.targetUserId) {
        const user = await db.getUserById(input.targetUserId);
        if (user?.lineUserId) {
          const ok = await pushMessage(user.lineUserId, input.messageContent, lineToken);
          result = ok ? { success: 1, failed: 0 } : { success: 0, failed: 1 };
        } else {
          result = { success: 0, failed: 1 };
        }
      } else if (input.targetType === "enrolled") {
        const lineUsers = await db.getUsersWithLineId();
        const lineIds = lineUsers.map(u => u.lineUserId!).filter(Boolean);
        if (lineIds.length > 0) {
          result = await multicastMessage(lineIds, input.messageContent, lineToken);
        }
      }

      await db.updateLinePush(pushId!, {
        status: result.success > 0 ? "sent" : "failed",
        sentCount: result.success,
        sentAt: new Date(),
        errorMessage: result.failed > 0 ? `${result.failed} 筆發送失敗` : undefined,
      });

      return { success: true, sentCount: result.success, failedCount: result.failed };
    } catch (error: any) {
      await db.updateLinePush(pushId!, {
        status: "failed",
        errorMessage: error.message,
      });
      return { success: false, error: error.message };
    }
  }),
  // Get users with LINE ID for targeted push
  lineUsers: adminProcedure.query(async () => {
    return db.getUsersWithLineId();
  }),
});

// ─── Review Admin Router ───
const reviewAdminRouter = router({
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllReviews(input?.page, input?.limit);
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteReview(input.id);
    return { success: true };
  }),
});

// ─── Wishlist Router ───
const wishlistRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserWishlist(ctx.user.id);
  }),
  add: protectedProcedure.input(z.object({ courseId: z.number() })).mutation(async ({ input, ctx }) => {
    await db.addToWishlist(ctx.user.id, input.courseId);
    return { success: true };
  }),
  remove: protectedProcedure.input(z.object({ courseId: z.number() })).mutation(async ({ input, ctx }) => {
    await db.removeFromWishlist(ctx.user.id, input.courseId);
    return { success: true };
  }),
  check: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ input, ctx }) => {
    return { inWishlist: await db.isInWishlist(ctx.user.id, input.courseId) };
  }),
});

// ─── Announcement Router ───
const announcementRouter = router({
  active: publicProcedure.query(async () => {
    return db.getActiveAnnouncements();
  }),
  all: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllAnnouncements(input?.page, input?.limit);
  }),
  create: adminProcedure.input(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(["info", "warning", "promotion", "maintenance"]).optional(),
    isPinned: z.boolean().optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createAnnouncement({
      title: input.title,
      content: input.content,
      type: input.type,
      isPinned: input.isPinned,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt ? new Date(input.endAt) : undefined,
    });
    return { success: true, id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    content: z.string().optional(),
    type: z.enum(["info", "warning", "promotion", "maintenance"]).optional(),
    isActive: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, startAt, endAt, ...rest } = input;
    await db.updateAnnouncement(id, {
      ...rest,
      ...(startAt !== undefined ? { startAt: startAt ? new Date(startAt) : null } : {}),
      ...(endAt !== undefined ? { endAt: endAt ? new Date(endAt) : null } : {}),
    } as any);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteAnnouncement(input.id);
    return { success: true };
  }),
});

// ─── FAQ Router ───
const faqRouter = router({
  byCourse: publicProcedure.input(z.object({ courseId: z.number() })).query(async ({ input }) => {
    return db.getFaqsByCourse(input.courseId);
  }),
  create: adminProcedure.input(z.object({
    courseId: z.number(),
    question: z.string().min(1),
    answer: z.string().min(1),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createFaq(input);
    return { success: true, id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    question: z.string().optional(),
    answer: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateFaq(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteFaq(input.id);
    return { success: true };
  }),
});

// ─── Notes Router ───
const noteRouter = router({
  byCourse: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ input, ctx }) => {
    return db.getNotesByUserAndCourse(ctx.user.id, input.courseId);
  }),
  byLesson: protectedProcedure.input(z.object({ lessonId: z.number() })).query(async ({ input, ctx }) => {
    return db.getNotesByUserAndLesson(ctx.user.id, input.lessonId);
  }),
  all: protectedProcedure.query(async ({ ctx }) => {
    return db.getAllNotesByUser(ctx.user.id);
  }),
  create: protectedProcedure.input(z.object({
    courseId: z.number(),
    lessonId: z.number().optional(),
    content: z.string().min(1),
    videoTimestamp: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createNote({ ...input, userId: ctx.user.id });
    return { success: true, id };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    content: z.string().min(1),
  })).mutation(async ({ input, ctx }) => {
    await db.updateNote(input.id, ctx.user.id, input.content);
    return { success: true };
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await db.deleteNote(input.id, ctx.user.id);
    return { success: true };
  }),
});

// ─── Certificate Router ───
const certificateRouter = router({
  // 檢查用戶是否已完成課程並可以獲取證書
  check: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ input, ctx }) => {
    // 檢查是否已註冊
    const enrolled = await db.isEnrolled(ctx.user.id, input.courseId);
    if (!enrolled) return { eligible: false, reason: "尚未購買此課程" };
    // 檢查完成率
    const allLessons = await db.getLessonsByCourse(input.courseId);
    const progress = await db.getProgressByCourse(ctx.user.id, input.courseId);
    const completedCount = progress.filter(p => p.completed).length;
    const totalCount = allLessons.length;
    if (totalCount === 0) return { eligible: false, reason: "課程尚無課時內容" };
    const completionRate = completedCount / totalCount;
    if (completionRate < 0.8) return { eligible: false, reason: `完成率需達 80% 以上（目前 ${Math.round(completionRate * 100)}%）`, completionRate };
    // 檢查是否已有證書
    const existing = await db.getCertificateByUserAndCourse(ctx.user.id, input.courseId);
    return { eligible: true, certificate: existing || null, completionRate };
  }),

  // 產生證書
  generate: protectedProcedure.input(z.object({ courseId: z.number() })).mutation(async ({ input, ctx }) => {
    // 檢查是否已有證書
    const existing = await db.getCertificateByUserAndCourse(ctx.user.id, input.courseId);
    if (existing) return { success: true, certificate: existing };
    // 檢查完成率
    const allLessons = await db.getLessonsByCourse(input.courseId);
    const progress = await db.getProgressByCourse(ctx.user.id, input.courseId);
    const completedCount = progress.filter(p => p.completed).length;
    if (allLessons.length === 0 || completedCount / allLessons.length < 0.8) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "完成率未達 80%，無法產生證書" });
    }
    // 取得課程資訊
    const course = await db.getCourseById(input.courseId);
    if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "課程不存在" });
    const instructor = course.instructorId ? await db.getInstructorById(course.instructorId) : null;
    // 產生證書編號
    const certificateNo = `KDL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date();
    // 產生 PDF
    const { generateCertificatePdf } = await import("./certificateGenerator");
    const { url: pdfUrl, key: pdfKey } = await generateCertificatePdf({
      certificateNo,
      userName: ctx.user.name || "學員",
      courseName: course.title,
      instructorName: instructor?.name || "平台講師",
      completedAt: now,
      siteName: "KDLuck 凱迪拉課",
    });
    // 儲存證書記錄
    await db.createCertificate({
      userId: ctx.user.id,
      courseId: input.courseId,
      certificateNo,
      userName: ctx.user.name || "學員",
      courseName: course.title,
      instructorName: instructor?.name || null,
      completedAt: now,
      pdfUrl,
      pdfKey,
    });
    const cert = await db.getCertificateByUserAndCourse(ctx.user.id, input.courseId);
    return { success: true, certificate: cert };
  }),

  // 用戶的所有證書
  myList: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserCertificates(ctx.user.id);
  }),

  // 公開驗證證書
  verify: publicProcedure.input(z.object({ certificateNo: z.string() })).query(async ({ input }) => {
    const cert = await db.getCertificateByNo(input.certificateNo);
    if (!cert) return { valid: false };
    return { valid: true, certificate: cert };
  }),
});

// ─── In-App Notification Router (站內通知) ───
const inAppNotificationRouter = router({
  // 取得未讀數量
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadNotificationCount(ctx.user.id);
  }),

  // 取得通知列表
  list: protectedProcedure.input(z.object({ page: z.number().default(1), limit: z.number().default(20) }).optional()).query(async ({ ctx, input }) => {
    return db.getUserNotifications(ctx.user.id, input?.page ?? 1, input?.limit ?? 20);
  }),

  // 標記單則已讀
  markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.markNotificationRead(input.id, ctx.user.id);
    return { success: true };
  }),

  // 全部標記已讀
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),

  // 刪除通知
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.deleteNotification(input.id, ctx.user.id);
    return { success: true };
  }),
});

// ─── Admin Notification Push Router (管理員通知推送) ───
const adminNotifyRouter = router({
  // 發送通知（統一介面）
  send: adminProcedure.input(z.object({
    channels: z.array(z.enum(["in_app", "line", "email"])).min(1),
    targetType: z.enum(["all", "user", "enrolled"]),
    targetUserId: z.number().optional(),
    courseId: z.number().optional(),
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(["system", "order", "course", "promotion", "review", "certificate"]).default("system"),
    link: z.string().optional(),
    emailSubject: z.string().optional(),
    emailButtonText: z.string().optional(),
    emailButtonUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { sendNotification } = await import("./notificationService");
    const result = await sendNotification({
      ...input,
      sentBy: ctx.user.id,
    });
    return result;
  }),

  // 取得通知發送記錄
  logs: adminProcedure.input(z.object({ page: z.number().default(1), limit: z.number().default(20) }).optional()).query(async ({ input }) => {
    return db.getNotificationLogs(input?.page ?? 1, input?.limit ?? 20);
  }),

  // SMTP 設定（讀取）
  getSmtpConfig: adminProcedure.query(async () => {
    const config = await db.getSiteConfig();
    return {
      smtp_host: config.smtp_host || "",
      smtp_port: config.smtp_port || "587",
      smtp_secure: config.smtp_secure || "false",
      smtp_user: config.smtp_user || "",
      smtp_pass: config.smtp_pass ? "******" : "",
      smtp_from_name: config.smtp_from_name || "",
      smtp_from_email: config.smtp_from_email || "",
    };
  }),

  // SMTP 設定（更新）
  updateSmtpConfig: adminProcedure.input(z.object({
    smtp_host: z.string(),
    smtp_port: z.string(),
    smtp_secure: z.string(),
    smtp_user: z.string(),
    smtp_pass: z.string(),
    smtp_from_name: z.string(),
    smtp_from_email: z.string(),
  })).mutation(async ({ input }) => {
    const updates = Object.entries(input)
      .filter(([_, v]) => v !== "******"); // 不覆蓋已遮蔽的密碼
    for (const [key, value] of updates) {
      await db.updateSiteConfig(key, value);
    }
    return { success: true };
  }),

  // 發送測試 Email
  testEmail: adminProcedure.input(z.object({ to: z.string().email() })).mutation(async ({ input }) => {
    const { sendEmail, buildEmailHtml } = await import("./email");
    const html = buildEmailHtml({
      title: "測試郵件",
      content: "這是一封來自 KDLuck 平台的測試郵件。\n如果您收到此郵件，表示 SMTP 設定正確。",
      buttonText: "前往平台",
      buttonUrl: "https://kdlearn-xbhqxuj2.manus.space",
    });
    const result = await sendEmail({ to: input.to, subject: "[KDLuck] SMTP 測試郵件", html });
    return result;
  }),
});

// ─── Main Router ───
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  category: categoryRouter,
  instructor: instructorRouter,
  course: courseRouter,
  chapter: chapterRouter,
  lesson: lessonRouter,
  order: orderRouter,
  enrollment: enrollmentRouter,
  progress: progressRouter,
  review: reviewRouter,
  coupon: couponRouter,
  siteConfig: siteConfigRouter,
  notification: notificationRouter,
  user: userRouter,
  analytics: analyticsRouter,
  upload: uploadRouter,
  recommend: recommendRouter,
  invoice: invoiceRouter,
  linePush: linePushRouter,
  reviewAdmin: reviewAdminRouter,
  wishlist: wishlistRouter,
  announcement: announcementRouter,
  faq: faqRouter,
  note: noteRouter,
  certificate: certificateRouter,
  inAppNotif: inAppNotificationRouter,
  adminNotify: adminNotifyRouter,
});

export type AppRouter = typeof appRouter;
