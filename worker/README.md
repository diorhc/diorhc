# Diorhc 3D Guestbook Worker (Cloudflare Workers + KV)

Бесплатный лёгкий бэкенд для общей 3D-доски посланий на портфолио (`GET /api/message`, `POST /api/message`) с валидацией символов, запретом URL и защитой от спама (rate-limit по IP).

## Быстрый деплой

1. Установите зависимости:
   ```bash
   cd worker
   npm install
   ```
2. Авторизуйтесь в Cloudflare и создайте KV namespace:
   ```bash
   npx wrangler login
   npx wrangler kv namespace create GUESTBOOK_KV
   ```
3. Вставьте полученный `id` в `worker/wrangler.toml`.
4. Задеплойте Worker:
   ```bash
   npx wrangler deploy
   ```
   Вы получите URL вида `https://diorhc-3d-guestbook.<your-subdomain>.workers.dev`.
5. В настройках GitHub-репозитория (`Settings -> Secrets and variables -> Actions -> Variables`) добавьте переменную `PUBLIC_GUESTBOOK_API_URL` с этим URL — и пересоберите GitHub Pages.
