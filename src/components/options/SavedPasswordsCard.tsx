import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff, Search } from "lucide-react";
import { m } from "@/paraglide/messages";

export type SaveRow = { id: string; website: string; username: string; password: string };

const PASSWORD_MASK = "••••••••";

type Props = {
    saves: SaveRow[];
    totalCount: number;
    loading: boolean;
    search: string;
    sortBy: "domain" | "added";
    visiblePasswords: Set<string>;
    onSearchChange: (value: string) => void;
    onSortByDomain: () => void;
    onSortByAdded: () => void;
    onTogglePasswordVisible: (id: string) => void;
    onCopyPassword: (password: string) => void;
    onCopyUsername: (username: string) => void;
};

export function SavedPasswordsCard({
    saves,
    totalCount,
    loading,
    search,
    sortBy,
    visiblePasswords,
    onSearchChange,
    onSortByDomain,
    onSortByAdded,
    onTogglePasswordVisible,
    onCopyPassword,
    onCopyUsername,
}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{m["main.saved_passwords"]()}</CardTitle>
                <CardDescription>{m["main.saved_passwords_description"]()}</CardDescription>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            placeholder={m["main.saved_passwords_search_placeholder"]()}
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={sortBy === "domain" ? "default" : "outline"}
                            size="sm"
                            onClick={onSortByDomain}
                        >
                            {m["main.sort_by_domain"]()}
                        </Button>
                        <Button
                            variant={sortBy === "added" ? "default" : "outline"}
                            size="sm"
                            onClick={onSortByAdded}
                        >
                            {m["main.sort_by_added"]()}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">{m["common.loading"]()}</p>
                ) : saves.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {totalCount === 0 ? m["main.no_saved_passwords"]() : m["main.no_results_found"]()}
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-3 py-2 text-left font-medium">{m["main.domain"]()}</th>
                                    <th className="px-3 py-2 text-left font-medium">{m["auth.username"]()}</th>
                                    <th className="px-3 py-2 text-left font-medium">{m["auth.password"]()}</th>
                                    <th className="w-24 px-3 py-2" aria-label={m["common.actions"]()} />
                                </tr>
                            </thead>
                            <tbody>
                                {saves.map((row) => {
                                    const showPw = visiblePasswords.has(row.id);
                                    return (
                                        <tr key={row.id} className="border-b last:border-0">
                                            <td
                                                className="max-w-[180px] truncate px-3 py-2"
                                                title={row.website}
                                            >
                                                {row.website}
                                            </td>
                                            <td
                                                className="max-w-[140px] truncate px-3 py-2"
                                                title={row.username}
                                            >
                                                {row.username}
                                            </td>
                                            <td className="px-3 py-2 font-mono">
                                                {showPw ? row.password : PASSWORD_MASK}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => onTogglePasswordVisible(row.id)}
                                                        title={showPw ? m["common.hide"]() : m["common.show"]()}
                                                    >
                                                        {showPw ? <EyeOff /> : <Eye />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => onCopyPassword(row.password)}
                                                        title={m["common.copy_password"]()}
                                                    >
                                                        <Copy />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => onCopyUsername(row.username)}
                                                        title={m["common.copy_username"]()}
                                                    >
                                                        <Copy />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
