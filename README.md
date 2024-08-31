# Team Health Dashboard

Gathers information from your github repository and from your google sheet, to render a dashboard with relevant team statistics.

## APIs

### Public Endpoints

- `GET /healthcheck`: Returns the current health status of the API.

### Protected Endpoints (Require Authentication)

- `GET /api/metrics`: Streams metrics data with real-time progress updates.

`Request`

- Method: GET
- URL: `/api/metrics`
- Headers: `Authorization: Bearer <access_token>`
- Query Parameters:
  - `timePeriod` (optional): Number of days to fetch data for. Default is 90 days.

`Response`

This endpoint uses Server-Sent Events (SSE) to provide real-time updates on the data fetching progress and the final result.

`Progress Events`

```js
event: progress
data: {
  "progress": number,
  "message": string,
  "current": number,
  "total": number
}
```

- `progress`: A number between 0 and 100 representing the percentage of completion.
- `message`: A string describing the current status of the operation.

`Result Event`

```js
event: result
data: {
  "success": boolean,
  "data": [
    {
      "id": string,
      "metric_category": string,
      "metric_name": string,
      "value": number,
      "timestamp": string,
      "unit": string,
      "additional_info": string,
      "source": string
    },
    ...
  ],
  "errors": string[],
  "status": number,
  "githubStats": {
    "totalPRs": number,
    "fetchedPRs": number,
    "timePeriod": number
  }
}
```

`Error Event`

```js
event: error
data: {
  "success": false,
  "errors": [
    {
      "source": string,
      "message": string
    }
  ],
  "status": number
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
