# Unified Authentication System

## Overview

This document describes the unified authentication system that consolidates admin and user authentication into a single login/registration flow. This improves security by removing publicly accessible admin login pages and prevents email duplication across user types.

## Security Improvements

### Problems Solved

1. **Eliminated Separate Admin Login Pages**: Hackers can no longer target admin-specific login pages
2. **Prevented Email Duplication**: Same email cannot be used for both admin and user accounts
3. **Removed Admin Secret Requirement**: No more hardcoded secrets in environment files
4. **Unified Login Flow**: Single entry point makes the system more secure and maintainable

## Architecture

### Authentication Flow

#### User Registration

1. User visits `/register`
2. Creates account with email/password or Google OAuth
3. System checks:
   - Email is not already registered as admin
   - Email is not already registered as user
4. Account created in User collection (Firebase Auth)
5. Redirect to home page `/`

#### Admin Registration

1. Admin uses API client (Postman/Thunder Client/Hoppscotch)
2. Sends POST request to `/api/admin/register`
3. System validates:
   - Name (min 2 characters)
   - Email format and uniqueness across both collections
   - Password (min 8 characters)
4. Admin account created in Admin collection (MongoDB only)
5. Admin can now login via unified login page

#### Login (Unified for Admin & User)

1. User/Admin visits `/login` (single login page)
2. Enters email and password
3. System checks:
   - **First**: Attempts admin login (MongoDB check)
   - **If admin found**: Redirects to `/admin`
   - **If not admin**: Attempts user login (Firebase Auth)
   - **If user found**: Redirects to `/`
4. Authentication token stored appropriately

### Database Structure

#### Admin Collection (MongoDB)

```javascript
{
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### User Collection (MongoDB + Firebase)

```javascript
{
  name: String,
  email: String (unique),
  // No password stored (Firebase handles auth)
  role: String (default: "student"),
  department: String,
  items: [ObjectId],
  itemsReturned: Number,
  // ... other user fields
}
```

## API Endpoints

### 1. Admin Registration (API Only)

**Endpoint**: `POST /api/admin/register`

**Access**: API clients only (Postman, Thunder Client, Hoppscotch)

**Request Body**:

```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success - 200)**:

```json
{
  "success": true,
  "message": "Admin created successfully",
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

**Response (Error - 409)**:

```json
{
  "error": "Email already registered as admin"
}
// OR
{
  "error": "Email already registered as user. Use a different email for admin."
}
```

**Validation Rules**:

- Name: minimum 2 characters
- Email: valid email format, unique across Admin and User collections
- Password: minimum 8 characters

### 2. Admin Login

**Endpoint**: `POST /api/admin/auth/login`

**Access**: Called internally by unified login action

**Request Body**:

```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success - 200)**:

```json
{
  "success": true,
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

**Response (Error - 401)**:

```json
{
  "error": "Invalid credentials"
}
```

### 3. User Registration/Sync

**Endpoint**: `POST /api/auth/sync`

**Access**: Called by Firebase Auth actions

**Behavior**:

- Checks if email exists in Admin collection (prevents conflict)
- Creates or retrieves user from User collection
- Links Firebase UID with MongoDB user document

## Pages & Routes

### User-Accessible Pages

#### `/login` - Unified Login Page

- Single login page for both admins and users
- Automatically detects user type and redirects appropriately
- Admins → `/admin`
- Users → `/`

#### `/register` - User Registration Page

- Only for regular user registration
- No admin registration link (removed for security)
- Supports email/password and Google OAuth

### Admin-Only API Registration

#### `/admin/register` - Information Page

- Not a registration form
- Shows API documentation for admin registration
- Provides instructions for Postman/Thunder Client/Hoppscotch usage
- Links back to unified login page

#### `/admin/login` - Redirect Page

- Automatically redirects to `/login`
- Prevents confusion and duplicate login pages

## Email Uniqueness Validation

### Cross-Collection Email Check

The system enforces email uniqueness across both Admin and User collections:

```javascript
// Admin Registration Check
const existingAdmin = await Admin.findOne({ email });
const existingUser = await User.findOne({ email });

if (existingAdmin || existingUser) {
  // Email already in use
}

// User Registration Check
const existingAdmin = await Admin.findOne({ email });
if (existingAdmin) {
  // This email is registered as admin
}
```

### Why This Matters

- Prevents privilege escalation attacks
- Eliminates confusion from duplicate accounts
- Ensures clean data separation
- Improves system integrity

## How to Register an Admin

### Using Postman

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/admin/register`
2. **Set Headers**

   - Content-Type: `application/json`

3. **Add Body** (raw JSON)

   ```json
   {
     "name": "John Admin",
     "email": "john@example.com",
     "password": "SecurePass123"
   }
   ```

4. **Send Request**
   - Success: Admin created
   - Admin can now login at `/login`

### Using Thunder Client (VS Code Extension)

1. **New Request**

   - Method: POST
   - URL: `http://localhost:3000/api/admin/register`

2. **Body Tab**

   - Select JSON
   - Enter admin details:

   ```json
   {
     "name": "Jane Admin",
     "email": "jane@example.com",
     "password": "SecurePass123"
   }
   ```

3. **Send**
   - Check response for success message

### Using Hoppscotch

1. **Go to** https://hoppscotch.io/
2. **Set Method**: POST
3. **URL**: `http://localhost:3000/api/admin/register`
4. **Body**: Raw → JSON
   ```json
   {
     "name": "Admin Name",
     "email": "admin@example.com",
     "password": "SecurePassword123"
   }
   ```
5. **Send Request**

## Migration Guide

### For Existing Systems

If you have an existing system with separate admin/user login:

#### 1. Remove Admin Secret from .env

```bash
# REMOVE THIS LINE:
# ADMIN_CREATION_SECRET=SuperSecretAdminKeyToCreateAdmin
```

#### 2. Update Admin Records (Optional)

No database migration needed - existing admins will work with new system

#### 3. Inform Users

- Users: Continue using same login page
- Admins: Use unified login page at `/login`
- New admins: Must be registered via API

#### 4. Update Documentation/Links

- Remove links to `/admin/login` and `/admin/register`
- Update admin onboarding documentation
- Provide API registration instructions

## Security Best Practices

### ✅ Do's

- Use API clients for admin registration (not web forms)
- Use strong passwords (8+ characters)
- Keep email addresses unique across the system
- Use HTTPS in production
- Rotate admin passwords regularly
- Monitor admin login attempts

### ❌ Don'ts

- Don't expose admin registration page publicly
- Don't reuse emails for admin and user accounts
- Don't share admin credentials
- Don't store admin secrets in frontend code
- Don't allow weak passwords

## Testing

### Test Case 1: Admin Registration via API

```bash
# Expected: Success
POST /api/admin/register
{
  "name": "Test Admin",
  "email": "testadmin@test.com",
  "password": "TestPass123"
}
```

### Test Case 2: Duplicate Email Prevention

```bash
# Step 1: Register user
POST /api/auth/sync (via Firebase)
email: "duplicate@test.com"

# Step 2: Try to register admin with same email
POST /api/admin/register
{
  "name": "Test Admin",
  "email": "duplicate@test.com",
  "password": "TestPass123"
}
# Expected: 409 Error - Email already registered as user
```

### Test Case 3: Unified Login - Admin

```bash
# Navigate to /login
# Enter admin credentials
# Expected: Redirect to /admin
```

### Test Case 4: Unified Login - User

```bash
# Navigate to /login
# Enter user credentials
# Expected: Redirect to /
```

### Test Case 5: Admin Page Redirects

```bash
# Navigate to /admin/login
# Expected: Automatic redirect to /login

# Navigate to /admin/register
# Expected: Show API documentation page
```

## Troubleshooting

### Issue: "Email already registered"

**Cause**: Email exists in either Admin or User collection
**Solution**: Use a different email or check which collection has the email

### Issue: Admin can't login

**Cause**: Trying to use user login flow (Firebase)
**Solution**: System should auto-detect; check if admin email/password are correct

### Issue: User registration fails

**Cause**: Email might be registered as admin
**Solution**: Use different email or check admin registration

### Issue: Redirect loops after login

**Cause**: Session storage issue
**Solution**: Clear localStorage/cookies and try again

## Code Reference

### Key Files Modified

1. **[actions/login.js](actions/login.js)** - Unified login logic
2. **[app/api/admin/auth/login/route.js](app/api/admin/auth/login/route.js)** - Admin auth endpoint
3. **[app/api/admin/register/route.js](app/api/admin/register/route.js)** - Admin registration endpoint
4. **[app/api/auth/sync/route.js](app/api/auth/sync/route.js)** - User auth sync with email check
5. **[app/(auth)/login/page.jsx](<app/(auth)/login/page.jsx>)** - Unified login page
6. **[app/(auth)/register/page.jsx](<app/(auth)/register/page.jsx>)** - User registration page
7. **[app/(auth)/admin/login/page.jsx](<app/(auth)/admin/login/page.jsx>)** - Redirect page
8. **[app/(auth)/admin/register/page.jsx](<app/(auth)/admin/register/page.jsx>)** - API documentation page

## Future Enhancements

1. **Rate Limiting**: Add rate limiting to login endpoints
2. **2FA**: Implement two-factor authentication for admins
3. **Audit Logs**: Track admin registrations and login attempts
4. **Email Verification**: Require email verification for admins
5. **Admin Management**: Create admin panel to manage other admins
6. **Password Reset**: Implement password reset for admins

---

**Last Updated**: January 7, 2026
**Version**: 2.0.0
**Breaking Changes**: Admin secret removed, unified login implemented
