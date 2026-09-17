# EasyProgramming

EasyProgramming — платформа, которая соединяет реальные IT-задачи бизнеса со студентами и junior-разработчиками.

## Стек

- Frontend: Next.js + React + TypeScript
- Backend: NestJS + TypeORM
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Production: Docker Compose + Nginx

## Структура

```text
.
├── frontend/
├── backend/
├── nginx/
├── scripts/
├── docker-compose.yml
└── .env.example
```

## Локальная разработка

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# заполни DB_PASSWORD и JWT_SECRET
npm run start:dev
```

Backend: `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend: `http://localhost:3000`

## GitHub

В репозиторий отправляется только исходный код. Реальные `.env`, `backend/backend.env`, `node_modules`, `.next`, `dist` и загруженные пользователями файлы в репозиторий не входят.

Первый push из корня проекта:

```bash
git init
git branch -M main
git add .
git commit -m "Initial EasyProgramming release"
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

## Production через Docker

На сервере нужен Docker Engine с Docker Compose. После клонирования проекта:

```bash
git clone https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
cp .env.example .env
```

Заполни `.env` реальными значениями: пароль PostgreSQL, длинный случайный `JWT_SECRET`, `CORS_ORIGIN` и остальные параметры. `.env` не коммитится.

Для первой установки пустой базы текущий проект использует `DB_SYNCHRONIZE=true`, чтобы TypeORM создал схему. Запусти:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Сайт будет доступен через Nginx на `http://SERVER_IP`.

После успешного первого запуска создай администратора по инструкции в [`README-DOCKER.md`](./README-DOCKER.md) и SQL-файлу [`scripts/create-admin.sql`](./scripts/create-admin.sql).

Для production-цикла стоит перейти на TypeORM migrations и после этого отключить `DB_SYNCHRONIZE`. Пока миграции не добавлены, не меняй это значение на `false` на новой пустой базе — схема автоматически не создастся.

## Обновление на сервере

```bash
git pull
docker compose up -d --build
```

PostgreSQL и загруженные аватары хранятся в Docker volumes и не должны теряться при обычном `docker compose down`. Не используй `docker compose down -v`, если не хочешь удалить данные volumes.

## Домен и HTTPS

Текущий Compose поднимает HTTP на порту 80. После проверки по IP можно направить DNS домена на сервер и добавить HTTPS через Nginx + Let's Encrypt. Это следующий отдельный этап после проверки базового deployment.

## Smoke-test после deployment

1. Открывается главная страница.
2. Регистрация создаёт пользователя.
3. Логин возвращает рабочую сессию.
4. `/users/me` работает.
5. Стек сохраняется и переживает перезагрузку страницы.
6. `default-avatar.png` используется для нового пользователя.
7. Загруженный avatar переживает перезапуск контейнера благодаря `backend_uploads`.
8. Бизнес создаёт задачу.
9. Программист подаёт заявку.
10. Администратор видит и обрабатывает заявку.
11. Программист получает назначенную задачу.
