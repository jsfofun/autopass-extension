import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import browser from "webextension-polyfill";
import { Copy, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { AuthFormSchema } from "@autopass/schemas";

type AuthMode = "login" | "register";
type Step = "form" | "backup-secret";

type AuthPageProps = {
    onSuccess?: (user: { id: string; username: string }) => void;
};

export default function AuthPage({ onSuccess }: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>("login");
    const [step, setStep] = useState<Step>("form");
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pendingSecretKey, setPendingSecretKey] = useState<string | null>(null);
    const [pendingUser, setPendingUser] = useState<{ id: string; username: string } | null>(null);

    const form = useForm({
        resolver: typeboxResolver(AuthFormSchema),
        defaultValues: {
            username: "",
            password: "",
            secretKey: "",
        },
        mode: "onBlur",
    });

    const handleSubmit = form.handleSubmit(async (data) => {
        setError(null);
        setLoading(true);

        try {
            const res = (await browser.runtime.sendMessage({
                action: mode === "login" ? "LOGIN" : "REGISTER",
                username: data.username.trim().toLowerCase(),
                password: data.password,
                ...(data.secretKey?.trim() && { secretKey: data.secretKey.trim() }),
            })) as {
                success?: boolean;
                user?: { id: string; username: string };
                secretKey?: string;
                error?: string;
            };

            if (res?.success && res?.user) {
                if (res.secretKey) {
                    setPendingSecretKey(res.secretKey);
                    setPendingUser(res.user);
                    setStep("backup-secret");
                } else {
                    onSuccess?.(res.user);
                }
                return;
            }
            setError(res?.error ?? "Authorization failed");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authorization failed");
        } finally {
            setLoading(false);
        }
    });

    const handleSecretKeyBackedUp = () => {
        if (pendingUser) {
            setPendingSecretKey(null);
            setPendingUser(null);
            setStep("form");
            onSuccess?.(pendingUser);
        }
    };

    const copySecretKey = async () => {
        if (!pendingSecretKey) return;
        await navigator.clipboard.writeText(pendingSecretKey);
    };

    const switchMode = () => {
        setMode((m) => (m === "login" ? "register" : "login"));
        setError(null);
        form.reset({ username: form.getValues("username"), password: "", secretKey: "" });
    };

    if (step === "backup-secret" && pendingSecretKey) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-amber-500" />
                        Сохраните Secret Key
                    </CardTitle>
                    <CardDescription>
                        Без этого ключа вы <strong>навсегда</strong> потеряете доступ к данным при смене устройства или
                        переустановке. Восстановление пароля отсутствует.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Secret Key</label>
                        <div className="flex gap-2">
                            <Input
                                type={showSecretKey ? "text" : "password"}
                                value={pendingSecretKey}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowSecretKey(!showSecretKey)}
                                title={showSecretKey ? "Скрыть" : "Показать"}
                            >
                                {showSecretKey ? "🙈" : "👁"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={copySecretKey}
                                title="Скопировать"
                            >
                                <Copy className="size-4" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Сохраните в надёжном месте: скриншот, файл или QR. Не храните только в облаке.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSecretKeyBackedUp}>
                        Я сохранил ключ
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const {
        register,
        formState: { errors },
    } = form;

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>{mode === "login" ? "Вход" : "Регистрация"}</CardTitle>
                <CardDescription>
                    {mode === "login"
                        ? "Войдите в AutoPass (zero-knowledge: данные шифруются на устройстве)"
                        : "Создайте учётную запись AutoPass"}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="flex flex-col gap-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
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
                            {...register("username")}
                            disabled={loading}
                            aria-invalid={!!errors.username}
                        />
                        {errors.username && (
                            <p className="text-destructive text-sm" role="alert">
                                {errors.username.message}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-medium">
                            Master Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            placeholder="Минимум 6 символов"
                            {...register("password")}
                            disabled={loading}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && (
                            <p className="text-destructive text-sm" role="alert">
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                    {mode === "login" && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="secretKey" className="text-sm font-medium">
                                Secret Key <span className="text-muted-foreground">(новое устройство)</span>
                            </label>
                            <Input
                                id="secretKey"
                                type="password"
                                placeholder="Вставьте Secret Key, если это новое устройство"
                                {...register("secretKey")}
                                disabled={loading}
                            />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Загрузка…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
                    </Button>
                    <button
                        type="button"
                        className="text-muted-foreground text-sm underline hover:text-foreground"
                        onClick={switchMode}
                    >
                        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                    </button>
                </CardFooter>
            </form>
        </Card>
    );
}
