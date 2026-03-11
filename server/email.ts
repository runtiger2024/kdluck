/**
 * Email 發送模組
 * 使用 nodemailer 透過 SMTP 發送 Email
 * SMTP 設定從 site_config 讀取，管理員可在後台設定
 */
import nodemailer from "nodemailer";
import { getSiteConfig } from "./db";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const config = await getSiteConfig();
  const host = config.smtp_host;
  const user = config.smtp_user;
  const pass = config.smtp_pass;
  
  if (!host || !user || !pass) return null;
  
  return {
    host,
    port: parseInt(config.smtp_port || "587"),
    secure: (config.smtp_secure || "false") === "true",
    user,
    pass,
    fromName: config.smtp_from_name || config.site_name || "KDLuck",
    fromEmail: config.smtp_from_email || user,
  };
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpConfig = await getSmtpConfig();
    if (!smtpConfig) {
      console.warn("[Email] SMTP not configured, skipping email send");
      return { success: false, error: "SMTP 尚未設定" };
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: recipients.join(", "),
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Email] Sent to ${recipients.length} recipients: ${options.subject}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Email] Send failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 生成 HTML Email 模板
 */
export function buildEmailHtml(params: {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}): string {
  const { title, content, buttonText, buttonUrl, footerText } = params;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; padding: 20px 0; }
    .logo h1 { color: #f97316; font-size: 24px; margin: 0; }
    h2 { color: #18181b; font-size: 20px; margin: 0 0 16px; }
    p { color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #f97316; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .btn:hover { background: #ea580c; }
    .footer { text-align: center; padding: 20px; color: #a1a1aa; font-size: 13px; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><h1>KDLuck</h1></div>
    <div class="card">
      <h2>${title}</h2>
      ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
      ${buttonText && buttonUrl ? `<hr class="divider"><p style="text-align:center"><a href="${buttonUrl}" class="btn">${buttonText}</a></p>` : ''}
    </div>
    <div class="footer">
      ${footerText || '此信件由 KDLuck 知識付費平台自動發送，請勿直接回覆。'}
    </div>
  </div>
</body>
</html>`;
}
