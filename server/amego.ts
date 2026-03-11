/**
 * 光貿電子發票 API 整合模組
 * API 文件: https://invoice.amego.tw/api_doc/
 * 
 * 所有函數接受外部傳入金鑰參數，由呼叫端從 DB 或環境變數取得
 */
import crypto from "crypto";

const AMEGO_API_URL = "https://invoice-api.amego.tw";

/**
 * 產生光貿 API 簽名
 * sign = md5(data JSON字串 + time + APP Key)
 */
export function generateSign(dataJson: string, time: number, appKey: string): string {
  const raw = dataJson + time + appKey;
  return crypto.createHash("md5").update(raw).digest("hex");
}

export interface AmegoCredentials {
  invoiceNumber: string;
  appKey: string;
}

/**
 * 呼叫光貿 API
 */
async function callAmegoApi(endpoint: string, data: Record<string, any>, credentials: AmegoCredentials) {
  if (!credentials.invoiceNumber || !credentials.appKey) {
    throw new Error("光貿 API 金鑰未設定，請至管理後台 → 支付設定進行配置");
  }

  const dataJson = JSON.stringify(data);
  const time = Math.floor(Date.now() / 1000);
  const sign = generateSign(dataJson, time, credentials.appKey);

  const body = new URLSearchParams({
    invoice: credentials.invoiceNumber,
    data: dataJson,
    time: String(time),
    sign,
  });

  const response = await fetch(`${AMEGO_API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const result = await response.json();
  return result;
}

export interface IssueInvoiceParams {
  orderId: string;
  buyerIdentifier?: string; // 統編，個人填 0000000000
  buyerName?: string;
  buyerEmail?: string;
  carrierType?: string; // 3J0002=手機條碼, CQ0001=自然人憑證
  carrierId1?: string; // 載具顯碼
  carrierId2?: string; // 載具隱碼
  npoban?: string; // 捐贈碼
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totalAmount: number;
}

/**
 * 開立發票（自動配號）
 */
export async function issueInvoice(params: IssueInvoiceParams, credentials: AmegoCredentials) {
  const salesAmount = params.totalAmount;
  const taxAmount = params.buyerIdentifier && params.buyerIdentifier !== "0000000000"
    ? Math.round(salesAmount * 0.05)
    : 0;

  const data: Record<string, any> = {
    OrderId: params.orderId,
    BuyerIdentifier: params.buyerIdentifier || "0000000000",
    BuyerName: params.buyerName || "消費者",
    BuyerEmailAddress: params.buyerEmail || "",
    MainRemark: "KDLuck 線上課程",
    CarrierType: params.carrierType || "",
    CarrierId1: params.carrierId1 || "",
    CarrierId2: params.carrierId2 || "",
    NPOBAN: params.npoban || "",
    ProductItem: params.items.map((item) => ({
      Description: item.name,
      Quantity: item.quantity,
      Unit: "式",
      UnitPrice: item.unitPrice,
      Amount: item.amount,
      Remark: "",
      TaxType: 1,
    })),
    SalesAmount: salesAmount,
    FreeTaxSalesAmount: 0,
    ZeroTaxSalesAmount: 0,
    TaxType: 1,
    TaxRate: "0.05",
    TaxAmount: taxAmount,
    TotalAmount: salesAmount + taxAmount,
  };

  const result = await callAmegoApi("/json/f0401", data, credentials);
  return result;
}

/**
 * 作廢發票
 */
export async function voidInvoice(invoiceNumber: string, invoiceDate: string, credentials: AmegoCredentials, reason?: string) {
  const data = {
    InvoiceNumber: invoiceNumber,
    InvoiceDate: invoiceDate,
    VoidReason: reason || "作廢",
  };

  const result = await callAmegoApi("/json/f0501", data, credentials);
  return result;
}

/**
 * 查詢發票狀態
 */
export async function queryInvoiceStatus(invoiceNumber: string, credentials: AmegoCredentials) {
  const data = { InvoiceNumber: invoiceNumber };
  const result = await callAmegoApi("/json/invoice_status", data, credentials);
  return result;
}

/**
 * 查詢發票列表
 */
export async function queryInvoiceList(startDate: string, endDate: string, credentials: AmegoCredentials) {
  const data = { StartDate: startDate, EndDate: endDate };
  const result = await callAmegoApi("/json/invoice_list", data, credentials);
  return result;
}
