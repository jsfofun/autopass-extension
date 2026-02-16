import { useEffect, useState, useCallback, useMemo } from "react";
import browser from "webextension-polyfill";
import AuthPage from "./auth";
import { OptionsHeader } from "@/components/options/OptionsHeader";
import { AddPasswordCard } from "@/components/options/AddPasswordCard";
import { SavedPasswordsCard, type SaveRow } from "@/components/options/SavedPasswordsCard";
import { m } from "@/paraglide/messages";

type AuthUser = { id: string; username: string } | null;

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

    return (
        <div className="bg-background min-h-screen p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
                <OptionsHeader username={user.username} onLogout={handleLogout} />

                <AddPasswordCard
                    form={addForm}
                    adding={adding}
                    onFormChange={setAddForm}
                    onSubmit={handleAddSave}
                />

                <SavedPasswordsCard
                    saves={filteredSaves}
                    totalCount={saves.length}
                    loading={loading}
                    search={search}
                    sortBy={sortBy}
                    visiblePasswords={visiblePasswords}
                    onSearchChange={setSearch}
                    onSortByDomain={() => setSortBy("domain")}
                    onSortByAdded={() => setSortBy("added")}
                    onTogglePasswordVisible={togglePasswordVisible}
                    onCopyPassword={copyToClipboard}
                    onCopyUsername={copyToClipboard}
                />
            </div>
        </div>
    );
}
