/**
 * Popup UI — минимальный интерфейс: toggle автозаполнения, счётчик, кнопка «Полный клиент».
 * Не перегружаем: быстрый доступ без задержек.
 */
import { useEffect, useState, useCallback } from "react";
import browser from "webextension-polyfill";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { m } from "@/paraglide/messages";

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
        return (
            <div className="flex min-h-[140px] min-w-[280px] items-center justify-center p-4">
                <span className="text-muted-foreground text-sm">Загрузка…</span>
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="flex min-w-[280px] flex-col gap-3 p-4">
                <p className="text-muted-foreground text-sm">{m["popup.login_in_full_client"]()}.</p>
                <Button className="w-full" onClick={handleOpenFullClient}>
                    {m["popup.openFullClient"]()}
                </Button>
            </div>
        );
    }

    const hasSite = !!origin;

    return (
        <div className="flex min-w-[280px] flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground truncate text-sm" title={origin ?? ""}>
                    {m["popup.autofill"]()}
                </span>
                <Switch checked={autofillOn} onCheckedChange={handleToggleAutofill} disabled={!hasSite} />
            </div>
            <p className="text-muted-foreground text-xs">
                {m["popup.insertions_count"]({ count: <strong className="text-foreground">{usageCount}</strong> })}
            </p>
            <Button variant="outline" className="w-full" onClick={handleOpenFullClient}>
                {m["popup.openFullClient"]()}
            </Button>
        </div>
    );
}
