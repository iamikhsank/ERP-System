// ==== 01-main.gs ====
// 01-main.gs

function doGet(e) {
  // Security best practices for Google Apps Script HTML Service:
  // - NATIVE sandbox mode required for google.script.run() to work
  // - Server-side validation prevents iframe escape attacks
  // - Never trust client-side validation alone
  return HtmlService.createHtmlOutputFromFile('webapp')
    .setTitle('ERP System')
    .setSandboxMode(HtmlService.SandboxMode.NATIVE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .addMetaTag('X-UA-Compatible', 'IE=Edge');
}

function processApiRequest(module, action, payload) {
  try {
    const user = getCurrentUser();
    if (!checkPermission(user, module, action)) {
      return errorResponse('Permission denied.');
    }
    
    // Dispatch to module handlers
    if (module === 'Inventory') return handleInventoryApi(action, payload);
    if (module === 'Finance') return handleFinanceApi(action, payload);
    if (module === 'HR') return handleHrApi(action, payload);
    if (module === 'Procurement') return handleProcurementApi(action, payload);
    if (module === 'Sales') return handleSalesApi(action, payload);
    if (module === 'Dashboard') return handleDashboardApi(action, payload);
    if (module === 'Auth') return handleAuthApi(action, payload);

    return errorResponse('Module not found.');
  } catch (err) {
    return errorResponse(err.message);
  }
}


// ==== 02-auth.gs ====
// 02-auth.gs

function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return { id: data[i][0], email: data[i][1], role: data[i][2], name: data[i][3] };
    }
  }
  
  // Return viewer role if not found (or deny completely depending on needs)
  return { id: 'unknown', email, role: 'viewer', name: 'Guest' };
}

function checkPermission(user, module, action) {
  if (user.role === 'admin') return true;
  if (user.role === 'viewer' && action === 'read') return true;
  if (user.role === 'manager' && action === 'read') return true;
  if (user.role === 'manager' && action === 'approve') return true;
  if (user.role === 'staff') return true; // simplified, ideally check specific module
  return false;
}

function handleAuthApi(action, payload) {
  if (action === 'getCurrentUser') {
    return successResponse(getCurrentUser());
  }
  return errorResponse('Invalid auth action');
}


// ==== modules/10-dashboard.gs ====
// modules/10-dashboard.gs
function handleDashboardApi(action, payload) {
  if (action === 'getMetrics') {
    return successResponse({
      totalRevenue: 15000000,
      totalOrders: 120,
      activeUsers: 45
    });
  }
  return errorResponse('Action not found');
}


// ==== modules/11-inventory.gs ====
// modules/11-inventory.gs
function handleInventoryApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Inventory'));
  return errorResponse('Not implemented');
}


// ==== modules/12-finance.gs ====
// modules/12-finance.gs
function handleFinanceApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Finance'));
  return errorResponse('Not implemented');
}


// ==== modules/13-hr.gs ====
// modules/13-hr.gs
function handleHrApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('HR'));
  return errorResponse('Not implemented');
}


// ==== modules/14-procurement.gs ====
// modules/14-procurement.gs
function handleProcurementApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Procurement'));
  return errorResponse('Not implemented');
}


// ==== modules/15-sales.gs ====
// modules/15-sales.gs
function handleSalesApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Sales'));
  return errorResponse('Not implemented');
}


// ==== modules/16-reporting.gs ====
// modules/16-reporting.gs
function handleReportingApi(action, payload) {
  return errorResponse('Not implemented');
}


// ==== modules/17-settings.gs ====
// modules/17-settings.gs
function handleSettingsApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Settings'));
  return errorResponse('Not implemented');
}


// ==== 99-utils.gs ====
// 99-utils.gs

function successResponse(data) {
  return JSON.stringify({ success: true, data: data, error: null });
}

function errorResponse(errorMessage) {
  return JSON.stringify({ success: false, data: null, error: errorMessage });
}

function getSheetDataAsObjects(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }
  
  return rows;
}


