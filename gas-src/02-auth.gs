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
  if (action === 'getCurrentUser') {
    return successResponse(getCurrentUser());
  }
  return errorResponse('Invalid auth action');
}
