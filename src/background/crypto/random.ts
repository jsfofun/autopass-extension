/**
 * CSPRNG utilities. Uses crypto.getRandomValues only.
 */
export const RANDOM = {
    /** 256-bit (32 bytes) cryptographically secure random bytes. */
    secretKey(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(32));
    },

    /** 128-bit (16 bytes) salt. */
    salt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(16));
    },

    /** 96-bit (12 bytes) IV/nonce for AES-GCM. */
    iv(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(12));
    },
};
