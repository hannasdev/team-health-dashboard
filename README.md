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
- Query Parameters:
  - `timePeriod` (optional): Number of days to fetch data for. Default is 90 days.

`Response`

This endpoint uses Server-Sent Events (SSE) to provide real-time updates on the data fetching progress and the final result.

`Progress Events`

```js
event: progress
data: {"progress": number, "message": string}
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

Registers a new user.

`Request`

- Method: POST
- URL: `/api/auth/register`
- Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

`Response`

- Success (201 Created):

```json
{
  "token": "jwt_token_here"
}
```

- Error (400 Bad Request):

```json
{
  "message": "User already exists"
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
  "password": "password123"
}
```

`Response`

- Success (200 OK):

```json
{
  "token": "jwt_token_here"
}
```

- Error (401 Unauthorized):

```json
{
  "message": "Invalid credentials"
}
```

Note: The JWT token returned by both register and login endpoints should be included in the Authorization header for subsequent authenticated requests.

## Development

Utilises the MVC-pattern with dependency injection and inversion of control for improved testability.
