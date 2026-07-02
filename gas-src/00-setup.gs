// 00-setup.gs

function runSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const requiredSheets = [
    { name: 'Users', headers: ['id', 'email', 'role', 'name', 'createdAt'] },
    { name: 'Inventory', headers: ['id', 'sku', 'name', 'quantity', 'warehouse', 'minStock', 'createdAt', 'updatedAt'] },
    { name: 'Finance', headers: ['id', 'type', 'amount', 'date', 'description', 'category', 'createdAt'] },
    { name: 'HR', headers: ['id', 'employeeName', 'position', 'status', 'email', 'salary', 'createdAt'] },
    { name: 'Procurement', headers: ['id', 'requestNo', 'item', 'quantity', 'status', 'estimatedCost', 'createdAt'] },
    { name: 'Sales', headers: ['id', 'orderNo', 'customer', 'total', 'status', 'createdAt'] },
    { name: 'Settings', headers: ['key', 'value'] }
  ];

  requiredSheets.forEach(sheetDef => {
    let sheet = ss.getSheetByName(sheetDef.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetDef.name);
      sheet.appendRow(sheetDef.headers);
    } else {
      // Pastikan baris pertama diisi dengan header yang tepat tanpa merusak data di bawahnya
      const range = sheet.getRange(1, 1, 1, sheetDef.headers.length);
      range.setValues([sheetDef.headers]);
    }
    
    // Terapkan format premium pada baris header (Baris ke-1)
    const headerRange = sheet.getRange(1, 1, 1, sheetDef.headers.length);
    headerRange.setBackground('#1e293b') // Slate 800 profesional
               .setFontColor('#ffffff')  // Tulisan putih kontras
               .setFontWeight('bold')    // Tebal
               .setHorizontalAlignment('center'); // Rata tengah
    
    // Freeze baris pertama agar tidak ikut tergulung saat scroll
    sheet.setFrozenRows(1);
    
    // Auto-adjust lebar kolom berdasarkan isi
    try {
      sheet.autoResizeColumns(1, sheetDef.headers.length);
    } catch(e) {
      // Abaikan jika tidak ada data/gagal di background run
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
