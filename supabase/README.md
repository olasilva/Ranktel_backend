# Supabase setup

1. Create a Supabase project.
2. Run [`migrations/001_initial.sql`](./migrations/001_initial.sql) in the Supabase SQL Editor.
3. Copy `.env.example` to `.env`.
4. Set `SUPABASE_URL` and the project **service-role** key in `.env`.
5. Start the API with `npm run dev`.

The backend uses Supabase when both variables are configured. If they are blank,
it continues using the local `data/*.json` store. The service-role key must remain
server-side and must never be sent to a browser.

## Deployment

Build and run the included Docker image:

```sh
docker build -t ranktel-backend .
docker run --env-file .env -p 5000:5000 ranktel-backend
```

For hosted deployments, configure the variables from `.env.example` in the
provider's environment/secrets settings instead of uploading `.env`.

## Render deployment

1. Push this repository to GitHub or another Git provider.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render detects [`render.yaml`](../render.yaml), creates the `ranktel-backend`
   web service, and installs dependencies with `npm ci`.
4. Set `CLIENT_ORIGIN` to the deployed frontend URL.
5. Add the Supabase URL and service-role key when the migration has been run.
6. Add the Paystack secret key if online payments should be enabled.

Render supplies `PORT`; the Blueprint uses port `10000` for local consistency,
and the service health check is `/api/health`. Do not upload `.env`; keep
production secrets in Render's environment settings.
