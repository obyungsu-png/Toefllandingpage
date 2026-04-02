
  # TOEFL Allmyexam

  This is a code bundle for TOEFL Allmyexam. The original project is available at https://www.figma.com/design/Kc8tw3AqEy9IMpFnyTTFUr/TOEFL-Allmyexam.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Environment variables

  API calls are sent to a Supabase Edge Function. The base URL is assembled from
  two optional Vite environment variables (see `.env.example`):

  | Variable | Default | Description |
  |---|---|---|
  | `VITE_SERVER_ORIGIN` | `https://<PROJECT_ID>.supabase.co/functions/v1` | Scheme + host up to (but not including) the function path |
  | `VITE_SERVER_BASE_PATH` | `/make-server-e46cd33a` | Path prefix expected by the edge-function router |

  The resulting base URL is `${VITE_SERVER_ORIGIN}${VITE_SERVER_BASE_PATH}`.

  ### Vercel deployment

  No environment variables are required for a standard Vercel deployment — the
  defaults point to the production Supabase project.  If you fork the project and
  deploy your own Supabase backend, add `VITE_SERVER_ORIGIN` and/or
  `VITE_SERVER_BASE_PATH` in the Vercel project's **Settings → Environment
  Variables** panel.
  