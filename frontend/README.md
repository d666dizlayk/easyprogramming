# EasyProgramming Frontend

Next.js frontend for EasyProgramming.

## Local development

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

The frontend uses `http://localhost:3001` as the backend by default. You can override it with `NEXT_PUBLIC_API_URL` in `.env.local`.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For the production Docker build behind Nginx, use:

```env
NEXT_PUBLIC_API_URL=/api
```
