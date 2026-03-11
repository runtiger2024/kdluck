/**
 * 綠界 ECPay 金流整合模組
 * 支援全方位金流 (AIO) 付款
 * 文件: https://developers.ecpay.com.tw/
 * 
 * 所有函數接受外部傳入金鑰參數，由呼叫端從 DB 或環境變數取得
 */
import crypto from "crypto";

// 綠界 API 端點
const ECPAY_API_URL = {
  test: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  production: "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
};

/**
 * 產生綠界 CheckMacValue 檢查碼
 * 依照綠界規範：
 * 1. 將參數依照 key 排序（A-Z, case-insensitive）
 * 2. 組成 key=value& 字串
 * 3. 前後加上 HashKey 和 HashIV
 * 4. URL encode (小寫)
 * 5. 轉小寫後做 SHA256
 * 6. 轉大寫
 */
export function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIv: string
): string {
  // 1. 排序（case-insensitive）
  const sortedKeys = Object.keys(params).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // 2. 組成 key=value& 字串
  const paramStr = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");

  // 3. 前後加上 HashKey 和 HashIV
  const raw = `HashKey=${hashKey}&${paramStr}&HashIV=${hashIv}`;

  // 4. URL encode
  let encoded = encodeURIComponent(raw);

  // 綠界特殊 URL encode 規則（與 .NET 相容）
  encoded = encoded
    .replace(/%2d/gi, "-")
    .replace(/%5f/gi, "_")
    .replace(/%2e/gi, ".")
    .replace(/%21/gi, "!")
    .replace(/%2a/gi, "*")
    .replace(/%28/gi, "(")
    .replace(/%29/gi, ")")
    .replace(/%20/gi, "+");

  // 5. 轉小寫
  encoded = encoded.toLowerCase();

  // 6. SHA256 後轉大寫
  const hash = crypto.createHash("sha256").update(encoded).digest("hex");
  return hash.toUpperCase();
}

/**
 * 驗證綠界回傳的 CheckMacValue
 */
export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIv: string
): boolean {
  const receivedMac = params.CheckMacValue;
  if (!receivedMac) return false;

  // 移除 CheckMacValue 後重新計算
  const paramsWithoutMac = { ...params };
  delete paramsWithoutMac.CheckMacValue;

  const calculated = generateCheckMacValue(paramsWithoutMac, hashKey, hashIv);
  return calculated === receivedMac;
}

export interface ECPayOrderParams {
  orderNo: string;
  amount: number; // 整數金額（新台幣）
  itemName: string; // 商品名稱
  returnUrl: string; // 付款結果通知 URL（後端 webhook）
  clientBackUrl: string; // 付款完成後導回頁面
  orderResultUrl?: string; // 付款完成後導向頁面（前端）
}

export interface ECPayCredentials {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  isProduction: boolean;
}

/**
 * 產生綠界 AIO 付款表單參數
 */
export function generateECPayOrder(
  params: ECPayOrderParams,
  credentials: ECPayCredentials
): {
  actionUrl: string;
  formParams: Record<string, string>;
} {
  // 交易時間格式: yyyy/MM/dd HH:mm:ss
  const now = new Date();
  const tradeDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("/") + " " + [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join(":");

  const formParams: Record<string, string> = {
    MerchantID: credentials.merchantId,
    MerchantTradeNo: params.orderNo.substring(0, 20), // 最多20字元
    MerchantTradeDate: tradeDate,
    PaymentType: "aio",
    TotalAmount: String(Math.round(params.amount)),
    TradeDesc: encodeURIComponent("KDLuck 線上課程購買"),
    ItemName: params.itemName,
    ReturnURL: params.returnUrl,
    ClientBackURL: params.clientBackUrl,
    OrderResultURL: params.orderResultUrl ?? params.clientBackUrl,
    ChoosePayment: "ALL", // 全方位付款
    EncryptType: "1", // SHA256
    NeedExtraPaidInfo: "Y",
  };

  // 產生 CheckMacValue
  formParams.CheckMacValue = generateCheckMacValue(formParams, credentials.hashKey, credentials.hashIv);

  const actionUrl = credentials.isProduction
    ? ECPAY_API_URL.production
    : ECPAY_API_URL.test;

  return { actionUrl, formParams };
}
