/**
 * Heuristics layer — pure functions for form detection.
 * No browser extension APIs. No cryptography. Only DOM analysis.
 */

const USERNAME_NAME_PATTERNS = [/user/i, /email/i, /login/i] as const;

function matchesUsernameNameOrId(input: HTMLInputElement): boolean {
    const s = `${input.name ?? ""} ${input.id ?? ""}`.toLowerCase();
    return USERNAME_NAME_PATTERNS.some((p) => p.test(s));
}

/**
 * True if input is visible, not disabled, not readonly.
 */
export function isVisibleInput(el: HTMLInputElement): boolean {
    if (el.type === "hidden") return false;
    if (el.disabled) return false;
    if (el.readOnly) return false;
    if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (parseFloat(style.opacity) === 0) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    return true;
}

/**
 * Returns scope: form if exists, else document.
 */
function getScope(passwordInput: HTMLInputElement): Element | Document {
    const form = passwordInput.closest("form");
    return form ?? document;
}

/**
 * Count of visible password inputs in scope.
 */
export function countPasswordInputs(scope: Element | Document): number {
    const inputs = scope.querySelectorAll<HTMLInputElement>('input[type="password"]');
    return Array.from(inputs).filter(isVisibleInput).length;
}

/**
 * Deterministic username lookup. Priority order:
 * 1. autocomplete="username"
 * 2. type="email"
 * 3. input in same form with name/id: user, email, login
 */
export function findUsernameForPassword(passwordInput: HTMLInputElement): HTMLInputElement | null {
    const scope = getScope(passwordInput);

    if (countPasswordInputs(scope) >= 2) {
        return null;
    }

    const candidates = scope.querySelectorAll<HTMLInputElement>(
        'input[type="email"], input[type="text"], input:not([type])',
    );

    const visible = Array.from(candidates).filter(isVisibleInput);
    if (visible.length === 0) return null;

    const byAutocomplete = visible.find((el) =>
        el.getAttribute("autocomplete")?.toLowerCase().includes("username"),
    );
    if (byAutocomplete) return byAutocomplete;

    const byEmailType = visible.find((el) => el.type === "email");
    if (byEmailType) return byEmailType;

    const byNameOrId = visible.find(matchesUsernameNameOrId);
    if (byNameOrId) return byNameOrId;

    return null;
}

/**
 * All visible, non-disabled, non-readonly password inputs in doc.
 */
export function findPasswordInputs(doc: Document): HTMLInputElement[] {
    const inputs = doc.querySelectorAll<HTMLInputElement>('input[type="password"]');
    return Array.from(inputs).filter(isVisibleInput);
}
