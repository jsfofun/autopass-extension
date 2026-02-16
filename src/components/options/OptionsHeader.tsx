import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { m } from "@/paraglide/messages";

type Props = {
    username: string;
    onLogout: () => void;
};

export function OptionsHeader({ username, onLogout }: Props) {
    return (
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold">{m["main.title"]()}</h1>
                <p className="text-muted-foreground text-sm">
                    {m["main.loginAs"]({ username })}
                </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut data-icon="inline-start" />
                {m["auth.logout"]()}
            </Button>
        </header>
    );
}
