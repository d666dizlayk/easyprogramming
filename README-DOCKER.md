# EasyProgramming: Docker и первый production deployment

## Архитектура

```text
Internet
   ↓
Nginx :80
   ├── /        → Next.js :3000
   ├── /api/    → NestJS :3001
   └── /uploads → NestJS :3001
                         ↓
                    PostgreSQL :5432
```

Внешний порт приложения — только `80`. PostgreSQL и NestJS доступны внутри Docker-сети.

## Что нужно на сервере

- Linux-сервер с открытым TCP-портом 80;
- Docker Engine;
- Docker Compose plugin;
- домен пока не обязателен: сначала можно проверить работу по IP.

## Первый запуск

Из корня репозитория:

```bash
cp .env.example .env
```

Обязательно поменяй как минимум:

```env
POSTGRES_PASSWORD=длинный_случайный_пароль
JWT_SECRET=длинный_случайный_секрет
CORS_ORIGIN=http://SERVER_IP
```

Если позже появится домен, используй, например:

```env
CORS_ORIGIN=https://example.com
```

Для **первой пустой базы** текущая версия ожидает:

```env
DB_SYNCHRONIZE=true
```

Это bootstrap-режим: TypeORM создаёт таблицы из entity. Постоянно держать `synchronize=true` в production не рекомендуется. После добавления migrations перейдём на `false`.

Запуск:

```bash
docker compose up -d --build
```

Проверка:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f nginx
```

Открой `http://SERVER_IP`.

## Администратор

После того как приложение один раз создало таблицы, открой `scripts/create-admin.sql`, замени email, username и пароль и выполни SQL внутри PostgreSQL-контейнера.

Подключение:

```bash
docker compose exec postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Затем вставь содержимое SQL-файла.

## Обновление

```bash
git pull
docker compose up -d --build
```

`postgres_data` хранит БД, `backend_uploads` хранит пользовательские аватары. Обычная команда `docker compose down` volumes не удаляет.

## Полное удаление данных

```bash
docker compose down -v
```

Эта команда удаляет volumes, включая базу и загруженные аватары.

## Почему backend использует `postgres`, а не `localhost`

Внутри Docker `localhost` означает текущий контейнер. Поэтому backend подключается к PostgreSQL по имени сервиса:

```env
DB_HOST=postgres
```

Frontend в production собирается с:

```env
NEXT_PUBLIC_API_URL=/api
```

Nginx превращает `/api/...` в запрос к backend.

## Следующий production-этап

После проверки работы по IP:

```text
DNS → домен → Nginx :443 → Let's Encrypt → HTTPS
```

Отдельно нужно добавить TypeORM migrations и отключить `DB_SYNCHRONIZE` в рабочей production-схеме.
