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
  // Admin: confirm bank transfer payment
  confirmPayment: adminProcedure.input(z.object({
    orderNo: z.string(),
  })).mutation(async ({ input }) => {
    const order = await db.getOrderByNo(input.orderNo);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.paymentStatus === "paid") throw new TRPCError({ code: "BAD_REQUEST", message: "已付款" });
    await db.updateOrderStatus(input.orderNo, "paid", "manual_confirm");
    await db.createEnrollment({ userId: order.userId, courseId: order.courseId });
    if (order.couponId) await db.incrementCouponUsage(order.couponId);
    return { success: true };
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
  updateRole: adminProcedure.input(z.object({
    userId: z.number(),
    role: z.enum(["user", "admin"]),
  })).mutation(async ({ input }) => {
    await db.updateUserRole(input.userId, input.role);
    return { success: true };
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
});

export type AppRouter = typeof appRouter;
