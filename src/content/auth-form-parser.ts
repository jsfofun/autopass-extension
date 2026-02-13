/**
 * Utilities for detecting and parsing authentication forms.
 * Focuses on forms with password fields and normalizes common credential field names.
 */

/** Common name patterns for identity fields (username, email, login). */
const IDENTITY_PATTERNS = [
    /^user(name)?$/i,
    /^email$/i,
    /^login$/i,
    /^account$/i,
    /^e-?mail$/i,
    /^uid$/i,
    /^username$/i,
] as const;

/** Patterns that indicate a password field. */
const PASSWORD_PATTERNS = [/^password$/i, /^passwd$/i, /^pwd$/i, /^pass$/i] as const;

/**
 * Checks if the form contains a password-type input or a field matching password patterns.
 */
export function isAuthForm(form: HTMLFormElement): boolean {
    const inputs = form.querySelectorAll<HTMLInputElement>("input[type='password'], input:not([type])");
    for (const input of Array.from(inputs)) {
        if (input.type === "password") return true;
        const name = (input.getAttribute("name") || input.id || "").toLowerCase().replace(/\s+/g, "");
        if (PASSWORD_PATTERNS.some((p) => p.test(name))) return true;
    }
    return false;
}

/**
 * Normalizes field name to a standard key (username, email, password).
 * Returns original name if no pattern matches.
 */
function normalizeFieldName(name: string): string {
    const lower = name.toLowerCase().replace(/\s+/g, "");
    if (PASSWORD_PATTERNS.some((p) => p.test(lower))) return "password";
    if (IDENTITY_PATTERNS.some((p) => p.test(lower))) return "username";
    return name;
}

/** Field names to skip (CSRF tokens, etc.). */
const SKIP_PATTERNS = [
    /^csrf/i,
    /^token$/i,
    /^_token$/i,
    /^authenticity_token$/i,
    /^next$/i,
    /^redirect/i,
] as const;

function shouldSkipField(name: string): boolean {
    const lower = name.toLowerCase().replace(/\s+/g, "");
    return SKIP_PATTERNS.some((p) => p.test(lower));
}

/**
 * Parses form into key-value pairs, skipping files, hidden inputs, and non-credential fields.
 */
export function parseFormValues(form: HTMLFormElement): Record<string, string> {
    const formData = new FormData(form);
    const raw: Record<string, string> = {};
    formData.forEach((value, key) => {
        if (typeof value === "string" && key && !shouldSkipField(key)) raw[key] = value;
    });

    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        const norm = normalizeFieldName(key);
        if (!value.trim()) continue;
        normalized[norm] = value;
    }
    return normalized;
}

/**
 * Builds a stable fingerprint for the form (website + action + sorted field keys).
 */
export function createFormFingerprint(
    website: string,
    formAction: string,
    fieldKeys: string[],
): string {
    const sorted = [...fieldKeys].sort();
    return `${website}|${formAction}|${sorted.join(",")}`;
}
