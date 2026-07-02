// modules/15-sales.gs
function handleSalesApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Sales'));
    }
    if (action === 'create') {
      const allOrders = getSheetDataAsObjects('Sales');
      const nextNum = allOrders.length + 1;
      payload.orderNo = 'SO-' + String(nextNum).padStart(3, '0');
      payload.status = payload.status || 'Draft';
      const res = insertRow('Sales', payload);
      return successResponse(res);
    }
    if (action === 'updateStatus') {
      const res = updateRow('Sales', payload.id, { status: payload.status });
      
      // Auto-log to Finance as Income when status becomes Paid
      if (payload.status === 'Paid') {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const salesSheet = ss.getSheetByName('Sales');
        const data = salesSheet.getDataRange().getValues();
        let orderObj = null;
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(payload.id)) {
            orderObj = { orderNo: data[i][1], customer: data[i][2], total: Number(data[i][3]) };
            break;
          }
        }
        if (orderObj) {
          insertRow('Finance', {
            type: 'Income',
            amount: orderObj.total,
            date: new Date().toISOString().split('T')[0],
            description: 'Pelunasan Pesanan ' + orderObj.orderNo + ' (' + orderObj.customer + ')',
            category: 'Sales'
          });
        }
      }
      
      return successResponse(res);
    }
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}
