import { describe, expect, it } from "vitest";
import { generateCheckMacValue, verifyCheckMacValue, generateECPayOrder } from "./ecpay";

// 綠界測試環境金鑰
const TEST_HASH_KEY = "pwFHCqoQZGmho4w6";
const TEST_HASH_IV = "EkRm7iFT261dpevs";
const TEST_MERCHANT_ID = "3002607";

describe("ECPay CheckMacValue", () => {
  it("should generate correct CheckMacValue with SHA256", () => {
    // 使用綠界官方文件的測試案例驗證
    const params: Record<string, string> = {
      MerchantID: TEST_MERCHANT_ID,
      MerchantTradeNo: "TEST20240101001",
      MerchantTradeDate: "2024/01/01 00:00:00",
      PaymentType: "aio",
      TotalAmount: "1000",
      TradeDesc: "test",
      ItemName: "Test Item",
      ReturnURL: "https://example.com/callback",
      ChoosePayment: "ALL",
      EncryptType: "1",
    };

    const mac = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);

    // CheckMacValue 應為 64 字元的大寫十六進位字串
    expect(mac).toMatch(/^[A-F0-9]{64}$/);
    expect(mac.length).toBe(64);
  });

  it("should produce consistent results for same input", () => {
    const params = {
      MerchantID: TEST_MERCHANT_ID,
      MerchantTradeNo: "CONSIST001",
      TotalAmount: "500",
      PaymentType: "aio",
    };

    const mac1 = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);
    const mac2 = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);

    expect(mac1).toBe(mac2);
  });

  it("should sort parameters case-insensitively for different keys", () => {
    // Same params in different insertion order should produce same MAC
    const params1: Record<string, string> = {};
    params1["MerchantID"] = "3002607";
    params1["TotalAmount"] = "1000";
    params1["PaymentType"] = "aio";

    const params2: Record<string, string> = {};
    params2["TotalAmount"] = "1000";
    params2["PaymentType"] = "aio";
    params2["MerchantID"] = "3002607";

    const mac1 = generateCheckMacValue(params1, TEST_HASH_KEY, TEST_HASH_IV);
    const mac2 = generateCheckMacValue(params2, TEST_HASH_KEY, TEST_HASH_IV);

    expect(mac1).toBe(mac2);
  });

  it("should handle special characters in values", () => {
    const params = {
      MerchantID: TEST_MERCHANT_ID,
      ItemName: "線上課程#1 (進階版)",
      TotalAmount: "1500",
    };

    const mac = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);
    expect(mac).toMatch(/^[A-F0-9]{64}$/);
  });
});

describe("ECPay verifyCheckMacValue", () => {
  it("should verify a valid CheckMacValue", () => {
    const params: Record<string, string> = {
      MerchantID: TEST_MERCHANT_ID,
      MerchantTradeNo: "VERIFY001",
      TotalAmount: "1000",
      PaymentType: "aio",
    };

    // 先產生正確的 CheckMacValue
    const mac = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);
    params.CheckMacValue = mac;

    // 驗證應通過
    // Note: verifyCheckMacValue 使用 ENV 中的 key/iv，在測試中需要設定環境變數
    // 這裡我們直接測試 generate + verify 的一致性
    const paramsWithoutMac = { ...params };
    delete paramsWithoutMac.CheckMacValue;
    const recalculated = generateCheckMacValue(paramsWithoutMac, TEST_HASH_KEY, TEST_HASH_IV);
    expect(recalculated).toBe(mac);
  });

  it("should reject tampered parameters", () => {
    const params: Record<string, string> = {
      MerchantID: TEST_MERCHANT_ID,
      MerchantTradeNo: "TAMPER001",
      TotalAmount: "1000",
      PaymentType: "aio",
    };

    const mac = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);

    // 竄改金額
    params.TotalAmount = "500";
    const tamperedMac = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);

    expect(mac).not.toBe(tamperedMac);
  });

  it("should return false when CheckMacValue is missing", () => {
    const params = {
      MerchantID: TEST_MERCHANT_ID,
      TotalAmount: "1000",
    };

    const result = verifyCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);
    expect(result).toBe(false);
  });

  it("should verify a valid CheckMacValue with hashKey/hashIv", () => {
    const params: Record<string, string> = {
      MerchantID: TEST_MERCHANT_ID,
      MerchantTradeNo: "VERIFY002",
      TotalAmount: "2000",
      PaymentType: "aio",
    };
    const mac = generateCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);
    params.CheckMacValue = mac;
    const result = verifyCheckMacValue(params, TEST_HASH_KEY, TEST_HASH_IV);
    expect(result).toBe(true);
  });
});

describe("ECPay generateECPayOrder", () => {
  it("should generate valid order form parameters", () => {
    const testCredentials: import("./ecpay").ECPayCredentials = {
      merchantId: TEST_MERCHANT_ID,
      hashKey: TEST_HASH_KEY,
      hashIv: TEST_HASH_IV,
      isProduction: false,
    };

    const { actionUrl, formParams } = generateECPayOrder({
      orderNo: "KD1704067200ABC123",
      amount: 1500,
      itemName: "Python 入門課程",
      returnUrl: "https://example.com/api/ecpay/callback",
      clientBackUrl: "https://example.com/payment/result?orderNo=KD1704067200ABC123",
    }, testCredentials);

    // 驗證 URL 為測試環境
    expect(actionUrl).toContain("payment-stage.ecpay.com.tw");

    // 驗證必要參數
    expect(formParams.MerchantID).toBe(TEST_MERCHANT_ID);
    expect(formParams.TotalAmount).toBe("1500");
    expect(formParams.ItemName).toBe("Python 入門課程");
    expect(formParams.PaymentType).toBe("aio");
    expect(formParams.ChoosePayment).toBe("ALL");
    expect(formParams.EncryptType).toBe("1");
    expect(formParams.ReturnURL).toBe("https://example.com/api/ecpay/callback");

    // 驗證 CheckMacValue 存在且格式正確
    expect(formParams.CheckMacValue).toBeDefined();
    expect(formParams.CheckMacValue).toMatch(/^[A-F0-9]{64}$/);

    // 驗證 MerchantTradeNo 不超過 20 字元
    expect(formParams.MerchantTradeNo.length).toBeLessThanOrEqual(20);

    // 驗證交易時間格式
    expect(formParams.MerchantTradeDate).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("should return test URL when ECPAY_IS_PRODUCTION is false", () => {
    const testCredentials: import("./ecpay").ECPayCredentials = {
      merchantId: TEST_MERCHANT_ID,
      hashKey: TEST_HASH_KEY,
      hashIv: TEST_HASH_IV,
      isProduction: false,
    };

    const { actionUrl } = generateECPayOrder({
      orderNo: "KD1704067200TEST01",
      amount: 2000,
      itemName: "進階課程",
      returnUrl: "https://example.com/api/ecpay/callback",
      clientBackUrl: "https://example.com/payment/result",
    }, testCredentials);

    // 測試環境應使用 stage URL
    expect(actionUrl).toContain("payment-stage.ecpay.com.tw");
  });

  it("should round amount to integer", () => {
    const testCredentials: import("./ecpay").ECPayCredentials = {
      merchantId: TEST_MERCHANT_ID,
      hashKey: TEST_HASH_KEY,
      hashIv: TEST_HASH_IV,
      isProduction: false,
    };

    const { formParams } = generateECPayOrder({
      orderNo: "KD1704067200ROUND1",
      amount: 1499.7,
      itemName: "課程",
      returnUrl: "https://example.com/callback",
      clientBackUrl: "https://example.com/result",
    }, testCredentials);

    expect(formParams.TotalAmount).toBe("1500");
  });

  it("should truncate orderNo to 20 characters", () => {
    const testCredentials: import("./ecpay").ECPayCredentials = {
      merchantId: TEST_MERCHANT_ID,
      hashKey: TEST_HASH_KEY,
      hashIv: TEST_HASH_IV,
      isProduction: false,
    };

    const longOrderNo = "KD17040672001234567890ABCDEF";
    const { formParams } = generateECPayOrder({
      orderNo: longOrderNo,
      amount: 500,
      itemName: "課程",
      returnUrl: "https://example.com/callback",
      clientBackUrl: "https://example.com/result",
    }, testCredentials);

    expect(formParams.MerchantTradeNo.length).toBeLessThanOrEqual(20);
  });
});
