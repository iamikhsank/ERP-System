// modules/10-dashboard.gs
function handleDashboardApi(action, payload) {
  if (action === 'getMetrics') {
    try {
      const financeItems = getSheetDataAsObjects('Finance');
      const salesItems = getSheetDataAsObjects('Sales');
      const hrItems = getSheetDataAsObjects('HR');
      const inventoryItems = getSheetDataAsObjects('Inventory');
      const procurementItems = getSheetDataAsObjects('Procurement');

      // 1. Calculate Total Revenue from Finance (Incomes)
      let totalRevenue = 0;
      financeItems.forEach(item => {
        if (item.type === 'Income') {
          totalRevenue += Number(item.amount || 0);
        }
      });

      // 2. Total Orders (Sales count)
      const totalOrders = salesItems.length;

      // 3. Active Karyawan count
      let activeUsers = 0;
      hrItems.forEach(emp => {
        if (emp.status === 'Active') {
          activeUsers++;
        }
      });

      // 4. Low stock items
      let lowStockItems = 0;
      inventoryItems.forEach(item => {
        const qty = Number(item.quantity || 0);
        const min = Number(item.minStock || 5);
        if (qty <= min) {
          lowStockItems++;
        }
      });

      // 5. Dynamic Cashflow (group by Month names: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Ags, Sep, Okt, Nov, Des)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      
      // Initialize last 6 months dynamically
      const cashflowMap = {};
      const today = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mName = monthNames[d.getMonth()];
        last6Months.push(mName);
        cashflowMap[mName] = { income: 0, expense: 0 };
      }

      financeItems.forEach(item => {
        if (!item.date) return;
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;
        const mName = monthNames[d.getMonth()];
        if (cashflowMap[mName]) {
          if (item.type === 'Income') {
            cashflowMap[mName].income += Number(item.amount || 0);
          } else if (item.type === 'Expense') {
            cashflowMap[mName].expense += Number(item.amount || 0);
          }
        }
      });

      const cashflow = last6Months.map(m => ({
        month: m,
        income: cashflowMap[m].income,
        expense: cashflowMap[m].expense
      }));

      // 6. Recent activities generated dynamically from actual entries
      const recentActivities = [];

      // Add recent sales orders
      salesItems.slice(-2).forEach(so => {
        recentActivities.push({
          id: 'sales_' + so.id,
          time: so.createdAt ? formatActivityDate(so.createdAt) : 'Baru saja',
          type: 'Sales',
          message: 'Pesanan ' + so.orderNo + ' oleh ' + so.customer + ' senilai Rp ' + Number(so.total || 0).toLocaleString('id-ID') + ' berstatus ' + so.status,
          severity: so.status === 'Paid' ? 'success' : 'info',
          rawDate: so.createdAt || ''
        });
      });

      // Add low stock alerts
      inventoryItems.forEach(inv => {
        const qty = Number(inv.quantity || 0);
        const min = Number(inv.minStock || 5);
        if (qty <= min) {
          recentActivities.push({
            id: 'inv_' + inv.id,
            time: 'Perhatian',
            type: 'Inventory',
            message: 'Stok barang ' + inv.name + ' menipis di ' + inv.warehouse + ' (sisa ' + qty + ' unit)',
            severity: 'warning',
            rawDate: inv.createdAt || ''
          });
        }
      });

      // Add recent procurement requests
      procurementItems.slice(-2).forEach(pr => {
        recentActivities.push({
          id: 'proc_' + pr.id,
          time: pr.createdAt ? formatActivityDate(pr.createdAt) : 'Kemarin',
          type: 'Procurement',
          message: 'Pengadaan ' + pr.item + ' sebanyak ' + pr.quantity + ' pcs berstatus ' + pr.status,
          severity: pr.status === 'Approved' ? 'success' : pr.status === 'Rejected' ? 'warning' : 'info',
          rawDate: pr.createdAt || ''
        });
      });

      // Sort recent activities by rawDate descending and limit to 4
      recentActivities.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
      const finalActivities = recentActivities.slice(0, 4);

      // Fallback if empty to look perfectly beautiful
      if (finalActivities.length === 0) {
        finalActivities.push({
          id: 'empty_sys',
          time: 'Sistem',
          type: 'Sistem',
          message: 'Sistem siap digunakan. Semua modul berjalan normal.',
          severity: 'info'
        });
      }

      return successResponse({
        totalRevenue,
        totalOrders,
        activeUsers,
        lowStockItems,
        cashflow,
        recentActivities: finalActivities
      });
    } catch (err) {
      return errorResponse(err.message);
    }
  }
  return errorResponse('Action not found');
}

function formatActivityDate(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Baru saja';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return hours + ':' + mins + ' WIB';
  } catch(e) {
    return 'Baru saja';
  }
}
