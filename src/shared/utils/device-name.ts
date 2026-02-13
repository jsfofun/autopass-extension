import browser from "webextension-polyfill";

export function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    let deviceType = "Desktop";
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
        deviceType = "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = "Tablet";
    }

    const browserName = userAgent.match(/(Chrome|Firefox|Safari)\/([\d.]+)/)?.[1] || "Unknown Browser";
    const osName = platform.startsWith("Win")
        ? "Windows"
        : platform.startsWith("Mac")
        ? "macOS"
        : platform.startsWith("Linux")
        ? "Linux"
        : "Unknown OS";

    return {
        name: `${browserName} on ${osName} (${deviceType})`,
        type: deviceType,
        userAgent,
        platform,
    };
}

/** Persists device info to storage. Call on extension init. */
export async function saveDeviceInfo(): Promise<void> {
    await browser.storage.local.set({ deviceInfo: getDeviceInfo() });
}
