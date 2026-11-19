import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Users,
  Building2,
  UserCheck,
  Receipt,
  ArrowUpRight,
  PlusCircle,
  Printer,
  ChevronRight,
  Factory,
  Boxes,
  Truck,
  ArrowRight,
  FileText,
  Filter,
} from 'lucide-react';

export const revalidate = 0; // Dynamic server rendering to fetch live real-time ledger

export default function AdminDashboardPage() {
  const metrics = db.getDashboardMetrics();
  const orders = db.getOrders();
  const invoices = db.getInvoices();
  const vendors = db.getVendors();
  const labour = db.getLabour();
  const productionTasks = db.getProductionTasks({ status: 'In Progress' });
  const unpaidInvoices = invoices.filter((i) => i.balanceDue > 0);

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. ADMINLTE 4 PRIMARY KPI SMALL-BOXES */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Billed Revenue */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden hover:border-slate-300 transition">
          <div className="p-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">
                Total Billed
              </span>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                ₹{metrics.totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Accrual sum of all customer jobs</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <Link
            href="/admin/billing"
            className="px-4 py-1.5 bg-slate-50/60 border-t border-slate-100 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-slate-100 flex items-center justify-between transition"
          >
            <span>More info</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Cash Collected */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden hover:border-slate-300 transition">
          <div className="p-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 block">
                Cash Collected
              </span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{metrics.actualCashCollected.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Offline register & UPI receipts</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <Link
            href="/admin/billing"
            className="px-4 py-1.5 bg-slate-50/60 border-t border-slate-100 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-slate-100 flex items-center justify-between transition"
          >
            <span>More info</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden hover:border-slate-300 transition">
          <div className="p-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-amber-600 block">
                Customer Dues
              </span>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                ₹{metrics.customerOutstanding.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Pending collection from clients</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <Link
            href="/admin/billing?status=unpaid"
            className="px-4 py-1.5 bg-slate-50/60 border-t border-slate-100 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-slate-100 flex items-center justify-between transition"
          >
            <span>More info</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden hover:border-slate-300 transition">
          <div className="p-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-600 block">
                Net Profit
              </span>
              <div
                className={`text-2xl font-bold mt-1 ${
                  metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-slate-800'
                }`}
              >
                ₹{metrics.netProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Revenue minus operating expenses</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <Link
            href="/admin/reports"
            className="px-4 py-1.5 bg-slate-50/60 border-t border-slate-100 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 flex items-center justify-between transition"
          >
            <span>More info</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. OPERATIONAL QUICK STAT BOXES */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/admin/orders"
          className="bg-white p-3 rounded-lg border border-slate-200 text-center hover:border-slate-300 transition"
        >
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Total Orders</span>
          <span className="text-lg font-bold text-slate-800 mt-0.5 block">{metrics.totalOrders}</span>
          <span className="text-[11px] text-slate-500">Registered Jobs</span>
        </Link>

        <Link
          href="/admin/track"
          className="bg-white p-3 rounded-lg border border-slate-200 text-center hover:border-slate-300 transition"
        >
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">In Production</span>
          <span className="text-lg font-bold text-amber-700 mt-0.5 block">{metrics.pendingOrders}</span>
          <span className="text-[11px] text-slate-500">Active Queue</span>
        </Link>

        <Link
          href="/admin/track"
          className="bg-white p-3 rounded-lg border border-slate-200 text-center hover:border-slate-300 transition"
        >
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Delivered</span>
          <span className="text-lg font-bold text-emerald-700 mt-0.5 block">{metrics.completedOrders}</span>
          <span className="text-[11px] text-slate-500">Completed</span>
        </Link>

        <Link
          href="/admin/expenses"
          className="bg-white p-3 rounded-lg border border-slate-200 text-center hover:border-slate-300 transition"
        >
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Total Expenses</span>
          <span className="text-lg font-bold text-rose-700 mt-0.5 block">
            ₹{metrics.totalExpenses.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500">Stock & costs</span>
        </Link>

        <Link
          href="/admin/vendors"
          className="bg-white p-3 rounded-lg border border-slate-200 text-center hover:border-slate-300 transition"
        >
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Vendor Dues</span>
          <span className="text-lg font-bold text-slate-800 mt-0.5 block">
            ₹{metrics.vendorOutstanding.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500">Outsourced</span>
        </Link>

        <Link
          href="/admin/attendance"
          className="bg-white p-3 rounded-lg border border-slate-200 text-center hover:border-slate-300 transition"
        >
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Labour Wages</span>
          <span className="text-lg font-bold text-slate-800 mt-0.5 block">
            ₹{metrics.labourOutstanding.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500">Pending payroll</span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 3. RECENT ORDERS & PRODUCTION QUEUE (ADMINLTE 4 CARDS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card (8 columns): Live Customer Orders */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* AdminLTE Card Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-800">Live Customer Orders</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {orders.length} Total
                </span>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View Full Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Job # & Date</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Total</th>
                    <th className="py-2.5 px-4">Balance</th>
                    <th className="py-2.5 px-4">Stage</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                        No orders recorded yet. Click &quot;Walk-in Order&quot; to record your first studio order.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 7).map((order) => {
                      const isOutsourced = order.productionMethod === 'vendor_outsourced';
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 block">{order.jobNumber}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                            </span>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{order.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</span>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isOutsourced
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isOutsourced ? 'Vendor' : 'In-House'}
                            </span>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap font-bold text-slate-900">
                            ₹{order.grandTotal.toLocaleString('en-IN')}
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            {order.balanceDue <= 0 ? (
                              <span className="text-emerald-700 font-bold text-xs">Paid</span>
                            ) : (
                              <span className="text-amber-700 font-bold text-xs">₹{order.balanceDue.toLocaleString('en-IN')}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                              {order.orderStatus}
                            </span>
                          </td>

                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <Link
                              href="/admin/track"
                              className="text-xs font-bold text-slate-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-slate-100 transition"
                            >
                              Track →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-right">
            <Link
              href="/admin/orders?action=new"
              className="text-xs font-bold text-dp-orange hover:underline inline-flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book New Walk-in Order</span>
            </Link>
          </div>
        </div>

        {/* Right Cards (4 columns): Unpaid Invoices & Quick Shortcuts */}
        <div className="lg:col-span-4 space-y-5">
          {/* Unpaid Invoices Alert Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-sm text-slate-800">Pending Balances</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {unpaidInvoices.length} Invoices
              </span>
            </div>

            <div className="p-3 divide-y divide-slate-100">
              {unpaidInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All accounts settled. No pending dues.
                </div>
              ) : (
                unpaidInvoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="py-2 flex items-center justify-between text-xs first:pt-1 last:pb-1">
                    <div>
                      <span className="font-medium text-slate-800 block">{inv.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{inv.invoiceNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-amber-700 block">₹{inv.balanceDue}</span>
                      <Link
                        href="/admin/billing"
                        className="text-[10px] font-medium text-blue-600 hover:underline"
                      >
                        Collect →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 bg-slate-50/60 border-t border-slate-100 text-center">
              <Link
                href="/admin/billing"
                className="text-xs font-medium text-slate-600 hover:text-blue-600 transition"
              >
                Open Full Invoicing Center →
              </Link>
            </div>
          </div>

          {/* Quick Studio Workflow Tools */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Studio Fast Actions
            </span>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/orders?action=new"
                className="p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Walk-in Order</span>
              </Link>

              <Link
                href="/admin/billing?action=new"
                className="p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 transition"
              >
                <Receipt className="w-4 h-4 text-slate-600" />
                <span>Tax Bill</span>
              </Link>

              <Link
                href="/admin/attendance"
                className="p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 transition"
              >
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span>Roll Call</span>
              </Link>

              <Link
                href="/admin/expenses"
                className="p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 transition"
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Expense</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
