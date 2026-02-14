import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import browser from "webextension-polyfill";

type AuthMode = "login" | "register";

type AuthPageProps = {
    onSuccess?: (user: { id: string; username: string }) => void;
};

export default function AuthPage({ onSuccess }: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = (await browser.runtime.sendMessage({
                action: mode === "login" ? "LOGIN" : "REGISTER",
                username: username.trim().toLowerCase(),
                password,
            })) as { success?: boolean; user?: { id: string; username: string }; error?: string };

            if (res?.success && res?.user) {
                onSuccess?.(res.user);
                return;
            }
            setError(res?.error ?? "Authorization failed");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authorization failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>{mode === "login" ? "Вход" : "Регистрация"}</CardTitle>
                <CardDescription>
                    {mode === "login"
                        ? "Войдите в AutoPass для синхронизации паролей"
                        : "Создайте учётную запись AutoPass"}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="flex flex-col gap-4">
                    {error && (
                        <div
                            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="username" className="text-sm font-medium">
                            Имя пользователя
                        </label>
                        <Input
                            id="username"
                            type="text"
                            autoComplete="username"
                            placeholder="a-z, 0-9, _, - (3–31 символов)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={31}
                            pattern="^[-a-z0-9_]+$"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-medium">
                            Пароль
                        </label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            placeholder="Минимум 6 символов"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            maxLength={256}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Загрузка…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
                    </Button>
                    <button
                        type="button"
                        className="text-muted-foreground text-sm underline hover:text-foreground"
                        onClick={() => {
                            setMode(mode === "login" ? "register" : "login");
                            setError(null);
                        }}
                    >
                        {mode === "login"
                            ? "Нет аккаунта? Зарегистрироваться"
                            : "Уже есть аккаунт? Войти"}
                    </button>
                </CardFooter>
            </form>
        </Card>
    );
}
