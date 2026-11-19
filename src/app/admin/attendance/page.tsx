'use client';

import React, { useState, useEffect } from 'react';
import { Labour, AttendanceRecord, AttendanceStatus, MonthlySalaryPayment } from '@/types';
import {
  UserCheck,
  Calendar,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  SunMedium,
  Check,
  Search,
  Users,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Building2,
  Phone,
  FileText,
  AlertCircle,
  X,
  CreditCard,
  History,
  Wallet,
  ArrowLeft,
  Edit2,
} from 'lucide-react';

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Labour[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'payouts' | 'employees'>('daily');

  // Payout Ledger & History State
  const [allSalaryPayments, setAllSalaryPayments] = useState<MonthlySalaryPayment[]>([]);
  const [selectedLedgerEmpId, setSelectedLedgerEmpId] = useState<string>('all');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
  const [monthlyStatusFilter, setMonthlyStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');

  // Daily Sheet State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [savingDaily, setSavingDaily] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Monthly Sheet State
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [monthlyFilterType, setMonthlyFilterType] = useState<'all' | 'permanent' | 'temporary'>('all');

  // Add & Edit Employee Modal
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Labour | null>(null);
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState('Printer Operator');
  const [empType, setEmpType] = useState<'permanent' | 'temporary'>('permanent');
  const [empRate, setEmpRate] = useState<number>(20000); // 20000/mo for perm, or 700/day for temp
  const [empStartDate, setEmpStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpPhone('');
    setEmpRole('Printer Operator');
    setEmpType('permanent');
    setEmpRate(20000);
    setEmpStartDate(new Date().toISOString().split('T')[0]);
    setAddEmployeeOpen(true);
  };

  const openEditEmployee = (emp: Labour) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpPhone(emp.phone);
    setEmpRole(emp.workType);
    setEmpType(emp.paymentType === 'fixed_salary' ? 'permanent' : 'temporary');
    setEmpRate(emp.defaultRate);
    setEmpStartDate(emp.startDate || new Date().toISOString().split('T')[0]);
    setAddEmployeeOpen(true);
  };

  // Pay Wage / Salary Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingEmployee, setPayingEmployee] = useState<Labour | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutDesc, setPayoutDesc] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'Cash' | 'Offline UPI' | 'Bank Transfer'>('Cash');
  const [processingPayout, setProcessingPayout] = useState(false);

  // Monthly Salary / Wage Payment Status State
  const [salaryPayments, setSalaryPayments] = useState<MonthlySalaryPayment[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, 'Paid' | 'Pending'>>({});
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const [savedPaymentSuccessId, setSavedPaymentSuccessId] = useState<string | null>(null);

  // Local daily attendance state mapped by labourId
  const [dailyStatuses, setDailyStatuses] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});

  const loadData = async () => {
    try {
      const monthStr = `${selectedYear}-${selectedMonth}`;
      const res = await fetch(`/api/attendance?date=${selectedDate}&month=${monthStr}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setAttendances(data.attendances || []);
        setSalaryPayments(data.salaryPayments || []);
        setAllSalaryPayments(data.allSalaryPayments || []);

        // Sync monthly payment statuses
        const newPaymentMap: Record<string, 'Paid' | 'Pending'> = {};
        (data.employees || []).forEach((emp: Labour) => {
          const pRec = (data.salaryPayments || []).find(
            (p: MonthlySalaryPayment) => p.labourId === emp.id && p.month === monthStr
          );
          newPaymentMap[emp.id] = (pRec?.status === 'Paid') ? 'Paid' : 'Pending';
        });
        setPaymentStatuses(newPaymentMap);

        // Sync daily status state for selectedDate
        const newDaily: Record<string, { status: AttendanceStatus; notes: string }> = {};
        (data.employees || []).forEach((emp: Labour) => {
          const rec = (data.attendances || []).find(
            (a: AttendanceRecord) => a.labourId === emp.id && a.date === selectedDate
          );
          if (rec) {
            newDaily[emp.id] = { status: rec.status, notes: rec.workNotes || '' };
          } else {
            // Default to full_day
            newDaily[emp.id] = { status: 'full_day', notes: '' };
          }
        });
        setDailyStatuses(newDaily);
      }
    } catch (e) {
      console.error('Failed to load attendance data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedYear, selectedMonth]);

  // Navigate date
  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Set single attendance status
  const handleSetStatus = (empId: string, status: AttendanceStatus) => {
    setDailyStatuses((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { notes: '' }),
        status,
      },
    }));
  };

  // Set notes
  const handleSetNotes = (empId: string, notes: string) => {
    setDailyStatuses((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { status: 'full_day' }),
        notes,
      },
    }));
  };

  // Mark all Full Day
  const handleMarkAllFullDay = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    employees.forEach((emp) => {
      updated[emp.id] = {
        status: 'full_day',
        notes: dailyStatuses[emp.id]?.notes || '',
      };
    });
    setDailyStatuses(updated);
  };

  // Save all daily attendances
  const handleSaveDailyAttendance = async () => {
    setSavingDaily(true);
    try {
      const recordsToSave: AttendanceRecord[] = employees.map((emp) => {
        const current = dailyStatuses[emp.id] || { status: 'full_day', notes: '' };
        const isPerm = emp.paymentType === 'fixed_salary';
        let dayWage = 0;
        if (!isPerm) {
          if (current.status === 'full_day') dayWage = emp.defaultRate;
          else if (current.status === 'half_day') dayWage = Math.round(emp.defaultRate * 0.5);
        } else {
          // Approx daily value of fixed salary for standard 26 work days
          if (current.status === 'full_day') dayWage = Math.round(emp.defaultRate / 26);
          else if (current.status === 'half_day') dayWage = Math.round((emp.defaultRate / 26) * 0.5);
        }

        return {
          id: `att-${emp.id}-${selectedDate}`,
          labourId: emp.id,
          labourName: emp.name,
          employmentType: isPerm ? 'permanent' : 'temporary',
          date: selectedDate,
          status: current.status,
          workNotes: current.notes,
          wageCalculated: dayWage,
          createdAt: new Date().toISOString(),
        };
      });

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 3000);
        loadData();
      } else {
        alert('Failed to save attendance: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setSavingDaily(false);
    }
  };

  // Add Employee Handler
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empPhone.trim()) {
      alert('Please enter Employee Name and Phone Number');
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_employee',
          id: editingEmployee?.id,
          name: empName.trim(),
          phone: empPhone.trim(),
          workType: empRole,
          paymentType: empType === 'permanent' ? 'fixed_salary' : 'per_job',
          defaultRate: Number(empRate),
          startDate: empStartDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddEmployeeOpen(false);
        setEditingEmployee(null);
        setEmpName('');
        setEmpPhone('');
        loadData();
      } else {
        alert('Failed to save employee: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Save Payment Status Handler (Paid / Pending)
  const handleSavePaymentStatus = async (
    emp: Labour,
    calculatedAmount: number,
    targetMonth?: string,
    targetStatus?: 'Paid' | 'Pending',
    targetMethod?: string
  ) => {
    const monthToSave = targetMonth || `${selectedYear}-${selectedMonth}`;
    const statusToSave = targetStatus || paymentStatuses[emp.id] || 'Pending';
    const saveKey = `${emp.id}-${monthToSave}`;
    setSavingPaymentId(saveKey);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_salary_status',
          labourId: emp.id,
          labourName: emp.name,
          month: monthToSave,
          status: statusToSave,
          amount: calculatedAmount,
          paymentMethod: targetMethod || 'Cash',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedPaymentSuccessId(saveKey);
        setTimeout(() => setSavedPaymentSuccessId(null), 2500);
        loadData();
      } else {
        alert('Failed to save payment status: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error saving payment status: ' + err.message);
    } finally {
      setSavingPaymentId(null);
    }
  };

  // Open Payout Modal
  const openPayoutModal = (emp: Labour, calculatedAmount: number) => {
    setPayingEmployee(emp);
    setPayoutAmount(calculatedAmount);
    setPayoutDesc(
      `${emp.paymentType === 'fixed_salary' ? 'Monthly Salary' : 'Wage Payout'} for ${selectedYear}-${selectedMonth}`
    );
    setPayoutMethod('Cash');
    setPayModalOpen(true);
  };

  // Submit Payout
  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingEmployee || payoutAmount <= 0) return;

    setProcessingPayout(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_wage',
          labourId: payingEmployee.id,
          labourName: payingEmployee.name,
          amount: Number(payoutAmount),
          description: payoutDesc,
          paymentMethod: payoutMethod,
          date: new Date().toISOString().split('T')[0],
          month: `${selectedYear}-${selectedMonth}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayModalOpen(false);
        setPayingEmployee(null);
        alert(`Successfully disbursed ₹${payoutAmount} to ${payingEmployee.name}! Recorded in Expense ledger.`);
        loadData();
      } else {
        alert('Failed to record payout: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error recording payout: ' + err.message);
    } finally {
      setProcessingPayout(false);
    }
  };

  // Helper calculations for Daily Sheet
  const dailyRecordsForSelectedDate = attendances.filter((a) => a.date === selectedDate);
  const fullDayCount = employees.filter(
    (e) => (dailyStatuses[e.id]?.status || 'full_day') === 'full_day'
  ).length;
  const halfDayCount = employees.filter(
    (e) => dailyStatuses[e.id]?.status === 'half_day'
  ).length;
  const absentCount = employees.filter(
    (e) => dailyStatuses[e.id]?.status === 'absent'
  ).length;
  const holidayCount = employees.filter(
    (e) => dailyStatuses[e.id]?.status === 'holiday'
  ).length;

  // Monthly calculations
  const monthPrefix = `${selectedYear}-${selectedMonth}`;
  const monthlyRecords = attendances.filter((a) => a.date.startsWith(monthPrefix));

  const getMonthlyStatsForEmployee = (emp: Labour, customPrefix?: string) => {
    const prefix = customPrefix || monthPrefix;
    const empRecords = attendances.filter((a) => a.labourId === emp.id && a.date.startsWith(prefix));
    const fullDays = empRecords.filter((a) => a.status === 'full_day').length;
    const halfDays = empRecords.filter((a) => a.status === 'half_day').length;
    const absents = empRecords.filter((a) => a.status === 'absent').length;
    const holidays = empRecords.filter((a) => a.status === 'holiday').length;
    const effectiveDays = fullDays + halfDays * 0.5;

    // Check employee start date relative to the target month
    const [targetYear, targetMonthNum] = prefix.split('-').map(Number);
    const startDate = emp.startDate || '2026-01-01';
    const [startYear, startMonthNum, startDayNum] = startDate.split('-').map(Number);

    let notJoinedYet = false;
    let joinedThisMonth = false;
    let payable = 0;

    // 1. If target month is prior to employee start date
    if (targetYear < startYear || (targetYear === startYear && targetMonthNum < startMonthNum)) {
      notJoinedYet = true;
      payable = 0;
      return { fullDays: 0, halfDays: 0, absents: 0, holidays: 0, effectiveDays: 0, payable: 0, notJoinedYet, joinedThisMonth, startDate: emp.startDate };
    }

    // 2. If target month is the joining month
    if (targetYear === startYear && targetMonthNum === startMonthNum) {
      joinedThisMonth = true;
      const daysInMonth = new Date(targetYear, targetMonthNum, 0).getDate();
      const daysEmployed = Math.max(1, daysInMonth - startDayNum + 1);

      if (emp.paymentType === 'fixed_salary') {
        const dailyRateCalc = emp.defaultRate / 26;
        if (empRecords.length === 0) {
          // Prorate by days active in start month
          payable = Math.round(emp.defaultRate * (daysEmployed / daysInMonth));
        } else {
          const maxProrated = Math.round(emp.defaultRate * (daysEmployed / daysInMonth));
          payable = Math.round(Math.min(maxProrated, effectiveDays * dailyRateCalc));
        }
      } else {
        payable = Math.round(fullDays * emp.defaultRate + halfDays * emp.defaultRate * 0.5);
      }

      return { fullDays, halfDays, absents, holidays, effectiveDays, payable, notJoinedYet, joinedThisMonth, startDate: emp.startDate };
    }

    // 3. Normal active month
    if (emp.paymentType === 'fixed_salary') {
      const workingDaysInMonth = 26;
      if (empRecords.length === 0) {
        payable = emp.defaultRate; // Default to full month salary if not marked yet
      } else {
        const dailyRateCalc = emp.defaultRate / workingDaysInMonth;
        payable = Math.round(Math.min(emp.defaultRate, effectiveDays * dailyRateCalc));
      }
    } else {
      payable = Math.round(fullDays * emp.defaultRate + halfDays * emp.defaultRate * 0.5);
    }

    return { fullDays, halfDays, absents, holidays, effectiveDays, payable, notJoinedYet, joinedThisMonth, startDate: emp.startDate };
  };

  // Month-wide aggregated payroll & payout metrics
  const monthlyCalculatedList = employees.map((emp) => {
    const stats = getMonthlyStatsForEmployee(emp);
    const status = paymentStatuses[emp.id] || 'Pending';
    return { emp, stats, status };
  });

  const totalPayroll = monthlyCalculatedList.reduce((acc, curr) => acc + curr.stats.payable, 0);
  const totalPaid = monthlyCalculatedList
    .filter((i) => i.status === 'Paid')
    .reduce((acc, curr) => acc + curr.stats.payable, 0);
  const totalPending = totalPayroll - totalPaid;
  const countPaid = monthlyCalculatedList.filter((i) => i.status === 'Paid').length;
  const countPending = monthlyCalculatedList.length - countPaid;

  const getMonthsListForYear = (year: string) => [
    { id: `${year}-12`, name: `December ${year}` },
    { id: `${year}-11`, name: `November ${year}` },
    { id: `${year}-10`, name: `October ${year}` },
    { id: `${year}-09`, name: `September ${year}` },
    { id: `${year}-08`, name: `August ${year}` },
    { id: `${year}-07`, name: `July ${year}` },
    { id: `${year}-06`, name: `June ${year}` },
    { id: `${year}-05`, name: `May ${year}` },
    { id: `${year}-04`, name: `April ${year}` },
    { id: `${year}-03`, name: `March ${year}` },
    { id: `${year}-02`, name: `February ${year}` },
    { id: `${year}-01`, name: `January ${year}` },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'daily'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'monthly'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Monthly Wage Calculation</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'payouts'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Monthly Payouts (Paid / Pending)</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'employees'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory ({employees.length})</span>
          </button>
        </div>

        <button
          onClick={openAddEmployee}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Date Control Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-xs text-slate-800">
                <Calendar className="w-4 h-4 text-dp-orange" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-mono text-xs focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs font-medium text-slate-700 hover:text-blue-600 px-2 py-1 transition"
              >
                Today
              </button>
            </div>

            {/* Quick Roll Call / Save */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleMarkAllFullDay}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Mark All Full Day
              </button>

              <button
                type="button"
                disabled={savingDaily}
                onClick={handleSaveDailyAttendance}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs flex items-center gap-1.5 transition"
              >
                {savingDaily ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Daily Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Attendance for {selectedDate} has been saved successfully!</span>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">🟢 Full Day</span>
                <span className="text-xl font-black text-emerald-700">{fullDayCount} Staff</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                1.0
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">🟡 Half Day</span>
                <span className="text-xl font-black text-amber-700">{halfDayCount} Staff</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                0.5
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">🔴 Absent</span>
                <span className="text-xl font-black text-rose-700">{absentCount} Staff</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                0.0
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">⚪ Holiday / Off</span>
                <span className="text-xl font-black text-slate-700">{holidayCount} Staff</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                OFF
              </div>
            </div>
          </div>

          {/* Daily Table (One Row per Employee) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Employee & Role</th>
                    <th className="py-3.5 px-4">Category & Pay Rate</th>
                    <th className="py-3.5 px-4">Attendance Status</th>
                    <th className="py-3.5 px-4">Daily Work Notes</th>
                    <th className="py-3.5 px-4 text-right">Daily Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const current = dailyStatuses[emp.id] || { status: 'full_day', notes: '' };
                    const isPerm = emp.paymentType === 'fixed_salary';
                    let dayEarned = 0;
                    if (!isPerm) {
                      if (current.status === 'full_day') dayEarned = emp.defaultRate;
                      else if (current.status === 'half_day') dayEarned = Math.round(emp.defaultRate * 0.5);
                    } else {
                      if (current.status === 'full_day') dayEarned = Math.round(emp.defaultRate / 26);
                      else if (current.status === 'half_day') dayEarned = Math.round((emp.defaultRate / 26) * 0.5);
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                        {/* Employee Name & Role */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{emp.workType}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        </td>

                        {/* Employment Category & Pay */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPerm ? (
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Permanent (Fixed Salary)
                              </span>
                              <div className="font-extrabold text-slate-900 text-xs mt-1">
                                ₹{emp.defaultRate.toLocaleString('en-IN')}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">/ month</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Temporary (According to Work)
                              </span>
                              <div className="font-extrabold text-slate-900 text-xs mt-1">
                                ₹{emp.defaultRate.toLocaleString('en-IN')}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Attendance Status Buttons */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 gap-1 border border-slate-200">
                            {/* Full Day */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(emp.id, 'full_day')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                current.status === 'full_day'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>Full Day</span>
                            </button>

                            {/* Half Day */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(emp.id, 'half_day')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                current.status === 'half_day'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>Half Day</span>
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(emp.id, 'absent')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                current.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>Absent</span>
                            </button>

                            {/* Holiday */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(emp.id, 'holiday')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                current.status === 'holiday'
                                  ? 'bg-slate-700 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>Holiday</span>
                            </button>
                          </div>
                        </td>

                        {/* Work Notes */}
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={current.notes}
                            onChange={(e) => handleSetNotes(emp.id, e.target.value)}
                            placeholder="Optional work notes / overtime..."
                            className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white focus:border-dp-navy focus:outline-none"
                          />
                        </td>

                        {/* Daily Earned */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isPerm ? (
                            <div>
                              <span className="font-bold text-slate-800">
                                ₹{dayEarned}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                (Prorated)
                              </span>
                            </div>
                          ) : (
                            <div className="font-extrabold text-slate-900">
                              ₹{dayEarned}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONTHLY WAGE & SALARY CALCULATION */}
      {/* ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Top Monthly Metrics: Total, Paid, Pending */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Month Payroll</span>
                <span className="text-xl font-black text-slate-900">₹{totalPayroll.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{employees.length} Staff Total</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">✓ Total Paid</span>
                <span className="text-xl font-black text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">{countPaid} Staff Disbursed</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 block">⏳ Total Pending</span>
                <span className="text-xl font-black text-amber-700">₹{totalPending.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">{countPending} Staff Due</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Month & Filter Controls */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none"
              >
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none"
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            {/* Filter by Type & Status */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMonthlyFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyFilterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All Staff
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyFilterType('permanent')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyFilterType === 'permanent' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Permanent (Fixed)
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyFilterType('temporary')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyFilterType === 'temporary' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Temporary (Work)
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMonthlyStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyStatusFilter('Paid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyStatusFilter === 'Paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
                  }`}
                >
                  ✓ Paid ({countPaid})
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyStatusFilter('Pending')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyStatusFilter === 'Pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700'
                  }`}
                >
                  ⏳ Pending ({countPending})
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Table (One Row per Employee) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Base Rate / Salary</th>
                    <th className="py-3.5 px-4 text-center">Full Days</th>
                    <th className="py-3.5 px-4 text-center">Half Days</th>
                    <th className="py-3.5 px-4 text-center">Absent</th>
                    <th className="py-3.5 px-4 text-center">Payable Days</th>
                    <th className="py-3.5 px-4 text-right">Calculated Payable</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees
                    .filter((emp) => {
                      if (monthlyFilterType === 'permanent') return emp.paymentType === 'fixed_salary';
                      if (monthlyFilterType === 'temporary') return emp.paymentType !== 'fixed_salary';
                      return true;
                    })
                    .filter((emp) => {
                      const st = paymentStatuses[emp.id] || 'Pending';
                      if (monthlyStatusFilter === 'Paid') return st === 'Paid';
                      if (monthlyStatusFilter === 'Pending') return st !== 'Paid';
                      return true;
                    })
                    .map((emp) => {
                      const stats = getMonthlyStatsForEmployee(emp);
                      const isPerm = emp.paymentType === 'fixed_salary';
                      const currentStatus = paymentStatuses[emp.id] || 'Pending';
                      const saveKey = `${emp.id}-${selectedYear}-${selectedMonth}`;

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                          {/* Name & Role */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                              <button
                                type="button"
                                onClick={() => openEditEmployee(emp)}
                                className="text-slate-400 hover:text-blue-600 transition p-0.5"
                                title="Edit employee & start date"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">{emp.workType}</div>
                            {emp.startDate && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                Starts: <span className="font-semibold text-slate-700">{emp.startDate}</span>
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPerm
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isPerm ? 'Permanent (Fixed)' : 'Temporary (Work)'}
                            </span>
                          </td>

                          {/* Base Rate */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              ₹{emp.defaultRate.toLocaleString('en-IN')}{' '}
                              <span className="text-[10px] font-normal text-slate-400">
                                {isPerm ? '/ month' : '/ day'}
                              </span>
                            </div>
                          </td>

                          {/* Full Days */}
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                            {stats.fullDays}
                          </td>

                          {/* Half Days */}
                          <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                            {stats.halfDays}
                          </td>

                          {/* Absent */}
                          <td className="py-3.5 px-4 text-center font-bold text-rose-700">
                            {stats.absents}
                          </td>

                          {/* Effective Days */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 bg-slate-50/60">
                            {stats.effectiveDays}
                          </td>

                          {/* Calculated Payable */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-sm text-slate-900">
                            ₹{stats.payable.toLocaleString('en-IN')}
                            {stats.notJoinedYet && (
                              <div className="text-[10px] font-semibold text-slate-400">
                                Not Employed Yet
                              </div>
                            )}
                            {stats.joinedThisMonth && (
                              <div className="text-[10px] font-semibold text-amber-600">
                                Pro-rated from start date
                              </div>
                            )}
                          </td>

                          {/* Action: Paid / Pending Dropdown & Save Button */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {stats.notJoinedYet ? (
                              <div className="flex items-center justify-end">
                                <span className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-slate-100 text-slate-400 border border-slate-200">
                                  Starts {emp.startDate || 'later'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => {
                                    const newStatus = e.target.value as 'Paid' | 'Pending';
                                    setPaymentStatuses((prev) => ({
                                      ...prev,
                                      [emp.id]: newStatus,
                                    }));
                                  }}
                                  className={`px-2.5 py-1 text-xs font-medium border rounded-md transition focus:outline-none cursor-pointer ${
                                    currentStatus === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <option value="Paid">✓ Paid</option>
                                  <option value="Pending">⏳ Pending</option>
                                </select>

                                <button
                                  type="button"
                                  disabled={savingPaymentId === saveKey}
                                  onClick={() => handleSavePaymentStatus(emp, stats.payable)}
                                  className={`px-3 py-1 rounded-md font-medium text-xs shadow-xs transition flex items-center gap-1 ${
                                    savedPaymentSuccessId === saveKey
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  {savingPaymentId === saveKey ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : savedPaymentSuccessId === saveKey ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Saved</span>
                                    </>
                                  ) : (
                                    <span>Save</span>
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMPLOYEE MONTHLY PAYMENTS (PAID / PENDING) */}
      {/* ========================================================================= */}
      {activeTab === 'payouts' && (
        <div className="space-y-5">
          {/* Top Controls & Navigation Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-dp-orange" />
                Month:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none"
              >
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none"
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              <span className="text-slate-300 mx-1">|</span>

              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-dp-navy" />
                Staff View:
              </span>
              <select
                value={selectedLedgerEmpId}
                onChange={(e) => setSelectedLedgerEmpId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-dp-navy focus:outline-none"
              >
                <option value="all">👥 All Staff Overview</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.workType} ({e.paymentType === 'fixed_salary' ? 'Fixed Salary' : 'Daily Rate'})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status: All / Paid / Pending */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPayoutStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  payoutStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setPayoutStatusFilter('Paid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  payoutStatusFilter === 'Paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-white/50'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Paid ({countPaid})</span>
              </button>
              <button
                type="button"
                onClick={() => setPayoutStatusFilter('Pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  payoutStatusFilter === 'Pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-white/50'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                <span>Pending ({countPending})</span>
              </button>
            </div>
          </div>

          {/* Top Monthly KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Monthly Payroll
                </span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{totalPayroll.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                  For {selectedMonth}/{selectedYear} across {employees.length} staff
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Wallet className="w-6 h-6 text-slate-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                  ✓ Amount Disbursed (Paid)
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {countPaid} / {employees.length} Paid
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({employees.length > 0 ? Math.round((countPaid / employees.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
                  ⏳ Amount Outstanding (Pending)
                </span>
                <span className="text-2xl font-black text-amber-700">
                  ₹{totalPending.toLocaleString('en-IN')}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                    {countPending} Pending Payout
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: ALL EMPLOYEES MONTHLY STATUS TABLE */}
          {selectedLedgerEmpId === 'all' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>Monthly Employee Payout Register</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {selectedMonth}/{selectedYear}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Track which employees have been paid or are pending for this month. Toggle dropdown and save to sync expenses.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Category & Pay Mode</th>
                      <th className="py-3.5 px-4 text-center">Effective Days</th>
                      <th className="py-3.5 px-4 text-right">Calculated Salary</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Disbursement Details</th>
                      <th className="py-3.5 px-4 text-right">Action & Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees
                      .filter((emp) => {
                        const st = paymentStatuses[emp.id] || 'Pending';
                        if (payoutStatusFilter === 'Paid') return st === 'Paid';
                        if (payoutStatusFilter === 'Pending') return st !== 'Paid';
                        return true;
                      })
                      .map((emp) => {
                        const stats = getMonthlyStatsForEmployee(emp);
                        const isPerm = emp.paymentType === 'fixed_salary';
                        const currentStatus = paymentStatuses[emp.id] || 'Pending';
                        const paymentRecord = salaryPayments.find((p) => p.labourId === emp.id);
                        const saveKey = `${emp.id}-${selectedYear}-${selectedMonth}`;

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                  {emp.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 text-xs">{emp.name}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold">{emp.workType}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{emp.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPerm
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isPerm ? 'Permanent (Fixed Salary)' : 'Temporary (Daily Wage)'}
                              </span>
                              <div className="font-bold text-slate-700 text-xs mt-1">
                                ₹{emp.defaultRate.toLocaleString('en-IN')}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {isPerm ? '/ month' : '/ day'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono font-bold text-slate-900">
                              {stats.effectiveDays} Days
                              <div className="text-[10px] text-slate-400 font-normal">
                                {stats.fullDays}F / {stats.halfDays}H / {stats.absents}A
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-sm text-slate-900">
                              ₹{stats.payable.toLocaleString('en-IN')}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <select
                                value={currentStatus}
                                onChange={(e) => {
                                  const newStatus = e.target.value as 'Paid' | 'Pending';
                                  setPaymentStatuses((prev) => ({
                                    ...prev,
                                    [emp.id]: newStatus,
                                  }));
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition focus:outline-none cursor-pointer ${
                                  currentStatus === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="Paid">✓ Paid</option>
                                <option value="Pending">⏳ Pending</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap text-xs">
                              {currentStatus === 'Paid' ? (
                                <div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Disbursed ({paymentRecord?.paymentMethod || 'Cash'})
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {paymentRecord?.paidAt
                                      ? new Date(paymentRecord.paidAt).toLocaleDateString()
                                      : 'Recorded'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-amber-600 font-semibold italic">
                                  Payment Awaiting
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={savingPaymentId === saveKey}
                                  onClick={() => handleSavePaymentStatus(emp, stats.payable)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1 ${
                                    savedPaymentSuccessId === saveKey
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                                  }`}
                                >
                                  {savingPaymentId === saveKey ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : savedPaymentSuccessId === saveKey ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Saved</span>
                                    </>
                                  ) : (
                                    <span>Save</span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedLedgerEmpId(emp.id)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-dp-navy hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1"
                                  title="View Full Monthly Payment History"
                                >
                                  <History className="w-3.5 h-3.5 text-slate-500" />
                                  <span>History</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: INDIVIDUAL EMPLOYEE MONTHLY PAYMENT DOSSIER & HISTORY */
            <div className="space-y-4">
              {(() => {
                const emp = employees.find((e) => e.id === selectedLedgerEmpId);
                if (!emp) return null;
                const isPerm = emp.paymentType === 'fixed_salary';
                const monthsList = getMonthsListForYear(selectedYear);

                let lifetimeEarnings = 0;
                let lifetimePaid = 0;

                monthsList.forEach((m) => {
                  const pRec = allSalaryPayments.find(
                    (p) => p.labourId === emp.id && p.month === m.id
                  );
                  const isCurrent = m.id === `${selectedYear}-${selectedMonth}`;
                  const calAmount = getMonthlyStatsForEmployee(emp, m.id).payable;

                  const payAmt = pRec ? pRec.amount : calAmount;
                  lifetimeEarnings += payAmt;
                  if (pRec?.status === 'Paid' || (isCurrent && paymentStatuses[emp.id] === 'Paid')) {
                    lifetimePaid += payAmt;
                  }
                });

                const lifetimePending = Math.max(0, lifetimeEarnings - lifetimePaid);

                return (
                  <div className="space-y-4">
                    {/* Profile Banner */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerEmpId('all')}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                            title="Back to All Staff Register"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>

                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dp-navy to-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-black text-slate-900">{emp.name}</h2>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPerm
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isPerm ? 'Permanent (Fixed Salary)' : 'Temporary (Daily Wage)'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-3">
                              <span>Role: {emp.workType}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {emp.phone}
                              </span>
                              <span>•</span>
                              <span>
                                Base: ₹{emp.defaultRate.toLocaleString('en-IN')}{' '}
                                {isPerm ? '/ month' : '/ day'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lifetime KPI Summary */}
                        <div className="flex items-center gap-3">
                          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Total Calculated
                            </span>
                            <span className="text-base font-black text-slate-900">
                              ₹{lifetimeEarnings.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                              ✓ Total Paid
                            </span>
                            <span className="text-base font-black text-emerald-700">
                              ₹{lifetimePaid.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-right">
                            <span className="text-[10px] uppercase font-bold text-amber-600 block">
                              ⏳ Total Pending
                            </span>
                            <span className="text-base font-black text-amber-700">
                              ₹{lifetimePending.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Month-by-Month Breakdown Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <History className="w-4 h-4 text-dp-orange" />
                            <span>Monthly Payment History for {emp.name} ({selectedYear})</span>
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Month-by-month record of salary/wages, paid status, and pending balance.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedLedgerEmpId('all')}
                          className="text-xs font-bold text-dp-orange hover:underline flex items-center gap-1"
                        >
                          View All Staff Register →
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[850px]">
                          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-3.5 px-4">Month</th>
                              <th className="py-3.5 px-4 text-center">Days Worked</th>
                              <th className="py-3.5 px-4 text-right">Calculated Salary</th>
                              <th className="py-3.5 px-4 text-center">Payment Status</th>
                              <th className="py-3.5 px-4 text-center">Disbursement Mode / Date</th>
                              <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {monthsList.map((m) => {
                              const pRec = allSalaryPayments.find(
                                (p) => p.labourId === emp.id && p.month === m.id
                              );
                              const isCurrent = m.id === `${selectedYear}-${selectedMonth}`;
                              const mStats = getMonthlyStatsForEmployee(emp, m.id);
                              const calAmount = pRec
                                ? pRec.amount
                                : mStats.payable;

                              const isPaid = pRec
                                ? pRec.status === 'Paid'
                                : isCurrent
                                ? paymentStatuses[emp.id] === 'Paid'
                                : false;

                              const currentStatus = isPaid ? 'Paid' : 'Pending';
                              const saveMonthKey = `${emp.id}-${m.id}`;

                              return (
                                <tr
                                  key={m.id}
                                  className={`hover:bg-slate-50/80 transition ${
                                    isCurrent ? 'bg-orange-50/30 font-semibold' : ''
                                  }`}
                                >
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                      <span>{m.name}</span>
                                      {isCurrent && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-dp-orange text-white">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">{m.id}</div>
                                  </td>

                                  <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-slate-700">
                                    {mStats.effectiveDays > 0 ? (
                                      <span>{mStats.effectiveDays} Days ({mStats.fullDays}F/{mStats.halfDays}H)</span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>

                                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-sm text-slate-900">
                                    ₹{calAmount.toLocaleString('en-IN')}
                                  </td>

                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <select
                                      value={currentStatus}
                                      onChange={(e) => {
                                        const newSt = e.target.value as 'Paid' | 'Pending';
                                        if (isCurrent) {
                                          setPaymentStatuses((prev) => ({
                                            ...prev,
                                            [emp.id]: newSt,
                                          }));
                                        }
                                        handleSavePaymentStatus(emp, calAmount, m.id, newSt);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition focus:outline-none cursor-pointer ${
                                        isPaid
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : 'bg-amber-50 text-amber-800 border-amber-300'
                                      }`}
                                    >
                                      <option value="Paid">✓ Paid</option>
                                      <option value="Pending">⏳ Pending</option>
                                    </select>
                                  </td>

                                  <td className="py-3.5 px-4 text-center whitespace-nowrap text-xs">
                                    {isPaid ? (
                                      <div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                          {pRec?.paymentMethod || 'Cash'}
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                          {pRec?.paidAt
                                            ? new Date(pRec.paidAt).toLocaleDateString()
                                            : 'Recorded'}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-amber-600 font-semibold italic">
                                        Pending Payout
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      disabled={savingPaymentId === saveMonthKey}
                                      onClick={() =>
                                        handleSavePaymentStatus(
                                          emp,
                                          calAmount,
                                          m.id,
                                          currentStatus === 'Paid' ? 'Pending' : 'Paid'
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition ${
                                        isPaid
                                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      }`}
                                    >
                                      {savingPaymentId === saveMonthKey ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : isPaid ? (
                                        <span>Mark Pending</span>
                                      ) : (
                                        <span>Mark as Paid</span>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STAFF DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 uppercase">
              Registered Studio Workforce ({employees.length})
            </span>
            <button
              onClick={openAddEmployee}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Staff Name</th>
                  <th className="py-3.5 px-4">Designation / Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Joining / Start Date</th>
                  <th className="py-3.5 px-4">Employment Classification</th>
                  <th className="py-3.5 px-4 text-right">Base Salary / Rate</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const isPerm = emp.paymentType === 'fixed_salary';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {emp.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.workType}</td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.phone}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {emp.startDate ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {emp.startDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            isPerm
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isPerm ? 'Permanent (Fixed Salary)' : 'Temporary (Work Based)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{emp.defaultRate.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          {isPerm ? '/ month' : '/ day'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditEmployee(emp)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW EMPLOYEE */}
      {/* ========================================================================= */}
      {addEmployeeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">
                {editingEmployee ? 'Edit Studio Employee & Start Date' : 'Add Studio Employee'}
              </h3>
              <button
                onClick={() => {
                  setAddEmployeeOpen(false);
                  setEditingEmployee(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Employee Start / Joining Date *
                </label>
                <input
                  type="date"
                  required
                  value={empStartDate}
                  onChange={(e) => setEmpStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Salaries and payroll will start calculating from this joining date onwards.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Phone / Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="e.g. 9845012345"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Designation / Role
                </label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Senior Graphic Designer">Senior Graphic Designer</option>
                  <option value="Flex & Large Format Operator">Flex & Large Format Operator</option>
                  <option value="Screenprint & DTF Specialist">Screenprint & DTF Specialist</option>
                  <option value="Fabricator & On-Site Installer">Fabricator & On-Site Installer</option>
                  <option value="Helper & Post-Press Finishing">Helper & Post-Press Finishing</option>
                  <option value="Counter Billing & Front Desk">Counter Billing & Front Desk</option>
                </select>
              </div>

              {/* Employment Classification (Permanent vs Temporary) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">
                  Employment Classification *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmpType('permanent');
                      setEmpRate(20000);
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left ${
                      empType === 'permanent'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>Permanent</div>
                    <div className="text-[10px] font-normal opacity-80">Fixed Monthly Salary</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmpType('temporary');
                      setEmpRate(700);
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left ${
                      empType === 'temporary'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>Temporary</div>
                    <div className="text-[10px] font-normal opacity-80">According to Works / Daily</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  {empType === 'permanent' ? 'Fixed Monthly Salary (₹) *' : 'Daily / Work Rate (₹) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={empRate}
                  onChange={(e) => setEmpRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAddEmployeeOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-3.5 py-1.5 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-xs hover:bg-blue-700 transition"
                >
                  {editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY WAGES & DISBURSE SALARY */}
      {/* ========================================================================= */}
      {payModalOpen && payingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Disburse Wages</span>
                <h3 className="font-extrabold text-base text-dp-navy">{payingEmployee.name}</h3>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="space-y-3.5">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Attendance Calculated Payout
                </span>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  ₹{payoutAmount.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {payingEmployee.paymentType === 'fixed_salary'
                    ? 'Permanent (Fixed Monthly Salary with Attendance Deductions)'
                    : 'Temporary (Daily / Per-Work Rate Calculation)'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Payment Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e: any) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Cash">Cash (Shop Register)</option>
                  <option value="Offline UPI">Offline UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Payout Description / Notes
                </label>
                <input
                  type="text"
                  value={payoutDesc}
                  onChange={(e) => setPayoutDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                ℹ️ Confirming this will automatically log this wage payment under <strong className="text-slate-800">Labour Charges</strong> in the Studio Expense Ledger.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayout}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  {processingPayout ? 'Recording...' : 'Confirm & Disburse Wage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
