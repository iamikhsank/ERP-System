// modules/12-finance.gs
function handleFinanceApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Finance'));
  return errorResponse('Not implemented');
}
