// src/types.ts

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  name: string;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  warehouse: string;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceRecord {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeName: string;
  position: string;
  status: 'Active' | 'Inactive';
  email: string;
  salary: number;
  createdAt: string;
}

export interface ProcurementRequest {
  id: string;
  requestNo: string;
  item: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  estimatedCost: number;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  customer: string;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
  createdAt: string;
}

export interface CompanySetting {
  companyName: string;
  address: string;
  phone: string;
  currency: string;
  invoicePrefix: string;
  poPrefix: string;
}
