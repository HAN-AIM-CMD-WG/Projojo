# OAuth Provider Setup Guide

This guide will help you obtain the necessary OAuth credentials for running the Projojo backend.

## Google OAuth Setup

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
