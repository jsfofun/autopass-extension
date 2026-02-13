import { SERVER_PUBLIC_KEY_PEM } from "../key";

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s+/g, "");
    return Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)).buffer;
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function uint8ArrayToBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr));
}

let _serverPublicKey: CryptoKey | null = null;

/** Lazy-load server public key to avoid top-level await. */
async function getServerPublicKey(): Promise<CryptoKey> {
    if (!_serverPublicKey) {
        _serverPublicKey = await crypto.subtle.importKey(
            "spki",
            pemToArrayBuffer(SERVER_PUBLIC_KEY_PEM),
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"],
        );
    }
    return _serverPublicKey;
}

async function generateAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
    );
}

async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return uint8ArrayToBase64(new Uint8Array(exported));
}

async function generateDeviceKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"],
    );
}

async function generatePublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", publicKey);
    return uint8ArrayToBase64(new Uint8Array(exported));
}

async function encryptAesKeyWithRsa(aesKeyBase64: string, serverPublicKeyPem: string): Promise<string> {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = serverPublicKeyPem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s+/g, "");
    const keyBuffer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
    const publicKey = await crypto.subtle.importKey(
        "spki",
        keyBuffer.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"],
    );
    const plaintext = new TextEncoder().encode(aesKeyBase64);
    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, plaintext);
    return uint8ArrayToBase64(new Uint8Array(encrypted));
}

/** AES-GCM encrypt plaintext, returns base64(iv + ciphertext). */
export async function encryptWithAesGcm(key: CryptoKey, plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        data,
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return uint8ArrayToBase64(combined);
}

/** AES-GCM decrypt base64(iv + ciphertext) to plaintext. */
export async function decryptWithAesGcm(key: CryptoKey, ciphertextBase64: string): Promise<string> {
    const combined = base64ToUint8Array(ciphertextBase64);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        ciphertext,
    );
    return new TextDecoder().decode(decrypted);
}

export const SERVER_PUBLIC_KEY = { get: getServerPublicKey };

export const AES = {
    generateAesKey,
    exportKey,
    generateDeviceKeyPair,
    generatePublicKey,
    encryptAesKeyWithRsa,
    encryptWithAesGcm,
    decryptWithAesGcm,
};
