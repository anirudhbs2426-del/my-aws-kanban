# Deploy Frontend to Vercel

This Phase 1 frontend is a static site, so Vercel can host it easily.

## What Vercel will host

Vercel will host the files inside `frontend/`.

## No-domain approach

You do not need to buy a domain for this setup.

The trick is:

- the browser talks only to Vercel over HTTPS
- Vercel forwards API requests to your EC2 backend using rewrites
- your EC2 backend can stay on plain HTTP for now

That avoids mixed-content browser errors without paying for a domain.

## Files involved

- `frontend/api.js`
- `frontend/vercel.json`

## How it works

1. The frontend calls `/health` and `/api/tasks` on the Vercel site.
2. Vercel proxies those requests to `http://3.110.81.154`.
3. The browser never sees the EC2 `http://` URL directly.
4. The frontend stays happy because it only talks to `https://your-vercel-project.vercel.app`.

## Important frontend setting

For production, the frontend should use the Vercel origin as its base URL.
That is now handled automatically in `frontend/api.js`.

For local development, it still uses:

```text
http://localhost:5000
```

## Basic deployment steps

1. Push this repository to GitHub.
2. Create a Vercel account.
3. Import the GitHub repository into Vercel.
4. Set the Vercel root directory to `frontend`.
5. Deploy the project.

## Backend setting to keep in sync

On EC2, `FRONTEND_ORIGIN` should include your local dev URL and the Vercel URL, for example:

```text
FRONTEND_ORIGIN=http://localhost:5500,https://your-project.vercel.app
```

## After deployment

Open the Vercel frontend URL and make sure:

- the page loads
- the backend health check succeeds
- tasks can be created and updated
- drag-and-drop still works