# Token Platform Scaffold

Isolated scaffold for a Django (DRF + Channels + Celery) backend and React (Vite + Tailwind) frontend, with Postgres and Redis via Docker Compose.

## Structure
- `backend/`: Django project `tokenplatform`
- `frontend/`: React + Vite + Tailwind app
- `docker-compose.yml`: db, redis, backend (Daphne), celery, frontend
- `docker-compose.prod.yml`: example production compose (db, redis, backend, celery)

## Backend env (.env)
```
SECRET_KEY=dev-secret-key
DEBUG=1
ALLOWED_HOSTS=*

POSTGRES_DB=token_db
POSTGRES_USER=token_user
POSTGRES_PASSWORD=token_pass
POSTGRES_HOST=db
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

VAT_RATE=0.15
PLATFORM_COMMISSION_RATE=0.25
GATEWAY_RATE=0.03
GATEWAY_FIXED=2.00
CHAPA_SECRET=
CHAPA_PUBLIC=
TELEBIRR_API_KEY=
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
MIN_WITHDRAWAL_ETB=500
```

## Money utilities
- `backend/apps/payments/utils/money.py`
- Tests: `backend/tests/test_money.py`

## Quickstart
1. Build and start services:
```
docker compose up --build -d
```
2. Run tests:
```
docker compose run --rm backend pytest
```
3. Check backend health:
```
curl http://localhost:8000/health/
```
4. Open frontend:
- http://localhost:3000

## System requirements
- Python 3.11
- Node 18+
- Postgres 15+
- Redis 7+
- Celery 5.x worker (with Redis broker)
- Channels ASGI server (Daphne)

## Environment variables (backend/.env checklist)
- App: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- Database: `USE_SQLITE` (dev) or `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- Redis/Celery: `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- Money: `VAT_RATE`, `PLATFORM_COMMISSION_RATE`, `GATEWAY_RATE`, `GATEWAY_FIXED`, `COINS_PER_ETB`, `MIN_WITHDRAWAL_ETB`
- Limits: `MAX_DAILY_WITHDRAWAL_ETB`, `MAX_MONTHLY_WITHDRAWAL_ETB`
- Risk controls: `RISK_TOPUPS_WINDOW_MIN`, `RISK_TOPUPS_COUNT`, `RISK_GIFTS_ETB_WINDOW_MIN`, `RISK_GIFTS_ETB_THRESHOLD`, `RISK_WITHDRAWALS_SAME_DEST_THRESHOLD`
- Integrations: `CHAPA_SECRET`, `CHAPA_PUBLIC`, `TELEBIRR_API_KEY`
- URLs: `BASE_URL`, `FRONTEND_URL`
- Optional: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `ENVIRONMENT`, `KYC_ENCRYPTION_KEY`, `GIFTS_SEND_RATE`

## Running locally (without Docker)
Backend (Windows PowerShell):
```
cd token_platform/backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

Celery worker (separate terminal):
```
cd token_platform/backend
. .venv\Scripts\Activate.ps1
celery -A tokenplatform.celery worker -l info
```

Daphne ASGI server (optional alternative to runserver):
```
cd token_platform/backend
. .venv\Scripts\Activate.ps1
python -m daphne -b 0.0.0.0 -p 8000 tokenplatform.asgi:application
```

Frontend:
```
cd token_platform/frontend
npm install
npm run dev
```

## Running locally (Docker)
```
cd token_platform
docker compose up --build -d
```

## Production deployment (example)
Use `docker-compose.prod.yml` as a starting point (behind Nginx/Traefik with TLS). Ensure backups for Postgres volume.
```
cd token_platform
docker compose -f docker-compose.prod.yml up -d --build
```

### Reverse proxy (Nginx) example
An example config is provided at `deploy/nginx.conf.example`.
- Run Nginx in front of the backend (Daphne) and terminate TLS at the proxy.
- Make sure to pass `Upgrade`/`Connection` headers for WebSockets.

Example docker run (adjust volumes/paths):
```
docker run -d --name nginx -p 80:80 \
  --network token_platform_default \
  -v %cd%/deploy/nginx.conf.example:/etc/nginx/nginx.conf:ro \
  -v %cd%/backend/staticfiles:/static:ro \
  -v %cd%/backend/media:/media:ro \
  nginx:alpine
```
Note: Use a proper compose service in production and enable HTTPS.

## Database migrations & seed data
Run migrations:
```
cd token_platform/backend
. .venv\Scripts\Activate.ps1  # if using venv
python manage.py migrate
```

Seed gifts and packages (idempotent):
```
python manage.py seed_gifts_and_packages
```

Create admin user:
```
python manage.py createsuperuser
```

### Env template
Copy `backend/.env.example` to `backend/.env` and tailor values for your environment. In production, set strong `SECRET_KEY`, provide Postgres/Redis endpoints, real payment keys, and a secure `KYC_ENCRYPTION_KEY` (Fernet key).

## Tests
Run tests locally:
```
cd token_platform/backend
. .venv\Scripts\Activate.ps1
pytest
```

With coverage:
```
pytest --cov=apps --cov-report=term-missing
```

## Makefile tasks
Convenience targets (Linux/macOS). On Windows, run the underlying docker compose commands or use WSL:
- `make up` / `make down` / `make build` / `make logs`
- `make migrate` / `make seed` / `make createsuperuser`
- `make test` / `make test-cov`
- `make prod-up` / `make prod-down`
- `make db-backup` / `make db-restore FILE=...`

## Backups & restore (Postgres)
Linux/macOS:
```
mkdir -p backups
docker compose exec -T db pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > backups/backup_$(date +%Y%m%d_%H%M%S).sql
# Restore
docker compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < backups/backup_YYYYMMDD_HHMMSS.sql
```

Windows PowerShell (simplest form):
```
mkdir backups -ErrorAction SilentlyContinue
docker compose exec -T db pg_dump -U token_user -d token_db > backups\backup_$(Get-Date -Format yyyyMMdd_HHmmss).sql
# Restore
docker compose exec -T db psql -U token_user -d token_db < backups\backup_YYYYMMDD_HHMMSS.sql
```

## Admin and manual payout procedures
Open Django Admin: http://localhost:8000/admin/

- Approve withdrawals: In `Withdrawals`, select PENDING rows → action `Approve selected withdrawals`.
  - This marks them APPROVED and triggers payout. On success, status becomes PAID and wallet balances are updated.
- Re-run payouts: For APPROVED withdrawals that didn’t complete, select rows → action `Re-run payout for APPROVED withdrawals`.
- Reject withdrawals: Select PENDING rows → action `Reject selected withdrawals (releases holds)`.

Manual payout via shell (only if necessary):
```
python manage.py shell
>>> from apps.payments.tasks import process_withdrawal_payout
>>> process_withdrawal_payout(<withdrawal_id>)
```

Force mark PAID via shell (emergency only):
```
python manage.py shell
>>> from django.utils import timezone
>>> from apps.payments.models import WithdrawalRequest
>>> wd = WithdrawalRequest.objects.get(id=<id>)
>>> wd.status = WithdrawalRequest.Status.PAID
>>> wd.provider_ref = "MANUAL-PAID"
>>> wd.paid_at = timezone.now()
>>> wd.save(update_fields=["status","provider_ref","paid_at","updated_at"])
```

## Accounting notes (ledger sketch)
This is a non-binding sketch for finance; adapt to your jurisdiction. Current implementation calculates VAT and gateway fee at top-up time (see `CoinPackage` fields and `price_total_etb`, `vat_etb`, `gw_fee_etb`). Gift splits use `GiftTransaction` fields.

Terminology and fields:
- Top-up pricing: `base_etb`, `vat_etb`, `price_total_etb`, `gw_fee_etb`
- Gift split: `commission_gross`, `vat_on_commission`, `commission_net`, `creator_payout`

Option A — VAT recognized at top-up (matches current implementation)
1) Customer top-up (on payment success):
   - Dr Cash/Bank: `price_total_etb`
   - Cr VAT Payable: `vat_etb`
   - Cr Top-up Revenue: `base_etb`
   - Dr Gateway Fees Expense: `gw_fee_etb`
   - Cr Cash/Bank: `gw_fee_etb`

2) Gift sent (coins redeemed) — recognize platform commission, accrue creator payable:
   - Cr Platform Commission Revenue: `commission_gross`
   - Cr VAT Payable (on commission): `vat_on_commission`
   - Dr Creator Payout Expense: `creator_payout`
   - Cr Creator Payable (liability): `creator_payout`

3) Payout to creator (on PAID):
   - Dr Creator Payable: `creator_payout`
   - Cr Cash/Bank: `creator_payout`

Option B — Coins as liability (defer revenue until redemption)
1) Customer top-up:
   - Dr Cash/Bank: `price_total_etb`
   - Cr VAT Payable: `vat_etb` (if VAT is charged at top-up; otherwise defer)
   - Cr Deferred Revenue (Coins Liability): `base_etb`
   - Dr Gateway Fees Expense: `gw_fee_etb`
   - Cr Cash/Bank: `gw_fee_etb`

2) Gift sent:
   - Dr Deferred Revenue (Coins Liability): `value_etb`
   - Cr Platform Commission Revenue: `commission_gross`
   - Cr VAT Payable (on commission): `vat_on_commission`
   - Dr Creator Payout Expense: `creator_payout`
   - Cr Creator Payable: `creator_payout`

3) Payout to creator:
   - Dr Creator Payable: `creator_payout`
   - Cr Cash/Bank: `creator_payout`

Note: Choose a single approach (A or B) and align tax recognition with your local rules.
