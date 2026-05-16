# For_Funsies

This project demonstrates a Dockerized PostgreSQL database connected to an Express API and an Angular frontend.

## What it includes

- `docker-compose.yml` to run:
  - `db` — PostgreSQL database
  - `api` — Node/Express backend
  - `frontend` — Angular application
- `backend/` with API endpoints and database connection
- `backend/db/init.sql` for initial sample data
- `frontend/` with Angular UI and table filtering

## Startup

From the project root (`For_Funsies`):

```powershell
docker compose up --build
```

This will start:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000`
- PostgreSQL: port `5432`

## API endpoints

- `GET /api/health`
  - Returns `{ status: 'ok' }`
- `GET /api/items`
  - Returns filtered items from the database
  - Query parameters:
    - `search` — text search on `name` or `description`
    - `category` — exact category match
    - `minPrice` — minimum price
    - `maxPrice` — maximum price
- `GET /api/drawings`
  - Returns Powerball drawing results from the database
  - Query parameters:
    - `date` — exact draw date (YYYY-MM-DD)
    - `minDate` — earliest draw date
    - `maxDate` — latest draw date
    - `ball` — matching white ball number in any position
    - `powerball` — matching Powerball number
    - `powerPlay` — Power Play text filter (e.g. `2x`, `3x`)

Example:

```powershell
curl "http://localhost:3000/api/items?search=power&category=Ticket&minPrice=1&maxPrice=5"
```

## Frontend

The Angular app shows the result table and filter form. Use the filter boxes and click `Apply Filters` to query the API.

## Notes

- Database seed data lives in `backend/db/init.sql`
- Backend service reads connection values from environment variables configured in `docker-compose.yml`
- If you change ports or API URL, update `frontend/src/environments/environment.ts`
