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
