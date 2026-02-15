/**
 * Vault key derivation and DEK management.
 * Master Key = Argon2id(Master Password + Secret Key, Salt)
 * DEK = encrypted by Master Key, used to encrypt vault entries.
 */
import * as aes from "./aes";
import { deriveMasterKey } from "./argon2";
import { RANDOM } from "./random";

/** In-memory DEK cache. Cleared on unlock failure or logout. */
let cachedDek: CryptoKey | null = null;

export function hasCachedDek(): boolean {
    return cachedDek !== null;
}

export function clearCachedDek(): void {
    cachedDek = null;
}

/**
 * Unlock vault: derive Master Key, decrypt DEK, cache it.
 * Call after successful login when we have masterPassword, secretKey, salt, encryptedDek.
 */
export async function unlockVault(
    masterPassword: string,
    secretKey: Uint8Array,
    salt: Uint8Array,
    encryptedDekBase64: string
): Promise<void> {
    const masterKey = await deriveMasterKey(masterPassword, secretKey, salt);
    const masterKeyCrypto = await aes.importAesKey(masterKey);
    const dekRaw = await aes.decrypt(masterKeyCrypto, encryptedDekBase64);
    if (dekRaw.length !== 32) throw new Error("Invalid encrypted DEK");
    cachedDek = await aes.importAesKey(dekRaw);
}

/**
 * Create new vault: generate Salt, DEK, derive Master Key, encrypt DEK.
 * Returns { salt, encryptedDek } to send to server.
 * Caller must store Secret Key separately.
 */
export async function createVault(
    masterPassword: string,
    secretKey: Uint8Array
): Promise<{ salt: Uint8Array; encryptedDekBase64: string }> {
    const salt = RANDOM.salt();
    const dekRaw = RANDOM.secretKey();
    const dek = await aes.importAesKey(dekRaw);
    const masterKey = await deriveMasterKey(masterPassword, secretKey, salt);
    const masterKeyCrypto = await aes.importAesKey(masterKey);
    const encryptedDekBase64 = await aes.encrypt(masterKeyCrypto, dekRaw);
    cachedDek = dek;
    return { salt, encryptedDekBase64 };
}

/**
 * Get cached DEK for encrypt/decrypt. Throws if not unlocked.
 */
export async function getDek(): Promise<CryptoKey> {
    if (!cachedDek) throw new Error("Vault not unlocked. Log in first.");
    return cachedDek;
}
