/**
 * Secret Key storage. Per CRYPTO_ARCHITECTURE.md:
 * - Never stored on server
 * - Stored on device in browser extension storage (session or local)
 */
import browser from "webextension-polyfill";

const STORAGE_KEY = "autopass_secret_key";

/** Base64-encode 32 bytes to URL-safe string (no padding for display). */
export function secretKeyToDisplay(sk: Uint8Array): string {
    const b64 = btoa(String.fromCharCode(...sk));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Parse display format or standard base64 back to bytes. */
export function displayToSecretKey(display: string): Uint8Array {
    const b64 = display.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

/** Check if Secret Key exists in storage. */
export async function hasSecretKey(): Promise<boolean> {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    return typeof stored[STORAGE_KEY] === "string";
}

/** Get Secret Key from storage. Returns null if missing. */
export async function getSecretKey(): Promise<Uint8Array | null> {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    const raw = stored[STORAGE_KEY] as string | undefined;
    if (!raw) return null;
    try {
        return displayToSecretKey(raw);
    } catch {
        return null;
    }
}

/** Store Secret Key. Overwrites existing. */
export async function setSecretKey(sk: Uint8Array): Promise<void> {
    await browser.storage.local.set({
        [STORAGE_KEY]: secretKeyToDisplay(sk),
    });
}

/** Remove Secret Key (e.g. on logout). */
export async function clearSecretKey(): Promise<void> {
    await browser.storage.local.remove(STORAGE_KEY);
}
