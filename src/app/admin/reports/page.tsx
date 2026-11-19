'use client';

import React, { useState, useEffect } from 'react';
import { Order, Expense, Invoice, PaymentRecord, ProductionTask, Vendor, Labour, Material } from '@/types';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Search,
  Filter,
  UserCheck,
  Building2,
  Boxes,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Percent,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [labour, setLabour] = useState<Labour[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'full' | 'advance' | 'none'>('all');
  const [pnlFilter, setPnlFilter] = useState<'all' | 'profit' | 'loss'>('all');

  // Selectable Calendar, Date, Month, Year Filter (Full, Monthly, Yearly)
  const [dateFilterType, setDateFilterType] = useState<
    'all' | 'full' | 'monthly' | 'yearly' | 'this_month' | 'today' | 'specific_date' | 'month_year' | 'custom_range'
  >('monthly');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth, 10);
    let y = parseInt(selectedYear, 10);
    if (m === 1) {
      m = 12;
      y -= 1;
    } else {
      m -= 1;
    }
    setSelectedMonth(m.toString().padStart(2, '0'));
    setSelectedYear(y.toString());
    setDateFilterType('monthly');
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth, 10);
    let y = parseInt(selectedYear, 10);
    if (m === 12) {
      m = 1;
      y += 1;
    } else {
      m += 1;
    }
    setSelectedMonth(m.toString().padStart(2, '0'));
    setSelectedYear(y.toString());
    setDateFilterType('monthly');
  };

  const handlePrevYear = () => {
    const y = parseInt(selectedYear, 10) - 1;
    setSelectedYear(y.toString());
    setDateFilterType('yearly');
  };

  const handleNextYear = () => {
    const y = parseInt(selectedYear, 10) + 1;
    setSelectedYear(y.toString());
    setDateFilterType('yearly');
  };

  const loadData = async () => {
    try {
      const [oRes, eRes, iRes, pRes, tRes, vRes, lRes, mRes, aRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/expenses'),
        fetch('/api/invoices'),
        fetch('/api/payments'),
        fetch('/api/production/tasks'),
        fetch('/api/vendors'),
        fetch('/api/labour'),
        fetch('/api/inventory'),
        fetch('/api/attendance'),
      ]);
      const [oData, eData, iData, pData, tData, vData, lData, mData, aData] = await Promise.all([
        oRes.json(),
        eRes.json(),
        iRes.json(),
        pRes.json(),
        tRes.json(),
        vRes.json(),
        lRes.json(),
        mRes.json(),
        aRes.json(),
      ]);

      if (oData.success) setOrders(oData.orders);
      if (eData.success) setExpenses(eData.expenses);
      if (iData.success) setInvoices(iData.invoices);
      if (pData.success) setPayments(pData.payments);
      if (tData.success) setTasks(tData.tasks);
      if (vData.success) setVendors(vData.vendors);
      if (lData.success) setLabour(lData.labour);
      if (mData.success && Array.isArray(mData.materials)) setMaterials(mData.materials);
      if (aData.success && Array.isArray(aData.allSalaryPayments || aData.salaryPayments)) {
        setSalaryPayments(aData.allSalaryPayments || aData.salaryPayments);
      }
    } catch (e) {
      console.error('Failed to load reports data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: compute financial details for an order
  const getOrderFinancials = (ord: Order) => {
    const orderDate = ord.createdAt ? ord.createdAt.split('T')[0] : '';
    
    // Payments received from customer
    const orderPayments = payments.filter(
      (p) => p.jobNumber?.toUpperCase() === ord.jobNumber?.toUpperCase()
    );
    const amountReceived =
      orderPayments.reduce((s, p) => s + p.amount, 0) || ord.advancePaid || 0;
    const amountPending = Math.max(0, ord.grandTotal - amountReceived);

    // Payment Stage Type
    let paymentType: 'Full' | 'Advance' | 'None' = 'None';
    if (amountReceived >= ord.grandTotal) {
      paymentType = 'Full';
    } else if (amountReceived > 0) {
      paymentType = 'Advance';
    } else {
      paymentType = 'None';
    }

    // Direct Job Costs (from tasks and direct expenses attributed to this job)
    const jobTasks = tasks.filter(
      (t) => t.jobNumber?.toUpperCase() === ord.jobNumber?.toUpperCase()
    );
    const jobExpenses = expenses.filter(
      (e) => e.jobNumber?.toUpperCase() === ord.jobNumber?.toUpperCase()
    );

    const matCost =
      jobTasks.reduce((s, t) => s + (t.materialCost || 0), 0) +
      jobExpenses.filter((e) => e.category === 'Material Purchase').reduce((s, e) => s + e.amount, 0);

    const labCost =
      jobTasks.reduce((s, t) => s + (t.labourCost || 0), 0) +
      jobExpenses.filter((e) => e.category === 'Labour Charges').reduce((s, e) => s + e.amount, 0);

    const vendCost =
      jobTasks.reduce((s, t) => s + (t.vendorCost || 0), 0) +
      jobExpenses.filter((e) => e.category === 'Vendor Payment').reduce((s, e) => s + e.amount, 0);

    const otherCost = jobExpenses
      .filter((e) => !['Material Purchase', 'Labour Charges', 'Vendor Payment'].includes(e.category))
      .reduce((s, e) => s + e.amount, 0);

    const totalJobCost = matCost + labCost + vendCost + otherCost;

    // Detailed itemized expenses list for this job
    const jobExpensesList: {
      id?: string;
      description: string;
      category: string;
      notes?: string;
      amount: number;
    }[] = [];

    jobExpenses.forEach((e) => {
      jobExpensesList.push({
        id: e.id,
        description: e.description,
        category: e.category,
        notes: e.notes,
        amount: e.amount,
      });
    });

    // Also include production task costs if not already in expenses
    jobTasks.forEach((t) => {
      if (t.materialCost && !jobExpenses.some((e) => e.amount === t.materialCost && e.category === 'Material Purchase')) {
        jobExpensesList.push({
          description: `${t.taskName} (Materials)`,
          category: 'Material',
          notes: t.notes,
          amount: t.materialCost,
        });
      }
      if (t.labourCost && !jobExpenses.some((e) => e.amount === t.labourCost && e.category === 'Labour Charges')) {
        jobExpensesList.push({
          description: `${t.taskName} (Labour)`,
          category: 'Labour',
          notes: t.notes,
          amount: t.labourCost,
        });
      }
      if (t.vendorCost && !jobExpenses.some((e) => e.amount === t.vendorCost && e.category === 'Vendor Payment')) {
        jobExpensesList.push({
          description: `${t.taskName} (Vendor)`,
          category: 'Vendor',
          notes: t.notes,
          amount: t.vendorCost,
        });
      }
    });

    const expensesSummaryText =
      jobExpensesList.length > 0
        ? jobExpensesList
            .map((e) => `${e.category}: ${e.description}${e.notes ? ` [${e.notes}]` : ''} - ₹${e.amount}`)
            .join('; ')
        : 'No direct expenses logged';

    // Profit or Loss
    const profitOrLoss = ord.grandTotal - totalJobCost;
    const margin = ord.grandTotal > 0 ? Math.round((profitOrLoss / ord.grandTotal) * 100) : 0;
    const isProfit = profitOrLoss > 0;
    const isLoss = profitOrLoss < 0;

    // Products summary
    const productsList = ord.items.map((it) => `${it.productName}${it.quantity > 1 ? ` (x${it.quantity})` : ''}`).join(', ');

    return {
      orderDate,
      amountReceived,
      amountPending,
      paymentType,
      matCost,
      labCost,
      vendCost,
      otherCost,
      totalJobCost,
      jobExpensesList,
      expensesSummaryText,
      profitOrLoss,
      margin,
      isProfit,
      isLoss,
      productsList,
    };
  };

  // Filtered Orders
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredOrders = orders.filter((ord) => {
    if (ord.orderStatus === 'Cancelled') return false;
    const f = getOrderFinancials(ord);

    // Payment Filter
    if (paymentFilter === 'full' && f.paymentType !== 'Full') return false;
    if (paymentFilter === 'advance' && f.paymentType !== 'Advance') return false;
    if (paymentFilter === 'none' && f.paymentType !== 'None') return false;

    // Profit / Loss Filter
    if (pnlFilter === 'profit' && f.profitOrLoss <= 0) return false;
    if (pnlFilter === 'loss' && f.profitOrLoss >= 0) return false;

    // Date & Calendar Filtering
    const d = f.orderDate;
    if (dateFilterType === 'all' || dateFilterType === 'full') {
      // All Time: no restriction
    } else if (dateFilterType === 'today') {
      if (d !== todayStr) return false;
    } else if (dateFilterType === 'this_month') {
      if (!d.startsWith(currentMonthStr)) return false;
    } else if (dateFilterType === 'specific_date') {
      if (selectedDate && d !== selectedDate) return false;
    } else if (dateFilterType === 'month_year' || dateFilterType === 'monthly') {
      if (selectedYear && selectedMonth && !d.startsWith(`${selectedYear}-${selectedMonth}`)) return false;
      if (selectedYear && !selectedMonth && !d.startsWith(selectedYear)) return false;
    } else if (dateFilterType === 'yearly') {
      if (selectedYear && !d.startsWith(selectedYear)) return false;
    } else if (dateFilterType === 'custom_range') {
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchJob = ord.jobNumber.toLowerCase().includes(q);
      const matchCust = ord.customerName.toLowerCase().includes(q);
      const matchPhone = ord.customerPhone.toLowerCase().includes(q);
      const matchProd = f.productsList.toLowerCase().includes(q);
      if (!matchJob && !matchCust && !matchPhone && !matchProd) return false;
    }

    return true;
  });

  // Aggregate totals
  const totalBilled = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalReceived = filteredOrders.reduce((sum, o) => sum + getOrderFinancials(o).amountReceived, 0);
  const totalPending = filteredOrders.reduce((sum, o) => sum + getOrderFinancials(o).amountPending, 0);
  const totalCosts = filteredOrders.reduce((sum, o) => sum + getOrderFinancials(o).totalJobCost, 0);
  const totalNetProfit = totalBilled - totalCosts;
  const overallMargin = totalBilled > 0 ? Math.round((totalNetProfit / totalBilled) * 100) : 0;
  const profitPercentage = totalBilled > 0 ? (totalNetProfit / totalBilled) * 100 : 0;

  // Filter salary payments & expenses by current period
  const isDateInCurrentPeriod = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateFilterType === 'all' || dateFilterType === 'full') return true;
    if (dateFilterType === 'today') return dateStr === todayStr;
    if (dateFilterType === 'this_month') return dateStr.startsWith(currentMonthStr);
    if (dateFilterType === 'specific_date') return dateStr === selectedDate;
    if (dateFilterType === 'month_year' || dateFilterType === 'monthly') {
      return dateStr.startsWith(`${selectedYear}-${selectedMonth}`);
    }
    if (dateFilterType === 'yearly') {
      return dateStr.startsWith(selectedYear);
    }
    if (dateFilterType === 'custom_range') {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }
    return true;
  };

  // Salary disbursements in period
  const periodSalaryPayments = salaryPayments.filter((sp) => {
    const target = sp.month || (sp.paidAt ? sp.paidAt.split('T')[0] : '');
    return isDateInCurrentPeriod(target);
  });
  const periodSalaryAmount = periodSalaryPayments.reduce((s, p) => s + (p.amount || 0), 0);

  // Labour expenses in period
  const periodLabourExpenses = expenses
    .filter((e) => e.category === 'Labour Charges' && isDateInCurrentPeriod(e.date))
    .reduce((s, e) => s + e.amount, 0);

  // Direct Job labour costs from filtered orders
  const periodJobLabourCost = filteredOrders.reduce((s, o) => s + getOrderFinancials(o).labCost, 0);

  // Total Employee Expense
  const totalEmployeeExpense = periodSalaryAmount + periodLabourExpenses + periodJobLabourCost;

  // Studio Net Worth Calculation:
  // Assets = Current Stock Valuation + Customer Receivables + Cash collections
  const totalStockValuation = materials.reduce((s, m) => s + m.purchasePrice * m.stockQuantity, 0);
  const totalReceivables = orders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((s, o) => s + getOrderFinancials(o).amountPending, 0);
  const totalCollections = orders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((s, o) => s + getOrderFinancials(o).amountReceived, 0);
  const totalVendorLiabilities = vendors.reduce((s, v) => s + (v.outstandingBalance || 0), 0);
  const totalLabourLiabilities = labour.reduce((s, l) => s + (l.pendingAmount || 0), 0);

  const studioTotalAssets = totalStockValuation + totalCollections + totalReceivables;
  const studioTotalLiabilities = totalVendorLiabilities + totalLabourLiabilities;
  const studioNetWorth = studioTotalAssets - studioTotalLiabilities;

  const profitableJobsCount = filteredOrders.filter((o) => getOrderFinancials(o).profitOrLoss > 0).length;
  const lossJobsCount = filteredOrders.filter((o) => getOrderFinancials(o).profitOrLoss < 0).length;
  const breakEvenJobsCount = filteredOrders.filter((o) => getOrderFinancials(o).profitOrLoss === 0).length;

  // In-House vs Outsourced Cost Ratio
  const inHouseTasksCost = tasks
    .filter((t) => t.type === 'in_house')
    .reduce((s, t) => s + (t.materialCost || 0) + (t.labourCost || 0), 0);
  const outsourcedCost = tasks
    .filter((t) => t.type === 'outsourced')
    .reduce((s, t) => s + (t.vendorCost || 0), 0);

  // Export CSV with itemized expenses, cause, and notes
  const handleExportCSV = () => {
    const headers = [
      'Job Number',
      'Customer',
      'Products Ordered',
      'Billed Revenue (Rs)',
      'Amount Received (Rs)',
      'Payment Status (Advance/Full/None)',
      'Pending Balance (Rs)',
      'For What Cause was this Expense Incurred?',
      'Note of Expense',
      'Expense Amount (Rs)',
      'Total Direct Job Cost (Rs)',
      'Net Profit or Loss (Rs)',
      'Margin %',
    ];

    const rows: (string | number)[][] = [headers];

    filteredOrders.forEach((o) => {
      const f = getOrderFinancials(o);

      if (f.jobExpensesList.length === 0) {
        rows.push([
          o.jobNumber,
          `"${o.customerName.replace(/"/g, '""')}"`,
          `"${f.productsList.replace(/"/g, '""')}"`,
          o.grandTotal,
          f.amountReceived,
          f.paymentType,
          f.amountPending,
          `"No direct expense logged"`,
          `"-"`,
          0,
          f.totalJobCost,
          f.profitOrLoss,
          `${f.margin}%`,
        ]);
      } else {
        f.jobExpensesList.forEach((exp, idx) => {
          const cause = `${exp.category}${exp.description ? ` - ${exp.description}` : ''}`;
          const note = exp.notes || '-';
          rows.push([
            o.jobNumber,
            `"${o.customerName.replace(/"/g, '""')}"`,
            `"${f.productsList.replace(/"/g, '""')}"`,
            o.grandTotal,
            f.amountReceived,
            f.paymentType,
            f.amountPending,
            `"${cause.replace(/"/g, '""')}"`,
            `"${note.replace(/"/g, '""')}"`,
            exp.amount,
            idx === 0 ? f.totalJobCost : '',
            idx === 0 ? f.profitOrLoss : '',
            idx === 0 ? `${f.margin}%` : '',
          ]);
        });
      }
    });

    // Use UTF-8 BOM so Excel opens special characters and Indian Rupee notation with zero corruption
    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DP_Graphics_Expenses_and_PnL_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <span className="text-sm font-semibold text-slate-800 block">Financial Audit & Job Costing</span>
          <span className="text-[11px] text-slate-500">Real-time studio revenue, payroll, valuation & profit analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PERIOD SELECTOR: MONTHLY / FULL / YEARLY CALENDAR SELECTOR */}
      {/* ========================================================= */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 mr-1">Time Period:</span>
          {/* Segmented Period Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setDateFilterType('monthly')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                dateFilterType === 'monthly' || dateFilterType === 'month_year'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilterType('full')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                dateFilterType === 'full' || dateFilterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Full (All Time)</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilterType('yearly')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                dateFilterType === 'yearly'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Yearly</span>
            </button>
          </div>
        </div>

        {/* Dynamic Calendar Controls based on period */}
        {(dateFilterType === 'monthly' || dateFilterType === 'month_year') && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setDateFilterType('monthly');
              }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
            >
              {MONTH_NAMES.map((name, idx) => {
                const val = (idx + 1).toString().padStart(2, '0');
                return (
                  <option key={val} value={val}>
                    {name}
                  </option>
                );
              })}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setDateFilterType('monthly');
              }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {dateFilterType === 'yearly' && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={handlePrevYear}
              title="Previous Year"
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setDateFilterType('yearly');
              }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextYear}
              title="Next Year"
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {(dateFilterType === 'full' || dateFilterType === 'all') && (
          <span className="text-xs text-slate-500 font-medium">
            Showing all-time records across all jobs, expenses & staff payroll
          </span>
        )}
      </div>

      {/* ========================================================= */}
      {/* FINANCIAL AUDIT STRIP 1: BILLED, RECEIVED, PENDING, COSTS, PROFIT */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Billed Revenue */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase text-slate-500 block tracking-wider">
            Total Billed
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {filteredOrders.length} audited jobs
          </span>
        </div>

        {/* Amount Received (Advance + Full) */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase text-emerald-600 block tracking-wider">
            Amount Received
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Advance & collections
          </span>
        </div>

        {/* Amount Pending */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase text-amber-600 block tracking-wider">
            Customer Pending Dues
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Outstanding balance
          </span>
        </div>

        {/* Total Production Cost */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase text-slate-500 block tracking-wider">
            Job Direct Costs
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{totalCosts.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Materials, vendors & labour
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase text-emerald-700 block tracking-wider">
            Net Studio Profit
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ₹{totalNetProfit.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
            {overallMargin}% net margin
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FINANCIAL AUDIT STRIP 2: EMPLOYEE EXPENSE, NET WORTH, PROFIT IN PERCENTAGE */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Employee Expense */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase text-indigo-700 block tracking-wider">
              Employee Expense
            </span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              ₹{totalEmployeeExpense.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {periodSalaryPayments.length > 0
                ? `${periodSalaryPayments.length} payroll disbursements (₹${periodSalaryAmount.toLocaleString('en-IN')})`
                : 'Salaries & operator labour'}
              {periodJobLabourCost > 0 ? ` + ₹${periodJobLabourCost.toLocaleString('en-IN')} job tasks` : ''}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Net Worth */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase text-blue-700 block tracking-wider">
              Studio Net Worth
            </span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              ₹{studioNetWorth.toLocaleString('en-IN')}
            </div>
            <span
              className="text-[11px] text-slate-400 block mt-0.5"
              title={`Assets: ₹${studioTotalAssets.toLocaleString('en-IN')} (Stock ₹${totalStockValuation.toLocaleString('en-IN')} + Customer Dues ₹${totalReceivables.toLocaleString('en-IN')} + Collections ₹${totalCollections.toLocaleString('en-IN')}) − Liabilities: ₹${studioTotalLiabilities.toLocaleString('en-IN')} (Vendors ₹${totalVendorLiabilities.toLocaleString('en-IN')} + Staff Dues ₹${totalLabourLiabilities.toLocaleString('en-IN')})`}
            >
              Assets ₹{studioTotalAssets.toLocaleString('en-IN')} − Liab. ₹{studioTotalLiabilities.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Profit in Percentage */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase text-emerald-700 tracking-wider">
                Profit Margin (%)
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  profitPercentage >= 30
                    ? 'bg-emerald-100 text-emerald-800'
                    : profitPercentage > 0
                    ? 'bg-blue-100 text-blue-800'
                    : profitPercentage === 0
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {profitPercentage >= 30
                  ? 'High Margin'
                  : profitPercentage > 0
                  ? 'Profitable'
                  : profitPercentage === 0
                  ? 'Break-Even'
                  : 'Loss Margin'}
              </span>
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {profitPercentage > 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Profit ₹{totalNetProfit.toLocaleString('en-IN')} on Billed ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER & DATE TOOLBAR: SELECTABLE CALENDAR, DATE, MONTH, YEAR */}
      {/* ========================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job #, client name, phone number, or product ordered..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Filter (Advance / Full / None) */}
            <select
              value={paymentFilter}
              onChange={(e: any) => setPaymentFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Customer Payment Statuses</option>
              <option value="full">🟢 Full Payment Received</option>
              <option value="advance">🔵 Advance Paid (Balance Pending)</option>
              <option value="none">🔴 None Received (Fully Pending)</option>
            </select>

            {/* Profit or Loss Filter */}
            <select
              value={pnlFilter}
              onChange={(e: any) => setPnlFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none w-full sm:w-auto"
            >
              <option value="all">Profit & Loss: All</option>
              <option value="profit">📈 Profitable Jobs Only</option>
              <option value="loss">📉 Loss Jobs Only</option>
            </select>

            {/* Selectable Calendar, Date, Month, Year Filter */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDateFilterType('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    dateFilterType === 'all'
                      ? 'bg-white text-dp-navy shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('this_month')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    dateFilterType === 'this_month'
                      ? 'bg-white text-dp-navy shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('today')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    dateFilterType === 'today'
                      ? 'bg-white text-dp-navy shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilterType('specific_date');
                    if (!selectedDate) setSelectedDate(todayStr);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    dateFilterType === 'specific_date'
                      ? 'bg-white text-dp-navy shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Select exact date from calendar"
                >
                  <Calendar className="w-3.5 h-3.5 text-dp-orange" />
                  <span>Calendar Date</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('month_year')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    dateFilterType === 'month_year'
                      ? 'bg-white text-dp-navy shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Select specific month and year"
                >
                  Month & Year
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('custom_range')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    dateFilterType === 'custom_range'
                      ? 'bg-white text-dp-navy shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Select date range"
                >
                  Range
                </button>
              </div>

              {/* Specific Calendar Date Picker */}
              {dateFilterType === 'specific_date' && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-dp-navy px-2.5 py-1 rounded-xl shadow-xs animate-fadeIn">
                  <Calendar className="w-3.5 h-3.5 text-dp-orange shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              )}

              {/* Month & Year Selectable Dropdowns */}
              {dateFilterType === 'month_year' && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-dp-navy shadow-xs animate-fadeIn">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold text-slate-800 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    <option value="01">Jan</option>
                    <option value="02">Feb</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">May</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Aug</option>
                    <option value="09">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs font-bold text-slate-800 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              )}

              {/* Custom Date Range Pickers */}
              {dateFilterType === 'custom_range' && (
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-dp-navy shadow-xs animate-fadeIn text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold pl-1">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
                  />
                  <span className="text-slate-400 text-[10px] uppercase font-bold">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Filter Indicator Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Showing {filteredOrders.length} of {orders.length} jobs audited
            </span>
            {(searchQuery || paymentFilter !== 'all' || pnlFilter !== 'all' || dateFilterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPaymentFilter('all');
                  setPnlFilter('all');
                  setDateFilterType('all');
                  setSelectedDate('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-dp-orange hover:underline font-bold text-[11px]"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {profitableJobsCount} Profitable
            </span>
            {lossJobsCount > 0 && (
              <span className="text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                {lossJobsCount} In Loss
              </span>
            )}
            <span className="text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              Net Margin: {overallMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. JOB-BY-JOB PROFITABILITY COSTING TABLE (ADMINLTE 4) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/60">
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 uppercase">
              Job Costing, Customer Receipts & Profit/Loss Audit
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Breakdown of customer payments (Advance / Full / None), pending dues, and net profit or loss.
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
            {filteredOrders.length} Jobs Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Job & Date</th>
                <th className="py-3.5 px-4">Customer & Product Ordered</th>
                <th className="py-3.5 px-4">Billed Revenue</th>
                <th className="py-3.5 px-4">Customer Amount Received</th>
                <th className="py-3.5 px-4">Pending Due</th>
                <th className="py-3.5 px-4 min-w-[240px]">Direct Costs & Expenses Incurred</th>
                <th className="py-3.5 px-4">Profit or Loss?</th>
                <th className="py-3.5 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No jobs matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const f = getOrderFinancials(ord);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition group">
                      {/* Job Number & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-dp-orange bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md text-[11px] block w-fit">
                          {ord.jobNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          {f.orderDate}
                        </span>
                      </td>

                      {/* Customer & Product Ordered */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 text-xs">{ord.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5" title={f.productsList}>
                          {f.productsList}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ord.customerPhone}</span>
                      </td>

                      {/* Billed Revenue */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                        ₹{ord.grandTotal.toLocaleString('en-IN')}
                      </td>

                      {/* AMOUNT RECEIVED: ADVANCE OR FULL OR NONE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {f.paymentType === 'Full' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Full: ₹{f.amountReceived}</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 block pl-1">100% Collected</span>
                          </div>
                        ) : f.paymentType === 'Advance' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>Advance: ₹{f.amountReceived}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block pl-1">Partially Collected</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>None Received</span>
                            </span>
                            <span className="text-[10px] text-rose-600 block pl-1">₹0 Collected Yet</span>
                          </div>
                        )}
                      </td>

                      {/* PENDING / BALANCE DUE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {f.amountPending > 0 ? (
                          <div className="font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs w-fit">
                            ₹{f.amountPending.toLocaleString('en-IN')} pending
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>

                      {/* Direct Costs & Itemized Expenses Incurred */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-rose-600 text-xs">
                            ₹{f.totalJobCost.toLocaleString('en-IN')}
                          </span>
                          {f.jobExpensesList.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                              {f.jobExpensesList.length} {f.jobExpensesList.length === 1 ? 'expense' : 'expenses'}
                            </span>
                          )}
                        </div>

                        {/* Itemized expenses with cause description, note, and category */}
                        {f.jobExpensesList.length > 0 ? (
                          <div className="mt-1.5 space-y-1">
                            {f.jobExpensesList.map((exp, idx) => (
                              <div
                                key={idx}
                                className="bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/80 rounded-lg p-1.5 text-[10px] leading-tight transition"
                              >
                                <div className="flex items-center justify-between gap-1 font-bold text-slate-800">
                                  <span className="truncate max-w-[150px]" title={exp.description}>
                                    {exp.description}
                                  </span>
                                  <span className="font-black text-rose-700 shrink-0">
                                    ₹{exp.amount.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="bg-white border border-rose-200 px-1 py-0.2 rounded font-semibold text-rose-800 shrink-0">
                                    {exp.category}
                                  </span>
                                  {exp.notes && (
                                    <span className="italic truncate text-slate-600" title={exp.notes}>
                                      Note: {exp.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : f.totalJobCost > 0 ? (
                          <div className="text-[10px] text-slate-400 mt-1 space-x-1">
                            {f.matCost > 0 && <span>Mat: ₹{f.matCost}</span>}
                            {f.vendCost > 0 && <span>Vend: ₹{f.vendCost}</span>}
                            {f.labCost > 0 && <span>Lab: ₹{f.labCost}</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block mt-1">
                            No direct cost logged
                          </span>
                        )}
                      </td>

                      {/* PROFIT OR LOSS? */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {f.profitOrLoss > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              <span>+₹{f.profitOrLoss.toLocaleString('en-IN')} PROFIT</span>
                            </span>
                          ) : f.profitOrLoss < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
                              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                              <span>-₹{Math.abs(f.profitOrLoss).toLocaleString('en-IN')} LOSS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span>₹0 BREAK-EVEN</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block pl-1">
                            Cash Realized: ₹{f.amountReceived - f.totalJobCost}
                          </span>
                        </div>
                      </td>

                      {/* Margin % */}
                      <td className="py-3.5 px-4 text-right font-black whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-block ${
                            f.margin >= 50
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : f.margin > 0
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : f.margin === 0
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {f.margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Calculated Sums */}
            {filteredOrders.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-xs font-black">
                    Audit Totals ({filteredOrders.length} Jobs):
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                    ₹{totalBilled.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-700 text-sm whitespace-nowrap">
                    ₹{totalReceived.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-amber-700 text-sm whitespace-nowrap">
                    ₹{totalPending.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-rose-700 text-sm whitespace-nowrap">
                    ₹{totalCosts.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-sm whitespace-nowrap">
                    <span className={totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {totalNetProfit >= 0 ? `+₹${totalNetProfit.toLocaleString('en-IN')} NET PROFIT` : `-₹${Math.abs(totalNetProfit).toLocaleString('en-IN')} NET LOSS`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-sm whitespace-nowrap">
                    <span className="text-dp-navy">{overallMargin}%</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Production Cost Ratio Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-dp-navy">In-House vs Outsourced Production Cost Ratio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-xs uppercase font-bold text-blue-800">In-House Production Expenses</span>
            <div className="text-2xl font-black text-blue-900">₹{inHouseTasksCost}</div>
            <p className="text-[11px] text-blue-700">Internal consumables, rolls, inks and machine operator wages.</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
            <span className="text-xs uppercase font-bold text-purple-800">External Vendor Outsourced Costs</span>
            <div className="text-2xl font-black text-purple-900">₹{outsourcedCost}</div>
            <p className="text-[11px] text-purple-700">Agreed contract fees paid to external offset & fabrication partners.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
