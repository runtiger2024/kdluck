/**
 * 綠界 ECPay Express 路由
 * - POST /api/ecpay/create-order: 產生綠界付款表單參數
 * - POST /api/ecpay/callback: 綠界付款結果通知 (ReturnURL)
 * - GET /api/ecpay/return: 付款完成後導回前端
 */
import type { Express, Request, Response } from "express";
import { generateECPayOrder, verifyCheckMacValue } from "./ecpay";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export function registerECPayRoutes(app: Express) {
  /**
   * 產生綠界付款表單參數
   * 前端收到後用 form submit 跳轉到綠界付款頁面
   */
  app.post("/api/ecpay/create-order", async (req: Request, res: Response) => {
    try {
      const { orderNo } = req.body;
      if (!orderNo) {
        return res.status(400).json({ error: "缺少訂單編號" });
      }

      const order = await db.getOrderByNo(orderNo);
      if (!order) {
        return res.status(404).json({ error: "訂單不存在" });
      }
      if (order.paymentStatus === "paid") {
        return res.status(400).json({ error: "訂單已付款" });
      }
      if (order.paymentMethod !== "ecpay") {
        return res.status(400).json({ error: "此訂單非綠界付款" });
      }

      // 取得課程名稱
      const course = await db.getCourseById(order.courseId);
      const itemName = course ? course.title : "線上課程";

      // 使用 origin header 或 referer 來建構回調 URL
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`;

      const { actionUrl, formParams } = generateECPayOrder({
        orderNo: order.orderNo,
        amount: Math.round(parseFloat(order.amount)),
        itemName,
        returnUrl: `${origin}/api/ecpay/callback`,
        clientBackUrl: `${origin}/payment/result?orderNo=${order.orderNo}`,
        orderResultUrl: `${origin}/payment/result?orderNo=${order.orderNo}`,
      });

      return res.json({ actionUrl, formParams });
    } catch (error) {
      console.error("[ECPay] Create order error:", error);
      return res.status(500).json({ error: "建立付款失敗" });
    }
  });

  /**
   * 綠界付款結果通知 (ReturnURL)
   * 綠界會以 POST application/x-www-form-urlencoded 格式回傳
   * 回傳 "1|OK" 表示收到通知
   */
  app.post("/api/ecpay/callback", async (req: Request, res: Response) => {
    try {
      const params = req.body as Record<string, string>;
      console.log("[ECPay] Callback received:", JSON.stringify(params));

      // 驗證 CheckMacValue
      if (!verifyCheckMacValue(params)) {
        console.error("[ECPay] CheckMacValue verification failed");
        return res.status(400).send("0|CheckMacValue Error");
      }

      const merchantTradeNo = params.MerchantTradeNo;
      const rtnCode = params.RtnCode; // 1 = 付款成功
      const tradeNo = params.TradeNo; // 綠界交易編號
      const paymentDate = params.PaymentDate;

      // 查找訂單
      const order = await db.getOrderByNo(merchantTradeNo);
      if (!order) {
        console.error("[ECPay] Order not found:", merchantTradeNo);
        return res.send("1|OK"); // 仍回傳 OK 避免綠界重試
      }

      if (order.paymentStatus === "paid") {
        // 已處理過，直接回傳 OK
        return res.send("1|OK");
      }

      if (rtnCode === "1") {
        // 付款成功
        await db.updateOrderStatus(merchantTradeNo, "paid", tradeNo);
        await db.createEnrollment({ userId: order.userId, courseId: order.courseId });
        if (order.couponId) {
          await db.incrementCouponUsage(order.couponId);
        }

        // 通知管理員
        const course = await db.getCourseById(order.courseId);
        try {
          await notifyOwner({
            title: "新訂單付款成功",
            content: `訂單 ${merchantTradeNo} 已透過綠界付款成功\n課程: ${course?.title ?? order.courseId}\n金額: NT$ ${order.amount}\n綠界交易編號: ${tradeNo}`,
          });
        } catch (e) {
          console.warn("[ECPay] Notify owner failed:", e);
        }

        console.log(`[ECPay] Order ${merchantTradeNo} paid successfully, trade: ${tradeNo}`);
      } else {
        // 付款失敗
        await db.updateOrderStatus(merchantTradeNo, "failed", tradeNo);
        console.log(`[ECPay] Order ${merchantTradeNo} payment failed, code: ${rtnCode}`);
      }

      // 回傳 "1|OK" 告知綠界已收到
      return res.send("1|OK");
    } catch (error) {
      console.error("[ECPay] Callback error:", error);
      return res.send("0|Error");
    }
  });

  /**
   * 付款結果頁面 (OrderResultURL / ClientBackURL)
   * 綠界付款完成後導回此頁面
   */
  app.get("/api/ecpay/return", (req: Request, res: Response) => {
    const orderNo = req.query.orderNo as string;
    // 導回前端付款結果頁面
    res.redirect(`/payment/result?orderNo=${orderNo || ""}`);
  });
}
