import { useState } from "react";
import browser from "webextension-polyfill";
import { AuthForm, type AuthMode } from "@/components/auth/AuthForm";
import { AuthSecretKeyBackup } from "@/components/auth/AuthSecretKeyBackup";
import { m } from "@/paraglide/messages";

type Step = "form" | "backup-secret";

type AuthPageProps = {
    onSuccess?: (user: { id: string; username: string }) => void;
};

export default function AuthPage({ onSuccess }: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>("login");
    const [step, setStep] = useState<Step>("form");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pendingSecretKey, setPendingSecretKey] = useState<string | null>(null);
    const [pendingUser, setPendingUser] = useState<{ id: string; username: string } | null>(null);

    const handleSubmit = async (data: { username: string; password: string; secretKey?: string }) => {
        setError(null);
        setLoading(true);
        try {
            const res = (await browser.runtime.sendMessage({
                action: mode === "login" ? "LOGIN" : "REGISTER",
                username: data.username,
                password: data.password,
                ...(data.secretKey && { secretKey: data.secretKey }),
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
            setError(res?.error ?? m["auth.authFailed"]());
        } catch (err) {
            setError(err instanceof Error ? err.message : m["auth.authFailed"]());
        } finally {
            setLoading(false);
        }
    };

    const handleSecretKeyBackedUp = () => {
        if (pendingUser) {
            setPendingSecretKey(null);
            setPendingUser(null);
            setStep("form");
            onSuccess?.(pendingUser);
        }
    };

    const handleSwitchMode = () => {
        setMode((m) => (m === "login" ? "register" : "login"));
        setError(null);
    };

    if (step === "backup-secret" && pendingSecretKey) {
        return (
            <AuthSecretKeyBackup secretKey={pendingSecretKey} onBackedUp={handleSecretKeyBackedUp} />
        );
    }

    return (
        <AuthForm
            key={mode}
            mode={mode}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onSwitchMode={handleSwitchMode}
        />
    );
}
