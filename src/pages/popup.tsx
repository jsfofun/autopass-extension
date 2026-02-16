import { useEffect, useState, useCallback } from "react";
import browser from "webextension-polyfill";
import { PopupLoading } from "@/components/popup/PopupLoading";
import { PopupUnauth } from "@/components/popup/PopupUnauth";
import { PopupMain } from "@/components/popup/PopupMain";

type AuthUser = { id: string; username: string } | null;

function getOriginFromUrl(url: string | undefined): string | null {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.protocol !== "http:" && u.protocol !== "https:") return null;
        return u.origin;
    } catch {
        return null;
    }
}

export default function PopupPage() {
    const [user, setUser] = useState<AuthUser | undefined>(undefined);
    const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);
    const [autofillOn, setAutofillOn] = useState<boolean>(true);
    const [usageCount, setUsageCount] = useState<number>(0);

    const origin = getOriginFromUrl(currentUrl);

    const loadTabAndState = useCallback(async () => {
        const [authRes, urlRes] = await Promise.all([
            browser.runtime.sendMessage({ action: "getAuth" }) as Promise<AuthUser>,
            browser.runtime.sendMessage({ action: "getUrl" }) as Promise<string | undefined>,
        ]);
        setUser(authRes ?? null);
        setCurrentUrl(urlRes ?? undefined);

        const o = getOriginFromUrl(urlRes);
        if (o) {
            const [on, count] = await Promise.all([
                browser.runtime.sendMessage({ action: "getAutofillState", origin: o }) as Promise<boolean>,
                browser.runtime.sendMessage({ action: "getUsageCount", origin: o }) as Promise<number>,
            ]);
            setAutofillOn(on);
            setUsageCount(typeof count === "number" ? count : 0);
        }
    }, []);

    useEffect(() => {
        loadTabAndState();
    }, [loadTabAndState]);

    const handleToggleAutofill = async () => {
        if (!origin) return;
        const next = !autofillOn;
        setAutofillOn(next);
        await browser.runtime.sendMessage({ action: "setAutofillState", origin, enabled: next });
    };

    const handleOpenFullClient = () => {
        browser.runtime.sendMessage({ action: "openFullClient" });
        window.close();
    };

    if (user === undefined) {
        return <PopupLoading />;
    }

    if (user === null) {
        return <PopupUnauth onOpenFullClient={handleOpenFullClient} />;
    }

    return (
        <PopupMain
            origin={origin}
            autofillOn={autofillOn}
            usageCount={usageCount}
            onToggleAutofill={handleToggleAutofill}
            onOpenFullClient={handleOpenFullClient}
        />
    );
}
