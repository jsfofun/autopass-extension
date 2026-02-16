import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { m } from "@/paraglide/messages";

type Props = {
    secretKey: string;
    onBackedUp: () => void;
};

export function AuthSecretKeyBackup({ secretKey, onBackedUp }: Props) {
    const [showSecretKey, setShowSecretKey] = useState(false);

    const copySecretKey = async () => {
        await navigator.clipboard.writeText(secretKey);
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-500" />
                    {m["auth.saveSecretTitle"]()}
                </CardTitle>
                <CardDescription>
                    {m["auth.saveSecretDescription"]()}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{m["auth.secretKey"]()}</label>
                    <div className="flex gap-2">
                        <Input
                            type={showSecretKey ? "text" : "password"}
                            value={secretKey}
                            readOnly
                            className="font-mono text-sm"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowSecretKey(!showSecretKey)}
                            title={showSecretKey ? m["common.hide"]() : m["common.show"]()}
                        >
                            {showSecretKey ? "🙈" : "👁"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={copySecretKey}
                            title={m["common.copy"]()}
                        >
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-muted-foreground text-xs">
                    {m["auth.saveSecretHint"]()}
                </p>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={onBackedUp}>
                    {m["auth.iSavedKey"]()}
                </Button>
            </CardFooter>
        </Card>
    );
}
