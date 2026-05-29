# API Testing Guide

This guide provides instructions for testing all the authentication APIs.

## Prerequisites

1. Make sure MongoDB is running
2. Make sure the backend server is running on port 3000
3. Make sure `.env` file has the required variables (JWT_SECRET, MONGODB_URI)

## Start the Server

```bash
cd backend
npm start
# or
node server.js
```

## API Testing

### 1. Register API
**Endpoint:** `POST /api/auth/register`

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser123@example.com",
    "password": "TestPassword@123"
  }' \
  -v
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "username": "testuser123",
    "email": "testuser123@example.com"
  }
}
```

**Error Cases:**
- Missing fields: Returns 400 with error message
- User already exists: Returns 400 "user already exists"

---

### 2. Login API
**Endpoint:** `POST /api/auth/login`

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser123@example.com",
    "password": "TestPassword@123"
  }' \
  -c cookies.txt \
  -v
```

**Expected Response (200):**
```json
{
  "message": "User logged in successfully",
  "user": {
    "id": "user_id",
    "username": "testuser123",
    "email": "testuser123@example.com"
  }
}
```

**Note:** The `-c cookies.txt` flag saves the authentication cookie for use in subsequent requests.

**Error Cases:**
- Invalid email or password: Returns 400
- Missing email or password: Returns 400

---

### 3. Get Me API (Requires Authentication)
**Endpoint:** `GET /api/auth/get-me`

**Test Command:**
```bash
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

Or with the token from login response:
```bash
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -v
```

**Expected Response (200):**
```json
{
  "message": "User details fetched successfully",
  "user": {
    "id": "user_id",
    "username": "testuser123",
    "email": "testuser123@example.com"
  }
}
```

**Error Cases:**
- No token provided: Returns 401 "Unauthorized, no token provided"
- Invalid token: Returns 401 "Unauthorized, invalid token"
- Token is blacklisted: Returns 401 "Unauthorized, token is blacklisted"

---

### 4. Logout API
**Endpoint:** `GET /api/auth/logout`

**Test Command:**
```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

Or with the token from login response:
```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -v
```

**Expected Response (200):**
```json
{
  "message": "User logged out successfully"
}
```

**Error Cases:**
- No token provided: Returns 400 "No token provided"

---

## Complete Test Workflow

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword@123"
  }' \
  -c cookies.txt

# 2. Login with the registered user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword@123"
  }' \
  -b cookies.txt \
  -c cookies.txt

# 3. Get user details (authenticated request)
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Logout
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 5. Try to access get-me after logout (should fail)
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

## Using Postman

### Setup Collection Variables

Create a Postman environment with these variables:
- `base_url`: http://localhost:3000

### Import Requests

#### 1. Register
- **Method:** POST
- **URL:** {{base_url}}/api/auth/register
- **Body (JSON):**
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "TestPassword@123"
}
```

#### 2. Login
- **Method:** POST
- **URL:** {{base_url}}/api/auth/login
- **Body (JSON):**
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword@123"
}
```
- **Tests Tab:** Add script to save token
```javascript
var jsonData = pm.response.json();
pm.environment.set("authToken", jsonData.token);
```

#### 3. Get Me
- **Method:** GET
- **URL:** {{base_url}}/api/auth/get-me
- **Headers:**
  - Key: Cookie
  - Value: token={{authToken}}

#### 4. Logout
- **Method:** GET
- **URL:** {{base_url}}/api/auth/logout
- **Headers:**
  - Key: Cookie
  - Value: token={{authToken}}

---

## Run Automated Tests with Jest

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/auth.test.js
```

