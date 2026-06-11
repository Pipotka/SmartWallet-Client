# Инструкции для фронтенд-разработчика: исправления Docker-образа `nasurino/smart-wallet-client`

## Контекст архитектуры

В нашей интеграции используется **внешний nginx-контейнер** (`smartwallet-nginx`), который выполняет SSL-терминацию и маршрутизацию:

- `/api/*` → `smartwallet-api:80` (бэкенд)
- `/*` → `smartwallet-client:8080` (фронтенд SPA)

Внутренний nginx фронтенд-контейнера используется **только для раздачи статики**. Проксирование API выполняет внешний nginx.

---

## Проблема 1: Permission denied на /etc/nginx/nginx.conf (КРИТИЧЕСКАЯ)

### Описание

Entrypoint-скрипт (`/docker-entrypoint.sh`) использует `envsubst` для подстановки `${BACKEND_HOST}` и `${API_BASE_URL}` в шаблоны конфигурации nginx, после чего записывает результат в `/etc/nginx/nginx.conf`. Однако контейнер запускается от имени непривилегированного пользователя (UID 1001, `appuser`), который не имеет прав на запись в `/etc/nginx/nginx.conf`.

```
/docker-entrypoint.sh: line 44: can't create /etc/nginx/nginx.conf: Permission denied
```

### Текущий обходной путь (костыль)

```yaml
user: "0:0"
```

Это запускает контейнер от имени root, что полностью лишает смысла использование непривилегированного пользователя.

### Рекомендуемое исправление

**Вариант A (предпочтительный):** Выдать `appuser` права на запись в нужные файлы до переключения пользователя в Dockerfile:

```dockerfile
# В Dockerfile, ПЕРЕД переключением на appuser:
RUN touch /etc/nginx/nginx.conf && \
    chown appuser:appuser /etc/nginx/nginx.conf && \
    chmod 644 /etc/nginx/nginx.conf && \
    chown -R appuser:appuser /etc/nginx/templates/ && \
    chown -R appuser:appuser /tmp/nginx/
```

**Вариант B:** Записывать сгенерированный конфиг в доступный для записи каталог (`/tmp`), а затем подключать его.

**Вариант C:** Выполнять entrypoint от root, затем понижать привилегии через `gosu` или `su-exec`.

---

## Проблема 2: BACKEND_HOST обязателен, хотя не используется для проксирования

### Описание

В нашей архитектуре внешний nginx обрабатывает всю маршрутизацию API. Внутренний nginx фронтенд-контейнера только раздаёт статику. Тем не менее, entrypoint-скрипт **требует** `BACKEND_HOST` для генерации корректного `nginx.conf` (он используется в блоке `upstream`).

Если `BACKEND_HOST` пустой или не задан — генерация конфига падает, и контейнер не стартует.

### Текущий обходной путь

```yaml
BACKEND_HOST: "smartwallet-api:80"
```

Мы указываем `BACKEND_HOST`, хотя внутренний nginx никогда не проксирует запросы к этому upstream (это делает внешний nginx).

### Рекомендуемое исправление

Сделать блок `upstream` и `proxy_pass` в `nginx.conf.template` условными. Если `BACKEND_HOST` не задан — пропустить upstream и location `/api/` целиком. Внутреннему nginx нужны только раздача статики и эндпоинт `/healthz`.

Пример условной генерации в `entrypoint.sh`:

```bash
if [ -n "${BACKEND_HOST}" ]; then
    envsubst '${BACKEND_HOST}' < /etc/nginx/templates/proxy.conf.template > /etc/nginx/conf.d/proxy.conf
fi
```

Либо задать значение по умолчанию в шаблоне nginx:

```nginx
upstream backend {
    server ${BACKEND_HOST:-127.0.0.1:8080};
}
```

В этом случае при отсутствии `BACKEND_HOST` upstream будет указывать на localhost, который никогда не будет затронут (запросы уходят через внешний nginx).

---

## Проблема 3: Health check (не требует исправления)

Health check корректно работает с `wget`, доступным в базовом образе `nginx:1.27-alpine`:

```yaml
test: ["CMD-SHELL", "wget -qO- http://localhost:8080/healthz || exit 1"]
```

Изменений не требуется.

---

## Итого: что нужно сделать

1. **Исправить права доступа**, чтобы контейнер мог работать от имени `appuser` (UID 1001) без `user: "0:0"` в docker-compose
2. **Сделать `BACKEND_HOST` опциональным**, чтобы фронтенд-контейнер мог стартовать без него при работе за внешним reverse proxy
3. После исправлений пересобрать и запушить образ:

```bash
docker build -t nasurino/smart-wallet-client:latest . && docker push nasurino/smart-wallet-client:latest
```

---

После обновления образа мы уберём `user: "0:0"` из docker-compose.yml на нашей стороне.