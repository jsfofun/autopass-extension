const encrypt = async (password: string, text: string): Promise<string> => {
    // Преобразуем пароль в ключ
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveKey"]);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-CTR", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const data = encoder.encode(text);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-CTR",
            counter: iv,
            length: 64,
        },
        key,
        data,
    );

    return [
        [...salt].map((b) => b.toString(16).padStart(2, "0")).join(""),
        [...iv].map((b) => b.toString(16).padStart(2, "0")).join(""),
        [...new Uint8Array(encrypted)].map((b) => b.toString(16).padStart(2, "0")).join(""),
    ].join("");
};

const decrypt = async (password: string, ciphertext: string): Promise<string> => {
    // Извлекаем salt, iv и encrypted data
    const salt = new Uint8Array(
        ciphertext
            .substring(0, 32)
            .match(/.{2}/g)!
            .map((byte) => parseInt(byte, 16)),
    );

    const iv = new Uint8Array(
        ciphertext
            .substring(32, 64)
            .match(/.{2}/g)!
            .map((byte) => parseInt(byte, 16)),
    );

    const encryptedData = new Uint8Array(
        ciphertext
            .substring(64)
            .match(/.{2}/g)!
            .map((byte) => parseInt(byte, 16)),
    );

    // Преобразуем пароль в ключ
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveKey"]);

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-CTR", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-CTR",
            counter: iv,
            length: 64,
        },
        key,
        encryptedData,
    );

    return new TextDecoder().decode(decrypted);
};

const Hash = { encrypt, decrypt };

export default Hash;
