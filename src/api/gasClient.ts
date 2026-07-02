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

// Mock data for local development
const mockData: Record<string, any[]> = {
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
        if (module === 'Auth' && action === 'getCurrentUser') {
          result = { id: 'local1', email: 'dev@local.com', role: 'admin', name: 'Local Dev' };
        } else if (action === 'get') {
          result = mockData[module] || [];
        } else if (module === 'Dashboard' && action === 'getMetrics') {
          result = {
            totalRevenue: 157500000,
            totalOrders: 342,
            activeUsers: 28,
            lowStockItems: 5,
            cashflow: [
              { month: 'Jan', income: 45000000, expense: 30000000 },
              { month: 'Feb', income: 52000000, expense: 34000000 },
              { month: 'Mar', income: 49000000, expense: 41000000 },
              { month: 'Apr', income: 63000000, expense: 39000000 },
              { month: 'Mei', income: 58000000, expense: 45000000 },
              { month: 'Jun', income: 71000000, expense: 48000000 },
            ],
            recentActivities: [
              { id: '1', time: '10:15 WIB', type: 'Sales', message: 'Invoice #INV-2026-003 diterbitkan untuk Customer PT. Maju Jaya', severity: 'success' },
              { id: '2', time: '09:30 WIB', type: 'Inventory', message: 'Pemberitahuan: Stok Laptop Lenovo menipis di Gudang Utama (sisa 2 unit)', severity: 'warning' },
              { id: '3', time: '08:45 WIB', type: 'Procurement', message: 'Purchase Order #PO-2026-002 disetujui oleh Direktur', severity: 'success' },
              { id: '4', time: 'Kemarin', type: 'HR', message: 'Pencatatan kehadiran bulanan berhasil diproses untuk payroll', severity: 'info' },
            ]
          };
        } else {
          // Mock success for mutations
          if (action === 'create' || action === 'update' || action === 'delete' || action === 'approve' || action === 'reject' || action === 'updateStatus') {
            // Simulate modifying local mock data
            const arr = mockData[module] || [];
            if (action === 'create') {
              const newItem = { id: `${Date.now()}`, ...payload, createdAt: new Date().toISOString() };
              arr.push(newItem);
            } else if (action === 'update' || action === 'updateStatus') {
              const idx = arr.findIndex((x: any) => x.id === payload.id);
              if (idx !== -1) {
                arr[idx] = { ...arr[idx], ...payload };
              }
            } else if (action === 'delete') {
              mockData[module] = arr.filter((x: any) => x.id !== payload.id);
            }
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

