import browser from "webextension-polyfill";
import { AES } from "./aes";

const STORAGE_KEY = "autopass_credential_aes_key";

/**
 * Returns the credential encryption key. Generates and persists one if missing.
 */
export async function getOrCreateCredentialKey(): Promise<CryptoKey> {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    const raw = stored[STORAGE_KEY] as string | undefined;

    if (raw) {
        const binary = atob(raw);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    }

    const key = await AES.generateAesKey();
    const exported = await crypto.subtle.exportKey("raw", key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    await browser.storage.local.set({ [STORAGE_KEY]: base64 });
    return key;
}
