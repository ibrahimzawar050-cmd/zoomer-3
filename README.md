# Zoomer

A small search site. The page is in `public/`, and `netlify/functions/search.mts` calls the search service.

## Setup
1. Push this folder to a GitHub repo.
2. In Netlify: Add new project > Import from Git > pick the repo. No build command needed.
3. In Site configuration > Environment variables, add ONE of:
   - `SERPER_API_KEY` (Google results via serper.dev)
   - `BRAVE_API_KEY` (Brave's own index)
   - `SEARXNG_URL` (address of your own SearXNG server, with JSON output enabled)
4. Redeploy. Open the site and search.
