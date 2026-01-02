# Google Sheets Backend Setup

Your cashback system now uses Google Sheets as the database instead of localStorage.

## Setup Steps

### 1. Create Google Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the Spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part

### 2. Deploy Apps Script
1. Open your spreadsheet
2. Go to **Extensions → Apps Script**
3. Delete any default code
4. Copy all content from `appscript-backend.gs` and paste it
5. Update the `SPREADSHEET_ID` at the top:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual ID
   ```
6. Click the **Run** button and select `setup` function to initialize sheets
7. Authorize the script (it will ask for permissions)
8. Click **Deploy → New deployment**
9. Choose **Web app** as type
10. Settings:
    - **Execute as:** Me (your email)
    - **Who has access:** Anyone
11. Click **Deploy**
12. Copy the **Web app URL** (it looks like: `https://script.google.com/macros/s/.../exec`)

### 3. Update Frontend
1. Open `services/storage.ts`
2. Replace the `APPSCRIPT_URL` with your deployed URL:
   ```typescript
   const APPSCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

### 4. Test
1. Start your dev server: `npm run dev`
2. Login as admin (username: `admin`, password: `admin123`)
3. Check the browser console - you should see:
   - "Fetched users from Sheets: X"
   - "Fetched transactions from Sheets: X"

## Features

✅ **Caching:** Data is cached for 5 minutes to reduce API calls
✅ **Auto-retry:** Falls back to cached data if API fails
✅ **Real-time sync:** Changes are immediately saved to Google Sheets
✅ **User balance:** Automatically updates when transactions are processed
✅ **Admin auto-create:** First login creates admin user automatically

## Troubleshooting

**Error: "Connection error"**
- Check that `APPSCRIPT_URL` is correct in `storage.ts`
- Make sure Apps Script deployment is set to "Anyone" access
- Check browser console for detailed error messages

**Users not appearing**
- Run the `setup()` function in Apps Script to initialize sheets
- Check that the spreadsheet ID in Apps Script is correct

**Transactions not saving**
- Make sure both Users and Transactions sheets exist
- Check Apps Script logs: Apps Script Editor → Executions

## Data Structure

### Users Sheet Columns:
1. ID
2. Phone Number
3. Name
4. Role (USER/ADMIN)
5. Balance
6. QR Data
7. Created At

### Transactions Sheet Columns:
1. ID
2. User ID
3. Amount
4. Cashback Amount
5. Type (EARN/REDEEM)
6. Timestamp
7. Admin ID
