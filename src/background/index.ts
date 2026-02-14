import type { AuthRequest } from "../shared/types/auth-messages";
import type { FormSubmitPayload } from "../shared/types/form-submit";
import { getDeviceInfo } from "../shared/utils/device-name";
import { default as browser } from "webextension-polyfill";
import api from "./api";

const AUTH_STORAGE_KEY = "autopass_auth_user";

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
    return (
        typeof msg === "object" &&
        msg !== null &&
        "action" in msg &&
        ((msg as AuthRequest).action === "LOGIN" || (msg as AuthRequest).action === "REGISTER") &&
        typeof (msg as AuthRequest).username === "string" &&
        typeof (msg as AuthRequest).password === "string"
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
        const { action, username, password } = message;
        const deviceInfo = getDeviceInfo();
        const device_info = deviceInfo.name.slice(0, 256);

        const body = {
            username: username.trim().toLowerCase(),
            password,
            device_info,
            public_key: "",
        };

        const req = action === "LOGIN" ? api.Login(body) : api.Register(body);

        return req
            .then((user: unknown) => {
                const u = user as { id: bigint; username: string };
                const stored = { id: String(u.id), username: u.username };
                return browser.storage.local.set({ [AUTH_STORAGE_KEY]: stored }).then(() => stored);
            })
            .then((stored) => ({ success: true, user: stored }))
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
            .catch(() => browser.storage.local.remove(AUTH_STORAGE_KEY).then(() => ({ success: true })));
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
        return Promise.resolve(sender.tab?.url);
    }

    return undefined;
});
