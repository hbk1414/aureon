# TrueLayer Integration Test Flow

## Complete OAuth Test Flow

This document outlines the complete test flow for the TrueLayer bank integration in AUREON.

### 1. Starting the Test

1. **Navigate to Dashboard**: Open http://localhost:5000/dashboard
2. **Click "Connect to Bank"**: Find and click the TrueLayer connection button
3. **Verify Button Action**: The button should open TrueLayer's authentication page in a new tab

### 2. TrueLayer Mock Authentication

1. **Authentication Page**: You'll be redirected to TrueLayer's sandbox authentication
2. **Mock Bank Login**: Use TrueLayer's mock bank credentials (provided by TrueLayer sandbox)
3. **Grant Permissions**: Authorize AUREON to access your account data
4. **Account Selection**: Select which mock accounts to share

### 3. OAuth Callback Processing

1. **Callback URL**: After authorization, TrueLayer redirects to: `http://localhost:5000/callback`
2. **Server Processing**: 
   - Express server receives the authorization code
   - Exchanges code for access token using TrueLayer API
   - Logs token exchange process in server console
3. **Dashboard Redirect**: Server redirects to: `http://localhost:5000/dashboard?token=ACCESS_TOKEN`

### 4. Data Fetching on Dashboard

1. **Token Detection**: Dashboard detects the token parameter in URL
2. **API Calls**: Automatically calls TrueLayer API functions:
   - `fetchAccounts(token)` - Gets all connected accounts
   - `fetchTransactions(token, accountId)` - Gets transactions for each account
3. **Console Logging**: All data is logged to browser console with emojis:
   - 🔗 Token detection
   - 📊 Data fetching start
   - ✅ Successful data retrieval
   - ❌ Any errors

### 5. Visual Feedback

1. **Loading State**: Blue loading banner appears while fetching data
2. **Success Display**: Green success banner shows:
   - Number of accounts connected
   - Account names and types
   - Transaction counts
   - Provider information
3. **Toast Notifications**: Success/error messages appear
4. **URL Cleanup**: Token parameter removed from URL after processing

### 6. Console Data Structure

Check browser console for detailed logging:

```javascript
// Account data structure
{
  account_id: "string",
  account_type: "string", 
  display_name: "string",
  currency: "string",
  account_number: {
    sort_code: "string",
    number: "string"
  },
  provider: {
    display_name: "string",
    provider_id: "string"
  },
  transactions: [
    {
      transaction_id: "string",
      timestamp: "string",
      description: "string", 
      amount: number,
      currency: "string",
      transaction_type: "string",
      merchant_name: "string"
    }
  ]
}
```

### 7. Expected Console Output

Look for these specific log messages:

1. `🔗 TrueLayer token detected in dashboard URL: [TOKEN]`
2. `📊 Starting TrueLayer data fetch...`
3. `Fetching TrueLayer accounts...`
4. `TrueLayer accounts response: {...}`
5. `Fetching TrueLayer transactions for account: [ACCOUNT_ID]`
6. `TrueLayer transactions response for [ACCOUNT_ID]: {...}`
7. `Complete TrueLayer data: [....]`
8. `✅ TrueLayer data fetched successfully: [....]`

### 8. Error Handling

The system handles various error scenarios:

- **OAuth Errors**: Redirects with error parameter
- **Token Exchange Failures**: Logged and user redirected with error
- **API Call Failures**: Caught and logged with detailed error messages
- **Network Issues**: Proper error boundaries and user feedback

### 9. Testing Checklist

- [ ] TrueLayer button opens authentication page
- [ ] Mock login completes successfully  
- [ ] Callback route receives authorization code
- [ ] Token exchange completes (check server logs)
- [ ] Dashboard receives token parameter
- [ ] `fetchAccounts()` function executes and logs data
- [ ] `fetchTransactions()` function executes for each account
- [ ] All API responses logged to console
- [ ] Visual success indicators appear
- [ ] URL cleanup removes token parameter
- [ ] Error handling works for various failure modes

### 10. Debugging Tips

1. **Server Logs**: Check Express server console for OAuth flow
2. **Browser Console**: Check for API calls and data logging
3. **Network Tab**: Inspect TrueLayer API requests/responses
4. **Environment Variables**: Verify `TRUELAYER_CLIENT_ID` and `TRUELAYER_CLIENT_SECRET` are set
5. **Redirect URI**: Ensure callback URL matches TrueLayer app configuration

### 11. Success Criteria

The test is successful when:

1. Complete OAuth flow works without errors
2. All account data is fetched and logged
3. All transaction data is fetched and logged  
4. Visual feedback confirms successful integration
5. No console errors related to TrueLayer API calls
6. Data structure matches expected TrueLayer API format

This test flow demonstrates a complete working TrueLayer integration with proper error handling, comprehensive logging, and user feedback.