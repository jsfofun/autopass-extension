/**
 * Minimal autofill button + dropdown. Does not affect form layout.
 */

type Credential = { username: string; password: string };

const STYLES = `
.ap-fill-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 6px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 2px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}
.ap-fill-btn:hover { color: #333; background: rgba(0,0,0,0.06); }
.ap-wrap { position: relative; display: inline-block; }
.ap-wrap input { padding-right: 32px !important; }
.ap-dd {
  position: fixed;
  min-width: 180px;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 2147483647;
  font-size: 13px;
  font-family: inherit;
}
.ap-dd-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}
.ap-dd-item:last-child { border-bottom: none; }
.ap-dd-item:hover { background: #f5f5f5; }
.ap-dd-empty { padding: 12px; color: #999; }
`;

function injectStyles(): void {
    if (document.getElementById("autopass-styles")) return;
    const style = document.createElement("style");
    style.id = "autopass-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
}

function createButton(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ap-fill-btn";
    btn.title = "AutoPass — заполнить";
    btn.setAttribute("aria-label", "AutoPass заполнить");
    btn.innerHTML = "🔑";
    return btn;
}

function createDropdown(
    credentials: Credential[],
    onSelect: (c: Credential, fillBoth: boolean) => void,
    triggerField: "username" | "password",
    usernameEmpty: boolean,
    passwordEmpty: boolean,
): HTMLDivElement {
    const dd = document.createElement("div");
    dd.className = "ap-dd";
    dd.addEventListener("click", (e) => e.stopPropagation());
    if (credentials.length === 0) {
        dd.innerHTML = '<div class="ap-dd-empty">Нет сохранённых</div>';
        return dd;
    }
    for (const c of credentials) {
        const item = document.createElement("div");
        item.className = "ap-dd-item";
        item.textContent = c.username;
        item.addEventListener("click", () => {
            const fillBoth = usernameEmpty && passwordEmpty;
            onSelect(c, fillBoth);
            dd.remove();
        });
        dd.appendChild(item);
    }
    return dd;
}

export function attachAutofillButton(
    input: HTMLInputElement,
    pair: { username: HTMLInputElement; password: HTMLInputElement },
    getCredentials: () => Promise<Credential[]>,
    inject: (el: HTMLInputElement, val: string) => void,
    onFilled?: () => void,
): void {
    injectStyles();
    if (input.closest(".ap-wrap") || input.dataset.autopassBtn === "1") return;
    input.dataset.autopassBtn = "1";

    const wrap = document.createElement("span");
    wrap.className = "ap-wrap";
    wrap.style.display = "inline-block";
    wrap.style.width = "100%";
    wrap.style.verticalAlign = "middle";

    const parent = input.parentElement;
    if (!parent) return;
    parent.insertBefore(wrap, input);
    wrap.appendChild(input);

    const btn = createButton();
    wrap.appendChild(btn);

    const fieldType: "username" | "password" = input.type === "password" ? "password" : "username";

    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const existing = document.querySelector(".ap-dd");
        if (existing) {
            existing.remove();
            return;
        }
        const creds = await getCredentials();
        const usernameEmpty = pair.username.value.trim() === "";
        const passwordEmpty = pair.password.value === "";
        const dd = createDropdown(
            creds,
            (c, fillBoth) => {
                if (fillBoth) {
                    inject(pair.username, c.username);
                    inject(pair.password, c.password);
                } else {
                    if (fieldType === "username") inject(pair.username, c.username);
                    else inject(pair.password, c.password);
                }
                onFilled?.();
            },
            fieldType,
            usernameEmpty,
            passwordEmpty,
        );
        document.body.appendChild(dd);
        const rect = btn.getBoundingClientRect();
        dd.style.left = `${rect.left}px`;
        dd.style.top = `${rect.bottom + 4}px`;
        const close = () => {
            dd.remove();
            document.removeEventListener("click", close);
        };
        requestAnimationFrame(() => document.addEventListener("click", close));
    });
}

/**
 * Удаляет все кнопки автозаполнения с страницы (при выключении настройки).
 */
export function removeAllAutofillButtons(): void {
    document.querySelectorAll(".ap-wrap").forEach((wrap) => {
        const input = wrap.querySelector("input");
        if (input) {
            delete input.dataset.autopassBtn;
            wrap.parentNode?.insertBefore(input, wrap);
        }
        wrap.remove();
    });
}
