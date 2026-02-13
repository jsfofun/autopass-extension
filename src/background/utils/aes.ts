import { SERVER_PUBLIC_KEY_PEM } from "../key";

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s+/g, "");
    return Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)).buffer;
}

// 2. Импорт серверного ключа (выполнить один раз при инициализации)
export const SERVER_PUBLIC_KEY = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(SERVER_PUBLIC_KEY_PEM), // PEM-формат
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
);
async function generateAesKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM", // Алгоритм
            length: 256, // 256 бит
        },
        true, // Можно экспортировать
        ["encrypt", "decrypt"], // Права ключа
    );
}

async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function generateDeviceKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true, // extractable
        ["deriveKey"],
    );
}

async function generatePublicKey(publicKey: CryptoKey) {
    const exportedKey = await crypto.subtle.exportKey("raw", publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

    return publicKeyBase64;
}
async function encryptAesKeyWithRsa(aesKeyBase64: string, serverPublicKey: string): Promise<string> {
    const publicKey = await crypto.subtle.importKey(
        "spki",
        Buffer.from(serverPublicKey, "base64"),
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"],
    );

    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, Buffer.from(aesKeyBase64, "utf8"));

    return Buffer.from(encrypted).toString("base64");
}

export const AES = {
    generateAesKey,
    exportKey,
    generateDeviceKeyPair,
    generatePublicKey,
    encryptAesKeyWithRsa,
};
