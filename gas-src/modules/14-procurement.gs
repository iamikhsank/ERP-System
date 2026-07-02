// modules/14-procurement.gs
function handleProcurementApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Procurement'));
    }
    if (action === 'create') {
      const allReqs = getSheetDataAsObjects('Procurement');
      const nextNum = allReqs.length + 1;
      
      const res = insertRow('Procurement', {
        requestNo: 'PR-' + String(nextNum).padStart(3, '0'),
        item: payload.item,
        quantity: Number(payload.quantity || 1),
        status: 'Pending',
        estimatedCost: Number(payload.estimatedCost || 0)
      });
      return successResponse(res);
    }
    if (action === 'approve') {
      // Find the procurement item first
      const allReqs = getSheetDataAsObjects('Procurement');
      const foundReq = allReqs.find(r => r.id === payload.id);
      
      if (!foundReq) {
        return errorResponse('Pengajuan tidak ditemukan');
      }
      
      const res = updateRow('Procurement', payload.id, { status: 'Approved' });
      
      // Auto-reconcile / integrate with Finance: create an Expense row
      const totalCost = Number(foundReq.quantity || 1) * Number(foundReq.estimatedCost || 0);
      insertRow('Finance', {
        type: 'Expense',
        amount: totalCost,
        date: new Date().toISOString().split('T')[0],
        description: 'Pengadaan ' + foundReq.item + ' (' + foundReq.requestNo + ')',
        category: 'Pengadaan',
        reconciled: 'false',
        bankRef: ''
      });
      
      // Auto-integrate with Inventory if item name/SKU matches
      const inventoryItems = getSheetDataAsObjects('Inventory');
      // Match by exact SKU or exact name (case-insensitive)
      const matchedItem = inventoryItems.find(inv => 
        (inv.sku && inv.sku.toLowerCase() === foundReq.item.toLowerCase()) ||
        (inv.name && inv.name.toLowerCase() === foundReq.item.toLowerCase())
      );
      
      if (matchedItem) {
        const prevQty = Number(matchedItem.quantity || 0);
        const addedQty = Number(foundReq.quantity || 1);
        const newQty = prevQty + addedQty;
        
        // Update stock
        updateRow('Inventory', matchedItem.id, {
          quantity: newQty
        });
        
        // Log mutation
        insertRow('StockMutations', {
          sku: matchedItem.sku,
          name: matchedItem.name,
          type: 'In',
          quantity: addedQty,
          prevQty: prevQty,
          newQty: newQty,
          description: 'Barang Masuk (Pengadaan ' + foundReq.requestNo + ')'
        });
      }
      
      return successResponse(res);
    }
    if (action === 'reject') {
      const res = updateRow('Procurement', payload.id, { status: 'Rejected' });
      return successResponse(res);
    }
    
    // Suppliers / Vendors Directory
    if (action === 'getSuppliers') {
      return successResponse(getSheetDataAsObjects('Suppliers'));
    }
    if (action === 'createSupplier') {
      const res = insertRow('Suppliers', {
        name: payload.name,
        contact: payload.contact,
        email: payload.email,
        deliveryPerformance: payload.deliveryPerformance || '100%',
        catalog: payload.catalog || ''
      });
      return successResponse(res);
    }
    if (action === 'updateSupplier') {
      const res = updateRow('Suppliers', payload.id, {
        name: payload.name,
        contact: payload.contact,
        email: payload.email,
        deliveryPerformance: payload.deliveryPerformance,
        catalog: payload.catalog
      });
      return successResponse(res);
    }
    if (action === 'deleteSupplier') {
      const res = deleteRow('Suppliers', payload.id);
      return successResponse({ success: res });
    }
    
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}
