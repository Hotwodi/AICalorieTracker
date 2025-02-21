# Firebase Configuration Setup Guide

## Prerequisites
1. Create a Firebase Account at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Create a new project or select an existing project

## Steps to Get Firebase Configuration

1. Go to Firebase Console
2. Click on your project
3. Go to Project Settings (gear icon near "Project Overview")
4. Under "Your apps" section, click on the Web app icon (`</>`)
5. Register your app with a nickname (e.g., "AI Calorie Tracker")
6. Copy the configuration object

## Configuration Values to Add

Create a `.env` file in the project root with the following template:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Authentication Setup

1. In Firebase Console, go to "Authentication"
2. Enable "Email/Password" sign-in method
3. Create test users for development

## Firestore Setup (Optional)

1. Go to "Firestore Database"
2. Create database in test mode
3. Set up initial collections as needed

## Troubleshooting

- Ensure `.env` file is in `.gitignore`
- Restart development server after adding configuration
- Check browser console for any configuration errors

## Security Note

NEVER commit your actual Firebase configuration to version control.
Always use environment variables and `.env` files.
