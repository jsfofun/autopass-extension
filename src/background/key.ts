let _cachedPem: string | null = null;

/** Fetches server RSA public key from GET {baseUrl}/keys/public. Caches result. */
export async function fetchServerPublicKeyPem(baseUrl = "http://localhost:1212/api"): Promise<string> {
    if (_cachedPem) return _cachedPem;
    const res = await fetch(`${baseUrl}/keys/public`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch server public key");
    const data = (await res.json()) as { public_key: string };
    _cachedPem = data.public_key;
    return _cachedPem;
}
