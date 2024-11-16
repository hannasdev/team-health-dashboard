# Team Health Dashboard

Gathers information from your github repository and from your google sheet, to render a dashboard with relevant team statistics.

## Middleware Stack

The application uses several middleware layers to handle security, authentication, and request processing:

### Security Middleware

1. **Security Headers Middleware**

   - Sets secure HTTP headers
   - Configures Content Security Policy (CSP)
   - Enables XSS protection
   - Sets HSTS headers
   - Controls frame options
   - Prevents MIME type sniffing

2. **Rate Limiting Middleware**

   - Protects against brute force attacks
   - Limits requests per IP address
   - Configurable time windows and request limits
   - Returns 429 (Too Many Requests) when limit exceeded

3. **CORS Middleware**
   - Manages Cross-Origin Resource Sharing
   - Configurable allowed origins
   - Supports wildcard or specific origin lists
   - Handles preflight OPTIONS requests
   - Sets appropriate CORS headers

### Authentication Middleware

1. **Auth Middleware**
   - Validates JWT tokens
   - Handles token expiration
   - Manages token refresh
   - Controls access to protected routes
   - Provides user context to requests

### Request Processing

1. **Body Parser Middleware**

   - Parses JSON request bodies
   - Handles URL-encoded data
   - Configurable size limits
   - Protects against oversized payloads

2. **Error Handler Middleware**
   - Catches and processes all errors
   - Provides consistent error responses
   - Handles different error types
   - Logs errors appropriately

## APIs

### Public Endpoints

- `GET /health`: Returns the current health status of the API.

### Protected Endpoints (Require Authentication)

- `GET /api/metrics/sync`: Initiates a sync of metrics from GitHub and Google Sheets.

- Method: GET
- URL: `/api/metrics/sync`
- Headers: `Authorization: Bearer <access_token>`

`Response`

- Success (200 OK):

```json
{
  "success": true,
  "data": {
    "message": "Metrics synced successfully"
  }
}
```

- `GET /api/metrics/reset-database`

- Method: GET
- URL: `/api/metrics/reset-database`
- Headers: `Authorization: Bearer <access_token>`

`Response`

- Success (200 OK):

```json
{
  "success": true,
  "data": {
    "message": "Database reset successfully"
  }
}
```

- `GET /api/metrics`: Retrieves metrics from github and google sheet

`Request`

- Method: GET
- URL: `/api/metrics`
- Headers: `Authorization: Bearer <access_token>`
- Query Parameters:
  - `timePeriod` (optional): Number of days to fetch data for. Default is 90 days.

`Response`

- Success (200 OK):

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "_id": "670a76828d9d1330dac959e9",
        "metric_category": "Code Quality",
        "metric_name": "Build Success",
        "value": 95,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "percent",
        "additional_info": "",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959ea",
        "metric_category": "Quality",
        "metric_name": "Bug Resolution",
        "value": 2.5,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "days",
        "additional_info": "",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959e5",
        "metric_category": "Sprint Metrics",
        "metric_name": "Burndown",
        "value": 30,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "percent",
        "additional_info": "Sprint 23, Day 3",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959e8",
        "metric_category": "Code Quality",
        "metric_name": "PR Size (avg)",
        "value": 250,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "lines",
        "additional_info": "",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959e6",
        "metric_category": "Efficiency",
        "metric_name": "Cycle Time",
        "value": 3.5,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "days",
        "additional_info": "",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959e4",
        "metric_category": "Sprint Metrics",
        "metric_name": "Sprint Velocity",
        "value": 45,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "points",
        "additional_info": "Sprint 23",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959ec",
        "metric_category": "Team Health",
        "metric_name": "Happiness Index",
        "value": 4.2,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "score",
        "additional_info": "Scale: 1-5",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959eb",
        "metric_category": "Sprint Metrics",
        "metric_name": "Goal Achievement",
        "value": 80,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "percent",
        "additional_info": "Sprint 23",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959e2",
        "metric_category": "Workflow",
        "metric_name": "WIP Items",
        "value": 5,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "items",
        "additional_info": "",
        "source": "Google Sheets"
      },
      {
        "_id": "670a76828d9d1330dac959e7",
        "metric_category": "Efficiency",
        "metric_name": "Code Review Time",
        "value": 1.2,
        "timestamp": "2023-08-01T00:00:00.000Z",
        "unit": "days",
        "additional_info": "",
        "source": "Google Sheets"
      }
    ],
    "githubStats": {
      "totalPRs": 168,
      "fetchedPRs": 0,
      "timePeriod": 90
    },
    "totalMetrics": 180
  }
}
```

### Authentication Endpoints

- `POST /api/auth/register`: Registers a new user.
- `POST /api/auth/login`: Authenticates a user and returns access and refresh tokens.
- `POST /api/auth/refresh`: Refreshes an expired access token using a valid refresh token.

`POST /api/auth/register`

### Register a New User

- **Endpoint**: `POST /api/auth/register`
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

`Response`

- Success (201 Created):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

- Error (409 Conflict):

```json
{
  "error": "User already exists"
}
```

### Login

`POST /api/auth/login`

Authenticates a user and returns a JWT token.

`Request`

- Method: POST
- URL: `/api/auth/login`
- Body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

`Response`

- Success (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

- Error (401 Unauthorized):

```json
{
  "error": "Invalid credentials"
}
```

Note: The JWT token returned by both register and login endpoints should be included in the Authorization header for subsequent authenticated requests.

### Refresh Token

`POST /api/auth/refresh`

Refreshes access token with a refresh token.

- Method: POST
- URL: `/api/auth/refresh`
- Body:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- Success (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- Error (401 Unauthorized):

```json
{
  "error": "Invalid refresh token"
}
```

### Logout

`POST /api/auth/logout`

- Headers: `Authorization: Bearer <access_token>`
- Body:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- Success (204 No Content)

- Error (401 Unauthorized):

```json
{
  "error": "Invalid token"
}
```

## Configuration

### Middleware Configuration

```typescript
// CORS Configuration
{
  CORS_ORIGIN: 'http://localhost:3000,http://example.com' // comma-separated list of allowed origins
}

// Rate Limit Configuration
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // requests per window
}

// Security Headers Configuration
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}
```

## Development

Here's a basic example of how to use these endpoints in a JavaScript client:

```javascript
const API_URL = 'http://your-api-url';
let accessToken = '';
let refreshToken = '';

// Function to handle authentication
async function authenticate(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (response.ok) {
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    return true;
  }
  return false;
}

// Function to refresh the token
async function refreshAccessToken() {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json();
  if (response.ok) {
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    return true;
  }
  return false;
}

// Function to fetch metrics
function fetchMetrics(timePeriod = 90) {
  const eventSource = new EventSource(
    `${API_URL}/api/metrics?timePeriod=${timePeriod}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  eventSource.onmessage = event => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);
  };

  eventSource.addEventListener('progress', event => {
    const progress = JSON.parse(event.data);
    console.log('Progress:', progress);
  });

  eventSource.addEventListener('result', event => {
    const result = JSON.parse(event.data);
    console.log('Final result:', result);
    eventSource.close();
  });

  eventSource.onerror = error => {
    console.error('EventSource failed:', error);
    eventSource.close();
  };
}

// Usage
authenticate('user@example.com', 'password').then(success => {
  if (success) {
    fetchMetrics();
  }
});
```

Utilises the MVC-pattern with dependency injection and inversion of control for improved testability.

## Conventional Commits

```txt
feat: add user authentication API
fix: resolve data race condition in job queue
BREAKING CHANGE: refactor API response format
```

## Semantic Versioning

MAJOR.MINOR.PATCH e.g. `1.2.3`

- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

## Release Process

1. Develop features in feature branches
2. Merge feature branches into main using pull requests
3. CI/CD pipeline automatically bumps version based on commit messages
4. CI/CD pipeline generates changelog and creates a new Git tag
5. CI/CD pipeline pushes the new version and changelog to the repository
