'use client';

import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, Order, Vendor } from '@/types';
import {
  TrendingDown,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  X,
  Printer,
  FileText,
  Boxes,
  Building2,
  UserCheck,
  Zap,
  Trash2,
  Eye,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  FileDown,
  Clock,
} from 'lucide-react';

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Date & Calendar Filter State
  const [dateFilterType, setDateFilterType] = useState<
    'all' | 'this_month' | 'today' | 'specific_date' | 'month_year' | 'custom_range'
  >('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('Material Purchase');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [jobNumber, setJobNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Offline UPI' | 'Bank Transfer'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');

  // Vendor Selection State
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Quick Add Vendor State
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Raw Materials & Stock');
  const [addingVendor, setAddingVendor] = useState(false);

  const loadData = async () => {
    try {
      const [eRes, oRes, vRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/orders'),
        fetch('/api/vendors'),
      ]);
      const eData = await eRes.json();
      const oData = await oRes.json();
      const vData = await vRes.json();
      if (eData.success) setExpenses(eData.expenses);
      if (oData.success) setOrders(oData.orders);
      if (vData.success) setVendors(vData.vendors);
    } catch (e) {
      console.error('Failed to load expenses, orders, or vendors', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Add Vendor Handler
  const handleQuickCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorPhone.trim()) {
      alert('Please enter Vendor / Shop Name and Phone Number');
      return;
    }
    setAddingVendor(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVendorName.trim(),
          phone: newVendorPhone.trim(),
          category: newVendorCategory.trim() || 'General Supplier',
        }),
      });
      const data = await res.json();
      if (data.success && data.vendor) {
        setVendors((prev) => [data.vendor, ...prev]);
        setSelectedVendorId(data.vendor.id);
        setShowAddVendor(false);
        setNewVendorName('');
        setNewVendorPhone('');
      } else {
        alert('Failed to add vendor: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error creating vendor: ' + err.message);
    } finally {
      setAddingVendor(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid expense amount greater than 0');
      return;
    }
    if (!description.trim()) {
      alert('Please enter for what the expense was caused');
      return;
    }

    const chosenVendor = vendors.find((v) => v.id === selectedVendorId);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          amount: numAmount,
          date: expenseDate,
          jobNumber: jobNumber.trim() || undefined,
          paymentMethod,
          paymentStatus,
          notes: notes.trim(),
          vendorId: chosenVendor ? chosenVendor.id : undefined,
          vendorName: chosenVendor ? chosenVendor.name : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setDescription('');
        setAmount('');
        setJobNumber('');
        setNotes('');
        setSelectedVendorId('');
        setPaymentStatus('Paid');
        setShowAddVendor(false);
        loadData();
      } else {
        alert('Failed to record expense: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Toggle Payment Status (Paid <-> Pending)
  const handleTogglePaymentStatus = async (id: string, newStatus: 'Paid' | 'Pending') => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('Failed to update payment status: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Delete expense handler
  const handleDelete = async (id: string, cause: string) => {
    if (!confirm(`Are you sure you want to delete this expense:\n"${cause}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (selectedExpense?.id === id) {
          setSelectedExpense(null);
        }
        loadData();
      } else {
        alert('Could not delete expense: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error deleting expense: ' + err.message);
    }
  };

  // Filter logic
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  const filtered = expenses.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;

    // Payment Status Filter (Paid vs Pending Liabilities)
    if (statusFilter !== 'all') {
      const isPending = e.paymentStatus === 'Pending' || e.paymentStatus === 'Unpaid';
      if (statusFilter === 'Pending' && !isPending) return false;
      if (statusFilter === 'Paid' && isPending) return false;
    }

    // Date & Calendar Filtering
    if (dateFilterType === 'today' && e.date !== todayStr) return false;
    if (dateFilterType === 'this_month' && !e.date.startsWith(currentMonthStr)) return false;
    if (dateFilterType === 'specific_date' && selectedDate && e.date !== selectedDate) return false;
    if (dateFilterType === 'month_year') {
      if (selectedYear && selectedMonth && !e.date.startsWith(`${selectedYear}-${selectedMonth}`)) return false;
      if (selectedYear && !selectedMonth && !e.date.startsWith(selectedYear)) return false;
    }
    if (dateFilterType === 'custom_range') {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchNotes = (e.notes || '').toLowerCase().includes(q);
      const matchJob = (e.jobNumber || '').toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      const matchMethod = e.paymentMethod.toLowerCase().includes(q);
      const matchVendor = (e.vendorName || '').toLowerCase().includes(q);
      const matchStatus = (e.paymentStatus || '').toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchJob && !matchCat && !matchMethod && !matchVendor && !matchStatus) {
        return false;
      }
    }
    return true;
  });

  // Dynamic Calculations
  const calculatedTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  // Category wise calculations across all loaded expenses
  const materialTotal = expenses
    .filter((e) => e.category === 'Material Purchase')
    .reduce((s, e) => s + e.amount, 0);

  const vendorTotal = expenses
    .filter((e) => e.category === 'Vendor Payment')
    .reduce((s, e) => s + e.amount, 0);

  const labourTotal = expenses
    .filter((e) => e.category === 'Labour Charges')
    .reduce((s, e) => s + e.amount, 0);

  const overheadsTotal = expenses
    .filter((e) => !['Material Purchase', 'Vendor Payment', 'Labour Charges'].includes(e.category))
    .reduce((s, e) => s + e.amount, 0);

  // Pending Liabilities (Unpaid Expenses)
  const pendingExpensesTotal = expenses
    .filter((e) => e.paymentStatus === 'Pending' || e.paymentStatus === 'Unpaid')
    .reduce((s, e) => s + e.amount, 0);

  const pendingExpensesCount = expenses
    .filter((e) => e.paymentStatus === 'Pending' || e.paymentStatus === 'Unpaid').length;

  const allGrandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // Category helper for badges
  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Material Purchase':
        return { label: 'Materials & Stock', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Boxes };
      case 'Vendor Payment':
        return { label: 'Vendor Outsourcing', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: Building2 };
      case 'Labour Charges':
        return { label: 'Labour & Workforce', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: UserCheck };
      case 'Electricity':
        return { label: 'Electricity & Power', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Zap };
      case 'Rent':
        return { label: 'Shop Rent', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: FileText };
      default:
        return { label: cat, bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: TrendingDown };
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* REAL-TIME CALCULATION & FINANCIAL BREAKDOWN CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {/* Total Outflows */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Expenses
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{allGrandTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {expenses.length} recorded entries
          </div>
        </div>

        {/* Materials & Stock Purchase */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Materials & Stock
            </span>
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{materialTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {allGrandTotal > 0 ? `${Math.round((materialTotal / allGrandTotal) * 100)}% of total` : '0%'}
          </div>
        </div>

        {/* Vendor Outsourcing */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Vendor Outsourcing
            </span>
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{vendorTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {allGrandTotal > 0 ? `${Math.round((vendorTotal / allGrandTotal) * 100)}% of total` : '0%'}
          </div>
        </div>

        {/* Labour & Wages */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Labour & Wages
            </span>
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{labourTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {allGrandTotal > 0 ? `${Math.round((labourTotal / allGrandTotal) * 100)}% of total` : '0%'}
          </div>
        </div>

        {/* Studio Utilities & Overheads */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Rent & Overheads
            </span>
            <Zap className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{overheadsTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {allGrandTotal > 0 ? `${Math.round((overheadsTotal / allGrandTotal) * 100)}% of total` : '0%'}
          </div>
        </div>

        {/* Pending Liabilities (Due Bills) */}
        <div className={`p-3.5 rounded-lg border shadow-xs transition ${
          pendingExpensesTotal > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending Liabilities
            </span>
            <Clock className={`w-3.5 h-3.5 ${pendingExpensesTotal > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl font-bold mt-1 ${pendingExpensesTotal > 0 ? 'text-amber-900' : 'text-slate-800'}`}>
            ₹{pendingExpensesTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700/90 mt-0.5 font-medium">
            {pendingExpensesCount > 0 ? `${pendingExpensesCount} unpaid dues` : 'All expenses settled'}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER & REAL-TIME RECALCULATION TOOLBAR */}
      {/* ========================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search by cause, note, job # */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by what caused expense, notes, payee name, job #, or payment mode..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none w-full sm:w-auto"
            >
              <option value="">All Expense Causes</option>
              <option value="Material Purchase">📦 Material & Stock Purchases</option>
              <option value="Vendor Payment">🏢 Vendor Outsourcing</option>
              <option value="Labour Charges">👷 Labour & Operator Wages</option>
              <option value="Rent">🏢 Shop Rent</option>
              <option value="Electricity">⚡ Electricity & Power</option>
              <option value="Maintenance">🛠️ Machine Maintenance</option>
              <option value="Transportation">🚚 Transportation & Travel</option>
              <option value="Delivery">📦 Courier & Delivery</option>
              <option value="Other Expenses">📌 Other Miscellaneous</option>
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

        {/* Live Calculation Result Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Showing {filtered.length} of {expenses.length} expenses
            </span>
            {(searchQuery || categoryFilter || dateFilterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setDateFilterType('all');
                  setSelectedDate('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-rose-600 hover:underline font-bold text-[11px]"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-rose-50 text-rose-900 px-3 py-1 rounded-lg border border-rose-100 font-bold">
            <span>Filtered Total Calculated:</span>
            <span className="text-sm font-black text-rose-700">₹{calculatedTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DETAILED EXPENSE LEDGER TABLE (ADMINLTE 4) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-slate-800">Expenditure Ledger</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filtered.length} entries
            </span>
            {/* Payment Status Filter Pills */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200 sm:ml-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition text-xs ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({expenses.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Paid')}
                className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1.5 ${
                  statusFilter === 'Paid'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <span>🟢 Paid</span>
                <span className="text-[10px] opacity-80">
                  ({expenses.filter((e) => e.paymentStatus !== 'Pending' && e.paymentStatus !== 'Unpaid').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Pending')}
                className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1.5 ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <span>⏳ Pending / Liabilities</span>
                {pendingExpensesCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      statusFilter === 'Pending'
                        ? 'bg-white text-amber-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {pendingExpensesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Cause / Category</th>
                <th className="py-2.5 px-4 w-2/5">For What Expense is Caused & Notes</th>
                <th className="py-2.5 px-4">Job Attributed</th>
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading studio expenses and calculating balances...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No expenses recorded matching current filters.</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-3 text-xs font-bold text-rose-600 hover:underline"
                    >
                      Record New Expense Now
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => {
                  const catBadge = getCategoryBadge(exp.category);
                  const Icon = catBadge.icon;
                  const linkedOrder = orders.find(
                    (o) => o.jobNumber?.toUpperCase() === exp.jobNumber?.toUpperCase()
                  );
                  const allExpensesForJob = expenses.filter(
                    (e) => e.jobNumber?.toUpperCase() === exp.jobNumber?.toUpperCase()
                  );
                  const totalJobCost = allExpensesForJob.reduce((s, e) => s + e.amount, 0);
                  const jobNetProfit = linkedOrder ? linkedOrder.grandTotal - totalJobCost : 0;
                  const jobMargin =
                    linkedOrder && linkedOrder.grandTotal > 0
                      ? Math.round((jobNetProfit / linkedOrder.grandTotal) * 100)
                      : 0;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition group">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{exp.date}</div>
                        <span className="text-[10px] text-slate-400 font-mono">#{exp.id}</span>
                      </td>

                      {/* Cause Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${catBadge.bg}`}>
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{catBadge.label}</span>
                        </span>
                      </td>

                      {/* What Caused the Expense + Detailed Note */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-[13px] leading-snug">
                          {exp.description}
                        </div>
                        {exp.vendorName && (
                          <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/80 px-2 py-0.5 rounded-md">
                            <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>From: <strong className="text-blue-900">{exp.vendorName}</strong></span>
                            {exp.vendorId && (
                              <span className="text-[9px] bg-blue-200 text-blue-800 px-1 rounded font-bold uppercase">
                                Registered
                              </span>
                            )}
                          </div>
                        )}
                        {exp.notes ? (
                          <div className="mt-1 bg-amber-50/80 border border-amber-200/80 text-amber-950 p-2 rounded-lg text-[11px] leading-relaxed">
                            <span className="font-bold text-amber-800 uppercase text-[9px] block">
                              📝 Note of Expense:
                            </span>
                            {exp.notes}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">No additional note recorded.</div>
                        )}
                      </td>

                      {/* Attributed Job, Customer & P&L Update */}
                      <td className="py-3.5 px-4">
                        {exp.jobNumber ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-orange-50 border border-orange-200 text-dp-orange px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                                {exp.jobNumber}
                              </span>
                              {linkedOrder && (
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]" title={linkedOrder.customerName}>
                                  {linkedOrder.customerName}
                                </span>
                              )}
                            </div>
                            {linkedOrder && (
                              <>
                                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]" title={linkedOrder.items.map((it) => it.productName).join(', ')}>
                                  {linkedOrder.items.map((it) => it.productName).join(', ')}
                                </div>
                                <div className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                  <span>Billed: ₹{linkedOrder.grandTotal}</span>
                                  <span>&bull;</span>
                                  <span className={jobNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                                    P&L: {jobNetProfit >= 0 ? `+₹${jobNetProfit}` : `-₹${Math.abs(jobNetProfit)}`} ({jobMargin}%)
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans font-medium text-[11px]">
                            General Overhead
                          </span>
                        )}
                      </td>

                      {/* Payment Method & Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-700">{exp.paymentMethod}</div>
                        {exp.paymentStatus === 'Pending' || exp.paymentStatus === 'Unpaid' ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              <span>Pending Due</span>
                            </span>
                            <button
                              onClick={() => handleTogglePaymentStatus(exp.id, 'Paid')}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md transition shadow-2xs cursor-pointer"
                              title="Mark as Paid (Settle liability)"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Pay ✓</span>
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                            <button
                              onClick={() => handleTogglePaymentStatus(exp.id, 'Pending')}
                              className="text-[9px] text-slate-400 hover:text-amber-700 hover:underline transition cursor-pointer"
                              title="Mark as Unpaid (Set as Pending Liability)"
                            >
                              Make Due
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Calculated Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-base font-black text-rose-600">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedExpense(exp)}
                            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
                            title="View Full Expense Voucher & Job P&L"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id, exp.description)}
                            className="p-1 rounded border border-rose-300 bg-white hover:bg-rose-50 text-rose-600 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Calculated Sum */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    Total Amount ({filtered.length} line items):
                  </td>
                  <td className="py-3 px-4 text-right text-base font-black text-rose-700">
                    ₹{calculatedTotal.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: RECORD NEW EXPENSE */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                  <span>Record New Business Expense</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Record exact amount, cause, and explanatory notes for accounting calculation.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 1. What is the Amount? */}
              <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-1">
                <label className="block font-semibold text-slate-700 uppercase text-[11px] tracking-wider">
                  1. What is the Amount? (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-base font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 2500)"
                    className="w-full pl-8 pr-4 py-2 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* 2. For What Expense is Caused? */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    2. For What Cause / Category? *
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Material Purchase">📦 Material & Raw Stock Purchase (Flex, Vinyl, Mugs, Inks)</option>
                    <option value="Vendor Payment">🏢 External Vendor Outsourcing (Screenprint, Laser cutting)</option>
                    <option value="Labour Charges">👷 Labour & Worker Wages (Operator, Helper, Designer)</option>
                    <option value="Rent">🏢 Shop Rent / Facility Space</option>
                    <option value="Electricity">⚡ Electricity & Commercial Machine Power</option>
                    <option value="Maintenance">🛠️ Equipment Maintenance & Plotter Repairs</option>
                    <option value="Transportation">🚚 Transportation, Travel & Cartage</option>
                    <option value="Delivery">📦 Courier & Doorstep Delivery Charges</option>
                    <option value="Other Expenses">📌 General Studio Overhead / Miscellaneous</option>
                  </select>
                </div>

                {/* Vendor Selection */}
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Purchased From Vendor (Optional)</span>
                    </label>
                    {!showAddVendor && (
                      <button
                        type="button"
                        onClick={() => setShowAddVendor(true)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
                      >
                        + Add New Vendor
                      </button>
                    )}
                  </div>

                  {showAddVendor ? (
                    <div className="bg-white p-3 rounded-md border border-slate-300 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          Register New Vendor
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddVendor(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-700 uppercase block mb-0.5">
                            Vendor / Firm Name *
                          </label>
                          <input
                            type="text"
                            value={newVendorName}
                            onChange={(e) => setNewVendorName(e.target.value)}
                            placeholder="e.g. Balaji Plastics"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-700 uppercase block mb-0.5">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={newVendorPhone}
                            onChange={(e) => setNewVendorPhone(e.target.value)}
                            placeholder="e.g. 9845012345"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-700 uppercase block mb-0.5">
                          Speciality / Supplies Provided
                        </label>
                        <input
                          type="text"
                          value={newVendorCategory}
                          onChange={(e) => setNewVendorCategory(e.target.value)}
                          placeholder="e.g. Flex Rolls, Mugs, Laser Cutting"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddVendor(false)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={addingVendor}
                          onClick={handleQuickCreateVendor}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs flex items-center gap-1 transition"
                        >
                          {addingVendor ? 'Saving...' : 'Save & Select Vendor'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">None (Direct Shop / Internal Expense)</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} {v.businessName ? `(${v.businessName})` : ''} — {v.category || 'Vendor'} — 📞 {v.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    Title / Expense Reason Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Purchased 2 rolls 440gsm Frontlit Flex from Balaji Plastics"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Write a Note of Expense */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                  3. Write a Note of Expense *
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write a clear note: What caused this expense? Vendor/Person paid, bill or invoice #, receipt details, why this cost was incurred..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-blue-500 focus:outline-none"
                ></textarea>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  This note will be recorded permanently in the expense ledger and financial statements.
                </span>
              </div>

              {/* 4. Link to Job, Payment Method & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    Link to Job # (Optional)
                  </label>
                  <select
                    value={jobNumber}
                    onChange={(e) => setJobNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">None (General Overhead)</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.jobNumber}>
                        {o.jobNumber} — {o.customerName} (₹{o.grandTotal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Cash">Cash (Shop Register)</option>
                    <option value="Offline UPI">Offline UPI (Shop QR)</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    Payment Status *
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e: any) => setPaymentStatus(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md font-bold text-xs focus:outline-none ${
                      paymentStatus === 'Pending'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 focus:border-amber-500'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-900 focus:border-emerald-500'
                    }`}
                  >
                    <option value="Paid">🟢 Paid (Settled)</option>
                    <option value="Pending">⏳ Pending / Due (Credit Liability)</option>
                  </select>
                </div>
              </div>

              {/* Informative Callout when Pending / Due Liability is chosen */}
              {paymentStatus === 'Pending' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-2.5 flex items-start gap-2 text-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Tracked under Studio Liabilities:</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      This unpaid expense {amount ? `(₹${parseFloat(amount).toLocaleString('en-IN')})` : ''} will be logged as an outstanding liability in Studio Net Worth until marked Paid. You can settle it anytime with 1-click in the Expenditure Ledger.
                    </p>
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-medium bg-blue-600 text-white rounded-md shadow-xs hover:bg-blue-700 transition"
                >
                  Calculate & Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW EXPENSE VOUCHER DETAILS */}
      {/* ========================================================= */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Expense Voucher</span>
                <h3 className="font-extrabold text-base text-dp-navy font-mono">#{selectedExpense.id}</h3>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Total Expense Amount</span>
              <div className="text-3xl font-black text-rose-700 mt-0.5">
                ₹{selectedExpense.amount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                Paid via {selectedExpense.paymentMethod} on {selectedExpense.date}
              </span>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Cause Category</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedExpense.category}</span>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Expense Reason / Description</span>
                <p className="font-semibold text-slate-900 mt-0.5 text-xs">{selectedExpense.description}</p>
              </div>

              {selectedExpense.vendorName && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Purchased From (Vendor / Shop)</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-blue-900 font-bold text-xs bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedExpense.vendorName}</span>
                    {selectedExpense.vendorId && (
                      <span className="text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase ml-auto">
                        Registered Vendor
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Note of Expense</span>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 mt-1 font-medium leading-relaxed">
                  {selectedExpense.notes || 'No note written.'}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Attributed Job</span>
                  <span className="font-mono font-bold text-dp-orange">
                    {selectedExpense.jobNumber || 'General Studio Cost'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                  {selectedExpense.paymentStatus === 'Pending' || selectedExpense.paymentStatus === 'Unpaid' ? (
                    <span className="text-amber-800 font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Pending Due (Liability)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Settled / Paid</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div>
                {selectedExpense.paymentStatus === 'Pending' || selectedExpense.paymentStatus === 'Unpaid' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleTogglePaymentStatus(selectedExpense.id, 'Paid');
                      setSelectedExpense((prev) => prev ? { ...prev, paymentStatus: 'Paid' } : null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Paid ✓</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleTogglePaymentStatus(selectedExpense.id, 'Pending');
                      setSelectedExpense((prev) => prev ? { ...prev, paymentStatus: 'Pending' } : null);
                    }}
                    className="px-2.5 py-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold transition"
                  >
                    Mark as Pending Due
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedExpense.id;
                    const desc = selectedExpense.description;
                    handleDelete(id, desc);
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PRINTABLE EXPENSE STATEMENT */}
      {/* ========================================================= */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[95vh] overflow-y-auto animate-fadeIn text-xs text-slate-800">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
                  DG
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">DG graphics - Studio Expense Statement</h3>
                  <p className="text-[11px] text-slate-500">Commercial Printing & Design Studio &bull; Indiranagar, Bengaluru</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-dp-navy hover:bg-dp-navyLight text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statement Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Statement Date</span>
                <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Count</span>
                <span className="font-bold text-slate-800">{filtered.length} line items</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Filter Scope</span>
                <span className="font-bold text-slate-800">{categoryFilter || 'All Categories'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 block">Total Calculated Outflow</span>
                <span className="font-black text-rose-700 text-sm">₹{calculatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Cause & Note</th>
                  <th className="py-2 px-3">Job #</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">{e.date}</td>
                    <td className="py-2 px-3 whitespace-nowrap font-medium">{e.category}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{e.description}</div>
                      {e.vendorName && (
                        <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                          Purchased from: {e.vendorName}
                        </div>
                      )}
                      {e.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">Note: {e.notes}</div>}
                    </td>
                    <td className="py-2 px-3 font-mono">{e.jobNumber || '-'}</td>
                    <td className="py-2 px-3">{e.paymentMethod}</td>
                    <td className="py-2 px-3 text-right font-bold text-rose-600">₹{e.amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right uppercase">Grand Total Outflow:</td>
                  <td className="py-2.5 px-3 text-right text-rose-700 text-sm">₹{calculatedTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
              <span>DG graphics Commercial Management System</span>
              <span>Authorized Signature: _______________________</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
