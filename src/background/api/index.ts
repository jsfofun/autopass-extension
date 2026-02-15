import type { UpsertSaveBody, UsersLoginBody } from "@autopass/schemas";
import type { Save } from "../../shared/types/saves";
import * as aes from "../crypto/aes";
import {
    createVault,
    unlockVault,
    getDek,
    clearCachedDek,
    hasCachedDek,
} from "../crypto/vault-keys";
import {
    setSecretKey,
    getSecretKey,
    clearSecretKey,
    secretKeyToDisplay,
    displayToSecretKey,
} from "../storage/secret-key";
import { RANDOM } from "../crypto/random";

class API {
    #uri: string;
    constructor() {
        this.#uri = "http://localhost:1212/api";
    }

    async xhr<T = unknown>(url: string, body?: object, method?: RequestInit["method"]): Promise<T> {
        const res = await fetch(`${this.#uri}${url}`, {
            method: method ?? "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json();
        if (res.status >= 200 && res.status < 300) return data as T;
        throw Object.assign(new Error((data as { error?: string })?.error ?? "Request failed"), {
            status: res.status,
            ...data,
        });
    }

    /**
     * Register with zero-knowledge vault.
     * Generates Secret Key, creates vault, sends salt + encrypted_dek to server.
     */
    async Register(body: { username: string; password: string; device_info: string }) {
        const secretKey = RANDOM.secretKey();
        const { salt, encryptedDekBase64 } = await createVault(body.password, secretKey);

        await setSecretKey(secretKey);

        const saltB64 = btoa(String.fromCharCode(...salt));
        const payload: UsersLoginBody = {
            ...body,
            salt: saltB64,
            encrypted_dek: encryptedDekBase64,
        };

        const user = await this.xhr<{ id: bigint; username: string }>(
            "/user/register",
            payload,
            "POST"
        );
        return user;
    }

    /**
     * Login: fetch salt + encrypted_dek, derive Master Key, decrypt DEK, cache.
     */
    async Login(body: { username: string; password: string; device_info: string }) {
        const secretKey = await getSecretKey();
        if (!secretKey) {
            throw new Error("Secret Key not found. Add this device with your Secret Key first.");
        }

        const res = await this.xhr<{
            id: bigint;
            username: string;
            salt: string | null;
            encrypted_dek: string | null;
        }>("/user/login", body, "POST");

        if (!res.salt || !res.encrypted_dek) {
            throw new Error("Server did not return vault data. Account may be legacy (re-register).");
        }

        const salt = Uint8Array.from(atob(res.salt), (c) => c.charCodeAt(0));
        await unlockVault(body.password, secretKey, salt, res.encrypted_dek);

        return { id: res.id, username: res.username };
    }

    async Logout() {
        clearCachedDek();
        await this.xhr("/user/logout", undefined, "DELETE");
    }

    /** Add device: store Secret Key locally. Call before Login on new device. */
    async storeSecretKeyForDevice(secretKeyDisplay: string) {
        const sk = displayToSecretKey(secretKeyDisplay);
        return setSecretKey(sk);
    }

    /** Get Secret Key display string (for backup / add device). */
    async getSecretKeyDisplay(): Promise<string | null> {
        const sk = await getSecretKey();
        return sk ? secretKeyToDisplay(sk) : null;
    }

    async UpsertSave(data: UpsertSaveBody) {
        const dek = await getDek();
        const plainFields = JSON.stringify(data.fields);
        const encryptedFields = await aes.encrypt(dek, plainFields);

        const payload = {
            ...data,
            fields: { _encrypted: encryptedFields } as Record<string, string>,
        };
        return this.xhr<Save>("/save", payload, "PUT");
    }

    async getSavesList(): Promise<Save[]> {
        return this.xhr<Save[]>("/save", undefined, "GET");
    }

    /** Decrypt save fields using cached DEK. */
    async decryptSaveFields(encryptedFields: {
        _encrypted?: string;
    }): Promise<Record<string, string>> {
        const enc = encryptedFields._encrypted;
        if (!enc || typeof enc !== "string") return {};
        if (!hasCachedDek()) return {};
        try {
            const dek = await getDek();
            const plain = await aes.decryptToString(dek, enc);
            const parsed = JSON.parse(plain) as Record<string, unknown>;
            const out: Record<string, string> = {};
            for (const [k, v] of Object.entries(parsed)) {
                if (typeof v === "string") out[k] = v;
            }
            return out;
        } catch (err) {
            if (err instanceof DOMException && err.name === "OperationError") {
                console.warn("[AutoPass] Decryption failed — wrong key or corrupt data");
            } else {
                console.warn("[AutoPass] Decryption failed:", err);
            }
            return {};
        }
    }

    /** Clear local Secret Key (e.g. full logout / remove device). */
    async clearSecretKey() {
        clearCachedDek();
        await clearSecretKey();
    }
}

const api = new API();
export default api;
