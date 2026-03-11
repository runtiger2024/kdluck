/**
 * 統一通知服務
 * 整合三管道：站內通知、LINE 推播、Email
 * 提供統一的發送介面和自動觸發機制
 */
import * as db from "./db";
import { pushMessage, broadcastMessage, multicastMessage } from "./line";
import { sendEmail, buildEmailHtml } from "./email";

export type NotificationChannel = "in_app" | "line" | "email";
export type NotificationType = "system" | "order" | "course" | "promotion" | "review" | "certificate";

interface SendNotificationParams {
  channels: NotificationChannel[];
  targetType: "all" | "user" | "enrolled";
  targetUserId?: number;
  courseId?: number; // for enrolled target type
  title: string;
  content: string;
  type?: NotificationType;
  link?: string;
  metadata?: any;
  sentBy?: number; // admin user id
  emailSubject?: string;
  emailButtonText?: string;
  emailButtonUrl?: string;
}

/**
 * 統一發送通知到指定管道
 */
export async function sendNotification(params: SendNotificationParams): Promise<{
  success: boolean;
  results: { channel: NotificationChannel; success: boolean; count: number; error?: string }[];
}> {
  const {
    channels, targetType, targetUserId, courseId,
    title, content, type = "system", link, metadata, sentBy,
    emailSubject, emailButtonText, emailButtonUrl,
  } = params;

  const results: { channel: NotificationChannel; success: boolean; count: number; error?: string }[] = [];

  // 取得目標用戶列表
  let targetUsers: { id: number; email: string | null; lineUserId: string | null }[] = [];
  
  if (targetType === "user" && targetUserId) {
    const user = await db.getUserById(targetUserId);
    if (user) {
      targetUsers = [{ id: user.id, email: user.email ?? null, lineUserId: user.lineUserId ?? null }];
    }
  } else if (targetType === "enrolled" && courseId) {
    targetUsers = (await db.getEnrolledUserIds(courseId)).map(u => ({
      id: u.id,
      email: u.email ?? null,
      lineUserId: u.lineUserId ?? null,
    }));
  } else {
    targetUsers = (await db.getAllUserIds()).map(u => ({
      id: u.id,
      email: u.email ?? null,
      lineUserId: u.lineUserId ?? null,
    }));
  }

  // 1. 站內通知
  if (channels.includes("in_app")) {
    try {
      const notifData = targetUsers.map(u => ({
        userId: u.id,
        title,
        content,
        type: type as any,
        link: link ?? null,
        metadata: metadata ?? null,
      }));
      await db.createNotificationBatch(notifData);
      
      const logId = await db.createNotificationLog({
        channel: "in_app",
        targetType: targetType as any,
        targetUserId: targetUserId ?? null,
        title,
        content,
        sentCount: targetUsers.length,
        status: "sent",
        sentBy: sentBy ?? null,
        sentAt: new Date(),
      });
      
      results.push({ channel: "in_app", success: true, count: targetUsers.length });
    } catch (error: any) {
      results.push({ channel: "in_app", success: false, count: 0, error: error.message });
    }
  }

  // 2. LINE 推播
  if (channels.includes("line")) {
    try {
      const apiConfig = await db.getApiConfig();
      if (!apiConfig.lineMessagingToken) {
        results.push({ channel: "line", success: false, count: 0, error: "LINE Messaging Token 未設定" });
      } else {
        const lineMessage = `📢 ${title}\n\n${content}${link ? `\n\n👉 ${link}` : ""}`;
        
        if (targetType === "all") {
          await broadcastMessage(lineMessage, apiConfig.lineMessagingToken);
          results.push({ channel: "line", success: true, count: targetUsers.length });
        } else {
          const lineUserIds = targetUsers
            .map(u => u.lineUserId)
            .filter((id): id is string => !!id && id.length > 0);
          
          if (lineUserIds.length > 0) {
            if (lineUserIds.length === 1) {
              await pushMessage(lineUserIds[0], lineMessage, apiConfig.lineMessagingToken);
            } else {
              await multicastMessage(lineUserIds, lineMessage, apiConfig.lineMessagingToken);
            }
            results.push({ channel: "line", success: true, count: lineUserIds.length });
          } else {
            results.push({ channel: "line", success: false, count: 0, error: "目標用戶無 LINE 帳號綁定" });
          }
        }
        
        await db.createNotificationLog({
          channel: "line",
          targetType: targetType as any,
          targetUserId: targetUserId ?? null,
          title,
          content: lineMessage,
          sentCount: results.find(r => r.channel === "line")?.count ?? 0,
          status: results.find(r => r.channel === "line")?.success ? "sent" : "failed",
          errorMessage: results.find(r => r.channel === "line")?.error ?? null,
          sentBy: sentBy ?? null,
          sentAt: new Date(),
        });
      }
    } catch (error: any) {
      results.push({ channel: "line", success: false, count: 0, error: error.message });
    }
  }

  // 3. Email
  if (channels.includes("email")) {
    try {
      const emailRecipients = targetUsers
        .map(u => u.email)
        .filter((e): e is string => !!e && e.length > 0);
      
      if (emailRecipients.length === 0) {
        results.push({ channel: "email", success: false, count: 0, error: "目標用戶無 Email" });
      } else {
        const html = buildEmailHtml({
          title: emailSubject || title,
          content,
          buttonText: emailButtonText,
          buttonUrl: emailButtonUrl || link,
        });
        
        // 分批發送（每批最多 50 人）
        let sentCount = 0;
        const batchSize = 50;
        for (let i = 0; i < emailRecipients.length; i += batchSize) {
          const batch = emailRecipients.slice(i, i + batchSize);
          const result = await sendEmail({
            to: batch,
            subject: emailSubject || title,
            html,
          });
          if (result.success) sentCount += batch.length;
        }
        
        results.push({ channel: "email", success: sentCount > 0, count: sentCount });
      }
      
      await db.createNotificationLog({
        channel: "email",
        targetType: targetType as any,
        targetUserId: targetUserId ?? null,
        title,
        content,
        sentCount: results.find(r => r.channel === "email")?.count ?? 0,
        status: results.find(r => r.channel === "email")?.success ? "sent" : "failed",
        errorMessage: results.find(r => r.channel === "email")?.error ?? null,
        sentBy: sentBy ?? null,
        sentAt: new Date(),
      });
    } catch (error: any) {
      results.push({ channel: "email", success: false, count: 0, error: error.message });
    }
  }

  return {
    success: results.some(r => r.success),
    results,
  };
}

// ─── 自動觸發通知快捷函數 ───

/**
 * 購買成功通知
 */
export async function notifyPurchaseSuccess(userId: number, courseName: string, orderNo: string, origin?: string) {
  return sendNotification({
    channels: ["in_app", "line", "email"],
    targetType: "user",
    targetUserId: userId,
    title: "購買成功",
    content: `您已成功購買課程「${courseName}」，訂單編號：${orderNo}。現在就開始學習吧！`,
    type: "order",
    link: origin ? `${origin}/member/courses` : "/member/courses",
    metadata: { orderNo },
    emailSubject: `[KDLuck] 購買成功 - ${courseName}`,
    emailButtonText: "開始學習",
    emailButtonUrl: origin ? `${origin}/member/courses` : undefined,
  });
}

/**
 * 付款憑證審核結果通知
 */
export async function notifyProofReviewResult(userId: number, orderNo: string, approved: boolean, reason?: string, origin?: string) {
  const title = approved ? "付款憑證已通過" : "付款憑證審核未通過";
  const content = approved
    ? `您的訂單 ${orderNo} 付款憑證已審核通過，課程已開通。`
    : `您的訂單 ${orderNo} 付款憑證審核未通過。${reason ? `原因：${reason}` : "請重新上傳正確的付款憑證。"}`;
  
  return sendNotification({
    channels: ["in_app", "line"],
    targetType: "user",
    targetUserId: userId,
    title,
    content,
    type: "order",
    link: origin ? `${origin}/member/orders` : "/member/orders",
    metadata: { orderNo, approved },
  });
}

/**
 * 課程完成/證書發放通知
 */
export async function notifyCertificateIssued(userId: number, courseName: string, certificateNo: string, origin?: string) {
  return sendNotification({
    channels: ["in_app"],
    targetType: "user",
    targetUserId: userId,
    title: "恭喜完成課程！",
    content: `您已完成課程「${courseName}」，學習證書已發放。證書編號：${certificateNo}`,
    type: "certificate",
    link: origin ? `${origin}/member/certificates` : "/member/certificates",
    metadata: { certificateNo },
  });
}

/**
 * 新課程上架通知（全體用戶）
 */
export async function notifyNewCourse(courseTitle: string, courseSlug: string, origin?: string) {
  return sendNotification({
    channels: ["in_app", "line"],
    targetType: "all",
    title: "新課程上架",
    content: `新課程「${courseTitle}」已上架，快來看看吧！`,
    type: "course",
    link: origin ? `${origin}/courses/${courseSlug}` : `/courses/${courseSlug}`,
  });
}

/**
 * 優惠券到期提醒
 */
export async function notifyCouponExpiring(couponCode: string, expiresAt: string) {
  return sendNotification({
    channels: ["in_app"],
    targetType: "all",
    title: "優惠券即將到期",
    content: `優惠碼「${couponCode}」將於 ${expiresAt} 到期，請把握機會使用！`,
    type: "promotion",
    link: "/courses",
  });
}
