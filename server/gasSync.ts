/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DEFAULT_GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxhbrnIQMIFHpZGXxq2Q2xnPJLPQtnCpDbDXFIOBPeWo6vulj2jEiWWrVlonr6dHa_M/exec";
const DEFAULT_GAS_BILLING_URL =
  "https://script.google.com/macros/s/AKfycbwnTipPI0OqpJdmgJa5q7ZgPit0jyIVvxFamdbC8pTVpYslchy2vfoOYdD_Po-8QsAE/exec";

function sanitizeGasUrl(raw: string | undefined, fallback: string): string {
  const trimmed = (raw || "").trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return fallback;

  // Handle markdown-formatted links injected via secrets/env like "[https://...](https://...)"
  const mdMatch = trimmed.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  const candidate = mdMatch ? mdMatch[1].trim() : trimmed;

  const urlMatch = candidate.match(/https?:\/\/[^\s)\]"'<>]+/i);
  const extracted = urlMatch ? urlMatch[0] : candidate;

  try {
    const parsed = new URL(extracted);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    // Fall back to verified default URL
  }
  return fallback;
}

export const GAS_WEB_APP_URL = sanitizeGasUrl(process.env.VITE_GAS_WEB_APP_URL, DEFAULT_GAS_WEB_APP_URL);
export const GAS_BILLING_URL = sanitizeGasUrl(process.env.VITE_GAS_BILLING_URL, DEFAULT_GAS_BILLING_URL);

export interface GasSyncResult {
  sheetSynced: boolean;
  sheetMessage: string;
  gasResponse?: any;
}

export async function syncPayloadToGAS(
  payload: Record<string, any>,
  options: { target?: "main" | "billing"; queryAction?: string; sheetTab?: string } = {}
): Promise<GasSyncResult> {
  const baseUrl = options.target === "billing" ? GAS_BILLING_URL : GAS_WEB_APP_URL;
  const params = new URLSearchParams();
  if (options.queryAction) params.set("action", options.queryAction);
  if (options.sheetTab) {
    params.set("sheet", options.sheetTab);
    params.set("tab", options.sheetTab);
  }
  const targetUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const gasRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await gasRes.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 200) };
    }

    const ok = gasRes.ok && (parsed?.success !== false);
    return {
      sheetSynced: ok,
      sheetMessage: parsed?.message || (ok ? "Synced to Google Sheets" : parsed?.error || `HTTP ${gasRes.status}`),
      gasResponse: parsed
    };
  } catch (err: any) {
    return {
      sheetSynced: false,
      sheetMessage: err?.message || "Google Sheets unreachable (saved locally)"
    };
  }
}
