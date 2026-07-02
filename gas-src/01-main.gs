// 01-main.gs

function doGet(e) {
  // Mencoba memuat file html 'Dashboard-for-Spreadsheet' terlebih dahulu, 
  // jika tidak ada, fallback ke 'webapp' atau 'index'
  let htmlOutput;
  try {
    htmlOutput = HtmlService.createHtmlOutputFromFile('Dashboard-for-Spreadsheet');
  } catch (err) {
    try {
      htmlOutput = HtmlService.createHtmlOutputFromFile('webapp');
    } catch (err2) {
      htmlOutput = HtmlService.createHtmlOutputFromFile('index');
    }
  }

  return htmlOutput
    .setTitle('ERP System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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
