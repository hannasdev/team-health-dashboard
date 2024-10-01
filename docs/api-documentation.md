# Team Health Dashboard API Documentation

## Overview

The Team Health Dashboard API provides endpoints for managing team health metrics and user authentication. This API allows users to register, log in, refresh tokens, log out, retrieve metrics, and sync metrics data.

## Base URL

The base URL for all API endpoints is:

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid access token to be included in the request header.

### Token Format

Include the access token in the Authorization header of your requests:

```
Authorization: Bearer <your_access_token>
```

## Endpoints

### Authentication

#### Register a New User

- **URL**: `/auth/register`
- **Method**: POST
- **Description**: Register a new user and receive access and refresh tokens.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**: 201 Created
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_id",
        "email": "user@example.com"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response**: 409 Conflict if user already exists

#### Log In

- **URL**: `/auth/login`
- **Method**: POST
- **Description**: Log in an existing user and receive access and refresh tokens.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**: 200 OK
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_id",
        "email": "user@example.com"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response**: 401 Unauthorized if credentials are invalid

#### Refresh Token

- **URL**: `/auth/refresh`
- **Method**: POST
- **Description**: Refresh the access token using a valid refresh token.
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Success Response**: 200 OK
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response**: 401 Unauthorized if refresh token is invalid

#### Log Out

- **URL**: `/auth/logout`
- **Method**: POST
- **Description**: Log out a user by invalidating their refresh token.
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Success Response**: 204 No Content
- **Error Response**: 401 Unauthorized if not authenticated

### Metrics

#### Get All Metrics

- **URL**: `/metrics`
- **Method**: GET
- **Description**: Retrieve all metrics with pagination.
- **Authentication**: Required
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `pageSize` (optional, default: 20): Number of items per page
- **Success Response**: 200 OK
  ```json
  {
    "success": true,
    "data": {
      "metrics": [
        {
          "_id": "metric_id",
          "metric_category": "category",
          "metric_name": "name",
          "value": 42,
          "timestamp": "2023-09-23T12:00:00Z",
          "unit": "unit",
          "additional_info": "info",
          "source": "source"
        }
      ],
      "githubStats": {
        "totalPRs": 100,
        "fetchedPRs": 50,
        "timePeriod": 30
      }
    }
  }
  ```
- **Error Response**: 401 Unauthorized if not authenticated

#### Sync Metrics

- **URL**: `/metrics/sync`
- **Method**: POST
- **Description**: Trigger a synchronization of metrics data.
- **Authentication**: Required
- **Success Response**: 200 OK
  ```json
  {
    "success": true,
    "message": "Metrics synced successfully"
  }
  ```
- **Error Responses**:
  - 401 Unauthorized if not authenticated
  - 500 Internal Server Error if sync fails

## Data Models

### User

```json
{
  "id": "string",
  "email": "string (email format)"
}
```

### Metric

```json
{
  "_id": "string",
  "metric_category": "string",
  "metric_name": "string",
  "value": "number",
  "timestamp": "string (date-time format)",
  "unit": "string",
  "additional_info": "string",
  "source": "string"
}
```

### Error

```json
{
  "success": false,
  "error": "string",
  "details": "object",
  "statusCode": "integer"
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests. In case of an error, the response will include a JSON object with details about the error.

Common error status codes:

- 400 Bad Request: Invalid input or missing required fields
- 401 Unauthorized: Authentication failure or invalid token
- 403 Forbidden: Authenticated user doesn't have permission for the requested action
- 404 Not Found: Requested resource doesn't exist
- 409 Conflict: Resource already exists (e.g., during registration with an existing email)
- 500 Internal Server Error: Unexpected server error

## Rate Limiting

To prevent abuse, the API implements rate limiting. Excessive requests from a single IP address may be temporarily blocked.

## Security Considerations

- Always use HTTPS in production to encrypt data in transit.
- Store tokens securely on the client-side and never expose them publicly.
- Implement token rotation and short expiration times for access tokens.
- Regularly update and patch your application and dependencies.

## Support

For any questions or issues regarding the API, please contact our support team at support@teamhealthdashboard.com.
