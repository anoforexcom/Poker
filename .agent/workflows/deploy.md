---
description: How to deploy the Firebase Poker application
---

This workflow guides you through deploying both the frontend and the backend (Cloud Functions) of the Poker application.

### Prerequisites
1.  **Firebase CLI**: Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`).
2.  **Login**: Run `firebase login` to authenticate.
3.  **Project Initialized**: Ensure you have a project selected (run `firebase use --add`).

### Deployment Steps

1.  **Install Dependencies**
    Navigate to the `functions` directory and install the engine dependencies.
    ```bash
    cd functions
    npm install
    cd ..
    ```

2.  **Build Frontend**
    Build the Vite application.
    ```bash
    npm run build
    ```

3.  **Deploy Everything**
    Deploy Firestore rules, indexes, Functions, and Hosting.
    ```bash
    firebase deploy
    ```

### Troubleshooting
-   **Function Errors**: Check logs using `firebase functions:log`.
-   **Firestore Permission Denied**: Ensure `firestore.rules` are deployed correctly.
-   **API Keys**: Verify your `.env` file has the correct Firebase credentials.
