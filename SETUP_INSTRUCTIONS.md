# Google Sheets Backend Setup Instructions

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Cashback System Database" (or any name you prefer)
4. Note the Spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part

## Step 2: Set Up Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `appscript-backend.gs` file
4. Paste it into the Apps Script editor
5. Replace `YOUR_SPREADSHEET_ID` on line 4 with your actual Spreadsheet ID
6. Save the project (name it "Cashback Backend" or similar)

## Step 3: Initialize the Sheets

1. In the Apps Script editor, select the `setup` function from the dropdown
2. Click the **Run** button (▶️)
3. You'll be asked to authorize the script:
   - Click **Review Permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
4. Check your spreadsheet - you should now see two sheets:
   - **Users** (with the admin user already added)
   - **Transactions** (empty, ready for data)

## Step 4: Deploy as Web App

1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Cashback System API v1"
   - **Execute as**: Me ([your email])
   - **Who has access**: Anyone (⚠️ Important for avoiding CORS)
5. Click **Deploy**
6. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/...../exec`)
7. Click **Done**

## Step 5: Update Your Code

1. Open `services/storage.ts` in your code
2. Replace `YOUR_APPSCRIPT_DEPLOYED_URL` with the Web app URL you just copied
3. Make sure to use the full URL including `/exec` at the end

Example:
```typescript
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

## Step 6: Test the Integration

1. Run your app: `npm run dev`
2. Try creating a new user account
3. Check your Google Sheet - the user should appear in the Users sheet
4. Try a transaction - it should appear in the Transactions sheet

## Troubleshooting

### CORS Errors
- Make sure you deployed as "Anyone" access
- Verify the URL ends with `/exec` not `/dev`
- Clear your browser cache

### Data Not Syncing
- Check the browser console for error messages
- Verify the Spreadsheet ID is correct in Apps Script
- Make sure you ran the `setup` function
- Check that the Web app is deployed with "Execute as: Me"

### Permission Errors
- Re-authorize the script from Apps Script editor
- Make sure your Google account has edit access to the sheet
- Try redeploying the Web app

## How It Works

- **Local First**: Data is saved to localStorage immediately (fast)
- **Auto Sync**: Data syncs to Google Sheets in the background
- **On Startup**: App loads latest data from Google Sheets
- **No CORS**: Apps Script Web Apps handle CORS automatically

## Data Structure

### Users Sheet Columns:
- ID, Phone Number, Name, Role, Balance, QR Data, Created At

### Transactions Sheet Columns:
- ID, User ID, Amount, Cashback Amount, Type, Timestamp, Admin ID

## Security Notes

⚠️ This setup allows anyone with the URL to access your backend. For production:
1. Add authentication tokens
2. Implement rate limiting
3. Validate all inputs
4. Consider using OAuth for user authentication
