/**
 * Easypaisa (Easypay) merchant REST API client — Mobile Account (MA) flow.
 *
 * Flow:
 *  1. initiate-ma-transaction: Easypaisa pushes an approval prompt to the customer's Easypaisa
 *     mobile account. The call returns once the customer approves/declines or it times out.
 *  2. inquire-transaction: server-side verification. An order is ONLY marked paid when the
 *     inquiry reports transactionStatus PAID for the same orderId and the exact amount.
 *
 * Endpoints and field names follow Easypaisa's "Easypay REST API" integration guide issued to
 * merchants. Confirm them against the guide supplied with your merchant account; base URLs can be
 * overridden with EASYPAISA_API_BASE_URL.
 */

export type EasypaisaConfig = {
  storeId: string;
  username: string;
  password: string;
  accountNum: string;
  baseUrl: string;
};

export const EASYPAISA_BASE_URLS = {
  sandbox: "https://easypaystg.easypaisa.com.pk/easypay-service/rest",
  production: "https://easypay.easypaisa.com.pk/easypay-service/rest",
} as const;

export function getEasypaisaConfig(env: Record<string, string | undefined> = process.env): EasypaisaConfig | null {
  const storeId = env.EASYPAISA_STORE_ID?.trim();
  const username = env.EASYPAISA_USERNAME?.trim();
  const password = env.EASYPAISA_PASSWORD?.trim();
  const accountNum = env.EASYPAISA_ACCOUNT_NUM?.trim();
  if (!storeId || !username || !password || !accountNum) return null;
  const mode = env.EASYPAISA_ENV === "production" ? "production" : "sandbox";
  return {
    storeId,
    username,
    password,
    accountNum,
    baseUrl: (env.EASYPAISA_API_BASE_URL?.trim() || EASYPAISA_BASE_URLS[mode]).replace(/\/$/, ""),
  };
}

export function isEasypaisaConfigured() {
  return getEasypaisaConfig() !== null;
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

function credentialsHeader(cfg: EasypaisaConfig) {
  return Buffer.from(`${cfg.username}:${cfg.password}`).toString("base64");
}

export function formatAmount(amount: number) {
  return amount.toFixed(1);
}

async function post<T>(cfg: EasypaisaConfig, path: string, body: object, fetchImpl: FetchLike, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${cfg.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Credentials: credentialsHeader(cfg),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new EasypaisaError(`Unexpected response from Easypaisa (HTTP ${res.status})`);
    }
    if (!res.ok) throw new EasypaisaError(`Easypaisa returned HTTP ${res.status}`, data);
    return data as T;
  } catch (err) {
    if (err instanceof EasypaisaError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new EasypaisaError("Easypaisa did not respond in time");
    throw new EasypaisaError("Could not reach Easypaisa");
  } finally {
    clearTimeout(timer);
  }
}

export class EasypaisaError extends Error {
  constructor(
    message: string,
    public raw?: unknown,
  ) {
    super(message);
  }
}

export type InitiateResponse = {
  orderId?: string;
  storeId?: string | number;
  transactionId?: string;
  transactionDateTime?: string;
  responseCode?: string;
  responseDesc?: string;
};

export type InquiryResponse = {
  orderId?: string;
  accountNum?: string;
  storeId?: string | number;
  transactionId?: string;
  transactionStatus?: string;
  transactionAmount?: number | string;
  transactionDateTime?: string;
  paymentMode?: string;
  msisdn?: string;
  responseCode?: string;
  responseDesc?: string;
};

export async function initiateMaTransaction(
  cfg: EasypaisaConfig,
  input: { orderId: string; amount: number; mobileAccountNo: string; emailAddress: string },
  fetchImpl: FetchLike = fetch,
) {
  return post<InitiateResponse>(
    cfg,
    "/v4/initiate-ma-transaction",
    {
      orderId: input.orderId,
      storeId: cfg.storeId,
      transactionAmount: formatAmount(input.amount),
      transactionType: "MA",
      mobileAccountNo: input.mobileAccountNo,
      emailAddress: input.emailAddress,
    },
    fetchImpl,
    95_000,
  );
}

export async function inquireTransaction(cfg: EasypaisaConfig, orderId: string, fetchImpl: FetchLike = fetch) {
  return post<InquiryResponse>(
    cfg,
    "/v4/inquire-transaction",
    { orderId, storeId: cfg.storeId, accountNum: cfg.accountNum },
    fetchImpl,
    30_000,
  );
}

export type VerificationOutcome = "PAID" | "FAILED" | "PENDING";

/**
 * Decides the payment outcome strictly from a server-side inquiry.
 * PAID requires: successful response code, PAID status, matching orderId and exact amount.
 */
export function evaluateInquiry(inquiry: InquiryResponse, expected: { orderId: string; amount: number }): VerificationOutcome {
  const status = String(inquiry.transactionStatus ?? "").toUpperCase();
  if (inquiry.responseCode !== "0000") return "PENDING";
  if (inquiry.orderId && inquiry.orderId !== expected.orderId) return "FAILED";
  if (status === "PAID") {
    const amount = Number(inquiry.transactionAmount);
    return Number.isFinite(amount) && Math.abs(amount - expected.amount) < 0.01 ? "PAID" : "FAILED";
  }
  if (["FAILED", "EXPIRED", "REVERSED", "DECLINED", "CANCELLED"].includes(status)) return "FAILED";
  return "PENDING";
}
