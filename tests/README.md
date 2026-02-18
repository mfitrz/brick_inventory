# Tests Documentation

This folder contains two test suites:

- `test_api.py`: local unit/integration tests using `FastAPI TestClient` + in-memory SQLite.
- `test_api_live.py`: live integration tests against the deployed API.

Shared fixtures and test setup live in `conftest.py`.

## Quick Start

Run local tests only:

```powershell
pytest -q tests/test_api.py
```

Run live tests only:

```powershell
pytest -q tests/test_api_live.py
```

Run everything:

```powershell
pytest -q tests
```

## Shared Setup (`conftest.py`)

`conftest.py` does the following:

- Loads `.env` from the repo root.
- Forces `DATABASE_URL=sqlite:///:memory:` for non-live tests.
- Sets fallback auth env vars for tests (`SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- Provides helpers/fixtures:
  - `make_token(...)`: creates signed HS256 JWTs with `sub` + `aud=authenticated`.
  - `db_engine`: fresh in-memory DB per test; monkeypatches `lego_inventory.engine`.
  - `client`: `TestClient(app, raise_server_exceptions=False)`.
  - `auth_headers`: returns a callable that creates `Authorization: Bearer <token>` headers.

## Local Test Suite (`test_api.py`)

All tests in this file run without external services.

### Collection and Add

- `test_list_sets_starts_empty_for_new_user`: `GET /sets` returns empty list for new user.
- `test_add_set_returns_confirmation_with_set_number`: `POST /sets` returns `200` with `{"message":"Added","set_number":...}`.
- `test_add_and_list_sets_sorted_by_set_number`: list response is ordered ascending by `set_number`.
- `test_add_duplicate_set_returns_409`: duplicate `(user_id, set_number)` returns `409`.
- `test_add_set_validates_required_params`: missing `set_number`/`set_name` returns `422`.

### User Isolation

- `test_list_sets_is_scoped_to_authenticated_user`: one user cannot see another user’s sets.

### Delete One (`DELETE /sets`)

- `test_remove_set_returns_404_when_set_does_not_exist`: deleting missing set returns `404`.
- `test_remove_set_deletes_only_for_current_user`: deleting for user A does not delete same set number for user B.

### Delete All (`DELETE /delete_sets`)

- `test_delete_all_sets_succeeds_on_empty_collection`: endpoint is idempotent and returns `200` on empty collection.
- `test_delete_all_sets_clears_only_current_users_collection`: delete-all affects only caller’s rows.

### Auth Enforcement

- `test_endpoints_require_auth` (parametrized):
  - `GET /sets`
  - `POST /sets`
  - `DELETE /sets`
  - `DELETE /delete_sets`
  - Expected: `401` or `403` when missing auth.
- `test_malformed_token_is_rejected`: malformed JWT is rejected (status in `401/403/500` depending on auth fallback path).
- `test_token_signed_with_wrong_secret_is_rejected`: invalid signature is rejected (status in `401/403/500`).
- `test_token_missing_sub_claim_is_rejected`: JWT without `sub` returns `401`.

### DB Constraint Verification

- `test_supabase_unique_constraint_exists`: verifies at least one unique constraint exists on `lego_sets`.
- `test_supabase_unique_constraint_on_user_id_and_set_number`: verifies unique constraint on `(user_id, set_number)`.

## Live Test Suite (`test_api_live.py`)

These tests hit real HTTP endpoints and will be skipped unless `LIVE_API_URL` is set.

### Required Environment for Live Tests

Set these in `.env` (or shell):

```env
LIVE_API_URL=https://your-azure-api-url
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
TEST_USER_EMAIL=real_supabase_test_user_email
TEST_USER_PASSWORD=real_supabase_test_user_password
```

Notes:

- Live tests sign in through Supabase Auth (`/auth/v1/token?grant_type=password`) to get a real access token.
- A real test account is required so DB foreign-key checks against `auth.users` pass.

### Live Fixture Behavior

- `live_user` fixture:
  - signs in and builds auth headers
  - extracts user id from token payload
  - calls `DELETE /delete_sets` before and after each test for cleanup

### Live Tests

- `test_live_jwt_secret_authenticates`: valid signed-in token can call `GET /sets` (`200`).
- `test_live_wrong_jwt_secret_rejected`: forged token is rejected (`401`, `403`, or `503`).
- `test_live_add_and_list_set`: add then list confirms inserted set is present.
- `test_live_sets_sorted_by_set_number`: list ordering is ascending.
- `test_live_duplicate_set_returns_409`: duplicate add returns `409`.
- `test_live_remove_set`: add then delete removes target set.
- `test_live_remove_nonexistent_set_returns_404`: deleting absent set returns `404`.
- `test_live_delete_all_sets`: delete-all empties collection.
