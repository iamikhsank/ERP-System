// modules/11-inventory.gs
function handleInventoryApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Inventory'));
    }
    if (action === 'create') {
      const res = insertRow('Inventory', payload);
      return successResponse(res);
    }
    if (action === 'update') {
      const res = updateRow('Inventory', payload.id, payload);
      return successResponse(res);
    }
    if (action === 'delete') {
      const res = deleteRow('Inventory', payload.id);
      return successResponse({ success: res });
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}
