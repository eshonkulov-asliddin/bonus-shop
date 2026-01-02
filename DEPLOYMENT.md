# Deployment Guide

## Netlify Deployment

### 1. Environment Variables

In your Netlify dashboard:
1. Go to **Site settings** > **Environment variables**
2. Add the following variable:
   - **Key**: `VITE_APPSCRIPT_URL`
   - **Value**: Your Google Apps Script deployment URL
   - Example: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

### 2. Build Settings

Netlify will automatically detect these settings from your project:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 3. Deploy

Push to your repository and Netlify will automatically build and deploy.

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Apps Script URL:
   ```
   VITE_APPSCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Important Notes

- The `.env` file is git-ignored and won't be committed
- Environment variables must be prefixed with `VITE_` to be accessible in the browser
- Changes to environment variables in Netlify require a rebuild to take effect
