# OAuth Provider Setup Guide

This guide will help you obtain the necessary OAuth credentials for running the Projojo backend.

## Google OAuth Setup

**Official Documentation:** [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)\
**Revoke Access:** [Manage Connected Apps](https://myaccount.google.com/connections)

> **Note:** The Google Cloud Console can be buggy in **Chrome** and sometimes needs a refresh when CSS doesn't load properly. **Edge** seems to work fine.

### Step 1: Create a New Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a **new project**

### Step 2: Configure OAuth Consent Screen
1. Navigate to the [Google Auth Platform](https://console.cloud.google.com/auth)
2. Click **Get started** and fill out the basic info for the consent screen:
   - **App name**: This will be displayed to users during login (e.g., "Projojo")
   - **Audience**: Select **External**
   - **User support email**: Enter a contact email (probably your own)

### Step 3: Create OAuth Client ID
1. Return to the homepage and navigate to **APIs & Services** > **[Credentials](https://console.cloud.google.com/apis/credentials)**
2. Click **Create credentials** > **OAuth client ID**
3. Configure the client:
   - **Application type**: Select **Web application**
   - **Name**: Only displayed within the Google Cloud Console (can be left as-is)
   - **Authorized redirect URIs**: Add the following:
     - `http://localhost:8000/auth/callback/google`
     - Optionally also add: `http://127.0.0.1:8000/auth/callback/google`

### Step 4: Save Your Credentials
1. Click **Create**
2. Copy the **Client ID** and **Client secret** from the modal
3. Add them to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

**Lost your Client secret?**
- If you didn't copy the Client secret, go to the [Credentials page](https://console.cloud.google.com/apis/credentials)
- Find your client listed under **OAuth 2.0 Client IDs** and click on it
- Create a new Client secret, copy it, and paste it into your `.env` file
- Disable and delete the lost first Client secret

### Step 5: Test Your Setup
1. Save any Python file in the backend (e.g., `main.py`) to trigger an automatic reload that loads the updated `.env` file
2. You should now be able to log in using the same Google account that you used to log in to the Google Cloud Console

### Optional: Customize Your App

**Add Branding**
- Go to the [Branding page](https://console.cloud.google.com/auth/branding)
- Add a logo and links to the homepage, privacy policy, and Terms of Service

**Add Test Users**
- Go to the [Audience page](https://console.cloud.google.com/auth/audience)
- Add **Test users** who can use this login
  > This is probably not needed for local development

**Publish Your App**
- When ready for production, you can publish your app from the [Audience page](https://console.cloud.google.com/auth/audience)

## GitHub OAuth Setup

**Official Documentation:** [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)\
**Revoke Access:** [Authorized Applications](https://github.com/settings/applications)

### Step 1: Access OAuth Apps Settings
1. Go to [GitHub](https://github.com/)
2. Click on your **profile picture** > **Settings** > **Developer settings** > **OAuth Apps**

### Step 2: Create New OAuth App
1. Click **New OAuth App**
2. Fill in the application details:
   - **Application name**: This will be displayed to users during login (e.g., "Projojo")
   - **Homepage URL**: `http://localhost:5173/home` (will also be displayed to users)
   - **Application description** (optional): Note that this doesn't seem to be shown to users despite what the form suggests
   - **Authorization callback URL**: `http://localhost:8000/auth/callback/github`
   - **Enable Device Flow**: Can stay disabled

3. Click **Register application**

### Step 3: Save Your Credentials
1. Click **Generate a new client secret**
2. Copy the **Client secret** and the **Client ID** into your `.env` file:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

**Lost your Client secret?**
- You can generate a new one from the same OAuth Apps settings page
- Delete the old secret after generating a new one

### Step 4: Test Your Setup
1. Save any Python file in the backend (e.g., `main.py`) to trigger an automatic reload that loads the updated `.env` file
2. You should now be able to log in using any GitHub account

### Optional: Add Branding
- Upload an application logo to make your OAuth app more recognizable to users

## Microsoft OAuth Setup

**Official Documentation:** [Microsoft Entra Identity Platform](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)\
**Revoke Access:** [App Access Management](https://account.microsoft.com/privacy/app-access)

### Step 1: Register an Application
1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com/) (formerly Azure Active Directory)
2. Browse to **Entra ID** > **App registrations** and select **New registration**
3. Fill in the application details:
   - **Name**: This will be displayed to users during login (e.g., "Projojo")
   - **Supported account types**: Select **Accounts in any organizational directory and personal Microsoft accounts** for most applications
   - Leave **Redirect URI** empty for now (we'll add it in the next step)
4. Click **Register**
5. Record the **Application (client) ID** from the Overview page - you'll need this for your `.env` file

### Step 2: Add a Redirect URI
**Guide:** [How to add a redirect URI](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri)

1. In your app registration, select **Authentication** under Manage
2. Under **Platform configurations**, select **Add a platform**
3. Select **Web** as the platform type
4. Add the redirect URI:
   - `http://localhost:8000/auth/callback/microsoft`
5. Click **Configure** to save

### Step 3: Create a Client Secret
**Guide:** [How to add credentials](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials)

1. In your app registration, select **Certificates & secrets** under Manage
2. Select **Client secrets** tab > **New client secret**
3. Add a description (e.g., "Local development") and choose an expiration period
4. Click **Add**
5. **Important:** Copy the **Value** (not the Secret ID) immediately - it won't be shown again!

### Step 4: Save Your Credentials
Add the Application (client) ID and client secret to your `.env` file:
```env
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

**Lost your Client secret?**
- Client secrets cannot be retrieved after creation
- Go to **Certificates & secrets** and create a new client secret
- Delete the old secret after updating your `.env` file

### Step 5: Test Your Setup
1. Save any Python file in the backend (e.g., `main.py`) to trigger an automatic reload that loads the updated `.env` file
2. You should now be able to log in using any Microsoft account (personal or organizational)
