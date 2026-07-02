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
