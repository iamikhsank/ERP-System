// modules/17-settings.gs
function handleSettingsApi(action, payload) {
  if (action === 'get') return successResponse(getSheetDataAsObjects('Settings'));
  return errorResponse('Not implemented');
}
