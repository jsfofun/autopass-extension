import { m } from "@/paraglide/messages";

export function PopupLoading() {
    return (
        <div className="flex min-h-[140px] min-w-[280px] items-center justify-center p-4">
            <span className="text-muted-foreground text-sm">{m["common.loading"]()}</span>
        </div>
    );
}
