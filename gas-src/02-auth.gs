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
