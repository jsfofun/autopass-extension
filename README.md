# AutoPass — Browser Extension

Менеджер паролей для браузера. Сохраняет и подставляет учётные данные на формах входа.

## Архитектура

Три слоя без смешения ответственности:

```
┌─────────────────────────────────────────────────────────────────┐
│  Content script                                                  │
│  • Анализ DOM (через heuristics)                                │
│  • Вставка значений в поля                                      │
│  • Перехват submit формы                                        │
│  • Нет криптографии, нет storage                                │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ messages
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Background / Service worker                                     │
│  • Хранение зашифрованных данных                                │
│  • Общение с backend                                            │
│  • AES-GCM шифрование/расшифровка                               │
│  • Нет логики форм, нет DOM                                     │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Heuristics layer (чистые функции)                              │
│  • findPasswordInputs(), findUsernameForPassword()              │
│  • isVisibleInput(), countPasswordInputs()                      │
│  • Без browser.*, без chrome.*, без API расширения              │
└─────────────────────────────────────────────────────────────────┘
```

## Сканирование страницы

При загрузке и при изменениях DOM (MutationObserver):

1. Найти все `input[type="password"]`
2. Отфильтровать: visible, не disabled, не readonly
3. Для каждого — найти связанный username field
4. Приоритет поиска username (детерминистично):
   - `autocomplete="username"`
   - `type="email"`
   - `name`/`id` содержит: user, email, login

## Login vs регистрация

- **1 поле password** → логин, сохраняем при submit
- **2+ поля password** → регистрация/reset, не сохраняем (v1)

## Сохранение

- Listener на `submit` формы
- Перед submit (асинхронно): взять username, password, отправить message в background
- **Не блокировать submit** — fire-and-forget

## Автоподстановка

- При обнаружении пары password + username → `location.origin` → message в background
- Если есть креды: `input.value = ...` + `dispatchEvent("input")` + `dispatchEvent("change")`
- Без событий React/Vue не увидят изменение

## Сборка

```bash
bun install
npx webpack
```

Или через скрипт:

```bash
bun run build
```

## Ограничения v1

- ~80% сайтов (детерминистичная эвристика, без ML)
- Регистрация/сброс пароля — не сохраняем
- Без UI иконки у полей (опционально позже)
