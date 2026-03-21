import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock database module ───
vi.mock("./db", () => {
  const mockCourses = [
    {
      id: 1, title: "React 入門", slug: "react-intro", subtitle: "從零開始學 React",
      description: "完整的 React 教學", coverImageUrl: null, previewVideoUrl: null,
      categoryId: 1, instructorId: 1, price: "1990.00", originalPrice: "2990.00",
      status: "published", level: "beginner", totalLessons: 10, totalDuration: 3600,
      enrollmentCount: 50, avgRating: "4.50", ratingCount: 10,
      seoTitle: null, seoDescription: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 2, title: "Node.js 進階", slug: "nodejs-advanced", subtitle: "深入 Node.js",
      description: "進階 Node.js 教學", coverImageUrl: null, previewVideoUrl: null,
      categoryId: 2, instructorId: 1, price: "0.00", originalPrice: null,
      status: "published", level: "advanced", totalLessons: 5, totalDuration: 1800,
      enrollmentCount: 20, avgRating: "4.80", ratingCount: 5,
      seoTitle: null, seoDescription: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
  ];

  const mockCategories = [
    { id: 1, name: "前端開發", slug: "frontend", description: "前端相關課程", iconUrl: null, sortOrder: 0, createdAt: new Date() },
    { id: 2, name: "後端開發", slug: "backend", description: "後端相關課程", iconUrl: null, sortOrder: 1, createdAt: new Date() },
  ];

  const mockInstructors = [
    { id: 1, name: "王老師", title: "資深工程師", bio: "10年經驗", avatarUrl: null, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockChapters = [
    { id: 1, courseId: 1, title: "第一章 基礎", sortOrder: 0, createdAt: new Date() },
    { id: 2, courseId: 1, title: "第二章 進階", sortOrder: 1, createdAt: new Date() },
  ];

  const mockLessons = [
    { id: 1, chapterId: 1, courseId: 1, title: "1-1 環境設定", description: null, videoKey: "videos/1.mp4", videoUrl: null, duration: 600, sortOrder: 0, isFreePreview: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, chapterId: 1, courseId: 1, title: "1-2 JSX 語法", description: null, videoKey: null, videoUrl: "https://example.com/video.mp4", duration: 900, sortOrder: 1, isFreePreview: false, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockOrders: any[] = [];
  const mockEnrollments: any[] = [];
  const mockReviews: any[] = [];
  const mockCoupons = [
    { id: 1, code: "SAVE100", discountType: "fixed", discountValue: "100.00", minOrderAmount: null, maxUses: 10, usedCount: 2, courseId: null, startsAt: null, expiresAt: null, isActive: true, createdAt: new Date() },
    { id: 2, code: "EXPIRED", discountType: "percentage", discountValue: "20", minOrderAmount: null, maxUses: 0, usedCount: 0, courseId: null, startsAt: null, expiresAt: new Date("2020-01-01"), isActive: true, createdAt: new Date() },
  ];
  const mockSiteConfig: Record<string, string> = {
    site_name: "KDLuck", site_description: "知識付費平台",
    bank_transfer_enabled: "true", bank_name: "中國信託商業銀行",
    bank_code: "822", bank_account: "1234567890123", bank_holder: "KDLuck 有限公司",
  };
  const mockNotificationTemplates = [
    { id: 1, templateKey: "order_paid", templateName: "付款成功通知", templateBody: "{name} 您好，課程已開通", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];
  const mockProgress: any[] = [];

  return {
    getDb: vi.fn().mockResolvedValue({}),
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
    getAllUsers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    updateUserRole: vi.fn(),
    getAllCategories: vi.fn().mockResolvedValue(mockCategories),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getAllInstructors: vi.fn().mockResolvedValue(mockInstructors),
    getInstructorById: vi.fn().mockImplementation((id: number) => Promise.resolve(mockInstructors.find(i => i.id === id))),
    createInstructor: vi.fn(),
    updateInstructor: vi.fn(),
    deleteInstructor: vi.fn(),
    getPublishedCourses: vi.fn().mockImplementation((opts: any) => {
      let items = mockCourses.filter(c => c.status === "published");
      if (opts?.categoryId) items = items.filter(c => c.categoryId === opts.categoryId);
      if (opts?.search) items = items.filter(c => c.title.includes(opts.search));
      return Promise.resolve({ items, total: items.length });
    }),
    getAllCourses: vi.fn().mockResolvedValue({ items: mockCourses, total: mockCourses.length }),
    getCourseById: vi.fn().mockImplementation((id: number) => Promise.resolve(mockCourses.find(c => c.id === id))),
    getCourseBySlug: vi.fn().mockImplementation((slug: string) => Promise.resolve(mockCourses.find(c => c.slug === slug))),
    createCourse: vi.fn().mockResolvedValue(3),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    getChaptersByCourse: vi.fn().mockResolvedValue(mockChapters),
    createChapter: vi.fn().mockResolvedValue(3),
    updateChapter: vi.fn(),
    deleteChapter: vi.fn(),
    getLessonsByChapter: vi.fn().mockResolvedValue(mockLessons.filter(l => l.chapterId === 1)),
    getLessonsByCourse: vi.fn().mockResolvedValue(mockLessons),
    getLessonById: vi.fn().mockImplementation((id: number) => Promise.resolve(mockLessons.find(l => l.id === id))),
    createLesson: vi.fn().mockResolvedValue(3),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
    createOrder: vi.fn(),
    getOrderByNo: vi.fn().mockImplementation((orderNo: string) => {
      return Promise.resolve(mockOrders.find(o => o.orderNo === orderNo));
    }),
    getOrdersByUser: vi.fn().mockResolvedValue({ items: mockOrders, total: 0 }),
    getAllOrders: vi.fn().mockResolvedValue({ items: mockOrders, total: 0 }),
    updateOrderStatus: vi.fn(),
    uploadPaymentProof: vi.fn(),
    reviewPaymentProof: vi.fn(),
    getOrdersWithPendingReview: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getPendingReviewCount: vi.fn().mockResolvedValue(3),
    batchReviewProofs: vi.fn().mockResolvedValue({ success: 2, failed: 0 }),
    exportAllOrders: vi.fn().mockResolvedValue([{ orderNo: "ORD-001", userId: 1, courseId: 1, amount: "1990.00", paymentMethod: "bank_transfer", paymentStatus: "paid", reviewStatus: "approved", createdAt: new Date(), paidAt: new Date() }]),
    exportAllUsers: vi.fn().mockResolvedValue([{ id: 1, name: "Test", email: "test@example.com", phone: null, role: "user", city: null, occupation: null, company: null, lineUserId: "U123", createdAt: new Date() }]),
    createEnrollment: vi.fn(),
    isEnrolled: vi.fn().mockResolvedValue(false),
    getEnrolledCourses: vi.fn().mockResolvedValue([]),
    upsertProgress: vi.fn(),
    getProgressByCourse: vi.fn().mockResolvedValue(mockProgress),
    getProgressByLesson: vi.fn().mockResolvedValue(undefined),
    getReviewsByCourse: vi.fn().mockResolvedValue(mockReviews),
    createReview: vi.fn(),
    getAllCoupons: vi.fn().mockResolvedValue({ items: mockCoupons, total: mockCoupons.length }),
    getCouponByCode: vi.fn().mockImplementation((code: string) => Promise.resolve(mockCoupons.find(c => c.code === code))),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
    incrementCouponUsage: vi.fn(),
    getSiteConfig: vi.fn().mockResolvedValue(mockSiteConfig),
    updateSiteConfig: vi.fn(),
    getAllNotificationTemplates: vi.fn().mockResolvedValue(mockNotificationTemplates),
    updateNotificationTemplate: vi.fn(),
    getSalesStats: vi.fn().mockResolvedValue({ totalRevenue: 19900, totalOrders: 10, paidOrders: 8, totalUsers: 50, totalCourses: 5 }),
    getMonthlySales: vi.fn().mockResolvedValue([{ month: "2026-03", revenue: 5000, orderCount: 3 }]),
    getUserGrowth: vi.fn().mockResolvedValue([{ month: "2026-03", userCount: 15 }]),
    getCategoryById: vi.fn().mockImplementation((id: number) => Promise.resolve(mockCategories.find(c => c.id === id))),
    createInvoice: vi.fn().mockResolvedValue(1),
    getInvoiceByOrderNo: vi.fn().mockResolvedValue(null),
    getInvoiceById: vi.fn().mockResolvedValue(null),
    updateInvoice: vi.fn(),
    getAllInvoices: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createLinePush: vi.fn().mockResolvedValue(1),
    updateLinePush: vi.fn(),
    getLinePushHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getAllReviews: vi.fn().mockResolvedValue({ items: mockReviews, total: 0 }),
    deleteReview: vi.fn(),
    getUsersWithLineId: vi.fn().mockResolvedValue([]),
    getUserById: vi.fn().mockImplementation((id: number) => Promise.resolve(id === 1 ? { id: 1, name: "Test", email: "test@example.com", phone: null, birthday: null, gender: null, city: null, address: null, bio: null, occupation: null, company: null, avatarUrl: null, lineUserId: "U123" } : null)),
    updateUserProfile: vi.fn(),
    searchUsers: vi.fn().mockResolvedValue({ items: [{ id: 1, name: "Test", email: "test@example.com", phone: null, loginMethod: "manus", lineUserId: "U123", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }], total: 1 }),
    getUserAccountDetail: vi.fn().mockImplementation((id: number) => Promise.resolve(id === 1 ? { id: 1, name: "Test", email: "test@example.com", phone: null, loginMethod: "manus", lineUserId: "U123", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), totalOrders: 3, totalSpent: "5970", enrolledCourseCount: 2, hasLineBinding: true } : null)),
    findUserByEmail: vi.fn().mockImplementation((email: string) => Promise.resolve(email === "test@example.com" ? [{ id: 1, name: "Test", email: "test@example.com", loginMethod: "manus", lineUserId: "U123", createdAt: new Date(), lastSignedIn: new Date() }] : [])),
    getUserWishlist: vi.fn().mockResolvedValue([{ id: 1, courseId: 1, courseTitle: "React 入門", courseSlug: "react-intro", coursePrice: "1990.00", coverImageUrl: null }]),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    isInWishlist: vi.fn().mockResolvedValue(false),
    getActiveAnnouncements: vi.fn().mockResolvedValue([{ id: 1, title: "測試公告", content: "測試內容", type: "info", isActive: true, isPinned: false, startAt: null, endAt: null, createdAt: new Date() }]),
    getAllAnnouncements: vi.fn().mockResolvedValue({ items: [{ id: 1, title: "測試公告", content: "測試內容", type: "info", isActive: true, isPinned: false }], total: 1 }),
    createAnnouncement: vi.fn().mockResolvedValue(2),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    getFaqsByCourse: vi.fn().mockResolvedValue([
      { id: 1, courseId: 1, question: "課程可以無限次觀看嗎？", answer: "是的，購買後可無限次觀看", sortOrder: 0, createdAt: new Date() },
    ]),
    createFaq: vi.fn().mockResolvedValue(2),
    updateFaq: vi.fn(),
    deleteFaq: vi.fn(),
    getNotesByUserAndCourse: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, courseId: 1, lessonId: 1, content: "測試筆記", videoTimestamp: 120, createdAt: new Date(), updatedAt: new Date() },
    ]),
    getNotesByUserAndLesson: vi.fn().mockResolvedValue([]),
    getAllNotesByUser: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, courseId: 1, lessonId: 1, content: "測試筆記", videoTimestamp: 120, createdAt: new Date(), updatedAt: new Date() },
    ]),
    createNote: vi.fn().mockResolvedValue(2),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    getCertificateByUserAndCourse: vi.fn().mockResolvedValue(null),
    getCertificateByNo: vi.fn().mockResolvedValue(null),
    getUserCertificates: vi.fn().mockResolvedValue([]),
    createCertificate: vi.fn(),
    getApiConfig: vi.fn().mockResolvedValue({
      ecpayMerchantId: "3002607",
      ecpayHashKey: "pwFHCqoQZGmho4w6",
      ecpayHashIv: "EkRm7iFT261dpevs",
      ecpayIsProduction: false,
      amegoInvoiceNumber: "TEST12345678",
      amegoAppKey: "test-app-key",
      lineChannelId: "test-channel-id",
      lineChannelSecret: "test-channel-secret",
      lineMessagingToken: "test-messaging-token",
    }),
    // Notification (站內通知)
    getUserNotifications: vi.fn().mockResolvedValue({
      items: [
        { id: 1, userId: 1, title: "購買成功", content: "您已成功購買課程", type: "order", isRead: false, link: "/member/courses", metadata: null, createdAt: new Date() },
        { id: 2, userId: 1, title: "新課程上架", content: "新課程已上架", type: "course", isRead: true, link: "/courses/1", metadata: null, createdAt: new Date() },
      ],
      total: 2,
      unreadCount: 1,
    }),
    getUnreadNotificationCount: vi.fn().mockResolvedValue(1),
    createNotification: vi.fn().mockResolvedValue(3),
    createNotificationBatch: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    deleteNotification: vi.fn(),
    // Notification Logs
    createNotificationLog: vi.fn().mockResolvedValue(1),
    updateNotificationLog: vi.fn(),
    getNotificationLogs: vi.fn().mockResolvedValue({
      items: [
        { id: 1, channel: "in_app", targetType: "all", targetUserId: null, title: "系統通知", content: "測試通知", sentCount: 5, status: "sent", errorMessage: null, sentBy: 99, sentAt: new Date(), createdAt: new Date() },
      ],
      total: 1,
    }),
    getAllUserIds: vi.fn().mockResolvedValue([
      { id: 1, email: "test@example.com", lineUserId: "U123" },
      { id: 2, email: "user2@example.com", lineUserId: null },
    ]),
    getEnrolledUserIds: vi.fn().mockResolvedValue([
      { id: 1, email: "test@example.com", lineUserId: "U123" },
    ]),
  };
});

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test/file.mp4", url: "https://cdn.example.com/test/file.mp4" }),
  storageGet: vi.fn().mockResolvedValue({ key: "videos/1.mp4", url: "https://cdn.example.com/signed/videos/1.mp4" }),
}));

// Mock amego (invoice)
vi.mock("./amego", () => ({
  issueInvoice: vi.fn().mockResolvedValue({ Status: "Success", InvoiceNumber: "AB12345678", InvoiceDate: "2026-03-11", RandomNumber: "1234" }),
  voidInvoice: vi.fn().mockResolvedValue({ Status: "Success" }),
}));

// Mock line
vi.mock("./line", () => ({
  pushMessage: vi.fn().mockResolvedValue(true),
  multicastMessage: vi.fn().mockResolvedValue({ success: 1, failed: 0 }),
  broadcastMessage: vi.fn().mockResolvedValue(true),
}));

// Mock certificate generator
vi.mock("./certificateGenerator", () => ({
  generateCertificatePdf: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/cert.pdf", key: "certs/test.pdf" }),
}));

// Mock notificationService
vi.mock("./notificationService", () => ({
  sendNotification: vi.fn().mockResolvedValue({
    success: true,
    results: [
      { channel: "in_app", success: true, count: 2 },
    ],
  }),
  notifyPurchaseSuccess: vi.fn().mockResolvedValue({ success: true, results: [] }),
  notifyProofReviewResult: vi.fn().mockResolvedValue({ success: true, results: [] }),
  notifyCertificateIssued: vi.fn().mockResolvedValue({ success: true, results: [] }),
  notifyNewCourse: vi.fn().mockResolvedValue({ success: true, results: [] }),
  notifyCouponExpiring: vi.fn().mockResolvedValue({ success: true, results: [] }),
}));

// Mock email
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildEmailHtml: vi.fn().mockReturnValue("<html><body>Test Email</body></html>"),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ ids: [2], reason: "基於您的學習歷史推薦" }) } }],
  }),
}));

// ─── Context helpers ───
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    avatarUrl: null,
    loginMethod: "manus",
    lineUserId: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ id: 99, openId: "admin-001", role: "admin", name: "Admin" });
}

// ─── Tests ───

describe("Public API - Categories", () => {
  it("lists all categories", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.category.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("前端開發");
  });
});

describe("Public API - Courses", () => {
  it("lists published courses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.published({});
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("filters courses by category", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.published({ categoryId: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("React 入門");
  });

  it("searches courses by keyword", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.published({ search: "Node" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe("nodejs-advanced");
  });

  it("gets course by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.getBySlug({ slug: "react-intro" });
    expect(result).toBeDefined();
    expect(result?.title).toBe("React 入門");
  });

  it("gets course by id", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.price).toBe("1990.00");
  });
});

describe("Public API - Chapters & Lessons", () => {
  it("lists chapters by course", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.chapter.listByCourse({ courseId: 1 });
    expect(result).toHaveLength(2);
  });

  it("lists lessons by course", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.lesson.listByCourse({ courseId: 1 });
    expect(result).toHaveLength(2);
  });
});

describe("Public API - Instructors", () => {
  it("lists all instructors", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.instructor.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("王老師");
  });

  it("gets instructor by id", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.instructor.getById({ id: 1 });
    expect(result?.name).toBe("王老師");
  });
});

describe("Public API - Coupons", () => {
  it("validates a valid coupon", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.coupon.validate({ code: "SAVE100" });
    expect(result.valid).toBe(true);
    expect(result.coupon?.discountType).toBe("fixed");
  });

  it("rejects an expired coupon", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.coupon.validate({ code: "EXPIRED" });
    expect(result.valid).toBe(false);
    expect(result.message).toContain("過期");
  });

  it("rejects an invalid coupon code", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.coupon.validate({ code: "NONEXIST" });
    expect(result.valid).toBe(false);
  });
});

describe("Public API - Site Config", () => {
  it("gets site config", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.siteConfig.get();
    expect(result.site_name).toBe("KDLuck");
  });
});

describe("Public API - Reviews", () => {
  it("lists reviews by course", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.review.listByCourse({ courseId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Protected API - Auth", () => {
  it("returns user info when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
  });

  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("Protected API - Enrollment", () => {
  it("checks enrollment status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.enrollment.check({ courseId: 1 });
    expect(result).toHaveProperty("enrolled");
    expect(typeof result.enrolled).toBe("boolean");
  });

  it("lists enrolled courses", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.enrollment.myCourses();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Protected API - Orders", () => {
  it("creates a free course order and auto-enrolls", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.order.create({
      courseId: 2, // Free course
      paymentMethod: "free",
    });
    expect(result.status).toBe("paid");
    expect(result.amount).toBe(0);
    expect(db.createEnrollment).toHaveBeenCalled();
  });

  it("creates a paid course order with pending status", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.order.create({
      courseId: 1,
      paymentMethod: "bank_transfer",
    });
    expect(result.status).toBe("pending");
    expect(result.amount).toBe(1990);
  });

  it("creates order with coupon discount", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.order.create({
      courseId: 1,
      paymentMethod: "bank_transfer",
      couponCode: "SAVE100",
    });
    expect(result.amount).toBe(1890); // 1990 - 100
    expect(result.status).toBe("pending");
  });

  it("prevents duplicate enrollment", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.order.create({ courseId: 1, paymentMethod: "bank_transfer" })
    ).rejects.toThrow("您已購買此課程");
  });

  it("lists user orders", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.order.myOrders({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });
});

describe("Protected API - Progress", () => {
  it("updates learning progress", async () => {
    const db = await import("./db");
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.progress.update({
      lessonId: 1,
      courseId: 1,
      progressSeconds: 300,
      completed: false,
    });
    expect(result.success).toBe(true);
    expect(db.upsertProgress).toHaveBeenCalled();
  });

  it("gets progress by course", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.progress.getByCourse({ courseId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Protected API - Signed URL", () => {
  it("returns signed URL for free preview lesson", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.lesson.getSignedUrl({ lessonId: 1 });
    expect(result.url).toBeDefined();
    expect(result.url).toContain("signed");
  });

  it("denies access to paid lesson without enrollment", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.lesson.getSignedUrl({ lessonId: 2 })
    ).rejects.toThrow("You need to purchase this course");
  });
});

describe("Protected API - Reviews", () => {
  it("rejects review from non-enrolled user", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.review.create({ courseId: 1, rating: 5, comment: "Great!" })
    ).rejects.toThrow("需購買課程才能評價");
  });

  it("allows review from enrolled user", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.review.create({ courseId: 1, rating: 5, comment: "Great!" });
    expect(result.success).toBe(true);
  });
});

describe("Admin API - Access Control", () => {
  it("denies regular user access to admin endpoints", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.course.all({})).rejects.toThrow();
  });

  it("denies unauthenticated access to admin endpoints", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.course.all({})).rejects.toThrow();
  });
});

describe("Admin API - Course Management", () => {
  it("lists all courses for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.course.all({});
    expect(result.items).toHaveLength(2);
  });

  it("creates a new course", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.course.create({
      title: "Vue.js 入門",
      slug: "vue-intro",
      price: "1500.00",
      status: "draft",
      level: "beginner",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBe(3);
  });

  it("updates a course", async () => {
    const db = await import("./db");
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.course.update({ id: 1, title: "React 入門 v2" });
    expect(result.success).toBe(true);
    expect(db.updateCourse).toHaveBeenCalledWith(1, { title: "React 入門 v2" });
  });

  it("deletes a course", async () => {
    const db = await import("./db");
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.course.delete({ id: 1 });
    expect(result.success).toBe(true);
    expect(db.deleteCourse).toHaveBeenCalledWith(1);
  });
});

describe("Admin API - Chapter Management", () => {
  it("creates a chapter", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chapter.create({ courseId: 1, title: "新章節" });
    expect(result.success).toBe(true);
  });

  it("updates a chapter", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.chapter.update({ id: 1, title: "更新的章節" });
    expect(result.success).toBe(true);
  });
});

describe("Admin API - Coupon Management", () => {
  it("lists all coupons", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.coupon.all({});
    expect(result.items).toHaveLength(2);
  });

  it("creates a coupon", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.coupon.create({
      code: "NEW50",
      discountType: "percentage",
      discountValue: "50",
      maxUses: 100,
    });
    expect(result.success).toBe(true);
  });
});

describe("Admin API - Site Config", () => {
  it("updates site config", async () => {
    const db = await import("./db");
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.siteConfig.update({ key: "site_name", value: "New Name" });
    expect(result.success).toBe(true);
    expect(db.updateSiteConfig).toHaveBeenCalledWith("site_name", "New Name");
  });

  it("batch updates site config", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.siteConfig.updateBatch([
      { key: "site_name", value: "KDLuck v2" },
      { key: "contact_email", value: "new@example.com" },
    ]);
    expect(result.success).toBe(true);
  });
});

describe("Admin API - Notification Templates", () => {
  it("lists notification templates", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.notification.templates();
    expect(result).toHaveLength(1);
    expect(result[0].templateKey).toBe("order_paid");
  });

  it("updates a notification template", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.notification.updateTemplate({
      id: 1,
      templateBody: "{name} 您好，感謝購買",
    });
    expect(result.success).toBe(true);
  });
});

describe("Admin API - Analytics", () => {
  it("gets sales stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.analytics.stats();
    expect(result.totalRevenue).toBe(19900);
    expect(result.totalUsers).toBe(50);
  });

  it("gets monthly sales", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.analytics.monthlySales();
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe("2026-03");
  });

  it("gets user growth", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.analytics.userGrowth();
    expect(result).toHaveLength(1);
  });
});

describe("Admin API - Order Confirmation", () => {
  it("confirms bank transfer payment", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD123456",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentStatus: "pending",
      couponId: null,
    });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.confirmPayment({ orderNo: "KD123456" });
    expect(result.success).toBe(true);
    expect(db.updateOrderStatus).toHaveBeenCalledWith("KD123456", "paid", "manual_confirm");
    expect(db.createEnrollment).toHaveBeenCalled();
  });

  it("rejects confirming already paid order", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD123456",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentStatus: "paid",
    });

    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.order.confirmPayment({ orderNo: "KD123456" })
    ).rejects.toThrow("已付款");
  });
});

describe("Protected API - LLM Recommendations", () => {
  it("returns course recommendations", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.recommend.getCourseRecommendations();
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("reason");
  });
});

// ─── Invoice Tests ───
describe("Admin API - Invoice Management", () => {
  it("lists all invoices", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.invoice.all({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("gets invoice by order number", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.invoice.getByOrderNo({ orderNo: "KD123456" });
    // Returns null since mock returns null
    expect(result).toBeNull();
  });

  it("issues an invoice", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.invoice.issue({
      orderId: 1,
      orderNo: "KD123456",
      buyerName: "測試用戶",
      buyerEmail: "test@example.com",
      itemName: "React 入門課程",
      amount: 1990,
    });
    expect(result.success).toBe(true);
    expect(result.invoiceNumber).toBe("AB12345678");
  });

  it("voids an invoice", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.invoice.void({
      id: 1,
      invoiceNumber: "AB12345678",
      invoiceDate: "2026-03-11",
      reason: "客戶退款",
    });
    expect(result.success).toBe(true);
  });
});

// ─── LINE Push Tests ───
describe("Admin API - LINE Push", () => {
  it("lists push history", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.linePush.history({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("sends broadcast push", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.linePush.send({
      targetType: "all",
      messageContent: "新課程上架通知！",
    });
    expect(result.success).toBe(true);
    expect(result.sentCount).toBe(1);
  });

  it("sends push to specific user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.linePush.send({
      targetType: "user",
      targetUserId: 1,
      messageContent: "您的課程已開通！",
    });
    expect(result.success).toBe(true);
  });

  it("lists LINE users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.linePush.lineUsers();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Review Admin Tests ───
describe("Admin API - Review Management", () => {
  it("lists all reviews", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.reviewAdmin.all({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("deletes a review", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.reviewAdmin.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── Instructor CRUD Tests ───
describe("Admin API - Instructor Management", () => {
  it("lists all instructors", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.instructor.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("王老師");
  });

  it("creates an instructor", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.instructor.create({
      name: "新講師",
      title: "AI 專家",
      bio: "專精 AI 領域",
    });
    expect(result.success).toBe(true);
  });

  it("updates an instructor", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.instructor.update({ id: 1, name: "更新名稱" });
    expect(result.success).toBe(true);
  });

  it("deletes an instructor", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.instructor.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── Category CRUD Tests ───
describe("Admin API - Category Management", () => {
  it("creates a category", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.category.create({
      name: "AI 人工智慧",
      slug: "ai",
      description: "AI 相關課程",
    });
    expect(result.success).toBe(true);
  });

  it("updates a category", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.category.update({ id: 1, name: "前端開發 v2" });
    expect(result.success).toBe(true);
  });

  it("deletes a category", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.category.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── Payment Proof Upload Tests ───
describe("Protected API - Payment Proof Upload", () => {
  it("uploads payment proof for bank transfer order", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD111111",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      reviewStatus: "none",
    });

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.order.uploadProof({
      orderNo: "KD111111",
      base64Data: "iVBORw0KGgo=", // minimal base64
      contentType: "image/png",
      fileName: "proof.png",
      note: "轉帳後五碼 12345",
    });
    expect(result.success).toBe(true);
    expect(result.proofUrl).toBeDefined();
    expect(db.uploadPaymentProof).toHaveBeenCalled();
  });

  it("rejects proof upload for non-bank-transfer order", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD222222",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "ecpay",
      paymentStatus: "pending",
    });

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.order.uploadProof({
        orderNo: "KD222222",
        base64Data: "iVBORw0KGgo=",
        contentType: "image/png",
        fileName: "proof.png",
      })
    ).rejects.toThrow("僅限銀行轉帳訂單");
  });

  it("rejects proof upload for already paid order", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD333333",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "paid",
    });

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.order.uploadProof({
        orderNo: "KD333333",
        base64Data: "iVBORw0KGgo=",
        contentType: "image/png",
        fileName: "proof.png",
      })
    ).rejects.toThrow("訂單已付款");
  });

  it("rejects proof upload from non-owner", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD444444",
      userId: 999, // different user
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
    });

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.order.uploadProof({
        orderNo: "KD444444",
        base64Data: "iVBORw0KGgo=",
        contentType: "image/png",
        fileName: "proof.png",
      })
    ).rejects.toThrow();
  });
});

// ─── Payment Proof Review Tests ───
describe("Admin API - Payment Proof Review", () => {
  it("approves payment proof and opens course", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD555555",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      reviewStatus: "pending_review",
      paymentProofUrl: "https://cdn.example.com/proof.png",
      couponId: null,
    });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.reviewProof({
      orderNo: "KD555555",
      approved: true,
    });
    expect(result.success).toBe(true);
    expect(db.reviewPaymentProof).toHaveBeenCalledWith("KD555555", true, 99, undefined);
    expect(db.createEnrollment).toHaveBeenCalled();
  });

  it("rejects payment proof with note", async () => {
    const db = await import("./db");
    const enrollCallsBefore = (db.createEnrollment as any).mock.calls.length;
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD666666",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      reviewStatus: "pending_review",
      paymentProofUrl: "https://cdn.example.com/proof.png",
      couponId: null,
    });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.reviewProof({
      orderNo: "KD666666",
      approved: false,
      reviewNote: "憑證模糊無法辨識",
    });
    expect(result.success).toBe(true);
    expect(db.reviewPaymentProof).toHaveBeenCalledWith("KD666666", false, 99, "憑證模糊無法辨識");
    // Ensure no NEW enrollment was created (only count calls after this test started)
    expect((db.createEnrollment as any).mock.calls.length).toBe(enrollCallsBefore);
  });

  it("rejects review for order without pending proof", async () => {
    const db = await import("./db");
    (db.getOrderByNo as any).mockResolvedValueOnce({
      orderNo: "KD777777",
      userId: 1,
      courseId: 1,
      amount: "1990.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      reviewStatus: "none",
    });

    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.order.reviewProof({ orderNo: "KD777777", approved: true })
    ).rejects.toThrow("此訂單無待審核憑證");
  });

  it("lists pending reviews", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.pendingReviews({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("denies regular user access to review proof", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.order.reviewProof({ orderNo: "KD555555", approved: true })
    ).rejects.toThrow();
  });
});

// ─── Bank Info API Tests ───
describe("Public API - Bank Info", () => {
  it("returns bank info when enabled", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.siteConfig.getBankInfo();
    expect(result.enabled).toBe(true);
    expect(result).toHaveProperty("bankName");
    expect(result).toHaveProperty("bankCode");
    expect(result).toHaveProperty("bankAccount");
    expect(result).toHaveProperty("bankHolder");
  });
});

// ─── Wishlist Tests ───
describe("Protected API - Wishlist", () => {
  it("lists user wishlist", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.wishlist.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("courseTitle");
  });

  it("adds course to wishlist", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.wishlist.add({ courseId: 1 });
    expect(result.success).toBe(true);
  });

  it("removes course from wishlist", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.wishlist.remove({ courseId: 1 });
    expect(result.success).toBe(true);
  });

  it("checks wishlist status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.wishlist.check({ courseId: 1 });
    expect(result).toHaveProperty("inWishlist");
    expect(typeof result.inWishlist).toBe("boolean");
  });

  it("denies anonymous access to wishlist", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.wishlist.list()).rejects.toThrow();
  });
});

// ─── Announcement Tests ───
describe("Public API - Announcements", () => {
  it("returns active announcements", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.announcement.active();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("content");
  });
});

describe("Admin API - Announcement Management", () => {
  it("lists all announcements", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.announcement.all({});
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("creates an announcement", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.announcement.create({
      title: "新公告",
      content: "公告內容",
      type: "info",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBe(2);
  });

  it("updates an announcement", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.announcement.update({
      id: 1,
      title: "更新公告",
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it("deletes an announcement", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.announcement.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("denies regular user access to create announcement", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.announcement.create({ title: "Test", content: "Test" })
    ).rejects.toThrow();
  });
});

// ─── User Profile Tests ───
describe("Protected API - User Profile", () => {
  it("gets user profile", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.user.getProfile();
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("email");
  });

  it("updates user profile", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.user.updateProfile({
      name: "新名稱",
      phone: "0912345678",
      birthday: "1990-01-01",
      gender: "male",
      city: "台北市",
      address: "信義區信義路一段1號",
      bio: "我是一名軟體工程師",
      occupation: "軟體工程師",
      company: "KDLuck 科技",
    });
    expect(result.success).toBe(true);
  });

  it("updates partial profile", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.user.updateProfile({
      phone: "0987654321",
    });
    expect(result.success).toBe(true);
  });

  it("denies anonymous access to profile", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.user.getProfile()).rejects.toThrow();
  });
});

// ─── FAQ Tests ───
describe("Public API - FAQ", () => {
  it("lists FAQs by course", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.faq.byCourse({ courseId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("question");
    expect(result[0]).toHaveProperty("answer");
  });
});

describe("Admin API - FAQ Management", () => {
  it("creates a FAQ", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.faq.create({
      courseId: 1,
      question: "如何退款？",
      answer: "請聯繫客服",
      sortOrder: 1,
    });
    expect(result.success).toBe(true);
    expect(result.id).toBe(2);
  });

  it("updates a FAQ", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.faq.update({
      id: 1,
      question: "更新的問題",
      answer: "更新的回答",
    });
    expect(result.success).toBe(true);
  });

  it("deletes a FAQ", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.faq.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("denies regular user access to create FAQ", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.faq.create({ courseId: 1, question: "Test", answer: "Test" })
    ).rejects.toThrow();
  });
});

// ─── Notes Tests ───
describe("Protected API - Notes", () => {
  it("lists all notes for user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.all();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("content");
    expect(result[0]).toHaveProperty("videoTimestamp");
  });

  it("lists notes by course", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.byCourse({ courseId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("lists notes by lesson", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.byLesson({ lessonId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a note", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.create({
      courseId: 1,
      lessonId: 1,
      content: "這是一則新筆記",
      videoTimestamp: 300,
    });
    expect(result.success).toBe(true);
    expect(result.id).toBe(2);
  });

  it("creates a note without timestamp", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.create({
      courseId: 1,
      content: "沒有時間戳的筆記",
    });
    expect(result.success).toBe(true);
  });

  it("updates a note", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.update({
      id: 1,
      content: "更新的筆記內容",
    });
    expect(result.success).toBe(true);
  });

  it("deletes a note", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.note.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("denies anonymous access to notes", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.note.all()).rejects.toThrow();
  });
});

// ─── Certificate Tests ───
describe("Protected API - Certificate", () => {
  it("checks certificate eligibility - not enough progress", async () => {
    const db = await import("./db");
    // checkEligibility calls: isEnrolled (default false - skip), getLessonsByCourse, getProgressByCourse
    (db.isEnrolled as any).mockResolvedValueOnce(true);
    (db.getLessonsByCourse as any).mockResolvedValueOnce([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    ]);
    (db.getProgressByCourse as any).mockResolvedValueOnce([
      { lessonId: 1, completed: true },
      { lessonId: 2, completed: true },
    ]);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.certificate.check({ courseId: 1 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("80%");
  });

  it("checks certificate eligibility - eligible", async () => {
    const db = await import("./db");
    (db.isEnrolled as any).mockResolvedValueOnce(true);
    (db.getLessonsByCourse as any).mockResolvedValueOnce([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    ]);
    (db.getProgressByCourse as any).mockResolvedValueOnce([
      { lessonId: 1, completed: true },
      { lessonId: 2, completed: true },
      { lessonId: 3, completed: true },
      { lessonId: 4, completed: true },
    ]);
    (db.getCertificateByUserAndCourse as any).mockResolvedValueOnce(null);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.certificate.check({ courseId: 1 });
    expect(result.eligible).toBe(true);
  });

  it("generates certificate for eligible user", async () => {
    const db = await import("./db");
    (db.getCertificateByUserAndCourse as any).mockResolvedValueOnce(null); // no existing
    (db.getLessonsByCourse as any).mockResolvedValueOnce([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    ]);
    (db.getProgressByCourse as any).mockResolvedValueOnce([
      { lessonId: 1, completed: true },
      { lessonId: 2, completed: true },
      { lessonId: 3, completed: true },
      { lessonId: 4, completed: true },
      { lessonId: 5, completed: true },
    ]);
    (db.getCourseById as any).mockResolvedValueOnce({
      id: 1, title: "React 入門", instructorId: 1,
    });
    (db.getInstructorById as any).mockResolvedValueOnce({
      id: 1, name: "王老師",
    });
    (db.getCertificateByUserAndCourse as any).mockResolvedValueOnce({
      id: 1, certificateNo: "KDL-TEST-001", userName: "Test User",
      courseName: "React 入門", pdfUrl: "https://cdn.example.com/cert.pdf",
    });

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.certificate.generate({ courseId: 1 });
    expect(result.success).toBe(true);
    expect(result.certificate).toBeDefined();
    expect(db.createCertificate).toHaveBeenCalled();
  });

  it("returns existing certificate without regenerating", async () => {
    const db = await import("./db");
    const existingCert = {
      id: 1, certificateNo: "KDL-EXIST-001", userName: "Test User",
      courseName: "React 入門", pdfUrl: "https://cdn.example.com/cert.pdf",
    };
    (db.getCertificateByUserAndCourse as any).mockResolvedValueOnce(existingCert);

    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.certificate.generate({ courseId: 1 });
    expect(result.success).toBe(true);
    expect(result.certificate).toHaveProperty("certificateNo");
  });

  it("rejects certificate generation with insufficient progress", async () => {
    const db = await import("./db");
    // First call: getCertificateByUserAndCourse returns null (no existing cert)
    (db.getCertificateByUserAndCourse as any).mockResolvedValueOnce(null);
    (db.getLessonsByCourse as any).mockResolvedValueOnce([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    ]);
    (db.getProgressByCourse as any).mockResolvedValueOnce([
      { lessonId: 1, completed: true },
    ]);

    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.certificate.generate({ courseId: 1 })
    ).rejects.toThrow("完成率未達 80%");
  });

  it("lists user certificates", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.certificate.myList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("verifies certificate by number - not found", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.certificate.verify({ certificateNo: "KDL-FAKE-001" });
    expect(result.valid).toBe(false);
  });

  it("verifies certificate by number - found", async () => {
    const db = await import("./db");
    (db.getCertificateByNo as any).mockResolvedValueOnce({
      id: 1, certificateNo: "KDL-REAL-001", userName: "Test User",
      courseName: "React 入門", completedAt: new Date(),
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.certificate.verify({ certificateNo: "KDL-REAL-001" });
    expect(result.valid).toBe(true);
    expect(result.certificate).toBeDefined();
  });

  it("denies anonymous access to generate certificate", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.certificate.generate({ courseId: 1 })
    ).rejects.toThrow();
  });
});

// ─── In-App Notification Tests ───
describe("In-App Notification - User", () => {
  it("gets unread notification count", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inAppNotif.unreadCount();
    expect(result).toBe(1);
  });

  it("lists user notifications with pagination", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inAppNotif.list({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.unreadCount).toBe(1);
  });

  it("lists user notifications with default params", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inAppNotif.list();
    expect(result.items).toBeDefined();
    expect(result.total).toBeDefined();
  });

  it("marks a single notification as read", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inAppNotif.markRead({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inAppNotif.markAllRead();
    expect(result.success).toBe(true);
  });

  it("deletes a notification", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.inAppNotif.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("denies anonymous access to notifications", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.inAppNotif.unreadCount()).rejects.toThrow();
  });

  it("denies anonymous access to notification list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.inAppNotif.list()).rejects.toThrow();
  });

  it("denies anonymous access to mark read", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.inAppNotif.markRead({ id: 1 })).rejects.toThrow();
  });

  it("denies anonymous access to delete notification", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.inAppNotif.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Admin Notification Push Tests ───
describe("Admin Notification Push", () => {
  it("sends notification to all users via in_app channel", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.send({
      channels: ["in_app"],
      targetType: "all",
      title: "系統維護通知",
      content: "系統將於今晚 23:00 進行維護",
      type: "system",
    });
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
  });

  it("sends notification to specific user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.send({
      channels: ["in_app"],
      targetType: "user",
      targetUserId: 1,
      title: "訂單已處理",
      content: "您的訂單已完成處理",
      type: "order",
      link: "/member/orders",
    });
    expect(result.success).toBe(true);
  });

  it("sends notification via multiple channels", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.send({
      channels: ["in_app", "line"],
      targetType: "all",
      title: "新課程上架",
      content: "全新課程已上架，快來看看！",
      type: "course",
    });
    expect(result.success).toBe(true);
  });

  it("gets notification send logs", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.logs({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].channel).toBe("in_app");
  });

  it("gets notification logs with default params", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.logs();
    expect(result.items).toBeDefined();
  });

  it("gets SMTP config", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.getSmtpConfig();
    expect(result).toHaveProperty("smtp_host");
    expect(result).toHaveProperty("smtp_port");
    expect(result).toHaveProperty("smtp_user");
  });

  it("updates SMTP config", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.updateSmtpConfig({
      smtp_host: "smtp.gmail.com",
      smtp_port: "587",
      smtp_secure: "false",
      smtp_user: "test@gmail.com",
      smtp_pass: "app-password",
      smtp_from_name: "KDLuck",
      smtp_from_email: "noreply@kdluck.com",
    });
    expect(result.success).toBe(true);
  });

  it("updates SMTP config without overwriting masked password", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.updateSmtpConfig({
      smtp_host: "smtp.gmail.com",
      smtp_port: "587",
      smtp_secure: "false",
      smtp_user: "test@gmail.com",
      smtp_pass: "******",
      smtp_from_name: "KDLuck",
      smtp_from_email: "noreply@kdluck.com",
    });
    expect(result.success).toBe(true);
  });

  it("sends test email", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminNotify.testEmail({ to: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("denies non-admin access to send notifications", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminNotify.send({
        channels: ["in_app"],
        targetType: "all",
        title: "Test",
        content: "Test content",
      })
    ).rejects.toThrow();
  });

  it("denies non-admin access to notification logs", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.adminNotify.logs()).rejects.toThrow();
  });

  it("denies non-admin access to SMTP config", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.adminNotify.getSmtpConfig()).rejects.toThrow();
  });

  it("denies non-admin access to test email", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminNotify.testEmail({ to: "test@example.com" })
    ).rejects.toThrow();
  });

  it("denies anonymous access to send notifications", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.adminNotify.send({
        channels: ["in_app"],
        targetType: "all",
        title: "Test",
        content: "Test content",
      })
    ).rejects.toThrow();
  });
});


// ─── Account Security & Recovery Tests ───
describe("User - Account Security", () => {
  it("returns masked account security info for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.user.accountSecurity();
    expect(result.loginMethod).toBe("manus");
    expect(result.hasEmail).toBe(true);
    expect(result.email).toContain("***");
    expect(result.hasLineBinding).toBe(true);
  });

  it("denies anonymous access to account security", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.user.accountSecurity()).rejects.toThrow();
  });
});

describe("User - Account Lookup (Public)", () => {
  it("finds account by email with masked info", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.user.lookupByEmail({ email: "test@example.com" });
    expect(result.found).toBe(true);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].loginMethod).toBe("manus");
    expect(result.accounts[0].hasLineBinding).toBe(true);
    // Name should be masked
    expect(result.accounts[0].maskedName).toBe("T***");
  });

  it("returns not found for unknown email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.user.lookupByEmail({ email: "unknown@example.com" });
    expect(result.found).toBe(false);
    expect(result.accounts).toHaveLength(0);
  });

  it("rejects invalid email format", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.user.lookupByEmail({ email: "not-an-email" })).rejects.toThrow();
  });
});

describe("Admin - User Search", () => {
  it("searches users by query", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.user.search({ query: "test" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Test");
  });

  it("denies non-admin access to user search", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.user.search({ query: "test" })).rejects.toThrow();
  });
});

describe("Admin - User Account Detail", () => {
  it("returns full account detail for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.user.accountDetail({ userId: 1 });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test");
    expect(result!.totalOrders).toBe(3);
    expect(result!.enrolledCourseCount).toBe(2);
    expect(result!.hasLineBinding).toBe(true);
  });

  it("denies non-admin access to account detail", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.user.accountDetail({ userId: 1 })).rejects.toThrow();
  });
});


// ─── Pending Review Count Badge Tests ───
describe("Admin - Pending Review Count", () => {
  it("returns pending review count for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.pendingReviewCount();
    expect(result.count).toBe(3);
  });

  it("denies non-admin access to pending review count", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.order.pendingReviewCount()).rejects.toThrow();
  });

  it("denies anonymous access to pending review count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.order.pendingReviewCount()).rejects.toThrow();
  });
});

// ─── Payment Method Switch Tests ───
describe("SiteConfig - getPaymentMethods", () => {
  it("returns payment method status as public API", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.siteConfig.getPaymentMethods();
    // mockSiteConfig has bank_transfer_enabled: "true", ecpay_enabled not set → false
    expect(result.bankTransfer).toBe(true);
    expect(result.ecpay).toBe(false);
  });

  it("is accessible without authentication (public procedure)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.siteConfig.getPaymentMethods()).resolves.not.toThrow();
  });

  it("is also accessible when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.siteConfig.getPaymentMethods()).resolves.not.toThrow();
  });
});

describe("Order Create - Payment Method Switch Enforcement", () => {
  it("rejects ecpay order when ecpay_enabled is false in config", async () => {
    const caller = appRouter.createCaller(createUserContext());
    // Override getSiteConfig mock to return ecpay disabled
    const db = await import("./db");
    vi.mocked(db.getSiteConfig).mockResolvedValueOnce({
      ecpay_enabled: "false",
      bank_transfer_enabled: "true",
    } as any);
    await expect(
      caller.order.create({ courseId: 1, paymentMethod: "ecpay" })
    ).rejects.toThrow("綠界支付目前已停用");
  });

  it("rejects bank_transfer order when bank_transfer_enabled is false in config", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const db = await import("./db");
    vi.mocked(db.getSiteConfig).mockResolvedValueOnce({
      ecpay_enabled: "true",
      bank_transfer_enabled: "false",
    } as any);
    await expect(
      caller.order.create({ courseId: 1, paymentMethod: "bank_transfer" })
    ).rejects.toThrow("銀行轉帳目前已停用");
  });

  it("allows free course regardless of payment switches", async () => {
    const caller = appRouter.createCaller(createUserContext());
    // Free course (courseId: 2, price: 0.00) should bypass payment switch check
    const result = await caller.order.create({ courseId: 2, paymentMethod: "free" });
    expect(result).toBeDefined();
  });
});

// ─── Batch Review Tests ───────────────────────────────────────────────────────
describe("Order Batch Review", () => {
  it("allows admin to batch approve multiple orders", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const db = await import("./db");
    vi.mocked(db.batchReviewProofs).mockResolvedValueOnce({ success: 2, failed: 0 });
    const result = await caller.order.batchReview({
      orderNos: ["ORD-001", "ORD-002"],
      approved: true,
    });
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("allows admin to batch reject multiple orders with note", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const db = await import("./db");
    vi.mocked(db.batchReviewProofs).mockResolvedValueOnce({ success: 3, failed: 1 });
    const result = await caller.order.batchReview({
      orderNos: ["ORD-001", "ORD-002", "ORD-003", "ORD-004"],
      approved: false,
      reviewNote: "憑證不清晰",
    });
    expect(result.success).toBe(3);
    expect(result.failed).toBe(1);
  });

  it("rejects batch review for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.order.batchReview({ orderNos: ["ORD-001"], approved: true })
    ).rejects.toThrow();
  });

  it("rejects batch review with empty orderNos", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.order.batchReview({ orderNos: [], approved: true })
    ).rejects.toThrow();
  });
});

// ─── Export Tests ─────────────────────────────────────────────────────────────
describe("Order Export", () => {
  it("allows admin to export all orders", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.exportOrders({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("orderNo");
    expect(result[0]).toHaveProperty("amount");
    expect(result[0]).toHaveProperty("paymentStatus");
  });

  it("allows admin to export orders filtered by status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.order.exportOrders({ status: "paid" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects order export for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.order.exportOrders({})).rejects.toThrow();
  });
});

describe("User Export", () => {
  it("allows admin to export all users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.user.exportUsers();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("email");
    expect(result[0]).toHaveProperty("role");
    expect(result[0]).toHaveProperty("lineUserId");
  });

  it("rejects user export for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.user.exportUsers()).rejects.toThrow();
  });
});
