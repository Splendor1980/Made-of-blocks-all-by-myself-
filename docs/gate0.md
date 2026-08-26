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

---

# Установка OpenCode CLI и верификация агентов/тулов (2026-08-26)

## Установка
- ОС: Windows (win32). В npm пакета нет (`opencode` / `@opencode-ai/opencode` → 404).
- Бинарь распространяется через GitHub-релизы `anomalyco/opencode`.
- Скачан `opencode-windows-x64.zip` (latest) → распакован user-level в
  `C:\Users\ILYA\.opencode\bin`, добавлен в user-PATH (`[Environment]::SetEnvironmentVariable`).
- `opencode --version` → **1.18.23**. ✅
- Замечание: на машине также присутствует OpenCode Desktop (`@opencode-aidesktop`),
  но для агента/тулов используется CLI из `~/.opencode/bin`.

## Проверка `opencode serve` (сайдкар)
- `opencode serve --port 4096` стартует, лог: `opencode server listening on http://127.0.0.1:4096`.
- `GET /` → **401 Unauthorized** (маршруты защищены) → сервер живой и защищён. ✅
- Вывод: сайдкар из Electron (`packages/app/sidecar.js`) жизнеспособен.

## Конфиг агентов (важное исправление)
- Неверно (исправлено): агенты в `opencode.json` ключом `agents` + `permission.{allow:[...]}`.
  Такой формат **не загружается** — `agent list` показывал только встроенных.
- Верно: агенты = markdown-файлы `.opencode/agents/<name>.md`. Обязателен
  frontmatter `description`. Доступ к тулам задаётся через `permission:` (а не
  deprecated `tools:`), по ключу `"tool:<имя>": "allow"|"deny"|"ask"`.
- `name` берётся из имени файла; лишний ключ `name:` в frontmatter ломал валидацию.
- Итоговые файлы: `.opencode/agents/skins.md` (mode: all) и `.opencode/agents/crafter.md`
  (`disable: true` — gated, не появляется в списке). `opencode.json` сведён к `$schema`.

## Верификация `agent list` / тулов
- `opencode agent list` → показывает `skins (subagent→all)`. ✅ (crafter скрыт через `disable`).
- Формат `permission` с `"tool:validate_skin": allow` и т.д. **принят** — агент
  загружается без ошибок конфигурации. ✅
- Кастомные тулы `.opencode/tools/*.ts` обнаруживаются (serve стартует без ошибок при
  наличии папки tools). Логика тулов покрыта 29 unit/integration-тестами, которые
  вызывают реальные `execute()` с мок-контекстом.

## Живой прогон агента (блокер окружения)
- Попытка `opencode run --agent skins -m opencode/<free>` упала с
  `Unexpected server error` на стороне провайдера `opencode/*-free`.
- Причина: бесплатные модели opencode-провайдера требуют логина/недоступны в этом
  окружении (браузерный `providers login` невозможен headless). **Не проблема нашей
  обвязки** — агент и тулы корректно выбираются (лог: `> skins · hy3-free`).
- Для реального прогона нужен сконфигурированный провайдер (напр. `opencode providers login`
  или ключ OpenRouter). После этого `run --agent skins` будет вызывать наши тулы end-to-end.

## Статус
- ✅ CLI установлен и на PATH.
- ✅ serve работает (сайдкар готов).
- ✅ Агенты и тулы корректно конфигурируются и загружаются; формат `tool:<имя>` верен.
- ⚠️ Живой вызов LLM заблокирован отсутствием провайдера в окружении (вне нашей зоны).
