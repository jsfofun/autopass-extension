import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { m } from "@/paraglide/messages";

type FormState = { website: string; username: string; password: string };

type Props = {
    form: FormState;
    adding: boolean;
    onFormChange: (next: FormState) => void;
    onSubmit: (e: React.FormEvent) => void;
};

export function AddPasswordCard({ form, adding, onFormChange, onSubmit }: Props) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>{m["main.add_password"]()}</CardTitle>
                <CardDescription>{m["main.add_password_description"]()}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-muted-foreground text-xs">{m["main.domain_example"]()}</label>
                        <Input
                            placeholder="https://example.com"
                            value={form.website}
                            onChange={(e) => onFormChange({ ...form, website: e.target.value })}
                            required
                        />
                    </div>
                    <div className="w-full space-y-1 sm:w-40">
                        <label className="text-muted-foreground text-xs">{m["auth.username"]()}</label>
                        <Input
                            placeholder="user"
                            value={form.username}
                            onChange={(e) => onFormChange({ ...form, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="w-full space-y-1 sm:w-40">
                        <label className="text-muted-foreground text-xs">{m["auth.password"]()}</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => onFormChange({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={adding}>
                        <Plus data-icon="inline-start" />
                        {m["main.add_password_button"]()}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
