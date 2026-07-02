// src/api/gasClient.ts

// Mock data for local development
const mockData: Record<string, any[]> = {
  Inventory: [
    { id: '1', sku: 'SKU-001', name: 'Laptop', quantity: 10, warehouse: 'Main', createdAt: new Date().toISOString() },
    { id: '2', sku: 'SKU-002', name: 'Mouse', quantity: 50, warehouse: 'Main', createdAt: new Date().toISOString() },
  ],
  Finance: [
    { id: '1', type: 'Income', amount: 5000000, date: new Date().toISOString(), description: 'Sales' },
    { id: '2', type: 'Expense', amount: 1500000, date: new Date().toISOString(), description: 'Office Supplies' },
  ]
};

export async function callGas(module: string, action: string, payload?: any): Promise<any> {
  // Check if running in GAS environment
  if (typeof (window as any).google !== 'undefined' && (window as any).google.script) {
    return new Promise((resolve, reject) => {
      (window as any).google.script.run
        .withSuccessHandler((res: string) => {
          try {
            const parsed = JSON.parse(res);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              reject(new Error(parsed.error));
            }
          } catch (e) {
            resolve(res); // If not JSON
          }
        })
        .withFailureHandler((err: any) => {
          reject(err);
        })
        .processApiRequest(module, action, payload);
    });
  }

  // Local Mock Environment
  console.log(`[MOCK GAS] ${module}.${action}`, payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (module === 'Auth' && action === 'getCurrentUser') {
        resolve({ id: 'local1', email: 'dev@local.com', role: 'admin', name: 'Local Dev' });
      } else if (action === 'get') {
        resolve(mockData[module] || []);
      } else if (module === 'Dashboard' && action === 'getMetrics') {
        resolve({ totalRevenue: 15000000, totalOrders: 120, activeUsers: 45 });
      } else {
        resolve([]);
      }
    }, 500);
  });
}
