// modules/14-procurement.gs
function handleProcurementApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Procurement'));
    }
    if (action === 'create') {
      const allReqs = getSheetDataAsObjects('Procurement');
      const nextNum = allReqs.length + 1;
      payload.requestNo = 'PR-' + String(nextNum).padStart(3, '0');
      payload.status = 'Pending';
      const res = insertRow('Procurement', payload);
      return successResponse(res);
    }
    if (action === 'approve') {
      const res = updateRow('Procurement', payload.id, { status: 'Approved' });
      return successResponse(res);
    }
    if (action === 'reject') {
      const res = updateRow('Procurement', payload.id, { status: 'Rejected' });
      return successResponse(res);
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}
