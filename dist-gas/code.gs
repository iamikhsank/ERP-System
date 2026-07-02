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
  const isReadAction = action === 'get' || action === 'getMetrics' || action === 'getCurrentUser' || action === 'read';
  if (user.role === 'admin') return true;
  if (isReadAction) return true; // Everyone can read
  
  if (user.role === 'viewer') return false; // Viewer cannot write
  
  if (user.role === 'manager') {
    if (action === 'approve' || action === 'reject' || action === 'create' || action === 'update' || action === 'updateStatus') return true;
    return false;
  }
  
  if (user.role === 'staff') {
    // Staff can create and update, but can't delete or run admin actions
    if (action === 'create' || action === 'update' || action === 'updateStatus') return true;
    return false;
  }
  
  return false;
}

function handleAuthApi(action, payload) {
  try {
    if (action === 'getCurrentUser') {
      return successResponse(getCurrentUser());
    }
    if (action === 'getUsers') {
      return successResponse(getSheetDataAsObjects('Users'));
    }
    if (action === 'createUser') {
      const res = insertRow('Users', payload);
      return successResponse(res);
    }
    if (action === 'updateUser') {
      const res = updateRow('Users', payload.id, payload);
      return successResponse(res);
    }
    if (action === 'deleteUser') {
      const res = deleteRow('Users', payload.id);
      return successResponse({ success: res });
    }
    return errorResponse('Invalid auth action');
  } catch (err) {
    return errorResponse(err.message);
  }
}


// ==== modules/10-dashboard.gs ====
// modules/10-dashboard.gs
function handleDashboardApi(action, payload) {
  if (action === 'getMetrics') {
    try {
      const financeItems = getSheetDataAsObjects('Finance');
      const salesItems = getSheetDataAsObjects('Sales');
      const hrItems = getSheetDataAsObjects('HR');
      const inventoryItems = getSheetDataAsObjects('Inventory');
      const procurementItems = getSheetDataAsObjects('Procurement');

      // 1. Calculate Total Revenue from Finance (Incomes)
      let totalRevenue = 0;
      financeItems.forEach(item => {
        if (item.type === 'Income') {
          totalRevenue += Number(item.amount || 0);
        }
      });

      // 2. Total Orders (Sales count)
      const totalOrders = salesItems.length;

      // 3. Active Karyawan count
      let activeUsers = 0;
      hrItems.forEach(emp => {
        if (emp.status === 'Active') {
          activeUsers++;
        }
      });

      // 4. Low stock items
      let lowStockItems = 0;
      inventoryItems.forEach(item => {
        const qty = Number(item.quantity || 0);
        const min = Number(item.minStock || 5);
        if (qty <= min) {
          lowStockItems++;
        }
      });

      // 5. Dynamic Cashflow (group by Month names: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Ags, Sep, Okt, Nov, Des)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      
      // Initialize last 6 months dynamically
      const cashflowMap = {};
      const today = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mName = monthNames[d.getMonth()];
        last6Months.push(mName);
        cashflowMap[mName] = { income: 0, expense: 0 };
      }

      financeItems.forEach(item => {
        if (!item.date) return;
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;
        const mName = monthNames[d.getMonth()];
        if (cashflowMap[mName]) {
          if (item.type === 'Income') {
            cashflowMap[mName].income += Number(item.amount || 0);
          } else if (item.type === 'Expense') {
            cashflowMap[mName].expense += Number(item.amount || 0);
          }
        }
      });

      const cashflow = last6Months.map(m => ({
        month: m,
        income: cashflowMap[m].income,
        expense: cashflowMap[m].expense
      }));

      // 6. Recent activities generated dynamically from actual entries
      const recentActivities = [];

      // Add recent sales orders
      salesItems.slice(-2).forEach(so => {
        recentActivities.push({
          id: 'sales_' + so.id,
          time: so.createdAt ? formatActivityDate(so.createdAt) : 'Baru saja',
          type: 'Sales',
          message: 'Pesanan ' + so.orderNo + ' oleh ' + so.customer + ' senilai Rp ' + Number(so.total || 0).toLocaleString('id-ID') + ' berstatus ' + so.status,
          severity: so.status === 'Paid' ? 'success' : 'info',
          rawDate: so.createdAt || ''
        });
      });

      // Add low stock alerts
      inventoryItems.forEach(inv => {
        const qty = Number(inv.quantity || 0);
        const min = Number(inv.minStock || 5);
        if (qty <= min) {
          recentActivities.push({
            id: 'inv_' + inv.id,
            time: 'Perhatian',
            type: 'Inventory',
            message: 'Stok barang ' + inv.name + ' menipis di ' + inv.warehouse + ' (sisa ' + qty + ' unit)',
            severity: 'warning',
            rawDate: inv.createdAt || ''
          });
        }
      });

      // Add recent procurement requests
      procurementItems.slice(-2).forEach(pr => {
        recentActivities.push({
          id: 'proc_' + pr.id,
          time: pr.createdAt ? formatActivityDate(pr.createdAt) : 'Kemarin',
          type: 'Procurement',
          message: 'Pengadaan ' + pr.item + ' sebanyak ' + pr.quantity + ' pcs berstatus ' + pr.status,
          severity: pr.status === 'Approved' ? 'success' : pr.status === 'Rejected' ? 'warning' : 'info',
          rawDate: pr.createdAt || ''
        });
      });

      // Sort recent activities by rawDate descending and limit to 4
      recentActivities.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
      const finalActivities = recentActivities.slice(0, 4);

      // Fallback if empty to look perfectly beautiful
      if (finalActivities.length === 0) {
        finalActivities.push({
          id: 'empty_sys',
          time: 'Sistem',
          type: 'Sistem',
          message: 'Sistem siap digunakan. Semua modul berjalan normal.',
          severity: 'info'
        });
      }

      return successResponse({
        totalRevenue,
        totalOrders,
        activeUsers,
        lowStockItems,
        cashflow,
        recentActivities: finalActivities
      });
    } catch (err) {
      return errorResponse(err.message);
    }
  }
  return errorResponse('Action not found');
}

function formatActivityDate(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Baru saja';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return hours + ':' + mins + ' WIB';
  } catch(e) {
    return 'Baru saja';
  }
}


// ==== modules/11-inventory.gs ====
// modules/11-inventory.gs
function handleInventoryApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Inventory'));
    }
    if (action === 'create') {
      const res = insertRow('Inventory', payload);
      return successResponse(res);
    }
    if (action === 'update') {
      const res = updateRow('Inventory', payload.id, payload);
      return successResponse(res);
    }
    if (action === 'delete') {
      const res = deleteRow('Inventory', payload.id);
      return successResponse({ success: res });
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}


// ==== modules/12-finance.gs ====
// modules/12-finance.gs
function handleFinanceApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Finance'));
    }
    if (action === 'create') {
      const res = insertRow('Finance', payload);
      return successResponse(res);
    }
    if (action === 'update') {
      const res = updateRow('Finance', payload.id, payload);
      return successResponse(res);
    }
    if (action === 'delete') {
      const res = deleteRow('Finance', payload.id);
      return successResponse({ success: res });
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}


// ==== modules/13-hr.gs ====
// modules/13-hr.gs
function handleHrApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('HR'));
    }
    if (action === 'create') {
      const res = insertRow('HR', payload);
      return successResponse(res);
    }
    if (action === 'update') {
      const res = updateRow('HR', payload.id, payload);
      return successResponse(res);
    }
    if (action === 'delete') {
      const res = deleteRow('HR', payload.id);
      return successResponse({ success: res });
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}


// ==== modules/14-procurement.gs ====
// modules/14-procurement.gs
function handleProcurementApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Procurement'));
    }
    if (action === 'create') {
      const allReqs = getSheetDataAsObjects('Procurement');
      const nextNum = allReqs.length + 1;
      payload.requestNo = 'PR-' + String(nextNum).padStart(3, '0');
      payload.status = 'Pending';
      const res = insertRow('Procurement', payload);
      return successResponse(res);
    }
    if (action === 'approve') {
      const res = updateRow('Procurement', payload.id, { status: 'Approved' });
      return successResponse(res);
    }
    if (action === 'reject') {
      const res = updateRow('Procurement', payload.id, { status: 'Rejected' });
      return successResponse(res);
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}


// ==== modules/15-sales.gs ====
// modules/15-sales.gs
function handleSalesApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Sales'));
    }
    if (action === 'create') {
      const allOrders = getSheetDataAsObjects('Sales');
      const nextNum = allOrders.length + 1;
      payload.orderNo = 'SO-' + String(nextNum).padStart(3, '0');
      payload.status = payload.status || 'Draft';
      const res = insertRow('Sales', payload);
      return successResponse(res);
    }
    if (action === 'updateStatus') {
      const res = updateRow('Sales', payload.id, { status: payload.status });
      
      // Auto-log to Finance as Income when status becomes Paid
      if (payload.status === 'Paid') {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const salesSheet = ss.getSheetByName('Sales');
        const data = salesSheet.getDataRange().getValues();
        let orderObj = null;
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(payload.id)) {
            orderObj = { orderNo: data[i][1], customer: data[i][2], total: Number(data[i][3]) };
            break;
          }
        }
        if (orderObj) {
          insertRow('Finance', {
            type: 'Income',
            amount: orderObj.total,
            date: new Date().toISOString().split('T')[0],
            description: 'Pelunasan Pesanan ' + orderObj.orderNo + ' (' + orderObj.customer + ')',
            category: 'Sales'
          });
        }
      }
      
      return successResponse(res);
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
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

function insertRow(sheetName, rowObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Assign ID if not exists
  if (!rowObj.id) {
    rowObj.id = 'id_' + Math.random().toString(36).substr(2, 9);
  }
  if (!rowObj.createdAt) {
    rowObj.createdAt = new Date().toISOString();
  }
  
  const newRow = headers.map(header => {
    return rowObj[header] !== undefined ? rowObj[header] : '';
  });
  
  sheet.appendRow(newRow);
  return rowObj;
}

function updateRow(sheetName, id, updatedFields) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');
  
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  if (data.length <= 1) throw new Error('No data found to update');
  
  const headers = data[0];
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowIndex = i + 1; // 1-indexed and skip headers
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error('Row with ID ' + id + ' not found');
  
  const rowRange = sheet.getRange(rowIndex, 1, 1, headers.length);
  const currentRowValues = rowRange.getValues()[0];
  
  const updatedRowValues = headers.map((header, idx) => {
    if (header === 'id') return currentRowValues[idx];
    if (header === 'updatedAt') return new Date().toISOString();
    return updatedFields[header] !== undefined ? updatedFields[header] : currentRowValues[idx];
  });
  
  rowRange.setValues([updatedRowValues]);
  return { id, ...updatedFields };
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowIndex = i + 1; // 1-indexed and skip headers
      break;
    }
  }
  
  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex);
    return true;
  }
  
  throw new Error('Row with ID ' + id + ' not found');
}


