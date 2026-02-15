/**
 * Argon2id key derivation for Master Key.
 * Uses Master Password + Secret Key + Salt as per CRYPTO_ARCHITECTURE.md.
 */
import { argon2idAsync } from "@noble/hashes/argon2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

/** Argon2id params: memory 19MB, time 2, parallelism 1 (per doc). */
const ARGON2_MEM_KB = 19_456;
const ARGON2_TIME = 2;
const ARGON2_PARALLELISM = 1;
const MASTER_KEY_LEN = 32;

/**
 * Derives 32-byte Master Key from Master Password + Secret Key + Salt.
 * @param masterPassword - User's master password (UTF-8)
 * @param secretKey - 256-bit Secret Key (32 bytes)
 * @param salt - Random salt (min 8 bytes, typically 16)
 */
export async function deriveMasterKey(
    masterPassword: string,
    secretKey: Uint8Array,
    salt: Uint8Array
): Promise<Uint8Array> {
    const password = concatBytes(utf8ToBytes(masterPassword), secretKey);
    return argon2idAsync(password, salt, {
        t: ARGON2_TIME,
        m: ARGON2_MEM_KB,
        p: ARGON2_PARALLELISM,
        dkLen: MASTER_KEY_LEN,
        maxmem: 2 ** 32 - 1,
    });
}

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
    const total = arrs.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrs) {
        out.set(a, offset);
        offset += a.length;
    }
    return out;
}
