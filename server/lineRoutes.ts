/**
 * LINE Login Express 路由
 * - GET /api/line/login: 導向 LINE Login 授權頁
 * - GET /api/line/callback: LINE Login 回調處理
 * 
 * API 金鑰從 DB site_config 讀取，fallback 到環境變數
 */
import type { Express, Request, Response } from "express";
import { exchangeLineToken, getLineProfile, parseLineIdToken, getLineLoginUrl } from "./line";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import crypto from "crypto";

export function registerLineRoutes(app: Express) {
  /**
   * 導向 LINE Login 授權頁
   */
  app.get("/api/line/login", async (req: Request, res: Response) => {
    try {
      const apiConfig = await db.getApiConfig();
      if (!apiConfig.lineChannelId) {
        return res.status(503).json({ error: "LINE Login 尚未設定，請至管理後台 → 支付設定進行配置" });
      }

      const origin = req.query.origin as string || `${req.protocol}://${req.get("host")}`;
      const returnPath = req.query.returnPath as string || "/";
      const state = Buffer.from(JSON.stringify({ origin, returnPath })).toString("base64url");
      const nonce = crypto.randomBytes(16).toString("hex");

      const redirectUri = `${origin}/api/line/callback`;
      const loginUrl = getLineLoginUrl({ redirectUri, state, nonce }, apiConfig.lineChannelId);

      res.redirect(loginUrl);
    } catch (error) {
      console.error("[LINE Login] Error:", error);
      res.status(500).json({ error: "LINE Login 初始化失敗" });
    }
  });

  /**
   * LINE Login 回調處理
   */
  app.get("/api/line/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      if (error) {
        console.error("[LINE Login] Auth error:", error);
        return res.redirect("/?error=line_login_failed");
      }

      if (!code || !state) {
        return res.status(400).json({ error: "缺少必要參數" });
      }

      // 解析 state
      let stateData: { origin: string; returnPath: string };
      try {
        stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      } catch {
        stateData = { origin: `${req.protocol}://${req.get("host")}`, returnPath: "/" };
      }

      const redirectUri = `${stateData.origin}/api/line/callback`;

      // 從 DB 讀取 API 金鑰
      const apiConfig = await db.getApiConfig();

      // 換取 token
      const tokenResponse = await exchangeLineToken(code, redirectUri, {
        channelId: apiConfig.lineChannelId,
        channelSecret: apiConfig.lineChannelSecret,
      });

      // 取得 LINE 個人資料
      const profile = await getLineProfile(tokenResponse.access_token);

      // 從 id_token 解析 email
      const idTokenData = parseLineIdToken(tokenResponse.id_token);

      // 建立或更新使用者
      // 使用 LINE userId 作為 openId 的前綴，避免與 Manus OAuth 衝突
      const lineOpenId = `line_${profile.userId}`;

      await db.upsertUser({
        openId: lineOpenId,
        name: profile.displayName,
        email: idTokenData.email ?? null,
        avatarUrl: profile.pictureUrl ?? null,
        loginMethod: "line",
        lineUserId: profile.userId,
        lastSignedIn: new Date(),
      });

      // 建立 session token
      const sessionToken = await sdk.createSessionToken(lineOpenId, {
        name: profile.displayName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 導回前端
      res.redirect(302, stateData.returnPath || "/");
    } catch (error) {
      console.error("[LINE Login] Callback error:", error);
      res.redirect("/?error=line_login_failed");
    }
  });
}
