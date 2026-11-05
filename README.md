# SDKR – Reliable Repairs. Better Living.
Full-stack appliance repair site: React+Vite+Tailwind client, Express+SQLite server.

## Run locally (Node 18+)
    cd server && cp .env.example .env   # edit ADMIN_PASSWORD and JWT_SECRET
    npm install && npm start            # API on :4000
    cd ../client && npm install && npm run dev   # site on :5173
Site: http://localhost:5173  Admin: http://localhost:5173/#/admin

## WhatsApp
After saving a booking, the site opens wa.me/919010274491 with a prefilled message. The customer must press Send in WhatsApp. Nothing is auto-sent.

## Optional SMS (Twilio)
Run `npm i twilio` in /server and set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, OWNER_PHONE in .env. If unset, SMS is skipped silently.

## PostgreSQL later
All SQL lives in server/index.js; swap better-sqlite3 for `pg` and change `?` placeholders to `$1..`.

## Production
Set NODE_ENV=production, CLIENT_ORIGIN to your domain, build client (`npm run build`) and serve dist/ behind HTTPS.
