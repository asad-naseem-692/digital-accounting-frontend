/**
 * types/index.ts
 *
 * Full Data Dictionary TypeScript interfaces for the complete Accounting Software:
 * Customers, Suppliers, Products, Daily Transactions, Ledgers, Reports, and Dashboard.
 */

// ---------------------------------------------------------------------------
// Auth & Business
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  account_type?: "owner" | "staff";
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface Business {
  id: string;
  name: string;
  business_type: string;
  created_at: string;
}

export interface BusinessWithRole extends Business {
  role: "owner" | "staff";
  can_edit: boolean;
  can_delete: boolean;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: "owner" | "staff";
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "staff";
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
}

export interface StaffInvitePayload {
  name: string;
  email: string;
  password: string;
  can_edit: boolean;
  can_delete: boolean;
}

export interface StaffUpdatePermissionsPayload {
  can_edit?: boolean;
  can_delete?: boolean;
}

// ---------------------------------------------------------------------------
// Parties (Customers & Suppliers)
// ---------------------------------------------------------------------------

export interface PartyCreate {
  name: string;
  type: "customer" | "supplier";
  phone?: string;
  address?: string;
  opening_balance?: number;
}

export interface Party {
  id: string;
  business_id: string;
  name: string;
  type: "customer" | "supplier";
  phone: string | null;
  address: string | null;
  current_balance: number; // computed server-side
  created_at: string;
}

export interface LedgerTransactionCreate {
  type: "credit" | "debit";
  amount: number;
  description: string;
  date?: string;
}

export interface LedgerTransaction {
  id: string;
  business_id: string;
  party_id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  created_by: string;
  created_at: string;
  running_balance?: number;
}

export interface PartyBalanceSummary {
  party_id: string;
  party_name: string;
  current_balance: number;
  total_credit: number;
  total_debit: number;
}

export interface PartiesSummary {
  total_receivable: number;
  total_payable: number;
}

// ---------------------------------------------------------------------------
// Products & Inventory
// ---------------------------------------------------------------------------

export interface ProductCreate {
  name: string;
  sku?: string;
  unit_price: number;
  cost_price?: number;
  initial_stock?: number;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  created_at: string;
}

export interface StockAdjustmentCreate {
  change_amount: number;
  reason: string;
}

export interface StockAdjustment {
  id: string;
  business_id: string;
  product_id: string;
  change_amount: number;
  reason: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Cash Book
// ---------------------------------------------------------------------------

export interface CashEntryCreate {
  type: "cash_in" | "cash_out";
  amount: number;
  category: string;
  description?: string;
  date?: string;
}

export interface CashEntry {
  id: string;
  business_id: string;
  type: "cash_in" | "cash_out";
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_by: string;
  created_at: string;
  running_balance?: number;
}

export interface CashSummary {
  cash_in_hand: number;
  total_cash_in: number;
  total_cash_out: number;
  today_cash_in: number;
  today_cash_out: number;
}

// ---------------------------------------------------------------------------
// Invoices & Bills
// ---------------------------------------------------------------------------

export interface InvoiceItem {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceCreate {
  party_id: string;
  invoice_type?: "sale" | "purchase";
  invoice_number?: string;
  items: InvoiceItem[];
  due_date?: string;
  date?: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  party_id: string;
  party_name?: string;
  invoice_type: "sale" | "purchase";
  invoice_number: string;
  items: InvoiceItem[];
  total_amount: number;
  paid_amount: number;
  status: "unpaid" | "partial" | "paid";
  due_date: string | null;
  date: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Daily Transactions & Accounting Engine
// ---------------------------------------------------------------------------

export interface UnifiedTransactionCreate {
  transaction_type: "sale" | "purchase" | "expense" | "receive_money" | "payment_money";
  party_id?: string;
  amount: number;
  category?: string;
  description: string;
  payment_mode?: "cash" | "credit";
  items?: InvoiceItem[];
  date?: string;
}

export interface UnifiedTransactionResponse {
  success: boolean;
  transaction_type: string;
  message: string;
  amount: number;
  party_id?: string;
  created_records: string[];
}

// ---------------------------------------------------------------------------
// Financial Reports & Statements
// ---------------------------------------------------------------------------

export interface GeneralLedgerItem {
  id: string;
  date: string;
  source: string;
  type: string;
  category_or_party: string;
  description: string;
  debit: number;
  credit: number;
  amount: number;
  created_by: string;
}

export interface ProfitLossReport {
  total_sales: number;
  total_purchases: number;
  gross_profit: number;
  total_expenses: number;
  net_profit: number;
}

export interface BalanceSheetReport {
  cash_in_hand: number;
  accounts_receivable: number;
  inventory_value: number;
  total_assets: number;
  accounts_payable: number;
  total_liabilities: number;
  net_worth: number;
}

export interface DashboardOverview {
  cash_in_hand: number;
  total_receivable: number;
  total_payable: number;
  total_invoices: number;
  unpaid_invoices: number;
  low_stock_products_count: number;
  today_sales: number;
  today_expenses: number;
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export interface StaffMember extends BusinessMember {
  user: Pick<User, "id" | "name" | "email">;
}

// ---------------------------------------------------------------------------
// Staff Book — Workers, Attendance, Salary, Advances
// ---------------------------------------------------------------------------

export interface WorkerCreate {
  name: string;
  phone?: string;
  designation?: string;
  monthly_salary: number;
  joining_date?: string; // ISO date "YYYY-MM-DD"
}

export interface WorkerUpdate {
  name?: string;
  phone?: string;
  designation?: string;
  monthly_salary?: number;
  joining_date?: string;
  is_active?: boolean;
}

export interface Worker {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  designation: string | null;
  monthly_salary: number;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
  today_status: "present" | "absent" | "half_day" | "leave" | null;
}

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export interface AttendanceCreate {
  worker_id: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
}

export interface WorkerAttendanceMonth {
  worker_id: string;
  worker_name: string;
  monthly_salary: number;
  days_present: number;
  days_half: number;
  days_absent: number;
  days_leave: number;
  working_days: number;
  attendance: AttendanceRecord[];
}

export interface SalaryCalculation {
  worker_id: string;
  worker_name: string;
  month: string;
  monthly_salary: number;
  working_days: number;
  days_present: number;
  days_half: number;
  payable_days: number;
  gross_salary: number;
  pending_advances: number;
  net_salary: number;
}

export interface SalaryPayCreate {
  worker_id: string;
  month: string; // "YYYY-MM"
  working_days?: number;
}

export interface SalaryPaymentRecord {
  id: string;
  worker_id: string;
  worker_name?: string;
  month: string;
  days_present: number;
  days_half: number;
  working_days: number;
  gross_salary: number;
  advance_deducted: number;
  net_salary: number;
  paid_at: string;
  created_at: string;
}

export interface AdvanceCreate {
  worker_id: string;
  amount: number;
  description?: string;
  date: string; // "YYYY-MM-DD"
}

export interface AdvanceRecord {
  id: string;
  worker_id: string;
  worker_name?: string;
  amount: number;
  description: string | null;
  date: string;
  is_deducted: boolean;
  created_at: string;
}

export interface StaffBookSummary {
  total_workers: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  unmarked_today: number;
  total_pending_advances: number;
}

export interface ApiError {
  detail: string;
}

