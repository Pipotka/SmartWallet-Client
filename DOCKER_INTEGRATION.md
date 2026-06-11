# Интеграция фронтенда в docker-compose: nginx Reverse Proxy (Approach C)

Документ предназначен для разработчиков и DevOps-инженеров, настраивающих `docker-compose.yml` в репозитории бэкенда для совместного развертывания с фронтенд-контейнером.

---

## Содержание

1. [Архитектура](#1-архитектура)
2. [Принцип работы API-клиента фронтенда](#2-принцип-работы-api-клиента-фронтенда)
3. [docker-compose.yml — полная конфигурация](#3-docker-composeyml--полная-конфигурация)
4. [Переменные окружения фронтенда](#4-переменные-окружения-фронтенда)
5. [Конфигурация ASP.NET Core бэкенда](#5-конфигурация-aspnet-core-бэкенда)
6. [Сценарии API_BASE_URL](#6-сценарии-api_base_url)
7. [Сборка и публикация образа фронтенда](#7-сборка-и-публикация-образа-фронтенда)
8. [Health checks](#8-health-checks)
9. [Диагностика и устранение неполадок](#9-диагностика-и-устранение-неполадок)

---

## 1. Архитектура

Фронтенд использует **Approach C: nginx Reverse Proxy**. Nginx-контейнер является единой точкой входа: он обслуживает статические файлы фронтенда и проксирует API-запросы к бэкенду. Это исключает проблемы CORS и обеспечивает прозрачную работу HTTP-only cookies (same-origin).

```
                          ┌─────────────────────────────────────────┐
                          │         docker-compose network          │
                          │                                         │
  Browser                 │   ┌───────────────────────────────┐     │
  (порт 3000)             │   │     frontend (nginx:8080)     │     │
      │                   │   │                               │     │
      │  HTTP :3000       │   │  /api/*        ──proxy_pass──┐│     │
      ├──────────────────►│   │  /assets/*     → static (1yr)││     │
      │                   │   │  /config.json  → no-cache    ││     │
      │                   │   │  /index.html   → no-cache    ││     │
      │                   │   │  /healthz      → 200 ok      ││     │
      │                   │   │  /*            → SPA fallback││     │
      │                   │   └──────────────────────────────┼│─────┘
      │                   │                                  │
      │                   │   ┌──────────────────────────────▼│─────┐
      │                   │   │   backend (ASP.NET Core:8080) │     │
      │                   │   │                               │     │
      │                   │   │   /api/users/refresh          │     │
      │                   │   │   /api/users/me               │     │
      │                   │   │   /api/...                    │     │
      │                   │   └───────────────────────────────┘     │
      │                   │                                         │
      └───────────────────┴─────────────────────────────────────────┘
```

**Ключевые свойства:**

| Свойство | Значение |
|----------|----------|
| Единая точка входа | `localhost:3000` (или любой опубликованный порт) |
| Origin для браузера | Один (nginx:8080) |
| CORS | Не требуется (same-origin) |
| Cookies | HTTP-only, SameSite=Lax или Strict |
| Проксирование | `/api/*` → `backend:8080` |
| Статика | `/assets/*` с immutable-кэшем на 1 год |

---

## 2. Принцип работы API-клиента фронтенда

Понимание механизма формирования URL критически важно для корректной настройки.

### 2.1. Загрузка конфигурации (`config.ts`)

При старте приложение выполняет запрос `/config.json` **относительно текущего origin** (тот же хост и порт, с которого загружена страница):

```typescript
// src/api/config.ts
const response = await fetch('/config.json');
cachedConfig = await response.json();
// cachedConfig = { "apiBaseUrl": "" }
```

Результат кэшируется и используется для всех последующих API-запросов.

### 2.2. Формирование URL запроса (`client.ts`)

Каждый API-запрос конструирует URL конкатенацией `apiBaseUrl` и `path`:

```typescript
// src/api/client.ts
const { apiBaseUrl } = getConfig();
const url = `${apiBaseUrl}${path}`;
// path всегда начинается с "/" (например, "/api/users/refresh")
```

**Важно:** слэш между `apiBaseUrl` и `path` **не вставляется**. Это означает:

| `apiBaseUrl` | `path` | Результат | Поведение |
|--------------|--------|-----------|-----------|
| `""` (пустая строка) | `/api/users/refresh` | `/api/users/refresh` | Same-origin, nginx проксирует |
| `"/api"` | `/api/users/refresh` | `/api/api/users/refresh` | Дублирование префикса — **не работает** |
| `"http://backend:5079"` | `/api/users/refresh` | `http://backend:5079/api/users/refresh` | Cross-origin, требуется CORS |

### 2.3. Аутентификация

Каждый запрос включает:

```typescript
credentials: 'include',           // Отправка HTTP-only cookies
headers: {
  'Authorization': `Bearer ${accessToken}`  // JWT в заголовке
}
```

При получении `401` клиент автоматически выполняет refresh:

```typescript
POST ${apiBaseUrl}/api/users/refresh
// credentials: 'include' (refresh token в HTTP-only cookie)
```

### 2.4. Вывод для конфигурации

Для Approach C **единственный корректный вариант** — `apiBaseUrl: ""` (пустая строка). Браузер отправляет запросы на тот же origin (nginx), а nginx проксирует `/api/*` на бэкенд.

---

## 3. docker-compose.yml — полная конфигурация

### 3.1. Минимальная рабочая конфигурация

```yaml
services:
  backend:
    image: smart-wallet-backend:latest
    expose:
      - "8080"
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: "http://+:8080"
      # Forwarded Headers — доверие к nginx proxy
      ASPNETCORE_FORWARDEDHEADERS__ALLOWEDHOSTS: "*"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - smart-wallet

  frontend:
    image: smart-wallet-frontend:latest
    ports:
      - "3000:8080"
    environment:
      API_BASE_URL: ""
      BACKEND_HOST: "backend:8080"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - smart-wallet

networks:
  smart-wallet:
    driver: bridge
```

### 3.2. Расширенная конфигурация с volume и production-настройками

```yaml
services:
  backend:
    image: ${REGISTRY:-ghcr.io}/smart-wallet-backend:${BACKEND_TAG:-latest}
    expose:
      - "8080"
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: "http://+:8080"
      ASPNETCORE_FORWARDEDHEADERS__ALLOWEDHOSTS: "*"
      ConnectionStrings__DefaultConnection: "${DB_CONNECTION_STRING}"
      Jwt__RefreshTokenCookie__Secure: "false"
      Jwt__RefreshTokenCookie__SameSite: "Lax"
      Jwt__RefreshTokenCookie__HttpOnly: "true"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
        reservations:
          memory: 256M
          cpus: "0.5"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - smart-wallet

  frontend:
    image: ${REGISTRY:-ghcr.io}/smart-wallet-frontend:${FRONTEND_TAG:-latest}
    ports:
      - "${FRONTEND_PORT:-3000}:8080"
    environment:
      API_BASE_URL: ""
      BACKEND_HOST: "backend:8080"
    volumes:
      # Опционально: кастомный config.json с дополнительными полями
      # См. раздел "Кастомизация config.json" ниже
      - ./config/custom-config.json.template:/etc/nginx/templates/config.json.template:ro
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.5"
        reservations:
          memory: 64M
          cpus: "0.25"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - smart-wallet

networks:
  smart-wallet:
    driver: bridge
    name: smart-wallet-network
```

### 3.3. Кастомизация config.json через volume

Если требуется добавить дополнительные поля в `config.json` (например, feature flags, URL внешних сервисов), создайте шаблон:

```json
// config/custom-config.json.template
{
  "apiBaseUrl": "${API_BASE_URL}",
  "featureFlags": {
    "enableNewDashboard": true
  },
  "externalServices": {
    "analyticsUrl": "https://analytics.example.com"
  }
}
```

Entrypoint-скрипт выполнит `envsubst` по этому шаблону и сгенерирует итоговый `config.json`.

---

## 4. Переменные окружения фронтенда

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `API_BASE_URL` | `""` (пустая строка) | Базовый URL, записываемый в `/config.json` для фронтенда. Пустая строка означает same-origin запросы, которые nginx проксирует на бэкенд. **Рекомендуемое значение для Approach C.** |
| `BACKEND_HOST` | `backend:8080` | Адрес upstream-сервера для директивы `proxy_pass` в nginx. Должен совпадать с именем сервиса и портом бэкенда в docker-compose. |

### 4.1. Детали работы `BACKEND_HOST`

Переменная подставляется в `nginx.conf` на этапе старта контейнера через `envsubst`:

```nginx
upstream backend {
    server ${BACKEND_HOST};  # Заменяется на "backend:8080"
}
```

**Требования к значению:**

- Должно быть разрешимым DNS-именем в docker-сети (имя сервиса в docker-compose).
- Должно включать порт, на котором слушает бэкенд.
- Формат: `<service-name>:<port>` (например, `backend:8080`, `api-server:5079`).

### 4.2. Детали работы `API_BASE_URL`

Переменная записывается в `/usr/share/nginx/html/config.json`:

```json
{"apiBaseUrl":""}
```

Фронтенд читает этот файл при старте и использует значение для конструирования URL API-запросов. Подробное описание сценариев — в [разделе 6](#6-сценарии-api_base_url).

---

## 5. Конфигурация ASP.NET Core бэкенда

### 5.1. Forwarded Headers (обязательно)

Nginx передает клиентскую информацию через заголовки `X-Forwarded-*`. Бэкенд должен их обрабатывать:

```csharp
// Program.cs — добавить ПЕРЕД всеми другими middleware
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
                             | ForwardedHeaders.XForwardedProto
                             | ForwardedHeaders.XForwardedHost;

    // Доверять всем proxy (в production ограничьте конкретными IP/CIDR)
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

app.UseForwardedHeaders();

// ... остальной middleware pipeline
```

**Что передаёт nginx:**

| Заголовок | Значение | Назначение |
|-----------|----------|------------|
| `X-Real-IP` | IP клиента | Идентификация клиента |
| `X-Forwarded-For` | Цепочка proxy | Аудит, rate limiting |
| `X-Forwarded-Proto` | `http` или `https` | Определение схемы |
| `X-Forwarded-Host` | Имя хоста | Генерация ссылок |

### 5.2. CORS — НЕ требуется

Поскольку браузер обращается к единому origin (nginx:8080), а nginx проксирует `/api/*` на бэкенд, **CORS не нужен**. Запросы с точки зрения браузера — same-origin.

```csharp
// НЕ добавляйте:
// builder.Services.AddCors(...);
// app.UseCors(...);
```

Если CORS всё же настроен — убедитесь, что он не блокирует same-origin запросы (это маловероятно, но может вызвать путаницу при отладке).

### 5.3. Конфигурация cookies

Cookies refresh token должны быть настроены для same-origin:

```csharp
// appsettings.json или конфигурация в Program.cs
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;       // Обязательно
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Lax;  // или Strict
    options.Cookie.Name = "SmartWallet.RefreshToken";
});
```

**Критически важно:**

| Параметр | Значение | Обоснование |
|----------|----------|-------------|
| `SameSite` | `Lax` или `Strict` | Same-origin — нет необходимости в `None` |
| `Secure` | Опционально | Не требуется для same-origin HTTP. Для HTTPS — установите `true`. |
| `HttpOnly` | `true` | Защита от XSS |
| `Path` | `/` или `/api` | Должен совпадать с путём, по которому фронтенд отправляет запросы |

**Почему НЕ `SameSite=None`:**

`SameSite=None` требует обязательного флага `Secure` (HTTPS). В same-origin сценарии это избыточно и создаёт ненужные ограничения. `Lax` полностью достаточен, так как запросы идут с того же origin.

### 5.4. PathBase (опционально)

Если бэкенд слушает на `/api/*` и nginx проксирует `/api/*` **без изменения пути** (текущая конфигурация — `proxy_pass` без trailing URI), то PathBase **не требуется**. Путь передаётся как есть:

```
Browser: GET /api/users/me
  → nginx: proxy_pass http://backend (без trailing URI)
    → Backend: GET /api/users/me (путь сохранён)
```

Если вы используете `proxy_pass http://backend/;` (с trailing URI), nginx отрезает `/api/` и бэкенд получает `/users/me`. В этом случае требуется:

```csharp
app.UsePathBase("/api");
```

**Рекомендация:** используйте текущую конфигурацию nginx (без trailing URI) — она проще и не требует `UsePathBase`.

### 5.5. Response Compression (опционально)

Nginx уже выполняет gzip-сжатие. Встроенное сжатие ASP.NET Core дублирует работу и увеличивает нагрузку на CPU:

```csharp
// НЕ рекомендуется включать при наличии nginx gzip:
// builder.Services.AddResponseCompression(...);
// app.UseResponseCompression();
```

Если по каким-то причинам требуется (например, прямой доступ к бэкенду без nginx) — настройте, но учитывайте двойное сжатие.

### 5.6. Health check endpoint

Бэкенд должен предоставлять endpoint для health check:

```csharp
// Минимальная реализация
app.MapGet("/health", () => Results.Ok("healthy"));

// Или с использованием Microsoft.Extensions.Diagnostics.HealthChecks
builder.Services.AddHealthChecks();
app.MapHealthChecks("/health");
```

---

## 6. Сценарии API_BASE_URL

### 6.1. Пустая строка `""` — РЕКОМЕНДУЕТСЯ для Approach C

```yaml
environment:
  API_BASE_URL: ""
```

**Результат в config.json:**
```json
{"apiBaseUrl":""}
```

**Формирование URL:**
```
"" + "/api/users/refresh" = "/api/users/refresh"
```

**Поведение:**
- Браузер отправляет запрос на текущий origin (nginx:8080).
- Nginx проксирует `/api/*` на `backend:8080`.
- Same-origin: CORS не требуется, cookies работают прозрачно.

**Когда использовать:** Всегда для Approach C. Это стандартный и рекомендуемый сценарий.

### 6.2. Относительный путь `/api` — НЕ РАБОТАЕТ без модификации кода

```yaml
environment:
  API_BASE_URL: "/api"
```

**Результат в config.json:**
```json
{"apiBaseUrl":"/api"}
```

**Формирование URL:**
```
"/api" + "/api/users/refresh" = "/api/api/users/refresh"
```

**Проблема:** дублирование префикса `/api`. Текущий код `client.ts` не вставляет слэш между `apiBaseUrl` и `path`, а `path` уже начинается с `/api/`. Результат — 404.

**Когда может работать:** Только если `path` в `client.ts` не содержит префикс `/api/` (например, `/users/refresh`). Требует модификации фронтенд-кода.

### 6.3. Полный URL `http://backend:5079` — НЕ РЕКОМЕНДУЕТСЯ для Approach C

```yaml
environment:
  API_BASE_URL: "http://backend:5079"
```

**Результат в config.json:**
```json
{"apiBaseUrl":"http://backend:5079"}
```

**Формирование URL:**
```
"http://backend:5079" + "/api/users/refresh" = "http://backend:5079/api/users/refresh"
```

**Проблемы:**

| Проблема | Описание |
|----------|----------|
| Cross-origin | Браузер отправляет запросы напрямую на `backend:5079`, минуя nginx |
| CORS | Требуется полная настройка CORS на бэкенде |
| Cookies | `SameSite=None; Secure` обязательно (иначе браузер не отправит cookies) |
| DNS | `backend` — внутреннее docker-имя, недоступно из браузера хоста |
| Порт | Бэкенд должен быть опубликован (`ports: "5079:5079"`), что нарушает изоляцию |

**Когда может работать:** Только если фронтенд и бэкенд развернуты на разных доменах/хостах (не Approach C).

---

## 7. Сборка и публикация образа фронтенда

### 7.1. Локальная сборка

```bash
# Из корня репозитория фронтенда
docker build -t smart-wallet-frontend:latest .

# Проверка образа
docker run --rm -d \
  -p 3000:8080 \
  -e BACKEND_HOST=host.docker.internal:8080 \
  -e API_BASE_URL="" \
  --name frontend-test \
  smart-wallet-frontend:latest

# Проверка health check
curl http://localhost:3000/healthz
# Ожидаемый ответ: ok

# Проверка config.json
curl http://localhost:3000/config.json
# Ожидаемый ответ: {"apiBaseUrl":""}

# Остановка
docker stop frontend-test
```

### 7.2. Публикация в container registry

```bash
# Docker Hub
docker build -t username/smart-wallet-frontend:1.0.0 -t username/smart-wallet-frontend:latest .
docker push username/smart-wallet-frontend:1.0.0
docker push username/smart-wallet-frontend:latest

# GitHub Container Registry (GHCR)
docker build -t ghcr.io/your-org/smart-wallet-frontend:1.0.0 .
docker push ghcr.io/your-org/smart-wallet-frontend:1.0.0

# Private Registry
docker build -t registry.example.com/smart-wallet-frontend:1.0.0 .
docker push registry.example.com/smart-wallet-frontend:1.0.0
```

### 7.3. Использование тегов в docker-compose

```yaml
# .env файл в репозитории бэкенда
REGISTRY=ghcr.io/your-org
FRONTEND_TAG=1.0.0
BACKEND_TAG=1.0.0
FRONTEND_PORT=3000

# docker-compose.yml использует переменные
services:
  frontend:
    image: ${REGISTRY}/smart-wallet-frontend:${FRONTEND_TAG}
    # ...
```

### 7.4. Multi-arch сборка (опционально)

```bash
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t smart-wallet-frontend:latest \
  --push .
```

---

## 8. Health checks

### 8.1. Фронтенд

| Параметр | Значение |
|----------|----------|
| Endpoint | `GET /healthz` |
| Ответ | `200 ok` (text/plain) |
| Метод проверки | `wget -qO- http://localhost:8080/healthz` |
| Встроенный Dockerfile HEALTHCHECK | `--interval=30s --timeout=3s --start-period=5s --retries=3` |

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:8080/healthz"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 5s
```

### 8.2. Бэкенд

| Параметр | Значение |
|----------|----------|
| Endpoint | `GET /health` |
| Ответ | `200 OK` |
| Метод проверки | `curl -f http://localhost:8080/health` |

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

### 8.3. Зависимости с health check

```yaml
frontend:
  depends_on:
    backend:
      condition: service_healthy  # Ждать, пока бэкенд пройдёт health check
```

---

## 9. Диагностика и устранение неполадок

### 9.1. 502 Bad Gateway

**Симптом:** При обращении к `/api/*` nginx возвращает `502 Bad Gateway`.

**Причины и решения:**

| Причина | Диагностика | Решение |
|---------|-------------|---------|
| Бэкенд не запущен | `docker compose ps` — статус backend | Убедитесь, что сервис backend запущен: `docker compose up -d backend` |
| Бэкенд не готов | Health check бэкенда не проходит | Увеличьте `start_period` или добавьте `depends_on: condition: service_healthy` |
| Неверный `BACKEND_HOST` | `docker compose exec frontend cat /etc/nginx/nginx.conf` — проверьте upstream | Убедитесь, что `BACKEND_HOST` совпадает с именем сервиса и портом бэкенда |
| Сеть | `docker compose exec frontend wget -qO- http://backend:8080/health` | Проверьте, что оба сервиса в одной docker-сети |

**Команды диагностики:**

```bash
# Логи nginx (ошибки проксирования)
docker compose logs frontend

# Проверка доступности бэкенда из контейнера фронтенда
docker compose exec frontend wget -qO- http://backend:8080/health

# Проверка сгенерированного nginx.conf
docker compose exec frontend cat /etc/nginx/nginx.conf | grep -A2 upstream
```

### 9.2. Config.json не обновляется

**Симптом:** После изменения `API_BASE_URL` и пересоздания контейнера фронтенд продолжает использовать старое значение.

**Причины и решения:**

| Причина | Диагностика | Решение |
|---------|-------------|---------|
| Кэш браузера | DevTools → Network → `/config.json` → проверьте заголовки кэша | nginx настроен на `no-cache` для `/config.json`. Очистите кэш: Ctrl+Shift+R (hard reload) |
| Контейнер не пересоздан | `docker compose exec frontend cat /usr/share/nginx/html/config.json` | Выполните `docker compose up -d --force-recreate frontend` |
| Volume переопределяет | Проверьте `docker compose config` на наличие volume mount на `/usr/share/nginx/html/config.json` | Удалите конфликтующий volume mount |

### 9.3. Cookies не отправляются

**Симптом:** Запросы к `/api/*` возвращают `401 Unauthorized`, хотя логин выполнен успешно.

**Причины и решения:**

| Причина | Диагностика | Решение |
|---------|-------------|---------|
| `SameSite=None` без `Secure` | DevTools → Application → Cookies → проверьте атрибуты | Установите `SameSite=Lax` или `Strict` (не `None`) |
| Неверный `Path` cookie | Проверьте `Path` атрибут cookie | Установите `Path=/` или `Path=/api` |
| Cross-origin запросы | DevTools → Network → проверьте `Origin` и `Host` | Убедитесь, что `API_BASE_URL=""` (same-origin) |
| `credentials` не включён | Проверьте код `client.ts` | Должно быть `credentials: 'include'` |

**Команды диагностики:**

```bash
# Проверьте заголовки Set-Cookie в ответе на /api/users/login
curl -v -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' 2>&1 | grep -i set-cookie
```

### 9.4. WebSocket не работает

**Симптом:** WebSocket-соединения завершаются сразу после установки.

**Причины и решения:**

| Причина | Диагностика | Решение |
|---------|-------------|---------|
| Missing Upgrade headers | Проверьте `nginx.conf` — секция `/api/` | Убедитесь, что присутствуют `proxy_set_header Upgrade` и `proxy_set_header Connection` |
| Таймаут | WebSocket idle-соединение закрывается через 60s | Увеличьте `proxy_read_timeout` (например, `3600s` для долгих соединений) |

**Текущая конфигурация nginx уже включает WebSocket-поддержку:**

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

location /api/ {
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
}
```

### 9.5. Статические файлы не загружаются (404)

**Симптом:** После деплоя страница белая, в консоли — 404 на `/assets/*.js`.

**Причины и решения:**

| Причина | Диагностика | Решение |
|---------|-------------|---------|
| Несоответствие версий | Образ фронтенда не соответствует текущей сборке | Пересоберите образ: `docker build -t smart-wallet-frontend:latest .` |
| Неправильный COPY в Dockerfile | Проверьте `COPY --from=build /app/dist /usr/share/nginx/html` | Убедитесь, что Vite output — `/app/dist` (проверьте `vite.config.ts`) |

### 9.6. Общие команды отладки

```bash
# Статус всех сервисов
docker compose ps

# Логи всех сервисов (последние 50 строк)
docker compose logs --tail=50

# Логи только фронтенда в реальном времени
docker compose logs -f frontend

# Выполнить команду внутри контейнера фронтенда
docker compose exec frontend sh

# Проверить сгенерированный config.json
docker compose exec frontend cat /usr/share/nginx/html/config.json

# Проверить сгенерированный nginx.conf (upstream)
docker compose exec frontend grep -A2 'upstream backend' /etc/nginx/nginx.conf

# Проверить доступность бэкенда из контейнера фронтенда
docker compose exec frontend wget -qO- http://backend:8080/health

# Перезагрузить nginx без остановки контейнера
docker compose exec frontend nginx -s reload

# Полное пересоздание фронтенда
docker compose up -d --force-recreate frontend
```

---

## Приложение A: Структура файлов фронтенд-образа

```
/usr/share/nginx/html/
├── index.html              # SPA entry point (no-cache)
├── config.json             # Runtime config (no-cache, generated at startup)
├── assets/
│   ├── index-abc123.js     # Content-hashed bundles (1yr immutable cache)
│   ├── index-abc123.css
│   └── ...
├── favicon.ico             # Static files (30d cache)
└── ...

/etc/nginx/
├── nginx.conf              # Generated from template at startup
└── templates/
    ├── nginx.conf.template # Source template with ${BACKEND_HOST}
    └── config.json.template # Source template with ${API_BASE_URL}

/docker-entrypoint.sh       # Entrypoint: envsubst + exec nginx
```

## Приложение B: Безопасность образа

| Мера | Реализация |
|------|------------|
| Non-root пользователь | UID 1001 (`appuser`), nginx слушает на порту 8080 (>1024) |
| Минимальный базовый образ | `nginx:1.27-alpine` (~40 MB) |
| Multi-stage build | Node.js и devDependencies не попадают в production-образ |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy` |
| Server tokens off | Версия nginx скрыта из заголовков и error pages |
| Temp paths | Перенаправлены в `/tmp/nginx/` (writable для non-root) |

## Приложение C: Быстрый старт

Минимальный `docker-compose.yml` для немедленного запуска:

```yaml
services:
  backend:
    image: smart-wallet-backend:latest
    expose:
      - "8080"
    environment:
      ASPNETCORE_URLS: "http://+:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  frontend:
    image: smart-wallet-frontend:latest
    ports:
      - "3000:8080"
    environment:
      API_BASE_URL: ""
      BACKEND_HOST: "backend:8080"
    depends_on:
      backend:
        condition: service_healthy
```

Запуск:

```bash
docker compose up -d
# Открыть http://localhost:3000
```
