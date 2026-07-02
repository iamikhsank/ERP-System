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
