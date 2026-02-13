import type { FormSubmitPayload } from "../shared/types/form-submit";
import { default as browser } from "webextension-polyfill";
import api from "./api";

function isFormSubmit(
    msg: unknown,
): msg is { type: "FORM_SUBMIT"; data: FormSubmitPayload["data"] } {
    return (
        typeof msg === "object" &&
        msg !== null &&
        "type" in msg &&
        (msg as { type: string }).type === "FORM_SUBMIT" &&
        "data" in msg &&
        typeof (msg as { data: unknown }).data === "object"
    );
}

browser.runtime.onMessage.addListener(
    (message: unknown, sender: browser.Runtime.MessageSender) => {
        if (isFormSubmit(message)) {
            const { url, formId, formClass, values, login } = message.data;

            const payload = {
                website: url,
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
    },
);
