import { LogOut, Plus, Search } from "lucide-react";
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

function App() {
    const [addForm, setAddForm] = useState({ website: "", username: "", password: "" });
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"domain" | "added">("domain");

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
                            <Button type="submit">
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
                    <CardContent></CardContent>
                </Card>
            </div>
        </div>
    );
}

export default App;
