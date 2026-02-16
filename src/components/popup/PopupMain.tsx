import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { m } from "@/paraglide/messages";

type Props = {
    origin: string | null;
    autofillOn: boolean;
    usageCount: number;
    onToggleAutofill: () => void;
    onOpenFullClient: () => void;
};

export function PopupMain({
    origin,
    autofillOn,
    usageCount,
    onToggleAutofill,
    onOpenFullClient,
}: Props) {
    const hasSite = !!origin;

    return (
        <div className="flex min-w-[280px] flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground truncate text-sm" title={origin ?? ""}>
                    {m["popup.autofill"]()}
                </span>
                <Switch checked={autofillOn} onCheckedChange={onToggleAutofill} disabled={!hasSite} />
            </div>
            <p className="text-muted-foreground text-xs">
                {m["popup.insertions_count"]({ count: <strong className="text-foreground">{usageCount}</strong> })}
            </p>
            <Button variant="outline" className="w-full" onClick={onOpenFullClient}>
                {m["popup.openFullClient"]()}
            </Button>
        </div>
    );
}
