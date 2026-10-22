import { describe, expect, it, vi } from "vitest";
import {
  EASYPAISA_BASE_URLS,
  EasypaisaError,
  evaluateInquiry,
  formatAmount,
  getEasypaisaConfig,
  initiateMaTransaction,
  inquireTransaction,
  type EasypaisaConfig,
} from "@/lib/easypaisa";

const cfg: EasypaisaConfig = { storeId: "12345", username: "merchant", password: "secret", accountNum: "654321", baseUrl: EASYPAISA_BASE_URLS.sandbox };

function mockFetch(body: unknown, status = 200) {
  return vi.fn(async (url: string, init: RequestInit) => {
    void url;
    void init;
    return new Response(JSON.stringify(body), { status });
  });
}

describe("getEasypaisaConfig", () => {
  it("returns null when any credential is missing", () => {
    expect(getEasypaisaConfig({})).toBeNull();
    expect(getEasypaisaConfig({ EASYPAISA_STORE_ID: "1", EASYPAISA_USERNAME: "u", EASYPAISA_PASSWORD: "p" })).toBeNull();
  });
  it("defaults to sandbox and honours production + overrides", () => {
    const env = { EASYPAISA_STORE_ID: "1", EASYPAISA_USERNAME: "u", EASYPAISA_PASSWORD: "p", EASYPAISA_ACCOUNT_NUM: "9" };
    expect(getEasypaisaConfig(env)?.baseUrl).toBe(EASYPAISA_BASE_URLS.sandbox);
    expect(getEasypaisaConfig({ ...env, EASYPAISA_ENV: "production" })?.baseUrl).toBe(EASYPAISA_BASE_URLS.production);
    expect(getEasypaisaConfig({ ...env, EASYPAISA_API_BASE_URL: "https://x.test/rest/" })?.baseUrl).toBe("https://x.test/rest");
  });
});

describe("initiateMaTransaction", () => {
  it("posts the MA payload with a Base64 Credentials header", async () => {
    const f = mockFetch({ responseCode: "0000", transactionId: "T1" });
    const res = await initiateMaTransaction(cfg, { orderId: "BNB-1", amount: 1250, mobileAccountNo: "03001234567", emailAddress: "a@b.pk" }, f);
    expect(res.responseCode).toBe("0000");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe(`${EASYPAISA_BASE_URLS.sandbox}/v4/initiate-ma-transaction`);
    expect((init.headers as Record<string, string>).Credentials).toBe(Buffer.from("merchant:secret").toString("base64"));
    expect(JSON.parse(init.body as string)).toEqual({
      orderId: "BNB-1",
      storeId: "12345",
      transactionAmount: "1250.0",
      transactionType: "MA",
      mobileAccountNo: "03001234567",
      emailAddress: "a@b.pk",
    });
  });
  it("throws EasypaisaError on HTTP errors and non-JSON responses", async () => {
    await expect(initiateMaTransaction(cfg, { orderId: "x", amount: 1, mobileAccountNo: "1", emailAddress: "e" }, mockFetch({ error: 1 }, 500))).rejects.toBeInstanceOf(EasypaisaError);
    const html = vi.fn(async () => new Response("<html>", { status: 200 }));
    await expect(inquireTransaction(cfg, "x", html)).rejects.toThrow(/Unexpected response/);
  });
});

describe("inquireTransaction", () => {
  it("sends orderId, storeId and accountNum", async () => {
    const f = mockFetch({ responseCode: "0000", transactionStatus: "PAID" });
    await inquireTransaction(cfg, "BNB-1", f);
    expect(JSON.parse(f.mock.calls[0][1].body as string)).toEqual({ orderId: "BNB-1", storeId: "12345", accountNum: "654321" });
  });
});

describe("evaluateInquiry (server-side payment verification)", () => {
  const expected = { orderId: "BNB-1", amount: 1250 };
  it("marks PAID only for success code, PAID status, same order and exact amount", () => {
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "PAID", orderId: "BNB-1", transactionAmount: "1250.0" }, expected)).toBe("PAID");
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "paid", transactionAmount: 1250 }, expected)).toBe("PAID");
  });
  it("rejects amount mismatches and foreign order IDs", () => {
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "PAID", orderId: "BNB-1", transactionAmount: 10 }, expected)).toBe("FAILED");
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "PAID", orderId: "OTHER", transactionAmount: 1250 }, expected)).toBe("FAILED");
  });
  it("treats failure statuses as FAILED and anything else as PENDING", () => {
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "FAILED" }, expected)).toBe("FAILED");
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "EXPIRED" }, expected)).toBe("FAILED");
    expect(evaluateInquiry({ responseCode: "0000", transactionStatus: "PENDING" }, expected)).toBe("PENDING");
    expect(evaluateInquiry({ responseCode: "0001", transactionStatus: "PAID", transactionAmount: 1250 }, expected)).toBe("PENDING");
  });
  it("formats amounts with one decimal", () => {
    expect(formatAmount(99)).toBe("99.0");
  });
});
