'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Invoice, PaymentRecord, Customer, Expense, Order, ExpenseCategory } from '@/types';
import {
  Receipt,
  PlusCircle,
  Printer,
  MessageSquare,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Phone,
  FileText,
  TrendingDown,
  TrendingUp,
  Plus,
  Boxes,
  Building2,
  UserCheck,
  Eye,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Pencil,
  Trash2,
  Save,
  Check,
  Sparkles,
} from 'lucide-react';

function AdminBillingContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action') || '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
  const [createModalOpen, setCreateModalOpen] = useState(initialAction === 'new');
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);
  const [expenseModalInvoice, setExpenseModalInvoice] = useState<Invoice | null>(null);
  const [pnlDetailInvoice, setPnlDetailInvoice] = useState<Invoice | null>(null);

  // Payment Recording State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Offline UPI' | 'Bank Transfer'>('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Quick Job Expense Recording State
  const [jobExpenseCategory, setJobExpenseCategory] = useState<ExpenseCategory>('Material Purchase');
  const [jobExpenseDesc, setJobExpenseDesc] = useState('');
  const [jobExpenseAmount, setJobExpenseAmount] = useState<string>('');
  const [jobExpenseNotes, setJobExpenseNotes] = useState('');
  const [jobExpenseMethod, setJobExpenseMethod] = useState<'Cash' | 'Offline UPI' | 'Bank Transfer'>('Cash');

  // Manual Invoice State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  // EDIT INVOICE & JOB CARD MODAL STATE
  const [editModalInvoice, setEditModalInvoice] = useState<Invoice | null>(null);
  const [editTab, setEditTab] = useState<'all' | 'customer' | 'product' | 'pricing' | 'expenses'>('all');
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editInvoiceDate, setEditInvoiceDate] = useState('');
  const [editProductTitle, setEditProductTitle] = useState('');
  const [editProductQuantity, setEditProductQuantity] = useState(1);
  const [editDimensions, setEditDimensions] = useState('');
  const [editMaterial, setEditMaterial] = useState('');
  const [editSpecialInstructions, setEditSpecialInstructions] = useState('');
  const [editSubtotal, setEditSubtotal] = useState(0);
  const [editDesignCharges, setEditDesignCharges] = useState(0);
  const [editDeliveryCharges, setEditDeliveryCharges] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editGrandTotal, setEditGrandTotal] = useState(0);
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [autoCalculateTotal, setAutoCalculateTotal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = async () => {
    try {
      const [invRes, payRes, custRes, expRes, ordRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/payments'),
        fetch('/api/customers'),
        fetch('/api/expenses'),
        fetch('/api/orders'),
      ]);
      const invData = await invRes.json();
      const payData = await payRes.json();
      const custData = await custRes.json();
      const expData = await expRes.json();
      const ordData = await ordRes.json();

      if (invData.success) setInvoices(invData.invoices);
      if (payData.success) setPayments(payData.payments);
      if (custData.success) setCustomers(custData.customers);
      if (expData.success) setExpenses(expData.expenses);
      if (ordData.success) setOrders(ordData.orders);
    } catch (e) {
      console.error('Failed to load billing data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit offline payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || payAmount <= 0) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentModalInvoice.id,
          jobNumber: paymentModalInvoice.jobNumber,
          customerId: paymentModalInvoice.customerId,
          amount: payAmount,
          paymentMethod: payMethod,
          transactionReference: payRef.trim() || undefined,
          notes: payNotes.trim() || 'Offline shop counter collection',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentModalInvoice(null);
        setPayAmount(0);
        setPayRef('');
        setPayNotes('');
        loadData();
      } else {
        alert('Payment recording failed: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Submit Quick Expense for this Customer Job
  const handleRecordJobExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseModalInvoice) return;
    const numAmt = parseFloat(jobExpenseAmount);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid expense amount greater than 0');
      return;
    }
    if (!jobExpenseDesc.trim()) {
      alert('Please enter what caused this expense');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: jobExpenseCategory,
          description: jobExpenseDesc.trim(),
          amount: numAmt,
          jobNumber: expenseModalInvoice.jobNumber,
          paymentMethod: jobExpenseMethod,
          paymentStatus: 'Paid',
          notes: jobExpenseNotes.trim() || `Cost attributed to ${expenseModalInvoice.customerName} (${expenseModalInvoice.jobNumber})`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExpenseModalInvoice(null);
        setJobExpenseDesc('');
        setJobExpenseAmount('');
        setJobExpenseNotes('');
        loadData();
      } else {
        alert('Failed to record expense: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Submit manual invoice creation
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const grandTotal = itemQty * itemPrice - discount;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: custName.trim(),
          customerPhone: custPhone.trim(),
          customerAddress: custAddress.trim(),
          items: [
            {
              description: itemDesc.trim(),
              quantity: itemQty,
              unitPrice: itemPrice,
              total: itemQty * itemPrice,
            },
          ],
          subtotal: itemQty * itemPrice,
          discount,
          tax: 0,
          deliveryCharges: 0,
          grandTotal,
          amountPaid: advancePaid,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setCustName('');
        setCustPhone('');
        setCustAddress('');
        setItemDesc('');
        setItemQty(1);
        setItemPrice(0);
        setDiscount(0);
        setAdvancePaid(0);
        loadData();
      } else {
        alert('Failed to create invoice: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Helper: Get expenses linked to a job number
  const getJobExpenses = (jobNumber: string): Expense[] => {
    return expenses.filter(
      (e) => e.jobNumber?.toUpperCase() === jobNumber?.toUpperCase()
    );
  };

  // Helper: Get total expenses amount linked to a job number
  const getJobExpenseTotal = (jobNumber: string): number => {
    const jobExps = getJobExpenses(jobNumber);
    return jobExps.reduce((sum, e) => sum + e.amount, 0);
  };

  // Helper: Get associated order (if any) to fetch extra item specs
  const getLinkedOrder = (jobNumber: string): Order | undefined => {
    return orders.find((o) => o.jobNumber?.toUpperCase() === jobNumber?.toUpperCase());
  };

  // Helper: Extract human-readable product title and specifications
  const getProductDisplayInfo = (inv: Invoice) => {
    const linkedOrder = getLinkedOrder(inv.jobNumber);
    if (linkedOrder && linkedOrder.items && linkedOrder.items.length > 0) {
      return linkedOrder.items.map((it) => {
        const specs: string[] = [];
        if (it.quantity) specs.push(`Qty: ${it.quantity}`);
        if (it.material) specs.push(it.material);
        if (it.width && it.height) specs.push(`${it.width}x${it.height} ${it.unit || 'ft'}`);
        if (it.selectedSize) specs.push(`Size: ${it.selectedSize}`);
        if (it.selectedColor) specs.push(`Color: ${it.selectedColor}`);
        if (it.specialInstructions) specs.push(it.specialInstructions);
        return {
          title: it.productName,
          specs: specs.join(' • '),
          quantity: it.quantity || 1,
        };
      });
    }

    if (inv.items && inv.items.length > 0) {
      return inv.items.map((it) => ({
        title: it.description,
        specs: `Qty: ${it.quantity}`,
        quantity: it.quantity,
      }));
    }

    return [{ title: 'Custom Printing Job', specs: 'Standard Spec', quantity: 1 }];
  };

  // Open Edit Modal with prefilled data
  const handleOpenEditModal = (
    inv: Invoice,
    tab: 'all' | 'customer' | 'product' | 'pricing' | 'expenses' = 'all'
  ) => {
    const linkedOrder = getLinkedOrder(inv.jobNumber);
    const firstItem = linkedOrder?.items?.[0];

    // Extract dimensions if formatted as Dimensions: WxH or WxH
    let dims = '';
    if (firstItem?.specialInstructions && firstItem.specialInstructions.includes('Dimensions:')) {
      const match = firstItem.specialInstructions.match(/Dimensions:\s*([^)]+)/);
      if (match) dims = match[1].trim();
    }
    if (!dims && inv.items?.[0]?.description && inv.items[0].description.includes('Dimensions:')) {
      const match = inv.items[0].description.match(/Dimensions:\s*([^)]+)/);
      if (match) dims = match[1].trim();
    }
    if (!dims && firstItem?.width && firstItem?.height) {
      dims = `${firstItem.width}x${firstItem.height} ${firstItem.unit || 'ft'}`;
    }

    let mat = firstItem?.material || '';
    if (!mat && inv.items?.[0]?.description) {
      if (inv.items[0].description.includes('Frontlit Flex')) mat = 'Frontlit Flex';
      else if (inv.items[0].description.includes('Vinyl')) mat = 'Vinyl Sticker';
      else if (inv.items[0].description.includes('Ceramic')) mat = 'Ceramic';
      else if (inv.items[0].description.includes('Cotton')) mat = 'Bio-Washed Cotton';
    }

    setEditModalInvoice(inv);
    setEditTab(tab);
    setEditCustName(inv.customerName);
    setEditCustPhone(inv.customerPhone);
    setEditCustAddress(inv.customerAddress || linkedOrder?.deliveryAddress || '');
    setEditInvoiceDate(inv.date || new Date().toISOString().split('T')[0]);

    setEditProductTitle(
      firstItem?.productName ||
      inv.items?.[0]?.description?.split('(')[0]?.trim() ||
      'Custom Printing Job'
    );
    setEditProductQuantity(firstItem?.quantity || inv.items?.[0]?.quantity || 1);
    setEditDimensions(dims);
    setEditMaterial(mat);
    setEditSpecialInstructions(
      firstItem?.specialInstructions
        ? firstItem.specialInstructions.replace(/Dimensions:[^)]+\)?/, '').trim()
        : ''
    );

    setEditSubtotal(inv.subtotal || 0);
    setEditDesignCharges(linkedOrder?.designCharges || 0);
    setEditDeliveryCharges(inv.deliveryCharges || linkedOrder?.deliveryCharges || 0);
    setEditDiscount(inv.discount || 0);
    setEditGrandTotal(inv.grandTotal || 0);
    setEditAmountPaid(inv.amountPaid || 0);
    setAutoCalculateTotal(false);
  };

  // Save changes to Invoice, Order, and Customer
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalInvoice) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModalInvoice.id,
          invoiceNumber: editModalInvoice.invoiceNumber,
          jobNumber: editModalInvoice.jobNumber,
          customerName: editCustName.trim(),
          customerPhone: editCustPhone.trim(),
          customerAddress: editCustAddress.trim(),
          date: editInvoiceDate,
          productTitle: editProductTitle.trim(),
          productQuantity: Number(editProductQuantity) || 1,
          dimensions: editDimensions.trim(),
          material: editMaterial.trim(),
          specialInstructions: editSpecialInstructions.trim(),
          subtotal: Number(editSubtotal) || 0,
          designCharges: Number(editDesignCharges) || 0,
          deliveryCharges: 0,
          discount: Number(editDiscount) || 0,
          grandTotal: Number(editGrandTotal) || 0,
          amountPaid: Number(editAmountPaid) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalInvoice(null);
        await loadData();
      } else {
        alert('Failed to save changes: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error saving changes: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete invoice with confirmation
  const handleDeleteInvoice = async (inv: Invoice) => {
    if (
      !confirm(
        `Are you sure you want to delete invoice ${inv.invoiceNumber} for Job ${inv.jobNumber}? This will permanently remove the billing record.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(inv.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (editModalInvoice?.id === inv.id) setEditModalInvoice(null);
        loadData();
      } else {
        alert('Delete failed: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error deleting invoice: ' + err.message);
    }
  };

  // Delete expense directly from job modal
  const handleDeleteJobExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to remove this expense entry?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(expenseId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('Failed to delete expense: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Filtered invoices
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter && inv.paymentStatus !== statusFilter) return false;

    // Date & Calendar Filtering
    if (dateFilterType === 'today' && inv.date !== todayStr) return false;
    if (dateFilterType === 'this_month' && !inv.date.startsWith(currentMonthStr)) return false;
    if (dateFilterType === 'specific_date' && selectedDate && inv.date !== selectedDate) return false;
    if (dateFilterType === 'month_year') {
      if (selectedYear && selectedMonth && !inv.date.startsWith(`${selectedYear}-${selectedMonth}`)) return false;
      if (selectedYear && !selectedMonth && !inv.date.startsWith(selectedYear)) return false;
    }
    if (dateFilterType === 'custom_range') {
      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      const matchJob = inv.jobNumber.toLowerCase().includes(q);
      const matchCust = inv.customerName.toLowerCase().includes(q);
      const matchPhone = inv.customerPhone.toLowerCase().includes(q);
      const matchItem = inv.items.some((it) => it.description.toLowerCase().includes(q));
      if (!matchInv && !matchJob && !matchCust && !matchPhone && !matchItem) {
        return false;
      }
    }
    return true;
  });

  // Aggregated calculations
  const totalBilledRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaidRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstandingBalance = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Total attributed costs for all invoiced jobs
  const totalJobCosts = invoices.reduce((sum, inv) => sum + getJobExpenseTotal(inv.jobNumber), 0);
  const totalNetProfit = totalBilledRevenue - totalJobCosts;
  const overallMargin = totalBilledRevenue > 0 ? Math.round((totalNetProfit / totalBilledRevenue) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* FINANCIAL INTELLIGENCE & P&L STRIP (ADMINLTE 4) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Invoiced */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Billed
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{totalBilledRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {invoices.length} invoices
          </span>
        </div>

        {/* Collected Offline */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 block">
            Realized Collections
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ₹{totalPaidRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Cash & UPI receipts
          </span>
        </div>

        {/* Balance Due */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 block">
            Balance Due
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            ₹{totalOutstandingBalance.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Payable upon collection
          </span>
        </div>

        {/* Attributed Product Expenses */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">
              Job Direct Costs
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{totalJobCosts.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Materials & vendor costs
          </span>
        </div>

        {/* Net Studio Profit & Margin */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 block">
              Net Job Profit
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ₹{totalNetProfit.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            {overallMargin}% net profit margin
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER & SEARCH TOOLBAR WITH CALENDAR / DATE PICKER */}
      {/* ========================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, job #, client name, phone, or product ordered..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none w-full sm:w-auto"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid in Full</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid / Balance Due</option>
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

        {/* Live Filter Indicator & Reset */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </span>
            {(searchQuery || statusFilter || dateFilterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
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
        </div>
      </div>

      {/* ========================================================= */}
      {/* ENHANCED INVOICES & PRODUCT P&L TABLE (ADMINLTE 4) */}
      {/* Invoices Table Card (AdminLTE 4 Standard) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800">Invoices Directory</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredInvoices.length} invoices
            </span>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Invoice & Date</th>
                <th className="py-2.5 px-4">Job Number</th>
                <th className="py-2.5 px-4">Customer Details</th>
                <th className="py-2.5 px-4 w-1/4">Customer Product & Specs</th>
                <th className="py-2.5 px-4">Billed Revenue</th>
                <th className="py-2.5 px-4">Paid / Due</th>
                <th className="py-2.5 px-4">Product Expenses</th>
                <th className="py-2.5 px-4">Net Profit & Loss</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-dp-orange border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading customer invoices, product details & expenses...</span>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const jobExpenses = getJobExpenses(inv.jobNumber);
                  const totalExpense = jobExpenses.reduce((sum, e) => sum + e.amount, 0);
                  const netProfit = inv.grandTotal - totalExpense;
                  const profitMargin = inv.grandTotal > 0 ? Math.round((netProfit / inv.grandTotal) * 100) : 0;
                  const productInfoList = getProductDisplayInfo(inv);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition group">
                      {/* 1. Invoice Number & Date */}
                      <td
                        onClick={() => handleOpenEditModal(inv, 'all')}
                        className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/80 transition rounded-lg"
                        title="Click to edit invoice & order details"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="font-mono font-bold text-dp-navy text-sm">
                            {inv.invoiceNumber}
                          </div>
                          <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {inv.date}
                        </span>
                      </td>

                      {/* 2. Job Number */}
                      <td
                        onClick={() => handleOpenEditModal(inv, 'all')}
                        className="py-3.5 px-4 whitespace-nowrap cursor-pointer"
                        title="Click to edit job"
                      >
                        <span className="font-mono font-bold text-dp-orange bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                          <span>{inv.jobNumber}</span>
                        </span>
                      </td>

                      {/* 3. Customer Details */}
                      <td
                        onClick={() => handleOpenEditModal(inv, 'customer')}
                        className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/80 transition rounded-lg"
                        title="Click to edit customer name & phone"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-slate-900">{inv.customerName}</div>
                          <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{inv.customerPhone}</span>
                        </div>
                      </td>

                      {/* 4. CUSTOMER PRODUCT & SPECIFICATIONS */}
                      <td
                        onClick={() => handleOpenEditModal(inv, 'product')}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition rounded-lg"
                        title="Click to edit product name, quantity, material & dimensions"
                      >
                        <div className="space-y-1.5">
                          {productInfoList.map((p, idx) => (
                            <div key={idx} className="bg-slate-50 hover:bg-white p-2 rounded-xl border border-slate-200 hover:border-dp-navy transition group/card relative">
                              <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-1">
                                <span className="truncate">{p.title}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] font-black text-dp-orange bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    Qty: {p.quantity}
                                  </span>
                                  <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/card:opacity-100 transition" />
                                </div>
                              </div>
                              {p.specs && (
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                                  {p.specs}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 5. Billed Amount */}
                      <td
                        onClick={() => handleOpenEditModal(inv, 'pricing')}
                        className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/80 transition rounded-lg"
                        title="Click to edit billing & subtotal"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-black text-slate-900 text-sm">
                            ₹{inv.grandTotal.toLocaleString('en-IN')}
                          </div>
                          <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Subtotal: ₹{inv.subtotal}
                        </span>
                      </td>

                      {/* 6. Paid / Balance Due */}
                      <td
                        onClick={() => handleOpenEditModal(inv, 'pricing')}
                        className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/80 transition rounded-lg"
                        title="Click to edit payment collection & dues"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-emerald-700 font-bold">
                            Paid: ₹{inv.amountPaid.toLocaleString('en-IN')}
                          </div>
                          <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>
                        {inv.balanceDue > 0 ? (
                          <div className="text-amber-700 font-extrabold text-[11px] mt-0.5">
                            Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid in Full</span>
                          </span>
                        )}
                      </td>

                      {/* 7. PRODUCT EXPENSES & COSTS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-black text-rose-600 text-xs">
                              ₹{totalExpense.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {jobExpenses.length} cost {jobExpenses.length === 1 ? 'entry' : 'entries'}
                            </span>
                          </div>
                          {/* Quick button to add cost for this job */}
                          <button
                            onClick={() => {
                              setExpenseModalInvoice(inv);
                              setJobExpenseDesc(`Expense for ${inv.customerName} (${inv.jobNumber})`);
                              setJobExpenseAmount('');
                              setJobExpenseNotes(`Cost incurred for ${productInfoList[0]?.title || 'Job'}`);
                            }}
                            className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                            title="Add direct expense for this product"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 8. NET PROFIT & LOSS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setPnlDetailInvoice(inv)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border transition ${
                            netProfit > 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : netProfit < 0
                              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                          title="Click to view full P&L breakdown"
                        >
                          {netProfit > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          ) : netProfit < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                          ) : null}
                          <span>
                            {netProfit >= 0 ? `+₹${netProfit}` : `-₹${Math.abs(netProfit)}`}
                          </span>
                          <span className="text-[10px] font-semibold opacity-80">
                            ({profitMargin}%)
                          </span>
                        </button>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPayAmount(inv.balanceDue);
                            }}
                            className="px-2 py-1 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition text-xs"
                            title="Record offline payment"
                          >
                            Collect
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(inv, 'all')}
                          className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition inline-block align-middle"
                          title="Edit Customer, Product & Invoicing Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPrintableInvoice(inv)}
                          className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition inline-block align-middle"
                          title="Print A4 Invoice & P&L Statement"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://wa.me/${inv.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello ${inv.customerName}, here is your invoice ${inv.invoiceNumber} for Job ${inv.jobNumber} (${productInfoList[0]?.title || 'Printing'}) at DG graphics. Total: ₹${inv.grandTotal}, Balance Due: ₹${inv.balanceDue}. You can pay offline at our shop counter.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 transition inline-block align-middle"
                          title="Share on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition inline-block align-middle"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: EDIT CUSTOMER ORDER, PRODUCT & INVOICE DETAILS     */}
      {/* ========================================================= */}
      {editModalInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-fadeIn text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-dp-navy text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {editModalInvoice.invoiceNumber}
                  </span>
                  <span className="font-mono font-bold text-dp-orange bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 text-xs">
                    {editModalInvoice.jobNumber}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-dp-navy flex items-center gap-2 mt-1">
                  <Pencil className="w-4 h-4 text-dp-orange" />
                  <span>Edit Customer Order, Product & Pricing</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Financial & Net P&L Strip */}
            {(() => {
              const currentJobExps = getJobExpenses(editModalInvoice.jobNumber);
              const expTotal = currentJobExps.reduce((s, e) => s + e.amount, 0);
              const curProfit = editGrandTotal - expTotal;
              const curMargin = editGrandTotal > 0 ? Math.round((curProfit / editGrandTotal) * 100) : 0;
              const curDue = Math.max(0, editGrandTotal - editAmountPaid);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed Total</span>
                    <span className="font-black text-sm text-dp-navy">₹{editGrandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Incurred Costs</span>
                    <span className="font-black text-sm text-rose-600">₹{expTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Due</span>
                    <span className={`font-black text-sm ${curDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {curDue > 0 ? `₹${curDue.toLocaleString('en-IN')}` : 'Paid in Full'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Net P&L</span>
                    <span className={`font-black text-sm flex items-center gap-1 ${curProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {curProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{curProfit >= 0 ? `+₹${curProfit}` : `-₹${Math.abs(curProfit)}`}</span>
                      <span className="text-[10px] font-bold text-slate-400">({curMargin}%)</span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEditTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                  editTab === 'all' ? 'bg-white text-dp-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Details
              </button>
              <button
                type="button"
                onClick={() => setEditTab('customer')}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                  editTab === 'customer' ? 'bg-white text-dp-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customer Info
              </button>
              <button
                type="button"
                onClick={() => setEditTab('product')}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                  editTab === 'product' ? 'bg-white text-dp-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Product & Specs
              </button>
              <button
                type="button"
                onClick={() => setEditTab('pricing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                  editTab === 'pricing' ? 'bg-white text-dp-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pricing & Payments
              </button>
              <button
                type="button"
                onClick={() => setEditTab('expenses')}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                  editTab === 'expenses' ? 'bg-white text-dp-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expenses ({getJobExpenses(editModalInvoice.jobNumber).length})
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditInvoice} className="space-y-4">
              {/* SECTION: CUSTOMER INFO */}
              {(editTab === 'all' || editTab === 'customer') && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-dp-navy uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-dp-orange" />
                    <span>Customer Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustName}
                        onChange={(e) => setEditCustName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-semibold bg-white"
                        placeholder="Customer Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustPhone}
                        onChange={(e) => setEditCustPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-semibold bg-white"
                        placeholder="9845012345"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={editInvoiceDate}
                        onChange={(e) => setEditInvoiceDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-semibold bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Delivery / Billing Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={editCustAddress}
                      onChange={(e) => setEditCustAddress(e.target.value)}
                      placeholder="e.g. 100 Feet Rd, Indiranagar, Bengaluru"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-white"
                    />
                  </div>
                </div>
              )}

              {/* SECTION: PRODUCT & SPECIFICATIONS */}
              {(editTab === 'all' || editTab === 'product') && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-dp-navy uppercase tracking-wider">
                    <Boxes className="w-4 h-4 text-dp-orange" />
                    <span>Customer Product & Job Specifications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Product / Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editProductTitle}
                        onChange={(e) => setEditProductTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-semibold bg-white"
                        placeholder="e.g. Custom Printed Bio-Washed Cotton T-Shirt"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editProductQuantity}
                        onChange={(e) => setEditProductQuantity(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-black text-dp-navy bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Dimensions / Size
                      </label>
                      <input
                        type="text"
                        value={editDimensions}
                        onChange={(e) => setEditDimensions(e.target.value)}
                        placeholder="e.g. 5x3 ft, A4, 12x18 inches, XL"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Material Specification
                      </label>
                      <input
                        type="text"
                        value={editMaterial}
                        onChange={(e) => setEditMaterial(e.target.value)}
                        placeholder="e.g. Frontlit Flex, 220 GSM Cotton, Star Flex"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Finishing & Special Instructions
                    </label>
                    <input
                      type="text"
                      value={editSpecialInstructions}
                      onChange={(e) => setEditSpecialInstructions(e.target.value)}
                      placeholder="e.g. Eyelets on 4 corners, matte lamination, round corners"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-white"
                    />
                  </div>
                </div>
              )}

              {/* SECTION: PRICING & PAYMENT */}
              {(editTab === 'all' || editTab === 'pricing') && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-dp-navy uppercase tracking-wider">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Pricing, Revenue & Payment Collection</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const rec = Math.max(0, editSubtotal + editDesignCharges - editDiscount);
                        setEditGrandTotal(rec);
                      }}
                      className="text-[11px] font-bold text-dp-orange hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Calculate Total</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Subtotal (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editSubtotal}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditSubtotal(val);
                          if (autoCalculateTotal) {
                            setEditGrandTotal(Math.max(0, val + editDesignCharges - editDiscount));
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Design Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editDesignCharges}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditDesignCharges(val);
                          if (autoCalculateTotal) {
                            setEditGrandTotal(Math.max(0, editSubtotal + val - editDiscount));
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editDiscount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditDiscount(val);
                          if (autoCalculateTotal) {
                            setEditGrandTotal(Math.max(0, editSubtotal + editDesignCharges - val));
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-bold bg-white text-rose-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-900 mb-1">
                        Grand Billed Total (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editGrandTotal}
                        onChange={(e) => setEditGrandTotal(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-dp-navy rounded-xl focus:outline-none font-black text-sm text-dp-navy bg-white shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                        Amount Paid / Advance (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editAmountPaid}
                        onChange={(e) => setEditAmountPaid(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-emerald-500 rounded-xl focus:outline-none font-black text-sm text-emerald-700 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Remaining Balance Due
                      </label>
                      <div className="px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 font-black text-sm flex items-center justify-between">
                        <span className={editGrandTotal - editAmountPaid > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                          ₹{Math.max(0, editGrandTotal - editAmountPaid).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider bg-white border border-slate-200">
                          {editGrandTotal - editAmountPaid <= 0 ? 'Paid' : editAmountPaid > 0 ? 'Partial' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: JOB EXPENSES & OUTSOURCING */}
              {(editTab === 'all' || editTab === 'expenses') && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-dp-navy uppercase tracking-wider">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                      <span>Expenses Incurred For This Job</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseModalInvoice(editModalInvoice);
                        setJobExpenseDesc(`Cost for ${editModalInvoice.customerName} (${editModalInvoice.jobNumber})`);
                        setJobExpenseAmount('');
                        setJobExpenseNotes(`Expense for ${editProductTitle}`);
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Cost Entry</span>
                    </button>
                  </div>

                  {(() => {
                    const jobExps = getJobExpenses(editModalInvoice.jobNumber);
                    if (jobExps.length === 0) {
                      return (
                        <div className="bg-white p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-center text-[11px]">
                          No direct expenses recorded yet for this job. Use "+ Add Cost Entry" to record outsourcing, materials, or wages.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1.5">
                        {jobExps.map((e) => (
                          <div key={e.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-800 text-[11px]">
                                {e.description}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{e.date}</span>
                                <span>•</span>
                                <span className="text-dp-navy font-semibold">{e.category}</span>
                                {e.notes && (
                                  <>
                                    <span>•</span>
                                    <span className="italic">{e.notes}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-black text-rose-600 text-xs">
                                ₹{e.amount.toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteJobExpense(e.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete expense entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleDeleteInvoice(editModalInvoice)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition text-xs flex items-center justify-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Invoice</span>
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setEditModalInvoice(null)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-dp-navy hover:bg-slate-800 text-white font-extrabold transition text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {isSavingEdit ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save All Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD EXPENSE FOR THIS SPECIFIC CUSTOMER PRODUCT */}
      {/* ========================================================= */}
      {expenseModalInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">
                  Direct Cost Attribution
                </span>
                <h3 className="font-extrabold text-base text-dp-navy flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  <span>Record Expense for {expenseModalInvoice.jobNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setExpenseModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Product Snapshot */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  Client: {expenseModalInvoice.customerName}
                </span>
                <span className="font-mono font-bold text-dp-orange bg-white px-2 py-0.5 rounded border border-slate-200">
                  {expenseModalInvoice.jobNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                Product: <strong>{getProductDisplayInfo(expenseModalInvoice).map(p => p.title).join(', ')}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Customer Billed Amount: <strong>₹{expenseModalInvoice.grandTotal}</strong>
              </div>
            </div>

            <form onSubmit={handleRecordJobExpense} className="space-y-3.5">
              {/* Expense Amount */}
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 space-y-1">
                <label className="block font-black text-rose-900 uppercase text-[11px]">
                  What is the Amount of this Expense? (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-base font-bold text-rose-600">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={jobExpenseAmount}
                    onChange={(e) => setJobExpenseAmount(e.target.value)}
                    placeholder="Enter cost incurred (e.g. 250)"
                    className="w-full pl-8 pr-4 py-2 text-base font-black text-rose-700 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Expense Cause / Category */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  For What Cause was this Expense Incurred? *
                </label>
                <select
                  value={jobExpenseCategory}
                  onChange={(e: any) => setJobExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                >
                  <option value="Material Purchase">📦 Material / Raw Stock (Flex roll, vinyl, blanks, inks)</option>
                  <option value="Vendor Payment">🏢 External Vendor Outsourcing (Screenprint, cutting, stitching)</option>
                  <option value="Labour Charges">👷 Labour & Worker Wages (Operator, helper fee)</option>
                  <option value="Transportation">🚚 Delivery / Transport to Shop</option>
                  <option value="Other Expenses">📌 Other Direct Production Cost</option>
                </select>
              </div>

              {/* Expense Title / Description */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Expense Description / Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobExpenseDesc}
                  onChange={(e) => setJobExpenseDesc(e.target.value)}
                  placeholder="e.g. Paid external vendor Balaji Garments for screenprinting"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Note of Expense */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Write a Note of Expense *
                </label>
                <textarea
                  rows={2}
                  required
                  value={jobExpenseNotes}
                  onChange={(e) => setJobExpenseNotes(e.target.value)}
                  placeholder="Explain why this expense was incurred, vendor bill #, person paid..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-rose-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Payment Method
                </label>
                <select
                  value={jobExpenseMethod}
                  onChange={(e: any) => setJobExpenseMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Cash">Cash (Counter)</option>
                  <option value="Offline UPI">Offline UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpenseModalInvoice(null)}
                  className="px-4 py-2 text-slate-600 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700"
                >
                  Update Expenses & Recalculate P&L
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PROFIT & LOSS BREAKDOWN FOR THIS SPECIFIC CUSTOMER JOB */}
      {/* ========================================================= */}
      {pnlDetailInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Customer Job Financial Audit
                </span>
                <h3 className="font-extrabold text-base text-dp-navy flex items-center gap-2">
                  <span>Profit & Loss: {pnlDetailInvoice.jobNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setPnlDetailInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Product Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{pnlDetailInvoice.customerName}</span>
                <span className="font-mono font-bold text-dp-orange">{pnlDetailInvoice.invoiceNumber}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Ph: {pnlDetailInvoice.customerPhone} &bull; Date: {pnlDetailInvoice.date}
              </div>
              <div className="pt-2 border-t border-slate-200/80 mt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Product Ordered:</span>
                <div className="font-bold text-slate-800 text-xs mt-0.5">
                  {getProductDisplayInfo(pnlDetailInvoice).map(p => `${p.title} (${p.specs})`).join(', ')}
                </div>
              </div>
            </div>

            {/* Calculations Card */}
            {(() => {
              const jobExps = getJobExpenses(pnlDetailInvoice.jobNumber);
              const totalCost = jobExps.reduce((s, e) => s + e.amount, 0);
              const netProfit = pnlDetailInvoice.grandTotal - totalCost;
              const margin = pnlDetailInvoice.grandTotal > 0 ? Math.round((netProfit / pnlDetailInvoice.grandTotal) * 100) : 0;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed Revenue</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        ₹{pnlDetailInvoice.grandTotal}
                      </span>
                    </div>

                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-600 block">Product Costs</span>
                      <span className="text-lg font-black text-rose-700 mt-0.5 block">
                        ₹{totalCost}
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border ${
                      netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${
                        netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        Net Profit ({margin}%)
                      </span>
                      <span className={`text-lg font-black mt-0.5 block ${
                        netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {netProfit >= 0 ? `+₹${netProfit}` : `-₹${Math.abs(netProfit)}`}
                      </span>
                    </div>
                  </div>

                  {/* Attributed Expenses List */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">
                        Recorded Expenses for this Product ({jobExps.length}):
                      </span>
                      <button
                        onClick={() => {
                          setExpenseModalInvoice(pnlDetailInvoice);
                          setPnlDetailInvoice(null);
                        }}
                        className="text-rose-600 font-bold hover:underline text-[11px] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Another Cost</span>
                      </button>
                    </div>

                    {jobExps.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                        No direct expenses recorded yet for this job.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {jobExps.map((e) => (
                          <div key={e.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-900">{e.description}</div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {e.category} &bull; {e.date}
                                {e.notes && <span> &bull; <em>{e.notes}</em></span>}
                              </div>
                            </div>
                            <span className="font-black text-rose-600 text-xs">₹{e.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPnlDetailInvoice(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: RECORD OFFLINE CASH / UPI PAYMENT */}
      {/* ========================================================= */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">
                Record Offline Payment &bull; {paymentModalInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between border border-slate-200">
                <span>Client: <strong>{paymentModalInvoice.customerName}</strong></span>
                <span>Balance Due: <strong className="text-amber-700">₹{paymentModalInvoice.balanceDue}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModalInvoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy bg-white"
                >
                  <option value="Cash">Cash (Counter)</option>
                  <option value="Offline UPI">Offline UPI (GPay / PhonePe / QR)</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref / Notes</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI Ref / Cash Received at Desk"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-dp-navy"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow"
                >
                  Record Payment & Clear Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DIRECT MANUAL INVOICE CREATION */}
      {/* ========================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">Generate Direct Invoice</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Product / Job Description *</label>
                <input
                  type="text"
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. 500 Visiting Cards with Spot UV & Matte Lamination"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Advance Received (₹)</label>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-dp-navy text-white rounded-xl shadow"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: A4 PRINTABLE INVOICE WITH PRODUCT & P&L SUMMARY */}
      {/* ========================================================= */}
      {printableInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-8 space-y-6 shadow-2xl max-h-[95vh] overflow-y-auto text-xs text-dp-charcoal">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200 no-print">
              <span className="font-bold text-xs uppercase text-slate-400">Tax Invoice & Job Cost Audit</span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => window.print()}
                  className="bg-dp-navy text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4 Invoice</span>
                </button>
                <button onClick={() => setPrintableInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Document */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="text-2xl font-black text-dp-navy">DG graphics</div>
                  <div className="text-[11px] text-slate-500">Commercial Printing & Graphic Design Studio</div>
                  <div className="text-[10px] text-slate-400">
                    No. 42, Commercial Print Street, Indiranagar, Bengaluru - 560038
                  </div>
                  <div className="text-[10px] text-slate-400">GSTIN: 29ABCDE1234F1Z5 &bull; Ph: +91 98450 12345</div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">TAX INVOICE</span>
                  <span className="text-xl font-mono font-black text-dp-orange block">{printableInvoice.invoiceNumber}</span>
                  <span className="text-[11px] font-mono text-slate-600 block">Job: {printableInvoice.jobNumber}</span>
                  <span className="text-[10px] text-slate-400">Date: {printableInvoice.date}</span>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Billed To (Client):</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">{printableInvoice.customerName}</div>
                <div className="text-slate-600">Ph: {printableInvoice.customerPhone}</div>
                {printableInvoice.customerAddress && (
                  <div className="text-slate-500 text-[11px] mt-0.5">{printableInvoice.customerAddress}</div>
                )}
              </div>

              {/* Customer's Product Line Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-200 min-w-[500px]">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5 border border-slate-200">Customer's Product & Specifications</th>
                      <th className="p-2.5 border border-slate-200 text-center">Qty</th>
                      <th className="p-2.5 border border-slate-200 text-right">Unit Rate (₹)</th>
                      <th className="p-2.5 border border-slate-200 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printableInvoice.items.map((it, idx) => (
                      <tr key={idx} className="border-t border-slate-200">
                        <td className="p-2.5 border border-slate-200 font-semibold text-slate-900">
                          {it.description}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center font-bold">{it.quantity}</td>
                        <td className="p-2.5 border border-slate-200 text-right">₹{it.unitPrice}</td>
                        <td className="p-2.5 border border-slate-200 text-right font-black">₹{it.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Offline Balance */}
              <div className="flex justify-between items-start gap-4">
                {/* Job Profitability Note */}
                {(() => {
                  const jobExps = getJobExpenses(printableInvoice.jobNumber);
                  const totalCost = jobExps.reduce((s, e) => s + e.amount, 0);
                  const profit = printableInvoice.grandTotal - totalCost;
                  const margin = printableInvoice.grandTotal > 0 ? Math.round((profit / printableInvoice.grandTotal) * 100) : 0;

                  return (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-w-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Job Profitability Calculation:</span>
                      <div className="text-[11px] text-slate-700">
                        Total Incurred Costs: <strong className="text-rose-600">₹{totalCost}</strong>
                      </div>
                      <div className="text-[11px] text-slate-700">
                        Calculated Net Margin: <strong className={profit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {profit >= 0 ? `+₹${profit}` : `-₹${Math.abs(profit)}`} ({margin}%)
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span>₹{printableInvoice.subtotal}</span>
                  </div>
                  {printableInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount:</span>
                      <span>-₹{printableInvoice.discount}</span>
                    </div>
                  )}
                  {printableInvoice.deliveryCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery:</span>
                      <span>₹{printableInvoice.deliveryCharges}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-dp-navy pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span>₹{printableInvoice.grandTotal}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Paid:</span>
                    <span>₹{printableInvoice.amountPaid}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-extrabold text-sm pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span>₹{printableInvoice.balanceDue}</span>
                  </div>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 space-y-1 border border-slate-200">
                <strong>Offline Shop Collection Notice:</strong> Payment is collected at our shop counter via Cash or UPI upon physical verification and collection of the printed goods.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBillingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading invoices...</div>}>
      <AdminBillingContent />
    </Suspense>
  );
}
