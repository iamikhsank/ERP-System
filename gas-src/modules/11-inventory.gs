// modules/11-inventory.gs
function handleInventoryApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Inventory'));
  return errorResponse('Not implemented');
}
