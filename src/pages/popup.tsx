/**
 * Popup UI — минимальный интерфейс: toggle автозаполнения, счётчик, кнопка «Полный клиент».
 * Не перегружаем: быстрый доступ без задержек.
 */

import { useEffect, useState, useCallback } from "react";
import browser from "webextension-polyfill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
                <p className="text-muted-foreground text-sm">
                    Войдите в полном клиенте для управления паролями.
                </p>
                <Button className="w-full" onClick={handleOpenFullClient}>
                    Открыть полный клиент
                </Button>
            </div>
        );
    }

    const hasSite = !!origin;

    return (
        <div className="flex min-w-[280px] flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground truncate text-sm" title={origin ?? ""}>
                    Автозаполнение
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={autofillOn}
                    aria-disabled={!hasSite}
                    onClick={hasSite ? handleToggleAutofill : undefined}
                    className={cn(
                        "relative inline-flex h-6 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors",
                        "focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        hasSite && "cursor-pointer",
                        !hasSite && "cursor-not-allowed opacity-60",
                        autofillOn ? "bg-primary" : "bg-muted"
                    )}
                >
                    <span
                        className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition",
                            autofillOn ? "translate-x-4" : "translate-x-0.5"
                        )}
                    />
                </button>
            </div>
            <p className="text-muted-foreground text-xs">
                {hasSite ? (
                    <>Вставок на этом сайте: <strong className="text-foreground">{usageCount}</strong></>
                ) : (
                    <>Вставок: <strong className="text-foreground">—</strong> (откройте страницу сайта)</>
                )}
            </p>
            <Button variant="outline" className="w-full" onClick={handleOpenFullClient}>
                Открыть полный клиент
            </Button>
        </div>
    );
}
