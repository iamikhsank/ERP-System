// modules/11-inventory.gs
function handleInventoryApi(action, payload) {
  try {
    if (action === 'get') {
      return successResponse(getSheetDataAsObjects('Inventory'));
    }
    if (action === 'create') {
      const purchasePrice = Number(payload.purchasePrice || 0);
      const sellingPrice = Number(payload.sellingPrice || 0);
      const qty = Number(payload.quantity || 0);
      
      const res = insertRow('Inventory', {
        sku: payload.sku,
        name: payload.name,
        quantity: qty,
        purchasePrice: purchasePrice,
        sellingPrice: sellingPrice,
        warehouse: payload.warehouse,
        minStock: Number(payload.minStock || 5)
      });
      
      // Log mutation
      insertRow('StockMutations', {
        sku: payload.sku,
        name: payload.name,
        type: 'Initial',
        quantity: qty,
        prevQty: 0,
        newQty: qty,
        description: 'Pendaftaran barang baru'
      });
      
      return successResponse(res);
    }
    if (action === 'update') {
      // Find current to check if qty changed
      const currentItems = getSheetDataAsObjects('Inventory');
      const found = currentItems.find(item => item.id === payload.id);
      const prevQty = found ? Number(found.quantity || 0) : 0;
      const newQty = Number(payload.quantity || 0);
      const qtyDiff = newQty - prevQty;

      const res = updateRow('Inventory', payload.id, {
        sku: payload.sku,
        name: payload.name,
        quantity: newQty,
        purchasePrice: Number(payload.purchasePrice || 0),
        sellingPrice: Number(payload.sellingPrice || 0),
        warehouse: payload.warehouse,
        minStock: Number(payload.minStock || 5)
      });

      if (qtyDiff !== 0) {
        insertRow('StockMutations', {
          sku: payload.sku,
          name: payload.name,
          type: qtyDiff > 0 ? 'In' : 'Out',
          quantity: Math.abs(qtyDiff),
          prevQty: prevQty,
          newQty: newQty,
          description: 'Ubah data barang manual'
        });
      }
      
      return successResponse(res);
    }
    if (action === 'delete') {
      const res = deleteRow('Inventory', payload.id);
      return successResponse({ success: res });
    }
    
    // Mutations (Stock Ledger)
    if (action === 'getMutations') {
      return successResponse(getSheetDataAsObjects('StockMutations'));
    }
    
    // Opname Fisik (Stock Adjustment)
    if (action === 'adjust') {
      const currentItems = getSheetDataAsObjects('Inventory');
      const found = currentItems.find(item => item.id === payload.id);
      if (!found) {
        return errorResponse('Barang tidak ditemukan');
      }
      
      const prevQty = Number(found.quantity || 0);
      const actualQty = Number(payload.actualQty || 0);
      const qtyDiff = actualQty - prevQty;
      
      if (qtyDiff === 0) {
        return successResponse({ message: 'Tidak ada selisih stok riil', updated: false });
      }
      
      // Update inventory quantity
      updateRow('Inventory', payload.id, {
        quantity: actualQty
      });
      
      // Log mutation
      insertRow('StockMutations', {
        sku: found.sku,
        name: found.name,
        type: 'Adjustment',
        quantity: qtyDiff, // can be positive or negative
        prevQty: prevQty,
        newQty: actualQty,
        description: payload.reason || 'Hasil Opname Fisik'
      });
      
      return successResponse({ message: 'Penyesuaian stok berhasil disimpan', updated: true });
    }
    
    return errorResponse('Action not found: ' + action);
  } catch (err) {
    return errorResponse(err.message);
  }
}
