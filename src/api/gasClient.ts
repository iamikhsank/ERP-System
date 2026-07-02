// src/api/gasClient.ts

// Lightweight in-memory cache for fast page transitions
const apiCache = new Map<string, any>();

export function getGasCache(module: string, action: string, payload?: any): any {
  const key = `${module}:${action}:${JSON.stringify(payload || '')}`;
  return apiCache.get(key);
}

export function setGasCache(module: string, action: string, payload: any, data: any): void {
  const key = `${module}:${action}:${JSON.stringify(payload || '')}`;
  apiCache.set(key, data);
}

export function clearGasCache(module?: string): void {
  if (module) {
    for (const key of apiCache.keys()) {
      if (key.startsWith(`${module}:`)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
}

// Mock data with localStorage persistence for local development
function getLocalStorageData(): Record<string, any[]> {
  const data = localStorage.getItem('erp_mock_data');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Gagal mem-parse erp_mock_data dari localStorage, menggunakan default.', e);
    }
  }
  
  const defaultData = {
    Inventory: [
      { id: '1', sku: 'SKU-001', name: 'Laptop', quantity: 10, warehouse: 'Gudang Utama', minStock: 5, createdAt: new Date().toISOString() },
      { id: '2', sku: 'SKU-002', name: 'Mouse', quantity: 50, warehouse: 'Gudang Utama', minStock: 5, createdAt: new Date().toISOString() },
    ],
    Finance: [
      { id: '1', type: 'Income', amount: 5000000, date: new Date().toISOString(), description: 'Penjualan Produk', category: 'Sales' },
      { id: '2', type: 'Expense', amount: 1500000, date: new Date().toISOString(), description: 'Pembelian Kertas A4', category: 'Office Supplies' },
    ],
    HR: [
      { id: '1', employeeName: 'Budi Santoso', position: 'Staff IT', status: 'Active', email: 'budi@perusahaan.com', salary: 6000000 },
      { id: '2', employeeName: 'Siti Aminah', position: 'HR Generalist', status: 'Active', email: 'siti@perusahaan.com', salary: 5500000 },
    ],
    Procurement: [
      { id: '1', requestNo: 'PR-001', item: 'Kursi Kerja', quantity: 5, status: 'Pending', estimatedCost: 500000, createdAt: new Date().toISOString() },
    ],
    Sales: [
      { id: '1', orderNo: 'SO-001', customer: 'PT. Maju Sejahtera', total: 12000000, status: 'Paid', createdAt: new Date().toISOString() },
    ]
  };
  localStorage.setItem('erp_mock_data', JSON.stringify(defaultData));
  return defaultData;
}

function saveLocalStorageData(data: Record<string, any[]>): void {
  localStorage.setItem('erp_mock_data', JSON.stringify(data));
}

function formatDevActivityDate(isoString: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Baru saja';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} WIB`;
  } catch (e) {
    return 'Baru saja';
  }
}

export async function callGas(module: string, action: string, payload?: any): Promise<any> {
  const isRead = action === 'get' || action === 'getMetrics' || action === 'getCurrentUser';

  // If this is a write operation (mutation), clear cache for this module & dashboard
  if (!isRead) {
    clearGasCache(module);
    clearGasCache('Dashboard');
  }

  // Check if running in GAS environment
  if (typeof (window as any).google !== 'undefined' && (window as any).google.script) {
    return new Promise((resolve, reject) => {
      (window as any).google.script.run
        .withSuccessHandler((res: string) => {
          try {
            const parsed = JSON.parse(res);
            if (parsed.success) {
              if (isRead) {
                setGasCache(module, action, payload, parsed.data);
              }
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error));
            }
          } catch (e) {
            if (isRead) {
              setGasCache(module, action, payload, res);
            }
            resolve(res); // If not JSON
          }
        })
        .withFailureHandler((err: any) => {
          reject(err);
        })
        .processApiRequest(module, action, payload);
    });
  }

  // Local Mock Environment (Hanya aktif selama development lokal)
  if ((import.meta as any).env.DEV) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result: any = [];
        const localData = getLocalStorageData();

        if (module === 'Auth' && action === 'getCurrentUser') {
          result = { id: 'local1', email: 'dev@local.com', role: 'admin', name: 'Local Dev' };
        } else if (action === 'get') {
          result = localData[module] || [];
        } else if (module === 'Dashboard' && action === 'getMetrics') {
          const financeList = localData.Finance || [];
          const salesList = localData.Sales || [];
          const hrList = localData.HR || [];
          const inventoryList = localData.Inventory || [];
          const procurementList = localData.Procurement || [];

          // 1. Calculate Revenue (type: Income)
          let totalRevenue = 0;
          financeList.forEach((item: any) => {
            if (item.type === 'Income') {
              totalRevenue += Number(item.amount || 0);
            }
          });

          // 2. Calculate Total Orders (Sales count)
          const totalOrders = salesList.length;

          // 3. Active Karyawan count (HR status === 'Active')
          let activeUsers = 0;
          hrList.forEach((emp: any) => {
            if (emp.status === 'Active') {
              activeUsers++;
            }
          });

          // 4. Low Stock items (quantity <= minStock)
          let lowStockItems = 0;
          inventoryList.forEach((item: any) => {
            const qty = Number(item.quantity || 0);
            const min = Number(item.minStock || 5);
            if (qty <= min) {
              lowStockItems++;
            }
          });

          // 5. Dynamic Cashflow (6 months)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
          const cashflowMap: Record<string, { income: number; expense: number }> = {};
          const today = new Date();
          const last6Months: string[] = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mName = monthNames[d.getMonth()];
            last6Months.push(mName);
            cashflowMap[mName] = { income: 0, expense: 0 };
          }

          financeList.forEach((item: any) => {
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

          // 6. Recent Activities dinamis
          const recentActivities: any[] = [];
          
          // Sales
          salesList.slice(-2).forEach((so: any) => {
            recentActivities.push({
              id: 'sales_' + so.id,
              time: so.createdAt ? formatDevActivityDate(so.createdAt) : 'Baru saja',
              type: 'Sales',
              message: `Pesanan ${so.orderNo} oleh ${so.customer} senilai Rp ${Number(so.total || 0).toLocaleString('id-ID')} berstatus ${so.status}`,
              severity: so.status === 'Paid' ? 'success' : 'info',
              rawDate: so.createdAt || ''
            });
          });

          // Low Stock
          inventoryList.forEach((inv: any) => {
            const qty = Number(inv.quantity || 0);
            const min = Number(inv.minStock || 5);
            if (qty <= min) {
              recentActivities.push({
                id: 'inv_' + inv.id,
                time: 'Perhatian',
                type: 'Inventory',
                message: `Stok barang ${inv.name} menipis di ${inv.warehouse} (sisa ${qty} unit)`,
                severity: 'warning',
                rawDate: inv.createdAt || ''
              });
            }
          });

          // Procurement
          procurementList.slice(-2).forEach((pr: any) => {
            recentActivities.push({
              id: 'proc_' + pr.id,
              time: pr.createdAt ? formatDevActivityDate(pr.createdAt) : 'Kemarin',
              type: 'Procurement',
              message: `Pengadaan ${pr.item} sebanyak ${pr.quantity} pcs berstatus ${pr.status}`,
              severity: pr.status === 'Approved' ? 'success' : pr.status === 'Rejected' ? 'warning' : 'info',
              rawDate: pr.createdAt || ''
            });
          });

          // Sort descending by rawDate
          recentActivities.sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));
          const finalActivities = recentActivities.slice(0, 4);

          if (finalActivities.length === 0) {
            finalActivities.push({
              id: 'empty_sys',
              time: 'Sistem',
              type: 'Sistem',
              message: 'Sistem siap digunakan. Semua modul berjalan normal.',
              severity: 'info'
            });
          }

          result = {
            totalRevenue,
            totalOrders,
            activeUsers,
            lowStockItems,
            cashflow,
            recentActivities: finalActivities
          };
        } else {
          // Mock success for mutations with localStorage persistence
          if (action === 'create' || action === 'update' || action === 'delete' || action === 'approve' || action === 'reject' || action === 'updateStatus') {
            const arr = localData[module] || [];
            if (action === 'create') {
              const newItem = { id: `id_${Math.random().toString(36).substr(2, 9)}`, ...payload, createdAt: new Date().toISOString() };
              arr.push(newItem);
            } else if (action === 'update' || action === 'updateStatus') {
              const idx = arr.findIndex((x: any) => x.id === payload.id);
              if (idx !== -1) {
                arr[idx] = { ...arr[idx], ...payload, updatedAt: new Date().toISOString() };
              }
            } else if (action === 'delete') {
              localData[module] = arr.filter((x: any) => x.id !== payload.id);
            } else if (action === 'approve' || action === 'reject') {
              const idx = arr.findIndex((x: any) => x.id === payload.id);
              if (idx !== -1) {
                arr[idx].status = action === 'approve' ? 'Approved' : 'Rejected';
                arr[idx].updatedAt = new Date().toISOString();
                
                // Automasi Berantai: Menyetujui status pesanan penjualan sebagai "Lunas" (Paid / Approved) 
                // atau melunasi sales order akan memicu penambahan pencatatan kas masuk
                if (module === 'Sales' && action === 'approve') {
                  const so = arr[idx];
                  const finArr = localData['Finance'] || [];
                  finArr.push({
                    id: `id_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'Income',
                    amount: so.total || 0,
                    date: new Date().toISOString(),
                    description: `Pendapatan dari pesanan ${so.orderNo} (${so.customer})`,
                    category: 'Sales',
                    createdAt: new Date().toISOString()
                  });
                  localData['Finance'] = finArr;
                }
              }
            }
            if (action !== 'delete') {
              localData[module] = arr;
            }
            saveLocalStorageData(localData);
            result = { success: true };
          }
        }

        if (isRead) {
          setGasCache(module, action, payload, result);
        }
        resolve(result);
      }, 400); // 400ms delay for natural transition feel
    });
  }

  // Jika hasil build produksi dibuka di luar lingkungan GAS, langsung tolak permintaan
  return new Promise((_, reject) => {
    reject(new Error("Aplikasi harus dijalankan di dalam lingkungan Google Sheets / Google Apps Script. Data lokal dinonaktifkan pada versi rilis produksi."));
  });
}

