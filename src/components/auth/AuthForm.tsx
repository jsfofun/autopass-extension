import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { AuthFormSchema } from "@autopass/schemas";
import { m } from "@/paraglide/messages";

export type AuthMode = "login" | "register";

type AuthFormProps = {
    mode: AuthMode;
    loading: boolean;
    error: string | null;
    onSubmit: (data: { username: string; password: string; secretKey?: string }) => Promise<void>;
    onSwitchMode: () => void;
};

export function AuthForm({ mode, loading, error, onSubmit, onSwitchMode }: AuthFormProps) {
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
        await onSubmit({
            username: data.username.trim().toLowerCase(),
            password: data.password,
            ...(data.secretKey?.trim() && { secretKey: data.secretKey.trim() }),
        });
    });

    const { register, formState: { errors } } = form;

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>{mode === "login" ? m["auth.titleLogin"]() : m["auth.titleRegister"]()}</CardTitle>
                <CardDescription>
                    {mode === "login" ? m["auth.descriptionLogin"]() : m["auth.descriptionRegister"]()}
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
                            {m["auth.username"]()}
                        </label>
                        <Input
                            id="username"
                            type="text"
                            autoComplete="username"
                            placeholder={m["auth.usernamePlaceholder"]()}
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
                            {m["auth.masterPassword"]()}
                        </label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            placeholder={m["auth.passwordPlaceholder"]()}
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
                                {m["auth.secretKey"]()} <span className="text-muted-foreground">{m["auth.secretKeyNewDevice"]()}</span>
                            </label>
                            <Input
                                id="secretKey"
                                type="password"
                                placeholder={m["auth.secretKeyPlaceholder"]()}
                                {...register("secretKey")}
                                disabled={loading}
                            />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? m["auth.loading"]() : mode === "login" ? m["auth.submitLogin"]() : m["auth.submitRegister"]()}
                    </Button>
                    <button
                        type="button"
                        className="text-muted-foreground text-sm underline hover:text-foreground"
                        onClick={onSwitchMode}
                    >
                        {mode === "login" ? m["auth.switchToRegister"]() : m["auth.switchToLogin"]()}
                    </button>
                </CardFooter>
            </form>
        </Card>
    );
}
