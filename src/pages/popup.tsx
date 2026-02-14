import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import App from "../App";
import AuthPage from "./auth";
import { Button } from "@/components/ui/button";

type AuthUser = { id: string; username: string } | null;

export default function PopupPage() {
    const [user, setUser] = useState<AuthUser | undefined>(undefined);

    useEffect(() => {
        browser.runtime
            .sendMessage({ action: "getAuth" })
            .then((u: unknown) => setUser((u as AuthUser) ?? null));
    }, []);

    const handleLogout = async () => {
        await browser.runtime.sendMessage({ action: "LOGOUT" });
        setUser(null);
    };

    const handleAuthSuccess = (u: { id: string; username: string }) => {
        setUser(u);
    };

    if (user === undefined) {
        return (
            <div className="flex min-h-[200px] items-center justify-center p-4">
                <span className="text-muted-foreground text-sm">Загрузка…</span>
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="flex min-h-[200px] items-center justify-center p-4">
                <AuthPage onSuccess={handleAuthSuccess} />
            </div>
        );
    }

    return (
        <div className="flex min-w-[300px] flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                    Вход как <strong className="text-foreground">{user.username}</strong>
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Выйти
                </Button>
            </div>
            <App />
        </div>
    );
}
