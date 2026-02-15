/**
 * AES-256-GCM helpers. Each encryption uses a unique nonce/IV.
 */
const IV_LEN = 12;
const TAG_LEN = 16;

function base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function bytesToBase64(b: Uint8Array): string {
    return btoa(String.fromCharCode(...b));
}

/** Imports raw 32-byte key as AES-GCM CryptoKey. */
export async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * AES-256-GCM encrypt. Returns base64(iv || ciphertext).
 * Nonce is always unique (CSPRNG).
 */
export async function encrypt(key: CryptoKey, plaintext: Uint8Array | string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const data =
        typeof plaintext === "string"
            ? new TextEncoder().encode(plaintext)
            : plaintext;
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, tagLength: TAG_LEN * 8 },
        key,
        data
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return bytesToBase64(combined);
}

/**
 * AES-256-GCM decrypt. Input: base64(iv || ciphertext).
 */
export async function decrypt(key: CryptoKey, ciphertextBase64: string): Promise<Uint8Array> {
    const combined = base64ToBytes(ciphertextBase64);
    const iv = combined.slice(0, IV_LEN);
    const ct = combined.slice(IV_LEN);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: TAG_LEN * 8 },
        key,
        ct
    );
    return new Uint8Array(decrypted);
}

/** Decrypt to UTF-8 string. */
export async function decryptToString(
    key: CryptoKey,
    ciphertextBase64: string
): Promise<string> {
    const bytes = await decrypt(key, ciphertextBase64);
    return new TextDecoder().decode(bytes);
}
