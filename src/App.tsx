import "./App.css";
import { Button } from "./components/ui/button";

function App() {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">AutoPass</h2>
            <p className="text-muted-foreground text-sm">
                Пароли с форм сохраняются автоматически при входе на сайтах.
            </p>
            <Button type="submit" className="w-full">
                Войти
            </Button>
        </div>
    );
}

export default App;
