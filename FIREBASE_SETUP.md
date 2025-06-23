# Firebase Setup Instructions for AUREON

To enable authentication in your Firebase project, please follow these steps:

## 1. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your "aureonai" project
3. In the left sidebar, click on "Authentication"
4. Click the "Get started" button if this is your first time
5. Go to the "Sign-in method" tab

## 2. Enable Sign-in Methods

### Enable Email/Password Authentication:
1. Click on "Email/Password" in the sign-in providers list
2. Toggle "Enable" to ON
3. Click "Save"

### Enable Google Authentication:
1. Click on "Google" in the sign-in providers list
2. Toggle "Enable" to ON
3. Select a support email (your email address)
4. Click "Save"

## 3. Configure Authorized Domains

1. In the Authentication section, go to "Settings" tab
2. Scroll down to "Authorized domains"
3. Add your Replit domain (the one shown in the preview)
4. Add `localhost` for local development

## 4. Enable Firestore Database

**IMPORTANT**: You need to enable Firestore Database for the app to work properly.

1. In the left sidebar, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for now (allows read/write access for testing)
4. Select a location (choose one closest to your users, e.g., europe-west1 for Europe)
5. Click "Done"

Note: The Firestore transport errors you're seeing indicate that Firestore Database hasn't been created yet. Once you create the database, these errors will disappear.

## 5. Security Rules (Optional - for production)

For production, you'll want to update Firestore security rules to ensure user data privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Connected accounts - user can only access their own
    match /connectedAccounts/{accountId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Same pattern for other collections
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /financialGoals/{goalId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /aiTasks/{taskId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /debtAccounts/{debtId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /investingAccounts/{investingId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

Once you complete these steps, the authentication should work properly and users will be able to sign up and sign in to AUREON.