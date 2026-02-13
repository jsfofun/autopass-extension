import type { FormSubmitPayload } from "../shared/types/form-submit";
import browser from "webextension-polyfill";
import { v3 as hash } from "murmurhash";
import {
    isAuthForm,
    parseFormValues,
    createFormFingerprint,
} from "./auth-form-parser";

async function handleFormSubmit(event: Event): Promise<void> {
    if (!(event.target instanceof HTMLFormElement)) return;
    const form = event.target;

    if (!isAuthForm(form)) return;

    const values = parseFormValues(form);
    if (!values.password) return;

    const website = window.location.hostname;
    const formAction = (form.action || window.location.href).split("?")[0];
    const fingerprint = createFormFingerprint(website, formAction, Object.keys(values));
    const loginHash = String(hash(fingerprint));

    await browser.runtime
        .sendMessage({
            type: "FORM_SUBMIT",
            data: {
                url: website,
                formAction,
                formId: form.id || "",
                formClass: form.className || "",
                values,
                login: loginHash,
            },
        } satisfies FormSubmitPayload)
        .catch((err) => console.error("[AutoPass] Failed to send form data:", err));
}

document.addEventListener("submit", handleFormSubmit, true);
