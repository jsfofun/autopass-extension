/**
 * Content script — DOM analysis, value injection, form submit interception.
 * No cryptography. No storage. Communicates with background via messages.
 */

import type { FormSubmitPayload } from "../shared/types/form-submit";
import browser from "webextension-polyfill";
import { v3 as hash } from "murmurhash";
import {
    findPasswordInputs,
    findUsernameForPassword,
    countPasswordInputs,
} from "./heuristics";
import {
    isAuthForm,
    parseFormValues,
    createFormFingerprint,
} from "./auth-form-parser";
import { attachAutofillButton, removeAllAutofillButtons } from "./autofill-button";

const SCAN_DEBOUNCE_MS = 150;

type Credential = { username: string; password: string };

function injectValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function getCredentials(): Promise<Credential[]> {
    const origin = location.origin;
    const pageUrl = location.href;
    const list = (await browser.runtime
        .sendMessage({ action: "getCredentialsForOrigin", origin, pageUrl })
        .catch(() => [])) as Credential[];
    return Array.isArray(list) ? list : [];
}

function reportUsage(): void {
    browser.runtime.sendMessage({ action: "incrementUsageCount", origin: location.origin }).catch(() => {});
}

function processPair(passwordInput: HTMLInputElement, usernameInput: HTMLInputElement): void {
    attachAutofillButton(usernameInput, { username: usernameInput, password: passwordInput }, getCredentials, injectValue, reportUsage);
    attachAutofillButton(passwordInput, { username: usernameInput, password: passwordInput }, getCredentials, injectValue, reportUsage);
}

async function scanForLoginCandidates(): Promise<void> {
    const enabled = (await browser.runtime.sendMessage({ action: "getAutofillState", origin: location.origin }).catch(() => true)) as boolean;
    if (!enabled) return;

    const passwordInputs = findPasswordInputs(document);

    for (const passwordInput of passwordInputs) {
        const usernameInput = findUsernameForPassword(passwordInput);
        if (!usernameInput) continue;

        processPair(passwordInput, usernameInput);

        const credentials = await getCredentials();
        if (credentials.length === 0) continue;
        const c = credentials[0];
        if (!c.username || !c.password) continue;

        const usernameEmpty = usernameInput.value.trim() === "";
        const passwordEmpty = passwordInput.value === "";
        if (usernameEmpty && passwordEmpty) {
            injectValue(usernameInput, c.username);
            injectValue(passwordInput, c.password);
            reportUsage();
        }
    }
}

function debounce(fn: () => void, ms: number): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn();
        }, ms);
    };
}

const debouncedScan = debounce(scanForLoginCandidates, SCAN_DEBOUNCE_MS);

function handleSubmit(event: Event): void {
    if (!(event.target instanceof HTMLFormElement)) return;
    const form = event.target;

    if (!isAuthForm(form)) return;

    const values = parseFormValues(form);
    if (!values.password) return;

    if (countPasswordInputs(form) >= 2) return;

    const website = window.location.hostname;
    const formAction = (form.action || window.location.href).split("?")[0];
    const fingerprint = createFormFingerprint(website, formAction, Object.keys(values));
    const loginHash = String(hash(fingerprint));

    browser.runtime
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

document.addEventListener("submit", handleSubmit, true);

browser.runtime.onMessage.addListener((msg: unknown) => {
    const m = msg as { type?: string; origin?: string; enabled?: boolean };
    if (m?.type !== "AUTOFILL_STATE_CHANGED" || m.origin !== location.origin) return;
    if (m.enabled) {
        debouncedScan();
    } else {
        removeAllAutofillButtons();
    }
});

function startScanner(): void {
    scanForLoginCandidates();
    setTimeout(scanForLoginCandidates, 400);

    const observer = new MutationObserver(() => {
        debouncedScan();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startScanner);
} else if (document.body) {
    startScanner();
} else {
    document.addEventListener("DOMContentLoaded", startScanner);
}
