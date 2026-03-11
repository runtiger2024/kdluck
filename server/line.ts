/**
 * LINE 整合模組
 * - LINE Login OAuth 2.1
 * - LINE Messaging API 推播
 * 
 * 所有函數接受外部傳入金鑰參數，由呼叫端從 DB 或環境變數取得
 */

// ─── LINE Login OAuth 2.1 ───

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

export interface LineLoginConfig {
  redirectUri: string;
  state: string;
  nonce?: string;
}

export interface LineLoginCredentials {
  channelId: string;
  channelSecret: string;
}

export interface LineMessagingCredentials {
  token: string;
}

/**
 * 產生 LINE Login 授權 URL
 */
export function getLineLoginUrl(config: LineLoginConfig, channelId: string): string {
  if (!channelId) throw new Error("LINE_CHANNEL_ID 未設定，請至管理後台 → 支付設定進行配置");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: config.redirectUri,
    state: config.state,
    scope: "profile openid email",
    bot_prompt: "aggressive",
  });

  if (config.nonce) params.set("nonce", config.nonce);

  return `${LINE_AUTH_URL}?${params.toString()}`;
}

export interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

/**
 * 用授權碼換取 access token
 */
export async function exchangeLineToken(
  code: string,
  redirectUri: string,
  credentials: LineLoginCredentials
): Promise<LineTokenResponse> {
  if (!credentials.channelId || !credentials.channelSecret) {
    throw new Error("LINE Login 金鑰未設定，請至管理後台 → 支付設定進行配置");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: credentials.channelId,
    client_secret: credentials.channelSecret,
  });

  const response = await fetch(LINE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE token exchange failed: ${error}`);
  }

  return response.json();
}

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

/**
 * 取得 LINE 使用者個人資料
 */
export async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE profile fetch failed: ${error}`);
  }

  return response.json();
}

/**
 * 從 id_token 解析 email（LINE Login 的 email scope）
 */
export function parseLineIdToken(idToken: string): { email?: string; name?: string; picture?: string } {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return {};
  }
}

// ─── LINE Messaging API ───

const LINE_MESSAGING_URL = "https://api.line.me/v2/bot";

/**
 * 推送訊息給單一使用者
 */
export async function pushMessage(lineUserId: string, message: string, token: string): Promise<boolean> {
  if (!token) {
    console.warn("[LINE] Messaging token not configured");
    return false;
  }

  try {
    const response = await fetch(`${LINE_MESSAGING_URL}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[LINE] Push message failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[LINE] Push message error:", error);
    return false;
  }
}

/**
 * 多播訊息（最多 500 人）
 */
export async function multicastMessage(lineUserIds: string[], message: string, token: string): Promise<{ success: number; failed: number }> {
  if (!token) {
    console.warn("[LINE] Messaging token not configured");
    return { success: 0, failed: lineUserIds.length };
  }

  // LINE multicast API 一次最多 500 人
  const chunks: string[][] = [];
  for (let i = 0; i < lineUserIds.length; i += 500) {
    chunks.push(lineUserIds.slice(i, i + 500));
  }

  let success = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const response = await fetch(`${LINE_MESSAGING_URL}/message/multicast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: chunk,
          messages: [{ type: "text", text: message }],
        }),
      });

      if (response.ok) {
        success += chunk.length;
      } else {
        const error = await response.text();
        console.error("[LINE] Multicast failed:", error);
        failed += chunk.length;
      }
    } catch (error) {
      console.error("[LINE] Multicast error:", error);
      failed += chunk.length;
    }
  }

  return { success, failed };
}

/**
 * 廣播訊息給所有好友
 */
export async function broadcastMessage(message: string, token: string): Promise<boolean> {
  if (!token) {
    console.warn("[LINE] Messaging token not configured");
    return false;
  }

  try {
    const response = await fetch(`${LINE_MESSAGING_URL}/message/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[LINE] Broadcast failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[LINE] Broadcast error:", error);
    return false;
  }
}
