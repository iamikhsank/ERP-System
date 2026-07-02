// modules/14-procurement.gs
function handleProcurementApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Procurement'));
  return errorResponse('Not implemented');
}
