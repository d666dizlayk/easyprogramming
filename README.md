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
