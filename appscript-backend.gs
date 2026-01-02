// Google Apps Script Backend for Cashback System
// Deploy this as a Web App with "Anyone" access

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your Google Sheet ID
const USERS_SHEET = 'Users';
const TRANSACTIONS_SHEET = 'Transactions';

// Enable CORS
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    switch(action) {
      case 'getUsers':
        result = getUsers();
        break;
      case 'getTransactions':
        result = getTransactions();
        break;
      default:
        result = { error: 'Invalid action' };
    }
    return createResponse(result);
  } catch (error) {
    return createResponse({ error: error.toString() });
  }
}

function doPost(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    const data = JSON.parse(e.postData.contents);
    
    switch(action) {
      case 'saveUser':
        result = saveUser(data);
        break;
      case 'saveTransaction':
        result = saveTransaction(data);
        break;
      default:
        result = { error: 'Invalid action' };
    }
    return createResponse(result);
  } catch (error) {
    return createResponse({ error: error.toString() });
  }
}

// Create CORS-friendly response
function createResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  return output;
}

// Get spreadsheet
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Initialize sheets if they don't exist
function initializeSheets() {
  const ss = getSpreadsheet();
  
  // Create Users sheet
  let usersSheet = ss.getSheetByName(USERS_SHEET);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET);
    usersSheet.appendRow(['ID', 'Phone Number', 'Name', 'Role', 'Balance', 'QR Data', 'Created At']);
    
    // Add default admin
    usersSheet.appendRow([
      'admin_1',
      '000',
      'Store Manager',
      'ADMIN',
      0,
      'ADMIN_KEY',
      new Date().toISOString()
    ]);
  }
  
  // Create Transactions sheet
  let transactionsSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  if (!transactionsSheet) {
    transactionsSheet = ss.insertSheet(TRANSACTIONS_SHEET);
    transactionsSheet.appendRow(['ID', 'User ID', 'Amount', 'Cashback Amount', 'Type', 'Timestamp', 'Admin ID']);
  }
}

// Get all users
function getUsers() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET);
  
  if (!sheet) {
    initializeSheets();
    return getUsers();
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {  // Skip empty rows
      users.push({
        id: String(row[0]),  // Force to string
        phoneNumber: String(row[1] || ''),
        name: String(row[2] || ''),
        role: String(row[3] || 'USER'),
        balance: parseFloat(row[4]) || 0,
        qrData: String(row[5] || ''),
        createdAt: row[6] ? row[6].toString() : ''
      });
    }
  }
  
  Logger.log('getUsers: Returning ' + users.length + ' users');
  return users;
}

// Get all transactions
function getTransactions() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  
  if (!sheet) {
    initializeSheets();
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const transactions = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    transactions.push({
      id: row[0],
      userId: row[1],
      amount: parseFloat(row[2]) || 0,
      cashbackAmount: parseFloat(row[3]) || 0,
      type: row[4],
      timestamp: row[5],
      adminId: row[6]
    });
  }
  
  return transactions;
}

// Save or update user
function saveUser(user) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET);
  
  if (!sheet) {
    initializeSheets();
    return saveUser(user);
  }
  
  const data = sheet.getDataRange().getValues();
  let userRow = -1;
  
  // Convert user.id to string for comparison
  const userId = String(user.id);
  
  Logger.log('saveUser: Looking for user ID: "' + userId + '"');
  
  // Find existing user by ID (primary check)
  for (let i = 1; i < data.length; i++) {
    const existingId = String(data[i][0]);
    Logger.log('saveUser: Comparing with row ' + i + ': "' + existingId + '"');
    
    if (existingId === userId) {
      userRow = i + 1;
      Logger.log('saveUser: Found existing user at row ' + userRow);
      break;
    }
  }
  
  // If not found by ID, also check by phone number to prevent duplicates
  if (userRow === -1 && user.phoneNumber) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(user.phoneNumber) && user.phoneNumber !== '') {
        userRow = i + 1;
        Logger.log('saveUser: Found existing user by phone at row ' + userRow);
        break;
      }
    }
  }
  
  const rowData = [
    String(user.id),  // Force to string
    String(user.phoneNumber || ''),
    String(user.name || ''),
    String(user.role || 'USER'),
    parseFloat(user.balance) || 0,
    String(user.qrData || ''),
    user.createdAt || new Date().toISOString()
  ];
  
  if (userRow > 0) {
    // Update existing user
    sheet.getRange(userRow, 1, 1, 7).setValues([rowData]);
    Logger.log('saveUser: Updated existing user: ' + user.id);
  } else {
    // Add new user
    sheet.appendRow(rowData);
    Logger.log('saveUser: Created new user: ' + user.id);
  }
  
  // Flush changes immediately
  SpreadsheetApp.flush();
  
  return { success: true, user: user };
}

// Save transaction and update user balance
function saveTransaction(transaction) {
  const ss = getSpreadsheet();
  const transSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  const usersSheet = ss.getSheetByName(USERS_SHEET);
  
  if (!transSheet || !usersSheet) {
    initializeSheets();
    return saveTransaction(transaction);
  }
  
  // Save transaction
  transSheet.appendRow([
    transaction.id,
    transaction.userId,
    transaction.amount,
    transaction.cashbackAmount,
    transaction.type,
    transaction.timestamp,
    transaction.adminId
  ]);
  
  // Update user balance
  const userData = usersSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][0] === transaction.userId) {
      const currentBalance = parseFloat(userData[i][4]) || 0;
      let newBalance;
      
      if (transaction.type === 'EARN') {
        newBalance = currentBalance + transaction.cashbackAmount;
      } else if (transaction.type === 'REDEEM') {
        newBalance = currentBalance - transaction.cashbackAmount;
      } else {
        newBalance = currentBalance;
      }
      
      usersSheet.getRange(i + 1, 5).setValue(newBalance);
      break;
    }
  }
  
  return { success: true, transaction: transaction };
}

// Setup function (run this once manually)
function setup() {
  initializeSheets();
  Logger.log('Sheets initialized successfully!');
}
