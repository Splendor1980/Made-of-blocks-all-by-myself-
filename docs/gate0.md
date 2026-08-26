# Гейт 0 — проверка API OpenCode (выполнен)

Дата: 2026-08-26. Версия документации OpenCode: актуальна (Last updated Aug 26, 2026).

## Результат по чек-листу из §3 v7

| # | Вопрос | Вердикт | Доказательство |
|---|--------|---------|----------------|
| 1 | Agent `skins` с `bash/edit=deny` | ✅ | `permission` поле: `edit` покрывает `write`+`edit`+`apply_patch`; `bash` отдельно. |
| 2 | Исчезают ли запрещённые тулы из схемы? | ✅ (лучше, чем ожидалось) | Per-agent `permission` матчится по wildcard к имени тула; неразрешённое = denied и **отсутствует в схеме агента**. Используем allowlist, а не deny → тулы физически не видны модели. |
| 3 | Только custom tools через `.opencode/tools`? | ✅ | Custom tools = `.opencode/tools/*.ts` с `tool()` из `@opencode-ai/plugin`. Имя файла = имя тула; несколько export = `<file>_<export>`. |
| 4 | Ограничение записи путём (не в `.minecraft`)? | ✅ | Permission-ключ `external_directory` + path-scoped объект на `edit`/`bash` (`{"/abs/path/*":"allow","*":"deny"}`). |
| 5 | Смена профиля = новая сессия/агент? | ✅ | Профили = отдельные primary-агенты; переключение Tab/@. Hot-swap permission внутри чата не нужен. |

## Решения, зафиксированные для реализации

1. **`profile.json` → компилятор.** Наш `core` генерирует:
   - `.opencode/agents/<profile>.md` (frontmatter: `mode: primary`, `permission` allowlist только наши custom-тулы + `bash:"deny"`, `edit:"deny"`),
   - `.opencode/tools/*.ts` (обёртки над `core`),
   - `opencode.json` (agent-роутинг).
2. **Allowlist, не deny.** Для `skins` разрешаем только `skins_*` (или явный список), всё остальное denied. `bash`/`edit` — `"deny"`.
3. **`tools` поле deprecated** — в v7 §3 п.1 упоминается `tools: { bash: false }`; заменить на `permission: { bash: "deny" }`. (Поправить в следующей редакции промпта.)
4. **Сторона UI** общается с ядром через `opencode serve` (HTTP/SSE). Custom tools пишут только в `projects/skins/**` (контролируется самим кодом тула + path-scoped permission).

## Риски, НЕ заблокированные Гейтом 0 (ожидаемо)
- Сложность сборки Electron-оболочки — отдельная задача, не влияет на ядро скинов.
- Точный контракт SSE-стриминга `serve` — уточнить при сборке UI (док: `/docs/server`).

**Гейт 0 пройден. Можно строить каркас и домен `skins` ступени 1.**
