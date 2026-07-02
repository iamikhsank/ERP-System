// modules/13-hr.gs
function handleHrApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('HR'));
  return errorResponse('Not implemented');
}
