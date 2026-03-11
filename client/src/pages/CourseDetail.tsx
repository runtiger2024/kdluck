import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Clock, Play, Star, Users, Lock, CheckCircle, ChevronDown, ChevronUp, ShoppingCart, Loader2, CreditCard, Building2 } from "lucide-react";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CourseDetail() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ecpay" | "bank_transfer" | "free">("ecpay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const { data: course, isLoading } = trpc.course.getBySlug.useQuery({ slug: params.slug ?? "" });
  const { data: chapters } = trpc.chapter.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: lessons } = trpc.lesson.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: reviews } = trpc.review.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: enrollment } = trpc.enrollment.check.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course && !!user });
  const { data: instructor } = trpc.instructor.getById.useQuery({ id: course?.instructorId ?? 0 }, { enabled: !!course?.instructorId });
  const { data: couponResult } = trpc.coupon.validate.useQuery({ code: couponCode, courseId: course?.id }, { enabled: couponCode.length > 3 });

  const utils = trpc.useUtils();
  const createOrder = trpc.order.create.useMutation();

  const createReview = trpc.review.create.useMutation({
    onSuccess: () => { utils.review.listByCourse.invalidate({ courseId: course?.id ?? 0 }); setReviewText(""); toast.success("評價已提交"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">載入中...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">課程不存在</h1>
          <Button onClick={() => setLocation("/courses")}>返回課程目錄</Button>
        </div>
      </div>
    );
  }

  const isEnrolled = enrollment?.enrolled ?? false;
  const isFree = parseFloat(course.price) === 0;
  const levelLabel: Record<string, string> = { beginner: "入門", intermediate: "中級", advanced: "高級" };

  const handlePurchase = () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    if (isFree) {
      createOrder.mutate({ courseId: course.id, paymentMethod: "free" });
    } else {
      setOrderDialog(true);
    }
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    createOrder.mutate({
      courseId: course.id,
      paymentMethod,
      couponCode: couponCode || undefined,
    }, {
      onSuccess: async (data) => {
        if (data.status === "paid") {
          // 免費課程直接開通
          setOrderDialog(false);
          toast.success("課程已開通！");
          utils.enrollment.check.invalidate({ courseId: course.id });
          setIsSubmitting(false);
          return;
        }
        if (paymentMethod === "ecpay") {
          // 呼叫 ECPay API 取得付款表單
          try {
            const resp = await fetch("/api/ecpay/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderNo: data.orderNo }),
            });
            const ecpayData = await resp.json();
            if (ecpayData.actionUrl && ecpayData.formParams) {
              // 建立隱藏表單並提交到綠界
              const form = document.createElement("form");
              form.method = "POST";
              form.action = ecpayData.actionUrl;
              form.target = "_blank";
              Object.entries(ecpayData.formParams).forEach(([key, value]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value as string;
                form.appendChild(input);
              });
              document.body.appendChild(form);
              form.submit();
              document.body.removeChild(form);
              setOrderDialog(false);
              toast.success("已開啟綠界付款頁面，請在新視窗完成付款");
              setLocation(`/payment/result?orderNo=${data.orderNo}`);
            } else {
              toast.error(ecpayData.error || "建立綠界付款失敗");
            }
          } catch (e) {
            toast.error("連接綠界付款失敗，請稍後再試");
          }
        } else {
          // 銀行轉帳 - 導向付款結果頁顯示轉帳資訊
          setOrderDialog(false);
          toast.success(`訂單已建立，請依指示完成轉帳並上傳憑證`);
          setLocation(`/payment/result?orderNo=${data.orderNo}`);
        }
        setIsSubmitting(false);
      },
      onError: (e) => {
        toast.error(e.message);
        setIsSubmitting(false);
      },
    });
  };

  let discountedPrice = parseFloat(course.price);
  if (couponResult?.valid && couponResult.coupon) {
    const c = couponResult.coupon;
    if (c.discountType === "fixed") {
      discountedPrice = Math.max(0, discountedPrice - parseFloat(c.discountValue));
    } else {
      discountedPrice = Math.max(0, discountedPrice * (1 - parseFloat(c.discountValue) / 100));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-cinematic-hero py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{levelLabel[course.level] ?? course.level}</Badge>
                {course.status === "published" && <Badge variant="outline" className="border-primary/30 text-primary">已發布</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{course.title}</h1>
              {course.subtitle && <p className="text-lg text-muted-foreground">{course.subtitle}</p>}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {course.avgRating && parseFloat(course.avgRating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-medium text-foreground">{course.avgRating}</span>
                    <span>({course.ratingCount} 評價)</span>
                  </div>
                )}
                <div className="flex items-center gap-1"><Users className="h-4 w-4" />{course.enrollmentCount} 人學習</div>
                <div className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.totalLessons} 堂課</div>
                {course.totalDuration > 0 && (
                  <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{Math.floor(course.totalDuration / 3600)} 小時</div>
                )}
              </div>

              {instructor && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {instructor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{instructor.name}</p>
                    {instructor.title && <p className="text-xs text-muted-foreground">{instructor.title}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Price Card */}
            <div>
              <Card className="bg-card border-border sticky top-20">
                {course.coverImageUrl && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    {isFree ? (
                      <span className="text-3xl font-bold text-primary">免費</span>
                    ) : (
                      <div>
                        {course.originalPrice && parseFloat(course.originalPrice) > parseFloat(course.price) && (
                          <span className="text-lg text-muted-foreground line-through mr-3">NT$ {course.originalPrice}</span>
                        )}
                        <span className="text-3xl font-bold text-primary">NT$ {course.price}</span>
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">已購買此課程</span>
                      </div>
                      <Button className="w-full" size="lg" onClick={() => setLocation(`/learn/${course.slug}`)}>
                        <Play className="h-5 w-5 mr-2" />開始學習
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full glow-orange" size="lg" onClick={handlePurchase} disabled={createOrder.isPending}>
                      <ShoppingCart className="h-5 w-5 mr-2" />{isFree ? "免費報名" : "立即購買"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {course.description && (
                <Card className="bg-card border-border">
                  <CardHeader><CardTitle>課程介紹</CardTitle></CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none text-foreground whitespace-pre-wrap">{course.description}</div>
                  </CardContent>
                </Card>
              )}

              {/* Instructor */}
              {instructor && instructor.bio && (
                <Card className="bg-card border-border">
                  <CardHeader><CardTitle>講師介紹</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                        {instructor.avatarUrl ? <img src={instructor.avatarUrl} className="w-full h-full rounded-full object-cover" /> : instructor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{instructor.name}</h3>
                        {instructor.title && <p className="text-sm text-muted-foreground">{instructor.title}</p>}
                        <p className="mt-2 text-sm leading-relaxed">{instructor.bio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chapters */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>課程大綱</CardTitle>
                  <p className="text-sm text-muted-foreground">{chapters?.length ?? 0} 章節 · {lessons?.length ?? 0} 課時</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {chapters?.map(ch => {
                    const chLessons = lessons?.filter(l => l.chapterId === ch.id) ?? [];
                    const isExpanded = expandedChapter === ch.id;
                    return (
                      <div key={ch.id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedChapter(isExpanded ? null : ch.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{ch.title}</span>
                            <span className="text-xs text-muted-foreground">{chLessons.length} 課時</span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border">
                            {chLessons.sort((a, b) => a.sortOrder - b.sortOrder).map(lesson => (
                              <div key={lesson.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                                <div className="flex items-center gap-3">
                                  {lesson.isFreePreview || isEnrolled ? (
                                    <Play className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">{lesson.title}</span>
                                  {lesson.isFreePreview && <Badge variant="outline" className="text-xs">免費試看</Badge>}
                                </div>
                                {lesson.duration > 0 && (
                                  <span className="text-xs text-muted-foreground">{Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, "0")}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!chapters || chapters.length === 0) && (
                    <p className="text-center py-8 text-muted-foreground">課程大綱即將更新</p>
                  )}
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card className="bg-card border-border">
                <CardHeader><CardTitle>學員評價</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {isEnrolled && (
                    <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <Label>評分：</Label>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setReviewRating(n)}>
                            <Star className={`h-5 w-5 ${n <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="分享您的學習心得..." rows={3} />
                      <Button size="sm" onClick={() => createReview.mutate({ courseId: course.id, rating: reviewRating, comment: reviewText })} disabled={createReview.isPending}>
                        提交評價
                      </Button>
                    </div>
                  )}
                  {reviews?.map(r => (
                    <div key={r.id} className="p-4 rounded-lg bg-secondary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("zh-TW")}</span>
                      </div>
                      {r.comment && <p className="text-sm">{r.comment}</p>}
                    </div>
                  ))}
                  {(!reviews || reviews.length === 0) && (
                    <p className="text-center py-4 text-muted-foreground">尚無評價</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - preview video */}
            <div className="hidden lg:block">
              {course.previewVideoUrl && (
                <Card className="bg-card border-border sticky top-20">
                  <CardHeader><CardTitle className="text-base">課程預覽</CardTitle></CardHeader>
                  <CardContent>
                    <video src={course.previewVideoUrl} controls className="w-full rounded-lg" />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>購買課程</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{course.title}</p>
              <p className="text-2xl font-bold text-primary mt-2">NT$ {discountedPrice.toFixed(0)}</p>
              {couponResult?.valid && <p className="text-xs text-green-400">已套用優惠券</p>}
            </div>
            <Separator />
            <div>
              <Label>優惠券代碼</Label>
              <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="輸入優惠碼" />
              {couponCode.length > 3 && couponResult && !couponResult.valid && (
                <p className="text-xs text-destructive mt-1">{couponResult.message}</p>
              )}
            </div>
            <div>
              <Label>付款方式</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecpay">綠界 ECPay（信用卡/ATM/超商）</SelectItem>
                  <SelectItem value="bank_transfer">銀行轉帳</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === "ecpay" && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <p className="font-medium">綠界 ECPay 付款</p>
                </div>
                <p className="text-muted-foreground">支援信用卡、ATM 轉帳、超商代碼等多種付款方式。點擊確認後將跳轉至綠界安全付款頁面。</p>
              </div>
            )}
            {paymentMethod === "bank_transfer" && (
              <div className="p-3 rounded-lg bg-secondary/30 text-sm space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4" />
                  <p className="font-medium">銀行轉帳資訊</p>
                </div>
                <p className="text-muted-foreground">確認訂單後將顯示完整轉帳資訊，請依指示完成轉帳並上傳付款憑證。審核通過後即自動開通課程。</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOrderDialog(false)} disabled={isSubmitting}>取消</Button>
              <Button onClick={submitOrder} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />處理中...</> : paymentMethod === "ecpay" ? "前往綠界付款" : "確認下單"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
