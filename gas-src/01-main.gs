// 01-main.gs

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('webapp')
    .setTitle('ERP System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.NATIVE)
    .addMetaTag('X-UA-Compatible', 'IE=Edge')
    // Security best practices for Google Apps Script HTML Service:
    // - NATIVE sandbox mode required for google.script.run() to work
    // - Server-side validation prevents iframe escape attacks
    // - Never trust client-side validation alone
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
