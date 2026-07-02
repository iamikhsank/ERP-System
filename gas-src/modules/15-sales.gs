// modules/15-sales.gs
function handleSalesApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Sales'));
  return errorResponse('Not implemented');
}
