/**
 * Full-page client (fallback page): авторизация, таблица паролей, поиск, копирование, добавление.
 * Zero-knowledge: данные расшифровываются только на клиенте.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import browser from "webextension-polyfill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AuthPage from "./auth";
import { Copy, Eye, EyeOff, LogOut, Plus, Search } from "lucide-react";
import { m } from "@/paraglide/messages";

type AuthUser = { id: string; username: string } | null;
type SaveRow = { id: string; website: string; username: string; password: string };

const PASSWORD_MASK = "••••••••";

function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
}

export default function OptionsPage() {
    const [user, setUser] = useState<AuthUser | undefined>(undefined);
    const [saves, setSaves] = useState<SaveRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"domain" | "added">("domain");
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [addForm, setAddForm] = useState({ website: "", username: "", password: "" });
    const [adding, setAdding] = useState(false);

    const loadUser = useCallback(async () => {
        const u = (await browser.runtime.sendMessage({ action: "getAuth" })) as AuthUser;
        setUser(u ?? null);
        return u;
    }, []);

    const loadSaves = useCallback(async () => {
        setLoading(true);
        const list = (await browser.runtime.sendMessage({ action: "getSavesListDecrypted" })) as SaveRow[];
        setSaves(Array.isArray(list) ? list : []);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadUser().then((u) => {
            if (u) loadSaves();
        });
    }, [loadUser, loadSaves]);

    const handleAuthSuccess = (u: { id: string; username: string }) => {
        setUser(u);
        loadSaves();
    };

    const handleLogout = async () => {
        await browser.runtime.sendMessage({ action: "LOGOUT" });
        setUser(null);
        setSaves([]);
        setVisiblePasswords(new Set());
    };

    const togglePasswordVisible = (id: string) => {
        setVisiblePasswords((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredSaves = useMemo(() => {
        let list = [...saves];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((s) => s.website.toLowerCase().includes(q) || s.username.toLowerCase().includes(q));
        }
        if (sortBy === "domain") {
            list.sort((a, b) => a.website.localeCompare(b.website));
        }
        return list;
    }, [saves, search, sortBy]);

    const handleAddSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.website.trim() || !addForm.username.trim() || !addForm.password) return;
        setAdding(true);
        try {
            await browser.runtime.sendMessage({
                action: "upsertSaveManual",
                website: addForm.website.trim(),
                username: addForm.username.trim(),
                password: addForm.password,
            });
            setAddForm({ website: "", username: "", password: "" });
            await loadSaves();
        } finally {
            setAdding(false);
        }
    };

    if (user === undefined) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <span className="text-muted-foreground">{m["common.loading"]()}</span>
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <AuthPage onSuccess={handleAuthSuccess} />
                </div>
            </div>
        );
    }
    console.log("filteredSaves", filteredSaves);
    return (
        <div className="bg-background min-h-screen p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{m["main.title"]()}</h1>
                        <p className="text-muted-foreground text-sm">
                            {m["main.loginAs"]({ username: user.username })}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut data-icon="inline-start" />
                        {m["auth.logout"]()}
                    </Button>
                </header>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>{m["main.add_password"]()}</CardTitle>
                        <CardDescription>{m["main.add_password_description"]()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-muted-foreground text-xs">{m["main.domain_example"]()}</label>
                                <Input
                                    placeholder="https://example.com"
                                    value={addForm.website}
                                    onChange={(e) => setAddForm((f) => ({ ...f, website: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="w-full space-y-1 sm:w-40">
                                <label className="text-muted-foreground text-xs">{m["auth.username"]()}</label>
                                <Input
                                    placeholder="user"
                                    value={addForm.username}
                                    onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="w-full space-y-1 sm:w-40">
                                <label className="text-muted-foreground text-xs">{m["auth.password"]()}</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={addForm.password}
                                    onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
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
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={sortBy === "domain" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSortBy("domain")}
                                >
                                    {m["main.sort_by_domain"]()}
                                </Button>
                                <Button
                                    variant={sortBy === "added" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSortBy("added")}
                                >
                                    {m["main.sort_by_added"]()}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">{m["common.loading"]()}</p>
                        ) : filteredSaves.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                {saves.length === 0 ? m["main.no_saved_passwords"]() : m["main.no_results_found"]()}
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
                                        {filteredSaves.map((row) => {
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
                                                                onClick={() => togglePasswordVisible(row.id)}
                                                                title={showPw ? m["common.hide"]() : m["common.show"]()}
                                                            >
                                                                {showPw ? <EyeOff /> : <Eye />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() => copyToClipboard(row.password)}
                                                                title={m["common.copy_password"]()}
                                                            >
                                                                <Copy />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() => copyToClipboard(row.username)}
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
            </div>
        </div>
    );
}
