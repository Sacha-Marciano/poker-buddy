# Firebase Admin SDK

**Version**: 12.7.0 (installed in project)
**npm**: https://www.npmjs.com/package/firebase-admin
**GitHub**: https://github.com/firebase/firebase-admin-node
**Documentation**: https://firebase.google.com/docs/admin/setup

**Last Updated**: 2025-12-30
**Compatibility**: Node.js 18+, TypeScript 5.x, Express 4.x

---

## Overview

Firebase Admin SDK is the official server-side library for Firebase services. In TripWiser, we use it exclusively for **server-side authentication token verification**.

**CRITICAL ARCHITECTURE PRINCIPLE:**

- **Frontend (React Native)**: Uses Firebase Client SDK to create users, handle login/logout, manage authentication
- **Backend (Express)**: Uses Firebase Admin SDK to **VERIFY tokens ONLY** - never creates users or manages authentication

The Admin SDK verifies Firebase ID tokens sent from the client, extracts the user's Firebase UID, and allows us to look up the user in our MongoDB database.

---

## Installation

```bash
npm install firebase-admin@12.7.0

# Already installed in TripWiser v2.0.0
```

**Peer Dependencies:**

- Node.js: 18 or higher
- TypeScript: 5.x (recommended)
- No additional peer dependencies required

**Optional Dependencies** (auto-installed if needed):

- `@google-cloud/firestore`: For Firestore operations (not used in TripWiser)
- `@google-cloud/storage`: For Firebase Storage operations (not used in TripWiser)

---

## Service Account Setup

### Obtaining Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file (contains private keys - **NEVER commit to Git**)

### Service Account JSON Structure

The downloaded file has this structure (snake_case):

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**IMPORTANT**: The JSON file uses `snake_case` (e.g., `project_id`), but Firebase Admin SDK's TypeScript `ServiceAccount` interface expects `camelCase` (e.g., `projectId`). The SDK handles this conversion internally when you pass the raw JSON.

---

## Initialization

### Pattern 1: Using JSON String Environment Variable (TripWiser Pattern)

**IMPORTANT**: TripWiser uses `FIREBASE_SERVICE_ACCOUNT_KEY` which contains the entire service account JSON as a single-line string. This is simpler than file-based approaches and works well for deployment platforms.

```typescript
import admin from "firebase-admin";

/**
 * Initialize Firebase Admin SDK
 * Reads service account credentials from FIREBASE_SERVICE_ACCOUNT_KEY env var
 * (JSON string containing the service account credentials)
 */
function initializeFirebase(): admin.app.App {
  try {
    // Prevent multiple initializations
    if (admin.apps.length > 0) {
      console.log("Firebase Admin SDK already initialized");
      return admin.app();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set",
      );
    }

    // Parse the JSON service account credentials from env variable
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (parseError) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON. Ensure it is a valid JSON string.",
      );
    }

    // Validate required fields
    if (
      !serviceAccount.project_id ||
      !serviceAccount.private_key ||
      !serviceAccount.client_email
    ) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields (project_id, private_key, client_email)",
      );
    }

    // Initialize Firebase Admin
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin SDK initialized successfully");
    return app;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

// Initialize on module load
const firebaseAdmin = initializeFirebase();

export { firebaseAdmin, admin };
export default admin;
```

**Environment Variable Format** (in `.env` or deployment platform):

```bash
# Paste entire service account JSON as single-line string
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Note**: The private key contains `\n` for newlines - keep them as-is in the JSON string.

### Pattern 2: Using Environment Variables (Production)

For production environments where you can't store JSON files:

```typescript
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // IMPORTANT: Replace escaped newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
```

**Environment Variables:**

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Pattern 3: Modular Imports (Modern SDK)

```typescript
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as admin from "firebase-admin";

initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

// Use modular imports
const auth = getAuth();
const decodedToken = await auth.verifyIdToken(idToken);
```

### Preventing Multiple Initializations

**Error**: "The default Firebase app already exists. This means you called initializeApp() more than once."

**Solution**: Always check if already initialized:

```typescript
if (admin.apps.length > 0) {
  return admin.app(); // Return existing app
}
// Otherwise, initialize
admin.initializeApp({ ... });
```

---

## Available Types

### Core Type: `DecodedIdToken`

The primary type returned from `verifyIdToken()`:

```typescript
/**
 * Interface representing a decoded Firebase ID token.
 * Firebase ID tokens are OpenID Connect spec-compliant JSON Web Tokens (JWTs).
 */
interface DecodedIdToken {
  /**
   * The audience for which this token is intended.
   * Equal to your Firebase project ID.
   */
  aud: string;

  /**
   * Time when the end-user authentication occurred (in seconds since Unix epoch).
   * NOT when the token was created, but when the user initially logged in.
   * Remains the same across token refreshes in a single session.
   */
  auth_time: number;

  /**
   * The email of the user (if available).
   */
  email?: string;

  /**
   * Whether the user's email is verified.
   */
  email_verified?: boolean;

  /**
   * Token expiration time (in seconds since Unix epoch).
   * Firebase ID tokens expire after 1 hour.
   */
  exp: number;

  /**
   * Information about the sign-in event.
   * CRITICAL: Contains sign_in_provider and identities.
   */
  firebase: {
    /**
     * Provider-specific identity details.
     */
    identities: {
      [key: string]: any;
    };

    /**
     * The ID of the provider used to sign in.
     * One of: "anonymous", "password", "facebook.com", "github.com",
     * "google.com", "twitter.com", "apple.com", "microsoft.com",
     * "yahoo.com", "phone", "playgames.google.com", "gc.apple.com",
     * or "custom".
     */
    sign_in_provider: string;

    /**
     * The type identifier of the second factor (multi-factor auth).
     */
    sign_in_second_factor?: string;

    /**
     * The UID of the second factor used to sign in.
     */
    second_factor_identifier?: string;

    /**
     * The ID of the tenant the user belongs to (if applicable).
     */
    tenant?: string;

    [key: string]: any;
  };

  /**
   * Token issued-at time (in seconds since Unix epoch).
   * Changes every hour when Firebase refreshes the token.
   */
  iat: number;

  /**
   * Issuer identifier.
   * Format: https://securetoken.google.com/<PROJECT_ID>
   */
  iss: string;

  /**
   * The phone number of the user (if available).
   */
  phone_number?: string;

  /**
   * The photo URL for the user (if available).
   */
  picture?: string;

  /**
   * The user's Firebase UID (subject).
   * This is the primary identifier for the user.
   */
  sub: string;

  /**
   * Convenience property - same as `sub`.
   * The user's Firebase UID.
   */
  uid: string;

  /**
   * Other arbitrary claims (custom claims set via Admin SDK).
   */
  [key: string]: any;
}
```

### Supporting Types

#### `ServiceAccount` Interface

```typescript
interface ServiceAccount {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}
```

**Note**: When loading from JSON file, the SDK accepts both `snake_case` and `camelCase` property names.

#### `Auth` Class

```typescript
class Auth {
  /**
   * Verifies a Firebase ID token (JWT).
   */
  verifyIdToken(
    idToken: string,
    checkRevoked?: boolean,
  ): Promise<DecodedIdToken>;

  /**
   * Creates a custom token for client-side sign-in.
   * (NOT USED IN TRIPWISER - clients handle their own auth)
   */
  createCustomToken(uid: string, developerClaims?: object): Promise<string>;

  /**
   * Gets user data by UID.
   * (NOT USED IN TRIPWISER - we store users in MongoDB)
   */
  getUser(uid: string): Promise<UserRecord>;

  /**
   * Gets user data by email.
   */
  getUserByEmail(email: string): Promise<UserRecord>;

  /**
   * Revokes refresh tokens for a user.
   * Forces user to re-authenticate on client.
   */
  revokeRefreshTokens(uid: string): Promise<void>;

  // Many other methods not used in TripWiser...
}
```

#### `UserRecord` Type

```typescript
interface UserRecord {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  disabled: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: UserInfo[];
  customClaims?: { [key: string]: any };
  tokensValidAfterTime?: string;
}
```

**Note**: We don't use `UserRecord` in TripWiser because we maintain our own user data in MongoDB.

---

## API Reference

### Primary Method: `verifyIdToken()`

**Description**: Verifies a Firebase ID token (JWT). Returns the decoded token if valid, throws an error if invalid.

**Signature**:

```typescript
verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<DecodedIdToken>
```

**Parameters**:

- `idToken` (string): The Firebase ID token to verify (from client's `Authorization: Bearer <token>` header)
- `checkRevoked` (boolean, optional): Whether to check if the token was revoked
  - `false` (default): Only verifies signature and expiration (faster, one network call)
  - `true`: Also checks if user is disabled or token was revoked (slower, requires extra Firebase backend call)

**Returns**:

- `Promise<DecodedIdToken>`: The decoded token payload containing user information

**Throws**:

- `FirebaseAuthError`: If token is invalid, expired, or revoked

**Token Validation Checks**:

1. Token has correct format (valid JWT structure)
2. Token signature is valid (signed by Firebase)
3. Token is not expired (< 1 hour old)
4. Token audience (`aud`) matches your Firebase project ID
5. Token issuer (`iss`) is `https://securetoken.google.com/<PROJECT_ID>`
6. Token subject (`sub`) is non-empty
7. (Optional) Token has not been revoked (if `checkRevoked: true`)

**Example - Basic Verification**:

```typescript
import admin from "firebase-admin";

async function verifyToken(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("User ID:", decodedToken.uid);
    console.log("Email:", decodedToken.email);
    console.log("Sign-in provider:", decodedToken.firebase.sign_in_provider);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
}
```

**Example - With Revocation Check**:

```typescript
async function verifyTokenStrict(idToken: string) {
  try {
    // checkRevoked: true - verifies token is not revoked
    // Requires extra network call to Firebase backend
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    return decodedToken;
  } catch (error) {
    if (error.code === "auth/id-token-revoked") {
      // Token has been revoked - user must re-authenticate
      console.log("Token revoked, user must log in again");
    }
    throw error;
  }
}
```

**Performance Consideration**:

- The SDK caches Firebase's public keys to verify signatures locally
- Without `checkRevoked`: Fast (local verification only)
- With `checkRevoked`: Slower (extra round trip to Firebase backend)
- For most cases, `checkRevoked: false` (default) is sufficient

---

### Secondary Methods (Not Used in TripWiser)

#### `createCustomToken()`

**Description**: Creates a custom token that clients can use to sign in. **NOT USED IN TRIPWISER** - clients handle their own authentication.

**Signature**:

```typescript
createCustomToken(uid: string, developerClaims?: object): Promise<string>
```

#### `getUser()`

**Description**: Retrieves user data from Firebase Authentication. **NOT USED IN TRIPWISER** - we store user data in MongoDB.

**Signature**:

```typescript
getUser(uid: string): Promise<UserRecord>
```

#### `revokeRefreshTokens()`

**Description**: Revokes all refresh tokens for a user, forcing them to re-authenticate.

**Signature**:

```typescript
revokeRefreshTokens(uid: string): Promise<void>
```

**Use Case**: Force logout when user's account is compromised or suspicious activity detected.

---

## Usage in TripWiser

### Current Usage: Authentication Middleware

**Pattern**: Client sends Firebase ID token → Backend verifies → Looks up user in MongoDB → Attaches user to request

**Files Using Firebase Admin SDK**:

- `src/config/firebase.ts` - Firebase initialization
- `src/middleware/authMiddleware.ts` - Token verification middleware
- `src/controllers/authController.ts` - Authentication endpoints
- `src/controllers/userController.ts` - User profile endpoints

### Example: Authentication Middleware

**From**: `src/middleware/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";
import { User } from "../models/User";
import { AuthError } from "../utils/errors";
import { ERROR_CODES } from "../utils/constants";

/**
 * Authentication middleware
 * Verifies Firebase ID token and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError(
        "No authentication token provided",
        ERROR_CODES.AUTH_TOKEN_MISSING,
      );
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken) {
      throw new AuthError(
        "Invalid authorization header format",
        ERROR_CODES.AUTH_TOKEN_INVALID,
      );
    }

    // Verify token with Firebase
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("expired")) {
          throw new AuthError(
            "Authentication token has expired",
            ERROR_CODES.AUTH_TOKEN_EXPIRED,
          );
        }
      }
      throw new AuthError(
        "Invalid authentication token",
        ERROR_CODES.AUTH_TOKEN_INVALID,
      );
    }

    // Find user in MongoDB using Firebase UID
    const user = await User.findActiveByFirebaseUid(decodedToken.uid);

    if (!user) {
      throw new AuthError(
        "User not found or inactive",
        ERROR_CODES.AUTH_USER_NOT_FOUND,
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthError(
        "User account is inactive",
        ERROR_CODES.AUTH_USER_INACTIVE,
      );
    }

    // Check if user is deleted
    if (user.isDeleted) {
      throw new AuthError(
        "User account has been deleted",
        ERROR_CODES.AUTH_USER_DELETED,
      );
    }

    // Attach user to request for downstream handlers
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}
```

### Patterns We Follow

**1. Token Extraction Pattern**:

```typescript
// Extract Bearer token from Authorization header
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  throw new Error("No token provided");
}
const idToken = authHeader.split("Bearer ")[1];
```

**2. Verification Pattern**:

```typescript
// Verify token (no revocation check for performance)
const decodedToken = await admin.auth().verifyIdToken(idToken);
// Use decodedToken.uid to look up user in MongoDB
```

**3. Database Lookup Pattern**:

```typescript
// Firebase UID is the link between Firebase Auth and MongoDB
const user = await User.findOne({ firebaseUid: decodedToken.uid });
```

**4. Error Handling Pattern**:

```typescript
try {
  decodedToken = await admin.auth().verifyIdToken(idToken);
} catch (error) {
  if (error.message.includes("expired")) {
    throw new AuthError("Token expired", ERROR_CODES.AUTH_TOKEN_EXPIRED);
  }
  throw new AuthError("Invalid token", ERROR_CODES.AUTH_TOKEN_INVALID);
}
```

### Custom Type Definitions

**From**: `src/types/auth.types.ts`

```typescript
/**
 * Decoded Firebase ID token payload
 * (Simplified version - actual token has more fields)
 */
export interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  phone_number?: string;
  firebase: {
    sign_in_provider: string;
  };
}
```

**Note**: This is a simplified version for our use case. The actual `DecodedIdToken` type from Firebase has many more fields.

---

## Architecture Pattern: Client-Side Auth + Server-Side Verification

### The Correct Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT (React Native + Firebase Client SDK)                │
│                                                             │
│ 1. User signs up/logs in                                   │
│ 2. Firebase Client SDK creates user & returns ID token     │
│ 3. Client sends ID token in Authorization header           │
│    Authorization: Bearer <firebase-id-token>               │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVER (Express + Firebase Admin SDK)                      │
│                                                             │
│ 1. Extract ID token from Authorization header              │
│ 2. Verify token with Firebase Admin SDK                    │
│ 3. Extract Firebase UID from decoded token                 │
│ 4. Look up user in MongoDB by firebaseUid                  │
│ 5. Attach user to req.user for route handlers              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Response
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE (MongoDB)                                          │
│                                                             │
│ User Collection:                                            │
│ {                                                           │
│   _id: ObjectId,                                            │
│   firebaseUid: "abc123...",  ← Links to Firebase Auth      │
│   email: "user@example.com",                                │
│   name: "John Doe",                                         │
│   plan: "free",                                             │
│   ...                                                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### CRITICAL: What Backend Should NEVER Do

**NEVER create Firebase users from the backend**:

```typescript
// ❌ WRONG - DO NOT DO THIS
// Backend should NEVER create Firebase users
const userRecord = await admin.auth().createUser({
  email: email,
  password: password,
});
```

**WHY?**

- Firebase Client SDK handles user creation, login, password reset, email verification
- Backend only verifies tokens - it's a **stateless JWT verifier**
- Creating users server-side breaks the Firebase client SDK flow
- Client SDK provides better UX (handles errors, edge cases, email verification)

### What Backend SHOULD Do

**✅ CORRECT - Verify tokens only**:

```typescript
// ✅ CORRECT - Backend only verifies tokens
const decodedToken = await admin.auth().verifyIdToken(idToken);

// Then look up or create user in MongoDB
let user = await User.findOne({ firebaseUid: decodedToken.uid });
if (!user) {
  // First time this Firebase user logged in - create MongoDB record
  user = await User.create({
    firebaseUid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name || "User",
  });
}
```

---

## Token Expiration & Refresh

### ID Token Lifespan

**Duration**: Firebase ID tokens are valid for **1 hour** (3600 seconds)

**Key Facts**:

- `exp` claim in token: Expiration timestamp (Unix epoch seconds)
- `iat` claim in token: Issued-at timestamp (Unix epoch seconds)
- **Cannot extend**: No way to extend the lifespan of an ID token
- **Auto-refresh**: Firebase Client SDK automatically refreshes tokens every hour

### Token Refresh Process

**Client-Side** (automatic, handled by Firebase Client SDK):

```
User logs in
   ↓
Client SDK gets ID token (valid 1 hour)
   ↓
After ~50 minutes, SDK refreshes token automatically
   ↓
New ID token issued (valid 1 hour from now)
   ↓
Repeat every hour
```

**Refresh Token**:

- Firebase uses a long-lived **refresh token** to generate new ID tokens
- Refresh token is stored securely by Firebase Client SDK
- Refresh token expires only when:
  - Password/email is changed
  - User is deleted
  - Explicitly revoked via `admin.auth().revokeRefreshTokens(uid)`

### Server-Side Handling

**You don't need to do anything**:

- Client SDK automatically sends the latest ID token with each request
- Server verifies whatever token is sent
- If token is expired, verification fails → Client gets 401 → Client refreshes token → Retries request

**Best Practice**:

```typescript
// Client-side: Always get current token before making request
const user = auth.currentUser;
const idToken = await user.getIdToken(true); // Force refresh if needed

// Send in request
fetch("/api/protected", {
  headers: {
    Authorization: `Bearer ${idToken}`,
  },
});
```

**IMPORTANT**:

- **NEVER cache ID tokens server-side** - they expire after 1 hour
- **NEVER store ID tokens in database** - they're meant to be ephemeral
- **ALWAYS verify tokens on each request** - don't trust client to send valid tokens

---

## Error Handling

### Firebase Auth Error Codes

All Firebase Auth errors are instances of `FirebaseAuthError` with an `errorInfo` object containing:

- `code`: Error code (string like `"auth/id-token-expired"`)
- `message`: Human-readable error message

### Common Error Codes for Token Verification

#### `auth/argument-error`

**Cause**: Invalid argument provided (e.g., empty string, null, wrong type)
**Example**: `verifyIdToken('')` or `verifyIdToken(null)`
**Resolution**: Validate input before calling `verifyIdToken()`

#### `auth/id-token-expired`

**Cause**: The Firebase ID token has expired (older than 1 hour)
**Message**: "Firebase ID token has expired. Get a fresh token from your client app and try again."
**Resolution**:

- Return 401 Unauthorized to client
- Client should refresh token and retry request
- Firebase Client SDK handles this automatically

#### `auth/invalid-id-token`

**Cause**: Token has invalid format, signature, or structure
**Reasons**:

- Token is not a valid JWT
- Token was not signed by Firebase
- Token has incorrect algorithm (not RS256)
- Token has missing required claims
  **Resolution**:
- Return 401 Unauthorized
- Likely an attack attempt or corrupted token
- User should log out and log back in

#### `auth/id-token-revoked`

**Cause**: Token has been revoked (only when `checkRevoked: true`)
**Message**: "Firebase ID token has been revoked."
**Resolution**:

- Return 401 Unauthorized
- Client should log out user immediately
- User must re-authenticate

#### `auth/user-disabled`

**Cause**: User account has been disabled in Firebase Authentication
**Resolution**:

- Return 403 Forbidden
- User cannot access the application
- Admin must re-enable the account

#### `auth/user-not-found`

**Cause**: No user found with the UID from the token (only when `checkRevoked: true`)
**Resolution**:

- Return 401 Unauthorized
- User account was deleted from Firebase
- Client should log out user

#### `auth/project-not-found`

**Cause**: Firebase project ID in token doesn't match initialized project
**Resolution**:

- Check Firebase initialization
- Verify service account credentials
- Ensure client and server use same Firebase project

#### `auth/insufficient-permission`

**Cause**: Service account lacks required permissions
**Resolution**:

- Check service account has Firebase Authentication Admin role
- Verify service account is from correct project

### Error Handling Pattern

```typescript
import admin from "firebase-admin";

async function verifyToken(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { success: true, user: decodedToken };
  } catch (error: any) {
    // Firebase errors have error.code property
    const errorCode = error?.code || "unknown";
    const errorMessage = error?.message || "Unknown error";

    switch (errorCode) {
      case "auth/argument-error":
        return {
          success: false,
          statusCode: 400,
          error: "Invalid token format",
        };

      case "auth/id-token-expired":
        return {
          success: false,
          statusCode: 401,
          error: "Token expired. Please refresh and try again.",
        };

      case "auth/invalid-id-token":
        return {
          success: false,
          statusCode: 401,
          error: "Invalid authentication token.",
        };

      case "auth/id-token-revoked":
        return {
          success: false,
          statusCode: 401,
          error: "Token has been revoked. Please log in again.",
        };

      case "auth/user-disabled":
        return {
          success: false,
          statusCode: 403,
          error: "User account has been disabled.",
        };

      case "auth/user-not-found":
        return {
          success: false,
          statusCode: 401,
          error: "User not found. Please log in again.",
        };

      case "auth/project-not-found":
      case "auth/insufficient-permission":
        // Server configuration errors - log and return generic error
        console.error("Firebase configuration error:", errorCode, errorMessage);
        return {
          success: false,
          statusCode: 500,
          error: "Authentication service error. Please try again later.",
        };

      default:
        console.error("Unknown Firebase auth error:", errorCode, errorMessage);
        return {
          success: false,
          statusCode: 500,
          error: "Authentication failed. Please try again.",
        };
    }
  }
}
```

### Error Detection Techniques

**Checking for expired tokens**:

```typescript
try {
  await admin.auth().verifyIdToken(idToken);
} catch (error: any) {
  // Option 1: Check error code (modern)
  if (error.code === "auth/id-token-expired") {
    // Handle expired token
  }

  // Option 2: Check error message (legacy fallback)
  if (error.message?.includes("expired")) {
    // Handle expired token
  }
}
```

**Type-safe error handling**:

```typescript
import { FirebaseAuthError } from "firebase-admin/auth";

try {
  await admin.auth().verifyIdToken(idToken);
} catch (error) {
  if (error instanceof FirebaseAuthError) {
    // TypeScript knows this has .code and .message
    console.log("Auth error:", error.code, error.message);
  }
}
```

---

## Version Compatibility

**Current Version**: 12.7.0 (installed in TripWiser)
**Recommended Version**: 12.7.0 (latest stable as of 2024-09-18)

**Compatibility Matrix**:
| Firebase Admin SDK | Node.js | TypeScript | Express | Status |
|-------------------|---------|------------|---------|--------|
| 12.7.0 | 18+ | 5.x | 4.x | ✅ Compatible (TripWiser) |
| 12.x | 18+ | 4.x-5.x | 4.x | ✅ Compatible |
| 11.x | 14+ | 4.x | 4.x | ✅ Compatible |
| 10.x | 14+ | 4.x | 4.x | ⚠️ Older (modular API) |
| 9.x | 12+ | 3.x-4.x | 4.x | ⚠️ Legacy |

**Known Issues**: None affecting TripWiser use case

**Breaking Changes**:

- **v10 → v11**: Modular API introduced (we use legacy API, no impact)
- **v11 → v12**: No breaking changes for token verification

**Upgrade Path**: To upgrade, run `npm install firebase-admin@latest`

---

## Migration Notes

### From v11 to v12 (No Breaking Changes)

No migration needed for token verification use case. All existing code continues to work.

### From v9/v10 to v12 (Modular API)

**Old Pattern** (still works):

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp({ ... });
const decodedToken = await admin.auth().verifyIdToken(idToken);
```

**New Pattern** (modular):

```typescript
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ ... });
const decodedToken = await getAuth().verifyIdToken(idToken);
```

**Recommendation**: Stick with legacy pattern for TripWiser (simpler, more familiar).

---

## Security Best Practices

### DO ✅

1. **Verify tokens on every request**
   - Never trust client to send valid tokens
   - Always call `verifyIdToken()` in middleware

2. **Use HTTPS only**
   - Tokens are JWTs sent in headers - can be intercepted over HTTP
   - Always use HTTPS in production

3. **Store service account credentials securely**
   - NEVER commit `serviceAccountKey.json` to Git
   - Add to `.gitignore`
   - Use environment variables in production

4. **Validate token claims**
   - Check `decodedToken.uid` is non-empty
   - Verify `decodedToken.email` matches expected pattern
   - Check `decodedToken.email_verified` if email verification is required

5. **Handle errors gracefully**
   - Return appropriate HTTP status codes (401, 403)
   - Don't leak sensitive information in error messages
   - Log detailed errors server-side only

6. **Use short token lifespans**
   - Firebase tokens expire after 1 hour (default, cannot change)
   - This limits damage if token is stolen

7. **Revoke tokens when needed**
   - Call `admin.auth().revokeRefreshTokens(uid)` if account is compromised
   - Force user to re-authenticate

8. **Validate before verifying**
   - Check Authorization header exists
   - Check token is non-empty
   - Check token format (Bearer <token>)

### DON'T ❌

1. **Don't cache ID tokens server-side**
   - Tokens expire after 1 hour
   - Verify on each request

2. **Don't store ID tokens in database**
   - They're ephemeral (1-hour lifespan)
   - Store Firebase UID instead

3. **Don't create Firebase users from backend**
   - Client SDK handles user creation
   - Backend only verifies tokens

4. **Don't skip token verification**
   - Always verify, even for "trusted" clients
   - Never trust `uid` sent by client without verification

5. **Don't log tokens**
   - Tokens are sensitive credentials
   - Log token errors, not token values

6. **Don't use `checkRevoked` by default**
   - Extra network call on every request (slow)
   - Only use for high-security operations

7. **Don't ignore token expiration**
   - Return 401 when token is expired
   - Client should refresh and retry

8. **Don't commit service account files**
   - Add `*.json` to `.gitignore` for credentials folder
   - Use environment variables instead

### Common Vulnerabilities to Avoid

**1. Token Replay Attacks**

- **Risk**: Stolen token used to impersonate user
- **Mitigation**: Short token lifespan (1 hour), HTTPS only, revoke tokens on logout

**2. Man-in-the-Middle Attacks**

- **Risk**: Token intercepted in transit
- **Mitigation**: HTTPS only, certificate pinning on mobile

**3. XSS Attacks** (not applicable to backend, but good to know)

- **Risk**: Malicious script steals token from client
- **Mitigation**: Client should store tokens securely (not in localStorage)

**4. Server-Side Token Theft**

- **Risk**: Service account credentials leaked
- **Mitigation**: Never commit to Git, use secure environment variables, rotate keys periodically

---

## Best Practices

### 1. Initialize Once, Use Everywhere

**Pattern**:

```typescript
// src/config/firebase.ts
import admin from 'firebase-admin';

// Initialize once on module load
if (admin.apps.length === 0) {
  admin.initializeApp({ ... });
}

export default admin;

// src/middleware/authMiddleware.ts
import admin from '../config/firebase';

// Use initialized instance
admin.auth().verifyIdToken(token);
```

### 2. Create Reusable Middleware

**Pattern**:

```typescript
// src/middleware/authMiddleware.ts
export async function authMiddleware(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = await findUserInDatabase(decoded.uid);
    next();
  } catch (error) {
    next(error);
  }
}

// src/routes/userRoutes.ts
import { authMiddleware } from "../middleware/authMiddleware";

router.get("/profile", authMiddleware, (req, res) => {
  // req.user is guaranteed to exist
  res.json({ user: req.user });
});
```

### 3. Centralize Error Handling

**Pattern**:

```typescript
// src/utils/errors.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// src/middleware/errorHandler.ts
export function errorHandler(error, req, res, next) {
  if (error instanceof AuthError) {
    return res.status(401).json({
      success: false,
      error: { type: "AuthError", message: error.message, code: error.code },
    });
  }
  // Handle other errors...
}
```

### 4. Type Safety with TypeScript

**Pattern**:

```typescript
import { Request, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { UserDocument } from "../models/User";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      decodedToken?: DecodedIdToken;
    }
  }
}

// Type-safe middleware
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // TypeScript knows req.user is UserDocument | undefined
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }

  const decoded = await admin.auth().verifyIdToken(token);
  req.decodedToken = decoded; // TypeScript knows this is DecodedIdToken
  next();
}
```

### 5. Graceful Degradation

**Pattern**:

```typescript
// Initialize Firebase with fallback
try {
  admin.initializeApp({ ... });
  console.log('Firebase initialized');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // In development, continue without Firebase
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // Crash in production - can't run without auth
  }
}
```

### 6. Testing with Mocks

**Pattern**:

```typescript
// tests/mocks/firebase.ts
export const mockVerifyIdToken = jest.fn();

jest.mock("firebase-admin", () => ({
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

// tests/middleware/authMiddleware.test.ts
import { mockVerifyIdToken } from "../mocks/firebase";

test("should authenticate valid token", async () => {
  mockVerifyIdToken.mockResolvedValue({
    uid: "user123",
    email: "user@example.com",
  });

  // Test middleware...
});
```

---

## Resources

**Official Documentation**:

- Main Docs: https://firebase.google.com/docs/admin/setup
- Verify ID Tokens: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Manage Sessions: https://firebase.google.com/docs/auth/admin/manage-sessions
- API Reference: https://firebase.google.com/docs/reference/admin/node
- Error Codes: https://firebase.google.com/docs/auth/admin/errors

**GitHub**:

- Repository: https://github.com/firebase/firebase-admin-node
- Issues: https://github.com/firebase/firebase-admin-node/issues
- Release Notes: https://firebase.google.com/support/release-notes/admin/node

**Community Resources**:

- Stack Overflow: [firebase-admin] tag
- Firebase Community: https://firebase.google.com/community
- Medium: "Firebase Admin SDK authentication" articles

**Related Packages**:

- `firebase` (Client SDK): For React Native/web clients
- `jsonwebtoken`: JWT library (Firebase Admin uses this internally)
- `jwks-rsa`: For JWT verification (Firebase Admin uses this internally)

---

## Notes

### Key Takeaways for TripWiser

1. **Backend role**: Token verifier ONLY, not user creator
2. **Client role**: Handles all authentication (signup, login, logout, password reset)
3. **MongoDB role**: Source of truth for user data (not Firebase)
4. **Token lifespan**: 1 hour, automatically refreshed by client SDK
5. **Performance**: Don't use `checkRevoked: true` unless absolutely necessary
6. **Security**: Always verify tokens, never cache them, HTTPS only
7. **Error handling**: Return 401 for auth errors, let client refresh token

### Common Gotchas

1. **Service account JSON has snake_case, TypeScript interface has camelCase**
   - Solution: SDK handles conversion automatically, just pass raw JSON

2. **Multiple initialization error**
   - Solution: Check `admin.apps.length > 0` before initializing

3. **Token expiration not detected properly**
   - Solution: Check `error.code === 'auth/id-token-expired'` or `error.message.includes('expired')`

4. **Private key newlines in environment variables**
   - Solution: Replace `\\n` with `\n`: `privateKey.replace(/\\n/g, '\n')`

5. **Tokens work in Postman but not from client**
   - Solution: Check Authorization header format: `Bearer <token>` (space after Bearer)

6. **403 errors in production**
   - Solution: Check service account has correct permissions in Firebase console

### Performance Optimization

**Firebase Admin SDK already optimizes**:

- Caches public keys for signature verification (reduces network calls)
- Verifies tokens locally when possible
- Only calls Firebase backend when `checkRevoked: true`

**Your optimization opportunities**:

- Cache MongoDB user lookups (not tokens!) in Redis
- Use connection pooling for MongoDB
- Don't use `checkRevoked: true` unless needed (saves 1 network round trip)

### Future Enhancements

**Possible improvements to TripWiser auth flow**:

1. **Custom claims**: Add `plan` to token claims for client-side UI changes
   ```typescript
   await admin.auth().setCustomUserClaims(uid, { plan: "pro" });
   ```
2. **Session cookies**: Use `createSessionCookie()` for web version
3. **Multi-factor auth**: Support MFA using Firebase Admin SDK methods
4. **Token revocation on logout**: Call `revokeRefreshTokens()` when user logs out
