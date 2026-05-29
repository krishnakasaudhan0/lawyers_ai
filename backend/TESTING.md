# API Testing Documentation

This document provides comprehensive instructions for testing all authentication APIs in the Lawgpt application.

## APIs to Test

1. **POST /api/auth/register** - Register a new user
2. **POST /api/auth/login** - Login a user
3. **GET /api/auth/get-me** - Get authenticated user details
4. **GET /api/auth/logout** - Logout a user

---

## Setup Prerequisites

Before testing, ensure:

1. **MongoDB is running**
   ```bash
   # If using MongoDB locally
   mongod
   ```

2. **Environment variables are configured** in `.env`
   ```env
   MONGODB_URI=mongodb://localhost:27017/lawgpt
   JWT_SECRET=your_secret_key_here
   PORT=3000
   ```

3. **Backend dependencies are installed**
   ```bash
   cd backend
   npm install
   ```

4. **Backend server is running**
   ```bash
   # Option 1: Using npm
   npm start
   
   # Option 2: Using node directly
   node server.js
   
   # Option 3: Using nodemon for development
   npx nodemon server.js
   ```

---

## Testing Methods

### Method 1: Manual Testing with curl (Command Line)

#### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword@123"
  }' \
  -v
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword@123"
  }' \
  -c cookies.txt \
  -v
```

#### Get Me (Authenticated)
```bash
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

#### Logout
```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

**See `API_TESTING_GUIDE.md` for detailed curl commands and examples.**

---

### Method 2: Automated Testing with Jest

Run the automated test suite using Jest and Supertest:

```bash
cd backend

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run specific test file
npm test -- tests/auth.test.js

# Run with coverage
npm test -- --coverage
```

**Test Output Example:**
```
PASS  tests/auth.test.js
  Authentication APIs
    POST /api/auth/register
      ✓ should register a new user successfully
      ✓ should reject registration if email already exists
      ✓ should reject registration with missing fields
    POST /api/auth/login
      ✓ should login user successfully with correct credentials
      ✓ should reject login with invalid email
      ✓ should reject login with wrong password
    GET /api/auth/get-me
      ✓ should get authenticated user details
      ✓ should reject request without authentication token
    GET /api/auth/logout
      ✓ should logout user successfully
      ✓ should reject logout without token
```

---

### Method 3: Manual Node.js Test Script

Run a simple Node.js script that tests all APIs without Jest:

```bash
cd backend
node tests/manual-test.js
```

**Script Features:**
- Tests register, login, get-me, logout in sequence
- Automatically manages cookies between requests
- Tests both success and error cases
- Provides detailed output for each test
- No external dependencies required

**Example Output:**
```
════════════════════════════════════════════════
TEST 1: Register API
════════════════════════════════════════════════
Request: {...}
Response Status: 201
Response Body: {...}
✓ Register test PASSED

════════════════════════════════════════════════
TEST 2: Login API
════════════════════════════════════════════════
Request: {...}
Response Status: 200
Response Body: {...}
✓ Login test PASSED

...

════════════════════════════════════════════════
TEST SUMMARY
════════════════════════════════════════════════
Total Tests: 6
Passed: 6
Failed: 0

✓ ALL TESTS PASSED! 🎉
```

---

### Method 4: Postman GUI Application

#### Import Collection

1. Open Postman
2. Click **Import** button
3. Select **Upload Files**
4. Choose `Lawgpt_Auth_API.postman_collection.json`

#### Setup Environment

1. Create a new environment named "Lawgpt"
2. Add these variables:
   - `base_url` = `http://localhost:3000`
   - `authToken` = (will be auto-filled during login)

#### Test APIs

The collection includes these pre-configured requests:

- **Register** - Register a new user
- **Register - User Exists** - Test duplicate registration
- **Register - Missing Fields** - Test validation
- **Login** - Login with valid credentials
- **Login - Invalid Password** - Test error handling
- **Login - Invalid Email** - Test error handling
- **Get Me** - Get authenticated user details
- **Get Me - No Token** - Test auth requirement
- **Get Me - Invalid Token** - Test token validation
- **Logout** - Logout and blacklist token
- **Logout - No Token** - Test error handling

#### Features in Postman

- **Pre-configured URLs** - All endpoints are pre-configured
- **Body templates** - Ready-to-use request bodies
- **Auto token management** - Login automatically extracts and stores auth token
- **Error test cases** - Includes tests for various error scenarios

---

## Test Cases Summary

### Register API Tests

| Test Case | Input | Expected Status | Expected Response |
|-----------|-------|-----------------|-------------------|
| Valid registration | username, email, password | 201 | User created with token |
| Duplicate email | existing email | 400 | "user already exists" |
| Missing field | missing password | 400 | "Please provide..." |
| Missing all fields | {} | 400 | "Please provide..." |

### Login API Tests

| Test Case | Input | Expected Status | Expected Response |
|-----------|-------|-----------------|-------------------|
| Valid credentials | email, password | 200 | User data with token |
| Invalid email | non-existent email | 400 | "Invalid email or password" |
| Wrong password | email, wrong password | 400 | "Invalid email or password" |
| Missing email | only password | 400 | "Please provide..." |
| Missing password | only email | 400 | "Please provide..." |

### Get Me API Tests

| Test Case | Input | Expected Status | Expected Response |
|-----------|-------|-----------------|-------------------|
| Valid token | auth token | 200 | User details (no password) |
| No token | no auth header | 401 | "Unauthorized, no token provided" |
| Invalid token | invalid auth token | 401 | "Unauthorized, invalid token" |
| Blacklisted token | token after logout | 401 | "Unauthorized, token is blacklisted" |

### Logout API Tests

| Test Case | Input | Expected Status | Expected Response |
|-----------|-------|-----------------|-------------------|
| Valid token | auth token | 200 | "User logged out successfully" |
| No token | no auth header | 400 | "No token provided" |
| Blacklisted token | already logged out | 401 | Token blacklisted error |

---

## Complete Test Workflow

Follow this workflow to test all APIs in sequence:

### Step 1: Start the Server
```bash
cd backend
npm start
```

### Step 2: Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "fulltest",
    "email": "fulltest@example.com",
    "password": "TestPassword@123"
  }' \
  -c cookies.txt
```

### Step 3: Login with the User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fulltest@example.com",
    "password": "TestPassword@123"
  }' \
  -b cookies.txt \
  -c cookies.txt
```

### Step 4: Get User Details
```bash
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

Expected: Returns user details with id, username, and email

### Step 5: Logout
```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

Expected: User logged out successfully

### Step 6: Try to Access Get Me After Logout
```bash
curl -X GET http://localhost:3000/api/auth/get-me \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

Expected: Returns 401 - Token is blacklisted

---

## Troubleshooting

### Connection Refused Error
**Error:** `curl: (7) Failed to connect to localhost port 3000`
- **Solution:** Make sure the backend server is running: `npm start`

### MongoDB Connection Error
**Error:** `MongooseError: Cannot connect to MongoDB`
- **Solution:** 
  - Start MongoDB: `mongod`
  - Check `MONGODB_URI` in `.env`
  - Verify MongoDB is accessible

### JWT_SECRET Not Found
**Error:** `Error: JWT_SECRET is not defined`
- **Solution:** Add `JWT_SECRET` to `.env` file

### Token Validation Error
**Error:** `Unauthorized, invalid token`
- **Solution:**
  - Token may have expired (reset with new login)
  - Token may be corrupted
  - JWT_SECRET in server doesn't match token

### CORS Errors (Frontend)
**Error:** `Access to XMLHttpRequest blocked by CORS policy`
- **Solution:** Add CORS middleware to server.js:
  ```javascript
  const cors = require('cors');
  app.use(cors());
  ```

---

## Performance Notes

- **Register**: ~100-200ms (includes password hashing)
- **Login**: ~100-150ms (includes password comparison)
- **Get Me**: ~50ms (database query)
- **Logout**: ~50ms (token blacklisting)

---

## Security Notes

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **Token Expiration**: JWT tokens expire in 1 day
3. **Token Blacklisting**: Logout tokens are immediately blacklisted
4. **Cookie Security**: Tokens stored in HTTP-only cookies
5. **Password Not Returned**: Passwords excluded from responses

---

## Files Created

- `tests/auth.test.js` - Jest automated tests
- `tests/manual-test.js` - Manual Node.js test script
- `API_TESTING_GUIDE.md` - Detailed curl command guide
- `Lawgpt_Auth_API.postman_collection.json` - Postman collection

---

## Next Steps

1. **Run automated tests**: `npm test`
2. **Test with manual script**: `node tests/manual-test.js`
3. **Use Postman**: Import the collection and test interactively
4. **Use curl**: Follow the API_TESTING_GUIDE.md for detailed commands

