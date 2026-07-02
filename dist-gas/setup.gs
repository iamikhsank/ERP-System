// 00-setup.gs

function runSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const requiredSheets = [
    { name: 'Users', headers: ['id', 'email', 'role', 'name', 'createdAt'] },
    { name: 'Inventory', headers: ['id', 'sku', 'name', 'quantity', 'warehouse', 'createdAt', 'updatedAt'] },
    { name: 'Finance', headers: ['id', 'type', 'amount', 'date', 'description', 'createdAt'] },
    { name: 'HR', headers: ['id', 'employeeName', 'position', 'status', 'createdAt'] },
    { name: 'Procurement', headers: ['id', 'requestNo', 'item', 'quantity', 'status', 'createdAt'] },
    { name: 'Sales', headers: ['id', 'orderNo', 'customer', 'total', 'status', 'createdAt'] },
    { name: 'Settings', headers: ['key', 'value'] }
  ];

  requiredSheets.forEach(sheetDef => {
    let sheet = ss.getSheetByName(sheetDef.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetDef.name);
      sheet.appendRow(sheetDef.headers);
    }
  });

  // Seed default admin if Users is empty
  const usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getLastRow() === 1) {
    usersSheet.appendRow(['u1', Session.getActiveUser().getEmail(), 'admin', 'Default Admin', new Date().toISOString()]);
  }

  // Set Script Properties
  PropertiesService.getScriptProperties().setProperty('COMPANY_NAME', 'ERP Corp');
  
  Logger.log('Setup complete.');
}
