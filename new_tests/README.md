# BuildaVault Test Suite

Comprehensive unit and integration tests for the LegoWebApp backend, LegoWebApp frontend, and LegoScannerApp mobile app.

## Structure

```
new_tests/
├── LegoWebApp.Tests/               # C# xUnit tests for the .NET backend
│   ├── Unit/
│   │   ├── Controllers/
│   │   │   ├── AuthControllerTests.cs
│   │   │   ├── AccountControllerTests.cs
│   │   │   ├── SearchControllerTests.cs
│   │   │   ├── SetsControllerTests.cs
│   │   │   └── VaultControllerTests.cs
│   │   ├── Services/
│   │   │   ├── EbayPriceCacheTests.cs
│   │   │   ├── EbayTokenCacheTests.cs
│   │   │   ├── RebrickableServiceTests.cs
│   │   │   └── SupabaseAuthServiceTests.cs
│   │   └── Utilities/
│   │       └── JwtHelperTests.cs
│   └── Integration/
│       ├── AuthIntegrationTests.cs
│       └── SetsIntegrationTests.cs
├── LegoWebApp.Frontend.Tests/      # Vitest tests for the React frontend
│   └── tests/
│       ├── api.test.js
│       ├── jwt.test.js
│       └── SetSearchInput.test.jsx
└── LegoScannerApp.Tests/           # Jest tests for the React Native mobile app
    └── tests/
        ├── auth.test.ts
        ├── collection.test.ts
        └── scanner.test.ts
```

## Running the Tests

### Backend (.NET)

```bash
cd new_tests/LegoWebApp.Tests
dotnet test
```

Run with detailed output:
```bash
dotnet test --logger "console;verbosity=detailed"
```

### Frontend (Vitest)

```bash
cd new_tests/LegoWebApp.Frontend.Tests
npm install
npm test
```

Watch mode:
```bash
npm run test:watch
```

### Mobile App (Jest)

```bash
cd new_tests/LegoScannerApp.Tests
npm install
npm test
```

Watch mode:
```bash
npm run test:watch
```

## What's Tested

### Backend Unit Tests

| Area | Tests |
|---|---|
| `JwtHelper` | Claim decoding, expired tokens, malformed JWTs, URL-safe base64 |
| `EbayPriceCache` | Cache hits/misses, TTL, null prices, overwrite |
| `EbayTokenCache` | Token refresh, cache reuse, concurrent calls, null factory |
| `RebrickableService` | Text search, year filter, mixed queries, API errors, result limiting |
| `SupabaseAuthService` | Login success/failure, signup, password reset, set CRUD |
| `AuthController` | Valid/invalid email, password length, security (forgot password leak) |
| `AccountController` | Password reset, email change validation, account deletion (503 guard) |
| `SetsController` | Auth guards, input validation, duplicate detection, CRUD responses |
| `SearchController` | Query length limits, empty queries, result forwarding |
| `VaultController` | Auth guard, null/empty body, Claude 503 passthrough, prediction shape |

### Backend Integration Tests

Full in-process HTTP tests using `WebApplicationFactory`:
- Auth endpoints with mocked Supabase responses
- Set endpoint input validation
- Unauthorized access protection

### Frontend Unit Tests

| File | Tests |
|---|---|
| `jwt.test.js` | Payload decoding, expiry checking, 30-second buffer, edge cases |
| `api.test.js` | All API functions — request shape, response mapping, error handling |
| `SetSearchInput.test.jsx` | Debounce, dropdown visibility, selection callback, rapid input |

### Mobile Unit Tests

| File | Tests |
|---|---|
| `auth.test.ts` | Auth headers, email/password validation, login/signup API calls |
| `collection.test.ts` | Fetch, add, delete, delete-all — request format and response handling |
| `scanner.test.ts` | LEGO detection, set number extraction, name matching score, scan/lookup API |
