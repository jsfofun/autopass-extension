import type { AuthRequest } from "../shared/types/auth-messages";
import type { FormSubmitPayload } from "../shared/types/form-submit";
import { getDeviceInfo } from "../shared/utils/device-name";
import { default as browser } from "webextension-polyfill";
import api from "./api";

const AUTH_STORAGE_KEY = "autopass_auth_user";
const AUTOFILL_STATE_KEY = "autopass_autofill";
const USAGE_COUNT_KEY = "autopass_usage";

function isFormSubmit(msg: unknown): msg is { type: "FORM_SUBMIT"; data: FormSubmitPayload["data"] } {
    return (
        typeof msg === "object" &&
        msg !== null &&
        "type" in msg &&
        (msg as { type: string }).type === "FORM_SUBMIT" &&
        "data" in msg &&
        typeof (msg as { data: unknown }).data === "object"
    );
}

function isAuthRequest(msg: unknown): msg is AuthRequest {
    const m = msg as AuthRequest;
    return (
        typeof msg === "object" &&
        msg !== null &&
        "action" in msg &&
        (m.action === "LOGIN" || m.action === "REGISTER") &&
        typeof m.username === "string" &&
        typeof m.password === "string"
    );
}

browser.runtime.onMessage.addListener((message: unknown, sender: browser.Runtime.MessageSender) => {
    if (isFormSubmit(message) && sender.tab?.url) {
        const tabUrl = sender.tab.url;
        return browser.storage.local.get(AUTH_STORAGE_KEY).then((stored) => {
            if (!stored[AUTH_STORAGE_KEY]) return;
            const { formId, formClass, values, login } = (message as { data: FormSubmitPayload["data"] }).data;
            const pathWithoutQuery = new URL(tabUrl);
            pathWithoutQuery.search = "";
            const payload = {
                website: pathWithoutQuery.toString(),
                hash_data: login,
                form_id: formId ?? "",
                form_classname: formClass ?? "",
                fields: values,
            };

            return api
                .UpsertSave(payload)
                .then(() => undefined)
                .catch((err) => {
                    console.error("[AutoPass] Failed to save form credentials:", err);
                    throw err;
                });
        });
    }

    if (isAuthRequest(message)) {
        const { action, username, password, secretKey } = message;
        const deviceInfo = getDeviceInfo();
        const device_info = deviceInfo.name.slice(0, 256);

        const body = {
            username: username.trim().toLowerCase(),
            password,
            device_info,
        };

        if (action === "LOGIN" && secretKey) {
            return api
                .storeSecretKeyForDevice(secretKey)
                .then(() => api.Login(body))
                .then((user) => {
                    const stored = { id: String(user.id), username: user.username };
                    return browser.storage.local
                        .set({ [AUTH_STORAGE_KEY]: stored })
                        .then(() => ({ success: true, user: stored }));
                })
                .catch((err) => ({
                    success: false,
                    error: err?.message || err?.error || "Authorization failed",
                }));
        }

        if (action === "LOGIN") {
            return api
                .Login(body)
                .then((user) => {
                    const stored = { id: String(user.id), username: user.username };
                    return browser.storage.local
                        .set({ [AUTH_STORAGE_KEY]: stored })
                        .then(() => ({ success: true, user: stored }));
                })
                .catch((err) => ({
                    success: false,
                    error: err?.message || err?.error || "Authorization failed",
                }));
        }

        return api
            .Register(body)
            .then(async (user) => {
                const secretKey = await api.getSecretKeyDisplay();
                const stored = { id: String(user.id), username: user.username };
                await browser.storage.local.set({ [AUTH_STORAGE_KEY]: stored });
                return { success: true, user: stored, secretKey: secretKey ?? undefined };
            })
            .catch((err) => ({
                success: false,
                error: err?.message || err?.error || "Authorization failed",
            }));
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "LOGOUT"
    ) {
        return api
            .Logout()
            .then(() => browser.storage.local.remove(AUTH_STORAGE_KEY))
            .then(() => ({ success: true }))
            .catch(() =>
                browser.storage.local.remove(AUTH_STORAGE_KEY).then(() => ({ success: true }))
            );
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "getAuth"
    ) {
        return browser.storage.local.get(AUTH_STORAGE_KEY).then((stored) => stored[AUTH_STORAGE_KEY] ?? null);
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "getUrl"
    ) {
        // Popup sends this message; sender is popup, not tab. Use active tab URL.
        return browser.tabs
            .query({ active: true, currentWindow: true })
            .then((tabs) => tabs[0]?.url);
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "getCredentialsForOrigin"
    ) {
        const { origin, pageUrl } = message as { action: string; origin: string; pageUrl?: string };
        if (!origin || typeof origin !== "string") return Promise.resolve([]);

        return browser.storage.local
            .get(AUTH_STORAGE_KEY)
            .then((stored) => {
                if (!stored[AUTH_STORAGE_KEY]) return [];
                return api.getSavesList();
            })
            .then(async (saves) => {
                if (!saves || !Array.isArray(saves)) return [];
                const urlNoQuery = pageUrl ? pageUrl.split("?")[0] : null;
                const matching = saves
                    .filter((s) => {
                        if (!s.website) return false;
                        try {
                            return new URL(s.website).origin === origin;
                        } catch {
                            return s.website.startsWith(origin);
                        }
                    })
                    .sort((a, b) => {
                        if (!urlNoQuery) return 0;
                        const aMatch = a.website?.split("?")[0] === urlNoQuery ? 1 : 0;
                        const bMatch = b.website?.split("?")[0] === urlNoQuery ? 1 : 0;
                        return bMatch - aMatch;
                    });
                const result: Array<{ username: string; password: string }> = [];
                for (const save of matching) {
                    const raw = save.fields as {
                        _encrypted?: string;
                        username?: string;
                        password?: string;
                        email?: string;
                        login?: string;
                    };
                    let username = raw.username ?? raw.email ?? raw.login;
                    let password = raw.password;
                    if (!username || !password) {
                        const decrypted = await api.decryptSaveFields(raw);
                        username = decrypted.username ?? decrypted.email ?? decrypted.login;
                        password = decrypted.password;
                    }
                    if (username && password) result.push({ username, password });
                }
                return result;
            })
            .catch((err) => {
                console.error("[AutoPass] Failed to get credentials:", err);
                return [];
            });
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "getAutofillState"
    ) {
        const { origin } = message as { action: string; origin: string };
        if (!origin || typeof origin !== "string") return Promise.resolve(true);
        return browser.storage.local.get(AUTOFILL_STATE_KEY).then((stored) => {
            const map = (stored[AUTOFILL_STATE_KEY] as Record<string, boolean>) ?? {};
            return map[origin] !== false;
        });
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "setAutofillState"
    ) {
        const { origin, enabled } = message as { action: string; origin: string; enabled: boolean };
        if (!origin || typeof origin !== "string") return undefined;
        return browser.storage.local.get(AUTOFILL_STATE_KEY).then((stored) => {
            const map = { ...((stored[AUTOFILL_STATE_KEY] as Record<string, boolean>) ?? {}) };
            map[origin] = enabled;
            return browser.storage.local.set({ [AUTOFILL_STATE_KEY]: map });
        }).then(() => {
            // Уведомить content script активной вкладки, чтобы обновить UI без перезагрузки
            return browser.tabs.query({ active: true, currentWindow: true });
        }).then((tabs) => {
            const tab = tabs[0];
            if (tab?.id != null) {
                browser.tabs.sendMessage(tab.id, { type: "AUTOFILL_STATE_CHANGED", origin, enabled }).catch(() => {});
            }
        });
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "getUsageCount"
    ) {
        const { origin } = message as { action: string; origin: string };
        if (!origin || typeof origin !== "string") return Promise.resolve(0);
        return browser.storage.local.get(USAGE_COUNT_KEY).then((stored) => {
            const map = (stored[USAGE_COUNT_KEY] as Record<string, number>) ?? {};
            return typeof map[origin] === "number" ? map[origin] : 0;
        });
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "incrementUsageCount"
    ) {
        const { origin } = message as { action: string; origin: string };
        if (!origin || typeof origin !== "string") return undefined;
        return browser.storage.local.get(USAGE_COUNT_KEY).then((stored) => {
            const map = { ...((stored[USAGE_COUNT_KEY] as Record<string, number>) ?? {}) };
            map[origin] = (map[origin] ?? 0) + 1;
            return browser.storage.local.set({ [USAGE_COUNT_KEY]: map });
        });
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "openFullClient"
    ) {
        const url = browser.runtime.getURL("dist/options.html");
        return browser.tabs.create({ url }).then(() => ({}));
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "getSavesListDecrypted"
    ) {
        return browser.storage.local.get(AUTH_STORAGE_KEY).then((stored) => {
            if (!stored[AUTH_STORAGE_KEY]) return [];
            return api.getSavesList();
        }).then(async (saves) => {
            if (!saves || !Array.isArray(saves)) return [];
            const result: Array<{ id: string; website: string; username: string; password: string }> = [];
            for (const save of saves) {
                const raw = save.fields as { _encrypted?: string; username?: string; password?: string; email?: string; login?: string };
                let username = raw?.username ?? raw?.email ?? raw?.login ?? "";
                let password = raw?.password ?? "";
                if (!username || !password) {
                    const decrypted = await api.decryptSaveFields(raw ?? {});
                    username = decrypted.username ?? decrypted.email ?? decrypted.login ?? "";
                    password = decrypted.password ?? "";
                }
                result.push({
                    id: String(save.id),
                    website: save.website ?? "",
                    username,
                    password,
                });
            }
            return result;
        }).catch((err) => {
            console.error("[AutoPass] getSavesListDecrypted failed:", err);
            return [];
        });
    }

    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "upsertSaveManual"
    ) {
        const { website, username, password } = message as { action: string; website: string; username: string; password: string };
        if (!website || typeof username !== "string" || typeof password !== "string") {
            return Promise.reject(new Error("website, username, password required"));
        }
        const hash_data = String(Math.abs((website + "\n" + username).split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)));
        const payload = {
            website: website.trim(),
            hash_data,
            form_id: "",
            form_classname: "",
            fields: { username: username.trim(), password },
        };
        return api.UpsertSave(payload).then(() => ({ success: true }));
    }

    return undefined;
});
