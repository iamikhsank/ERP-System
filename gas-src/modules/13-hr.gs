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
