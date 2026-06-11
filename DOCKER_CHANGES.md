# Документация по исправлениям Docker-образа фронтенда

## Контекст

Бэкенд-команда использует внешний nginx-контейнер (`smartwallet-nginx`) для SSL-терминации и маршрутизации:

```
Клиент ──> smartwallet-nginx (SSL)
              ├── /api/*  →  smartwallet-api:80      (бэкенд)
              └── /*      →  smartwallet-client:8080  (фронтенд SPA)
```

Внутренний nginx фронтенд-контейнера используется **исключительно** для раздачи статических файлов. Проксирование API на уровне внутреннего nginx не требуется.

---

## Две проблемы, которые были исправлены

### Проблема 1: Permission denied на /etc/nginx/nginx.conf (КРИТИЧЕСКАЯ)

**Симптом:**

```
/docker-entrypoint.sh: line 44: can't create /etc/nginx/nginx.conf: Permission denied
```

**Причина:**

Entrypoint-скрипт выполнялся от имени `appuser` (UID 1001), но пытался записать файл `/etc/nginx/nginx.conf`, владельцем которого является `root`. Директива `USER 1001` в Dockerfile устанавливала непривилегированного пользователя, но скрипт генерировал `nginx.conf` через `envsubst` с записью в защищённую директорию `/etc/nginx/`.

**Обходное решение, которое использовала бэкенд-команда:**

```yaml
services:
  frontend:
    user: "0:0"   # Запуск от root — обход проблемы прав
```

Это полностью обесценивало директиву `USER 1001` и нарушало принцип наименьших привилегий.

**Решение:**

`nginx.conf` теперь является **статическим файлом**, который копируется в образ на этапе сборки. Обработка `envsubst` для `nginx.conf` больше не выполняется. Конфигурация прокси-сервера, генерируемая в runtime, записывается в директорию `/etc/nginx/conf.d/`, которая доступна на запись для `appuser` (UID 1001).

---

### Проблема 2: BACKEND_HOST был обязательным, даже когда не нужен

**Симптом:**

При запуске контейнера без переменной окружения `BACKEND_HOST` nginx не мог стартовать, потому что в `nginx.conf` присутствовал блок:

```nginx
upstream backend {
    server ${BACKEND_HOST};
}
```

Если `BACKEND_HOST` не установлен, в `upstream` подставлялось пустое значение, и nginx завершался с ошибкой конфигурации.

**Причина:**

В архитектуре бэкенд-команды внешний nginx (`smartwallet-nginx`) сам выполняет маршрутизацию `/api/*` на бэкенд. Внутренний nginx фронтенда должен только раздавать статику. Но блок `upstream` был жёстко вшит в `nginx.conf`, что делало `BACKEND_HOST` фактически обязательным.

**Решение:**

Конфигурация nginx разделена на **два режима работы**:

| Режим | Условие | Поведение |
|-------|---------|-----------|
| **Proxy mode** | `BACKEND_HOST` установлена | nginx раздаёт статику **и** проксирует `/api/*` на бэкенд |
| **Static-only mode** | `BACKEND_HOST` не установлена | nginx раздаёт **только** статику — для использования за внешним reverse proxy |

Реализация использует glob-include директивы nginx, которые корректно обрабатывают отсутствие совпадающих файлов:

```nginx
include /etc/nginx/conf.d/upstream-*.conf;   # контекст http
include /etc/nginx/conf.d/proxy-*.conf;       # контекст server
```

Когда файлы прокси-конфигурации не сгенерированы (static-only mode), glob не находит совпадений, и nginx продолжает работу без ошибок.

---

## Изменённые файлы

### 1. Dockerfile

**Ключевые изменения:**

| Что | Было | Стало |
|-----|------|-------|
| `nginx.conf` | Копировался как шаблон: `COPY nginx.conf /etc/nginx/templates/nginx.conf.template` | Копируется как статический файл: `COPY nginx.conf /etc/nginx/nginx.conf` |
| Шаблоны прокси | Отсутствовали | Добавлены: `COPY upstream.conf.template /etc/nginx/templates/upstream.conf.template` и `COPY proxy.conf.template /etc/nginx/templates/proxy.conf.template` |
| `default.conf` | Не удалялся | Удаляется: `RUN rm -f /etc/nginx/conf.d/default.conf` |
| Права на `/etc/nginx/conf.d/` | Не выставлялись (директория принадлежала root) | `chown -R 1001:1001 /etc/nginx/conf.d` — запись доступна для `appuser` |
| Заголовок | Описывал только "Approach C: Reverse Proxy Architecture" | Описывает оба режима: proxy mode и static-only mode |
| `BACKEND_HOST` в комментариях | Обязательный, default `"backend:8080"` | Опциональный, без значения по умолчанию |
| Примеры docker-compose | Один пример (proxy mode) | Два примера: proxy mode и static-only mode |

**Секция `chown` — полный список директорий с правами для `appuser`:**

```dockerfile
chown -R 1001:1001 /etc/nginx/conf.d \
                    /etc/nginx/templates \
                    /usr/share/nginx/html \
                    /var/cache/nginx \
                    /var/log/nginx \
                    /tmp/nginx
```

---

### 2. nginx.conf

**Ключевые изменения:**

| Что | Было | Стало |
|-----|------|-------|
| Тип файла | Шаблон с `${BACKEND_HOST}`, обрабатывался `envsubst` | Статический файл без плейсхолдеров, копируется напрямую |
| Блок `upstream backend` | Жёстко вшит: `upstream backend { server ${BACKEND_HOST}; }` | Удалён. Заменён на glob-include: `include /etc/nginx/conf.d/upstream-*.conf;` |
| Блок `location /api/` | Жёстко вшит с `proxy_pass`, заголовками, таймаутами и буферизацией | Удалён. Заменён на glob-include: `include /etc/nginx/conf.d/proxy-*.conf;` |
| `map $http_upgrade` | Присутствовал | Сохранён без изменений (безвреден без прокси, необходим при включённом прокси) |
| Заголовок файла | "Reverse Proxy Configuration (Approach C)" | "Static Configuration (no envsubst required)" с описанием обоих режимов |

**Структура nginx.conf после изменений:**

```
http {
    ...
    map $http_upgrade $connection_upgrade { ... }   # безвреден без прокси

    include /etc/nginx/conf.d/upstream-*.conf;      # условный upstream (proxy mode)

    server {
        listen 8080;

        include /etc/nginx/conf.d/proxy-*.conf;     # условный /api/ (proxy mode)

        location /assets/    { ... }                 # статика (immutable cache)
        location = /config.json { ... }              # runtime-конфиг (no-cache)
        location = /index.html  { ... }              # SPA entry (no-cache)
        location ~* \.(ico|...)$ { ... }             # статика (30d cache)
        location /           { try_files ... }       # SPA fallback
        location /healthz    { return 200 "ok\n"; }  # health check
    }
}
```

---

### 3. docker-entrypoint.sh

**Ключевые изменения:**

| Что | Было | Стало |
|-----|------|-------|
| `BACKEND_HOST` default | `BACKEND_HOST="${BACKEND_HOST:-backend:8080}"` — всегда установлен | Удалён default. `BACKEND_HOST` проверяется через `[ -n "${BACKEND_HOST:-}" ]` |
| Генерация `nginx.conf` | `envsubst '${BACKEND_HOST}' < nginx.conf.template > /etc/nginx/nginx.conf` | Удалена. `nginx.conf` — статический файл, не обрабатывается |
| Генерация upstream | Отсутствовала | `envsubst '${BACKEND_HOST}' < upstream.conf.template > /etc/nginx/conf.d/upstream-backend.conf` |
| Генерация proxy | Отсутствовала | `cp proxy.conf.template /etc/nginx/conf.d/proxy-backend.conf` (без envsubst, т.к. нет shell-переменных) |
| Поведение без `BACKEND_HOST` | Ошибка: `nginx.conf.template not found` или невалидный upstream | Static-only mode: прокси-файлы не генерируются, выводится лог `entrypoint: proxy mode DISABLED` |
| Обработка `proxy.conf.template` | N/A | Копируется через `cp` (не через `envsubst`), чтобы nginx-переменные (`$host`, `$remote_addr`) не были интерпретированы как shell-переменные |

**Логика работы entrypoint после изменений:**

```
if BACKEND_HOST установлен:
    1. envsubst upstream.conf.template → /etc/nginx/conf.d/upstream-backend.conf
    2. cp proxy.conf.template         → /etc/nginx/conf.d/proxy-backend.conf
    3. Лог: "proxy mode ENABLED (BACKEND_HOST=...)"
else:
    1. Пропустить генерацию прокси-файлов
    2. Лог: "proxy mode DISABLED — static-only mode"

envsubst config.json.template → /usr/share/nginx/html/config.json  (всегда)

exec "$@"  → запуск nginx
```

---

### 4. upstream.conf.template (НОВЫЙ ФАЙЛ)

Содержит определение upstream-бэкенда для контекста `http`:

```nginx
upstream backend {
    server ${BACKEND_HOST};
}
```

- Обрабатывается `envsubst '${BACKEND_HOST}'` при старте контейнера
- Результат записывается в `/etc/nginx/conf.d/upstream-backend.conf`
- Подхватывается директивой `include /etc/nginx/conf.d/upstream-*.conf;` в `nginx.conf`
- При отсутствии `BACKEND_HOST` файл не генерируется, glob не находит совпадений

---

### 5. proxy.conf.template (НОВЫЙ ФАЙЛ)

Содержит `location /api/` блок для контекста `server`:

```nginx
location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;

    # Передача информации о клиенте на бэкенд
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;

    # Поддержка WebSocket (Upgrade-заголовки неактивны для обычного HTTP)
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    # Таймауты
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;

    # Буферизация
    proxy_buffering   on;
    proxy_buffer_size 4k;
    proxy_buffers     8 4k;

    # Заголовки безопасности (продублированы, т.к. add_header ломает наследование)
    add_header X-Frame-Options        "SAMEORIGIN"                      always;
    add_header X-Content-Type-Options "nosniff"                         always;
    add_header X-XSS-Protection       "1; mode=block"                  always;
    add_header Referrer-Policy        "strict-origin-when-cross-origin" always;
}
```

- Копируется через `cp` (без `envsubst`), т.к. не содержит shell-переменных
- Результат записывается в `/etc/nginx/conf.d/proxy-backend.conf`
- Подхватывается директивой `include /etc/nginx/conf.d/proxy-*.conf;` в `nginx.conf`
- `proxy_pass` без trailing URI — путь передаётся как-is (`/api/users/123` -> `backend:8080/api/users/123`)

---

## Примеры использования в docker-compose

### Static-only mode (за внешним reverse proxy)

Используется бэкенд-командой. Внешний `smartwallet-nginx` выполняет SSL-терминацию и маршрутизацию `/api/*` на бэкенд.

```yaml
services:
  frontend:
    image: nasurino/smart-wallet-client:latest
    expose:
      - "8080"
    environment:
      API_BASE_URL: ""
      # BACKEND_HOST намеренно НЕ установлена — nginx работает в static-only mode
```

### Proxy mode (фронтенд сам маршрутизирует API)

Используется, когда нет внешнего reverse proxy. Фронтенд-контейнер сам проксирует `/api/*` на бэкенд.

```yaml
services:
  frontend:
    image: nasurino/smart-wallet-client:latest
    ports:
      - "3000:8080"
    environment:
      API_BASE_URL: ""
      BACKEND_HOST: "backend:8080"
```

---

## Миграция для бэкенд-команды

Для перехода на исправленный образ необходимо внести три изменения в `docker-compose.yml`:

### 1. Удалить `user: "0:0"`

Контейнер теперь корректно работает от непривилегированного пользователя (UID 1001). Запуск от root больше не требуется.

```diff
 services:
   frontend:
     image: nasurino/smart-wallet-client:latest
-    user: "0:0"
     expose:
       - "8080"
```

### 2. Удалить переменную `BACKEND_HOST`

В архитектуре с внешним nginx (`smartwallet-nginx`) маршрутизацию API выполняет он. Внутренний nginx фронтенда должен работать в static-only mode.

```diff
     environment:
       API_BASE_URL: ""
-      BACKEND_HOST: "backend:8080"
+      # BACKEND_HOST не установлена — static-only mode
```

### 3. Обновить образ

```diff
 services:
   frontend:
-    image: nasurino/smart-wallet-client:<старая_версия>
+    image: nasurino/smart-wallet-client:latest
```

### Итоговый docker-compose.yml (фрагмент)

```yaml
services:
  frontend:
    image: nasurino/smart-wallet-client:latest
    expose:
      - "8080"
    environment:
      API_BASE_URL: ""
```

---

## Проверка работоспособности

После обновления образа и применения изменений:

```bash
# Пересобрать и перезапустить контейнер
docker compose up -d --build frontend

# Проверить, что контейнер запущен от UID 1001 (не root)
docker compose exec frontend id
# Ожидаемый вывод: uid=1001(appuser) gid=1001(appgroup) groups=1001(appgroup)

# Проверить логи entrypoint — должен быть static-only mode
docker compose logs frontend
# Ожидаемая строка: entrypoint: proxy mode DISABLED (BACKEND_HOST not set) — static-only mode

# Проверить health check
docker compose exec frontend wget -qO- http://localhost:8080/healthz
# Ожидаемый вывод: ok

# Проверить раздачу статики
curl http://localhost:8080/
# Ожидаемый вывод: HTML фронтенд-приложения

# Проверить, что /api/ НЕ проксируется (возвращает index.html через SPA fallback)
curl -I http://localhost:8080/api/health
# Ожидаемый статус: 200 (SPA fallback на index.html)
# Внешний nginx сам маршрутизирует /api/* на бэкенд
```
