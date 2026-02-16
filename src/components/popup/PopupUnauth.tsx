import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

type Props = {
    onOpenFullClient: () => void;
};

export function PopupUnauth({ onOpenFullClient }: Props) {
    return (
        <div className="flex min-w-[280px] flex-col gap-3 p-4">
            <p className="text-muted-foreground text-sm">{m["popup.login_in_full_client"]()}.</p>
            <Button className="w-full" onClick={onOpenFullClient}>
                {m["popup.openFullClient"]()}
            </Button>
        </div>
    );
}
