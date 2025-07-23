# TrueLayer Integration Test Flow - Updated

## Current Configuration
- **Client ID**: `sandbox-aureon-52c96f`
- **Environment**: TrueLayer Sandbox
- **Redirect URI**: Dynamic (automatically detects current origin)
  - Local: `http://localhost:5000/callback`
  - Replit: `https://your-replit-url.repl.co/callback`
- **Authorization URL**: `https://auth.truelayer-sandbox.com`

## OAuth Flow Steps

### 1. User Initiates Connection
- User clicks "Connect to Bank" on dashboard
- Modal opens with bank selection options
- User clicks "Connect with TrueLayer Mock Bank" button

### 2. Authorization Request
- App constructs TrueLayer sandbox auth URL with parameters:
  - `response_type=code`
  - `client_id=sandbox-aureon-52c96f`
  - `redirect_uri=` (dynamic based on current origin)
  - `scope=info accounts balance transactions identity`
  - `providers=mock`
  - `state=abc123` (CSRF protection)
  - `nonce=xyz456` (OpenID Connect)

### 3. TrueLayer Authentication
- User redirected to TrueLayer sandbox environment
- User selects "Mock Bank" provider
- User authenticates with mock credentials
- TrueLayer redirects back with authorization code

### 4. Token Exchange
- Express callback route (`/callback`) receives authorization code
- Server exchanges code for access token using client credentials
- Server makes authenticated requests to fetch accounts and transactions
- Server redirects user back to dashboard with account data

### 5. Data Display
- Dashboard automatically updates with fetched bank account information
- User sees connected accounts and transaction history
- Data is stored in Firestore for future sessions

## Dynamic Redirect URI Configuration

The system now automatically detects the current origin and uses it for the redirect URI:

```javascript
// Frontend - Dynamic redirect URI
const redirectUri = window.location.origin + '/callback';

// Backend - Dynamic redirect URI in token exchange
redirect_uri: req.get('origin') + '/callback'
```

This ensures the integration works across environments:
- **Development**: `http://localhost:5000/callback`
- **Replit Deployment**: `https://your-username.repl.co/callback`

## Testing Instructions

### TrueLayer App Configuration Required
Before testing, ensure your TrueLayer application is configured with the correct redirect URI:

1. **For Local Development**: `http://localhost:5000/callback`
2. **For Replit Deployment**: `https://[your-replit-username].repl.co/callback`

### Testing Checklist

- [ ] TrueLayer button appears in connect account modal
- [ ] Button opens TrueLayer sandbox authentication in new tab
- [ ] Correct redirect URI logged in console
- [ ] Mock bank provider is available for selection
- [ ] Authorization flow completes successfully
- [ ] Callback route receives and processes authorization code
- [ ] Access token is obtained through token exchange
- [ ] Account data is fetched and displayed
- [ ] Transaction data is fetched and displayed
- [ ] Data persists in Firestore
- [ ] User is redirected back to dashboard
- [ ] Connected accounts appear in dashboard UI

## Security Features

- **State Parameter**: `abc123` for CSRF protection
- **Nonce Parameter**: `xyz456` for OpenID Connect security
- **Dynamic Redirect URI**: Prevents redirect URI mismatch attacks
- **Bearer Token Authentication**: Secure API access

## API Endpoints Used

### Token Exchange
```
POST https://auth.truelayer-sandbox.com/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
client_id=sandbox-aureon-52c96f
client_secret=[HIDDEN]
redirect_uri=[DYNAMIC_ORIGIN]/callback
code=[AUTH_CODE]
```

### Account Data
```
GET https://api.truelayer-sandbox.com/data/v1/accounts
Authorization: Bearer [ACCESS_TOKEN]
```

### Transaction Data
```
GET https://api.truelayer-sandbox.com/data/v1/accounts/[ACCOUNT_ID]/transactions
Authorization: Bearer [ACCESS_TOKEN]
```