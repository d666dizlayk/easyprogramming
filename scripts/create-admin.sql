-- Run inside PostgreSQL after the first application start.
-- Replace the values below before executing.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "user" (email, password, username, role, stack, bio, avatar, "isAdmin", exp)
VALUES (
  'admin@example.com',
  crypt('CHANGE_THIS_PASSWORD', gen_salt('bf', 12)),
  'admin',
  'programmer',
  '[]'::jsonb,
  'Администратор EasyProgramming',
  'default-avatar.png',
  true,
  0
)
ON CONFLICT DO NOTHING;
