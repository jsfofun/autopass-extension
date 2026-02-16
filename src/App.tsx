import { LogOut, Plus, Search, EyeOff, Eye, Copy } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { useState } from "react";
const user = {
    username: "test",
};
function handleLogout() {
    console.log("logout");
}
type SaveRow = { id: string; website: string; username: string; password: string };

const PASSWORD_MASK = "••••••••";
function togglePasswordVisible(id: string) {
    console.log("togglePasswordVisible", id);
}
function copyToClipboard(text: string) {
    console.log("copyToClipboard", text);
}
function App() {
    const [addForm, setAddForm] = useState({ website: "", username: "", password: "" });
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"domain" | "added">("domain");
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filteredSaves, setFilteredSaves] = useState<SaveRow[]>([]);
    const [saves, setSaves] = useState<SaveRow[]>([]);
    return (
        <div className="bg-background min-h-screen p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">AutoPass — полный клиент</h1>
                        <p className="text-muted-foreground text-sm">
                            Вход как <strong>{user.username}</strong>
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut data-icon="inline-start" />
                        Выйти
                    </Button>
                </header>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Добавить пароль</CardTitle>
                        <CardDescription>Домен, логин и пароль сохраняются в зашифрованном виде.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-muted-foreground text-xs">
                                    Домен (например https://example.com)
                                </label>
                                <Input
                                    placeholder="https://example.com"
                                    value={addForm.website}
                                    onChange={(e) => setAddForm((f) => ({ ...f, website: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="w-full space-y-1 sm:w-40">
                                <label className="text-muted-foreground text-xs">Логин</label>
                                <Input
                                    placeholder="user"
                                    value={addForm.username}
                                    onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="w-full space-y-1 sm:w-40">
                                <label className="text-muted-foreground text-xs">Пароль</label>
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
                                Добавить
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Сохранённые пароли</CardTitle>
                        <CardDescription>
                            Пароль показывается только по нажатию «показать». Копирование через кнопку.
                        </CardDescription>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Поиск по домену или логину..."
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
                                    По домену
                                </Button>
                                <Button
                                    variant={sortBy === "added" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSortBy("added")}
                                >
                                    По порядку
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">Загрузка…</p>
                        ) : filteredSaves.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                {saves.length === 0 ? "Нет сохранённых паролей." : "Ничего не найдено."}
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-3 py-2 text-left font-medium">Домен</th>
                                            <th className="px-3 py-2 text-left font-medium">Логин</th>
                                            <th className="px-3 py-2 text-left font-medium">Пароль</th>
                                            <th className="w-24 px-3 py-2" aria-label="Действия" />
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
                                                                title={showPw ? "Скрыть" : "Показать"}
                                                            >
                                                                {showPw ? <EyeOff /> : <Eye />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() => copyToClipboard(row.password)}
                                                                title="Копировать пароль"
                                                            >
                                                                <Copy />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() => copyToClipboard(row.username)}
                                                                title="Копировать логин"
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

export default App;
