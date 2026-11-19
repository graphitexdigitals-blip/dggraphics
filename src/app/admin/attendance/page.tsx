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
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'calendar' | 'payouts' | 'employees'>('daily');

  // Calendar View State
  const [calendarEmpId, setCalendarEmpId] = useState<string>('');

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
  const [customPayableAmounts, setCustomPayableAmounts] = useState<Record<string, number>>({});
  const [editingAmountEmpKey, setEditingAmountEmpKey] = useState<string | null>(null);
  const [tempAmountInput, setTempAmountInput] = useState<string>('');
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
        const emps = data.employees || [];
        setEmployees(emps);
        if (emps.length > 0) {
          setCalendarEmpId((prev) => prev || emps[0].id);
        }
        setAttendances(data.attendances || []);
        setSalaryPayments(data.salaryPayments || []);
        setAllSalaryPayments(data.allSalaryPayments || []);

        // Sync monthly payment statuses & saved custom amounts
        const newPaymentMap: Record<string, 'Paid' | 'Pending'> = {};
        const savedAmountsMap: Record<string, number> = {};
        (data.employees || []).forEach((emp: Labour) => {
          const pRec = (data.salaryPayments || []).find(
            (p: MonthlySalaryPayment) => p.labourId === emp.id && p.month === monthStr
          );
          newPaymentMap[emp.id] = (pRec?.status === 'Paid') ? 'Paid' : 'Pending';
          if (pRec && typeof pRec.amount === 'number' && pRec.amount > 0) {
            savedAmountsMap[`${emp.id}-${monthStr}`] = pRec.amount;
          }
        });
        setPaymentStatuses(newPaymentMap);
        setCustomPayableAmounts((prev) => ({ ...savedAmountsMap, ...prev }));

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

  // Mark all Full Day (only for employees employed on selectedDate)
  const handleMarkAllFullDay = () => {
    const active = employees.filter((e) => !e.startDate || e.startDate <= selectedDate);
    if (active.length === 0) {
      alert(`Error: Cannot mark attendance for ${selectedDate}. Employee(s) have not joined on or before this date.`);
      return;
    }
    const updated = { ...dailyStatuses };
    active.forEach((emp) => {
      updated[emp.id] = {
        status: 'full_day',
        notes: dailyStatuses[emp.id]?.notes || '',
      };
    });
    setDailyStatuses(updated);
  };

  // Save all daily attendances
  const handleSaveDailyAttendance = async () => {
    const active = employees.filter((e) => !e.startDate || e.startDate <= selectedDate);
    if (active.length === 0) {
      alert(`Error: Selected date (${selectedDate}) is before employee joining date. Cannot mark or save attendance prior to joining.`);
      return;
    }
    setSavingDaily(true);
    try {
      const recordsToSave: AttendanceRecord[] = active.map((emp) => {
        const current = dailyStatuses[emp.id] || { status: 'full_day', notes: '' };
        const isPerm = emp.paymentType === 'fixed_salary';
        let dayWage = 0;
        if (!isPerm) {
          if (current.status === 'full_day') dayWage = emp.defaultRate;
          else if (current.status === 'half_day') dayWage = Math.round(emp.defaultRate * 0.5);
        } else {
          // Daily value of fixed salary for days in selected month
          const selDateObj = new Date(selectedDate);
          const daysInSelMonth = new Date(selDateObj.getFullYear(), selDateObj.getMonth() + 1, 0).getDate();
          if (current.status === 'full_day') dayWage = Math.round(emp.defaultRate / daysInSelMonth);
          else if (current.status === 'half_day') dayWage = Math.round((emp.defaultRate / daysInSelMonth) * 0.5);
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

  // Quick Mark from Monthly Calendar
  const handleCalendarMarkDay = async (
    emp: Labour,
    dateStr: string,
    newStatus: AttendanceStatus
  ) => {
    if (emp.startDate && dateStr < emp.startDate) {
      alert(`Error: Cannot mark attendance for ${dateStr}. Employee joined on ${emp.startDate}.`);
      return;
    }

    const isPerm = emp.paymentType === 'fixed_salary';
    let dayWage = 0;
    if (!isPerm) {
      if (newStatus === 'full_day') dayWage = emp.defaultRate;
      else if (newStatus === 'half_day') dayWage = Math.round(emp.defaultRate * 0.5);
    } else {
      const dateObj = new Date(dateStr);
      const daysInDateMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
      if (newStatus === 'full_day') dayWage = Math.round(emp.defaultRate / daysInDateMonth);
      else if (newStatus === 'half_day') dayWage = Math.round((emp.defaultRate / daysInDateMonth) * 0.5);
    }

    const recordToSave: AttendanceRecord = {
      id: `att-${emp.id}-${dateStr}`,
      labourId: emp.id,
      labourName: emp.name,
      employmentType: isPerm ? 'permanent' : 'temporary',
      date: dateStr,
      status: newStatus,
      workNotes: '',
      wageCalculated: dayWage,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [recordToSave] }),
      });
      const data = await res.json();
      if (data.success) {
        setAttendances((prev) => {
          const filtered = prev.filter((a) => !(a.labourId === emp.id && a.date === dateStr));
          return [...filtered, recordToSave];
        });
        loadData();
      } else {
        alert('Failed to update attendance: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error updating attendance: ' + err.message);
    }
  };

  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth) - 1;
    let y = parseInt(selectedYear);
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth) + 1;
    let y = parseInt(selectedYear);
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
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

  // Start inline editing of an amount
  const startEditingAmount = (key: string, currentVal: number) => {
    setEditingAmountEmpKey(key);
    setTempAmountInput(String(currentVal));
  };

  // Cancel inline editing
  const cancelInlineAmount = () => {
    setEditingAmountEmpKey(null);
    setTempAmountInput('');
  };

  // Save inline edited amount (persists immediately to DB via save_salary_status)
  const saveInlineAmount = async (emp: Labour, key: string) => {
    const parsed = parseFloat(tempAmountInput);
    const newAmount = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setCustomPayableAmounts((prev) => ({
      ...prev,
      [key]: newAmount,
    }));
    setEditingAmountEmpKey(null);
    await handleSavePaymentStatus(emp, newAmount);
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

  // Helper to check if an employee was employed on a given date (YYYY-MM-DD)
  const isEmployedOnDate = (emp: Labour, dateStr: string) => {
    if (!emp.startDate) return true;
    return emp.startDate <= dateStr;
  };

  // Helper calculations for Daily Sheet
  const dailyRecordsForSelectedDate = attendances.filter((a) => a.date === selectedDate);
  const activeEmployeesOnDate = employees.filter((e) => isEmployedOnDate(e, selectedDate));
  const unjoinedEmployeesOnDate = employees.filter((e) => !isEmployedOnDate(e, selectedDate));
  const isSelectedDateBeforeAnyJoining = unjoinedEmployeesOnDate.length > 0;

  const fullDayCount = activeEmployeesOnDate.filter(
    (e) => (dailyStatuses[e.id]?.status || 'full_day') === 'full_day'
  ).length;
  const halfDayCount = activeEmployeesOnDate.filter(
    (e) => dailyStatuses[e.id]?.status === 'half_day'
  ).length;
  const absentCount = activeEmployeesOnDate.filter(
    (e) => dailyStatuses[e.id]?.status === 'absent'
  ).length;
  const holidayCount = activeEmployeesOnDate.filter(
    (e) => dailyStatuses[e.id]?.status === 'holiday'
  ).length;

  // Monthly calculations
  const monthPrefix = `${selectedYear}-${selectedMonth}`;
  const monthlyRecords = attendances.filter((a) => a.date.startsWith(monthPrefix));
  const isMonthBeforeJoining = (emp: Labour, prefix: string) => {
    if (!emp.startDate) return false;
    const [targetYear, targetMonthNum] = prefix.split('-').map(Number);
    const [startYear, startMonthNum] = emp.startDate.split('-').map(Number);
    return targetYear < startYear || (targetYear === startYear && targetMonthNum < startMonthNum);
  };
  const unjoinedEmployeesInMonth = employees.filter((e) => isMonthBeforeJoining(e, monthPrefix));

  const getMonthlyStatsForEmployee = (emp: Labour, customPrefix?: string) => {
    const prefix = customPrefix || monthPrefix;
    const [targetYear, targetMonthNum] = prefix.split('-').map(Number);
    const startDate = emp.startDate || '2026-01-01';
    const [startYear, startMonthNum, startDayNum] = startDate.split('-').map(Number);
    const daysInMonth = new Date(targetYear, targetMonthNum, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    let notJoinedYet = false;
    let joinedThisMonth = false;

    // 1. If target month is prior to employee start date
    if (targetYear < startYear || (targetYear === startYear && targetMonthNum < startMonthNum)) {
      notJoinedYet = true;
      return {
        fullDays: 0,
        halfDays: 0,
        absents: 0,
        holidays: 0,
        sundaysCount: 0,
        upcomingDays: daysInMonth,
        preJoiningDays: 0,
        effectiveDays: 0,
        payableDays: 0,
        payable: 0,
        notJoinedYet: true,
        joinedThisMonth: false,
        startDate: emp.startDate,
        dailyRate: 0,
      };
    }

    if (targetYear === startYear && targetMonthNum === startMonthNum) {
      joinedThisMonth = true;
    }

    const isPerm = emp.paymentType === 'fixed_salary';
    let fullDays = 0;
    let halfDays = 0;
    let absents = 0;
    let holidays = 0;
    let sundaysCount = 0;
    let upcomingDays = 0;
    let preJoiningDays = 0;

    // Iterate through all days of the month up to daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${targetYear}-${String(targetMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(targetYear, targetMonthNum - 1, d).getDay();
      const isSun = dayOfWeek === 0;
      const isBeforeJoining = Boolean(emp.startDate && dStr < emp.startDate);

      if (isBeforeJoining) {
        preJoiningDays++;
        continue;
      }

      // If viewing ongoing or future month, days strictly after today are Upcoming (not yet elapsed)
      if (dStr > todayStr) {
        upcomingDays++;
        continue;
      }

      // Elapsed day on or before today
      const rec = attendances.find((a) => a.labourId === emp.id && a.date === dStr);
      if (rec) {
        if (rec.status === 'full_day') fullDays++;
        else if (rec.status === 'half_day') halfDays++;
        else if (rec.status === 'absent') absents++;
        else if (rec.status === 'holiday') holidays++;
      } else if (isSun) {
        sundaysCount++;
      } else {
        // Unmarked past/present weekday for permanent staff
        if (isPerm) {
          fullDays++;
        }
      }
    }

    // Daily rate for the month
    const dailyRate = emp.defaultRate / daysInMonth;

    let payable = 0;
    let payableDays = 0;

    if (isPerm) {
      // Salaried staff: Paid for attended days + paid weekly offs (Sundays), minus absents
      payableDays = fullDays + halfDays * 0.5 + sundaysCount + holidays;
      payable = Math.round(payableDays * dailyRate);
    } else {
      // Temporary staff: Paid strictly for attended working days
      payableDays = fullDays + halfDays * 0.5;
      payable = Math.round(payableDays * emp.defaultRate);
    }

    const effectiveDays = payableDays;

    return {
      fullDays,
      halfDays,
      absents,
      holidays,
      sundaysCount,
      upcomingDays,
      preJoiningDays,
      effectiveDays,
      payableDays,
      payable,
      notJoinedYet,
      joinedThisMonth,
      startDate: emp.startDate,
      dailyRate: Math.round(dailyRate),
    };
  };

  // Helper to get effective payable amount (admin-edited override, saved DB amount, or auto-calculated amount)
  const getPayableAmountForEmp = (emp: Labour, calculatedAmount: number, targetMonth?: string) => {
    const m = targetMonth || `${selectedYear}-${selectedMonth}`;
    const key = `${emp.id}-${m}`;
    if (customPayableAmounts[key] !== undefined) {
      return customPayableAmounts[key];
    }
    const pRec = (allSalaryPayments.length > 0 ? allSalaryPayments : salaryPayments).find(
      (p) => p.labourId === emp.id && p.month === m
    );
    if (pRec && typeof pRec.amount === 'number' && pRec.amount >= 0) {
      return pRec.amount;
    }
    return calculatedAmount;
  };

  // Month-wide aggregated payroll & payout metrics
  const monthlyCalculatedList = employees.map((emp) => {
    const stats = getMonthlyStatsForEmployee(emp);
    const payableAmount = getPayableAmountForEmp(emp, stats.payable);
    const status = paymentStatuses[emp.id] || 'Pending';
    return { emp, stats, payableAmount, status };
  });

  const totalPayroll = monthlyCalculatedList.reduce((acc, curr) => acc + curr.payableAmount, 0);
  const totalPaid = monthlyCalculatedList
    .filter((i) => i.status === 'Paid')
    .reduce((acc, curr) => acc + curr.payableAmount, 0);
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
            onClick={() => setActiveTab('calendar')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'calendar'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Attendance Calendar</span>
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

              <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg font-bold text-xs ${
                isSelectedDateBeforeAnyJoining
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <Calendar className={`w-4 h-4 ${isSelectedDateBeforeAnyJoining ? 'text-rose-600' : 'text-dp-orange'}`} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-mono text-xs focus:outline-none cursor-pointer"
                />
              </div>

              {isSelectedDateBeforeAnyJoining && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Before Joining Date</span>
                </span>
              )}

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

          {/* Error Banner when selected date is before employee joining date */}
          {isSelectedDateBeforeAnyJoining && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-sm block text-rose-950">
                  ⚠️ Error: Selected Date ({selectedDate}) is Prior to Employee Joining Date
                </span>
                <p className="text-rose-800 font-medium">
                  {unjoinedEmployeesOnDate.map((u) => (
                    <span key={u.id} className="block">
                      • <strong>{u.name}</strong> official joining date is <strong>{u.startDate}</strong>.
                    </span>
                  ))}
                  Attendance, wages, and work records cannot be searched, marked, or saved for dates before the employee joining date.
                </p>
              </div>
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
                    const isEmployed = isEmployedOnDate(emp, selectedDate);
                    const current = dailyStatuses[emp.id] || { status: 'full_day', notes: '' };
                    const isPerm = emp.paymentType === 'fixed_salary';
                    let dayEarned = 0;
                    if (isEmployed) {
                      if (!isPerm) {
                        if (current.status === 'full_day') dayEarned = emp.defaultRate;
                        else if (current.status === 'half_day') dayEarned = Math.round(emp.defaultRate * 0.5);
                      } else {
                        const selDateObj = new Date(selectedDate);
                        const daysInSelMonth = new Date(selDateObj.getFullYear(), selDateObj.getMonth() + 1, 0).getDate();
                        if (current.status === 'full_day') dayEarned = Math.round(emp.defaultRate / daysInSelMonth);
                        else if (current.status === 'half_day') dayEarned = Math.round((emp.defaultRate / daysInSelMonth) * 0.5);
                      }
                    }

                    return (
                      <tr key={emp.id} className={`transition ${!isEmployed ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'}`}>
                        {/* Employee Name & Role */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                            <button
                              type="button"
                              onClick={() => openEditEmployee(emp)}
                              className="text-slate-400 hover:text-blue-600 transition"
                              title="Edit employee & joining date"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{emp.workType}</div>
                          {emp.startDate && (
                            <div className={`text-[10px] font-semibold mt-0.5 ${!isEmployed ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                              Joining Date: {emp.startDate} {!isEmployed && '(Not Joined Yet)'}
                            </div>
                          )}
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
                          {!isEmployed ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 font-bold text-xs">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Error: Before Joining Date ({emp.startDate})</span>
                            </div>
                          ) : (
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
                          )}
                        </td>

                        {/* Work Notes */}
                        <td className="py-3.5 px-4">
                          {!isEmployed ? (
                            <input
                              type="text"
                              disabled
                              value=""
                              placeholder={`Employee not joined yet (Starts ${emp.startDate})`}
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-400 bg-slate-100 cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="text"
                              value={current.notes}
                              onChange={(e) => handleSetNotes(emp.id, e.target.value)}
                              placeholder="Optional work notes / overtime..."
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white focus:border-dp-navy focus:outline-none"
                            />
                          )}
                        </td>

                        {/* Daily Earned */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {!isEmployed ? (
                            <div>
                              <span className="font-bold text-slate-400">₹0</span>
                              <span className="text-[10px] text-rose-500 font-bold block">
                                Pre-Joining
                              </span>
                            </div>
                          ) : isPerm ? (
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

          {/* Error Banner when selected month is before employee joining date */}
          {unjoinedEmployeesInMonth.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-sm block text-rose-950">
                  ⚠️ Error: Selected Period ({selectedMonth}/{selectedYear}) is Before Employee Joining Date
                </span>
                <p className="text-rose-800 font-medium">
                  {unjoinedEmployeesInMonth.map((u) => (
                    <span key={u.id} className="block">
                      • <strong>{u.name}</strong> joined on <strong>{u.startDate}</strong>.
                    </span>
                  ))}
                  Salary and wages cannot be calculated or disbursed for months prior to the employee's official joining date.
                </p>
              </div>
            </div>
          )}

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
                      const empPayableAmount = getPayableAmountForEmp(emp, stats.payable);

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
                              <button
                                type="button"
                                onClick={() => {
                                  setCalendarEmpId(emp.id);
                                  setActiveTab('calendar');
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition"
                                title="View monthly calendar of attendance"
                              >
                                <Calendar className="w-2.5 h-2.5" />
                                <span>Calendar</span>
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

                          {/* Payable Days */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 bg-slate-50/60">
                            <div>{stats.payableDays}</div>
                            {stats.upcomingDays > 0 ? (
                              <span className="block text-[9px] text-slate-400 font-sans font-normal">
                                (till today &bull; {stats.upcomingDays} upcoming)
                              </span>
                            ) : (
                              <span className="block text-[9px] text-slate-400 font-sans font-normal">
                                (full month)
                              </span>
                            )}
                          </td>

                          {/* Calculated Payable (Editable on Edit Click) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {stats.notJoinedYet ? (
                              <div className="font-bold text-slate-400 text-xs">
                                ₹0
                                <div className="text-[10px] font-semibold text-slate-400">
                                  Not Employed Yet
                                </div>
                              </div>
                            ) : editingAmountEmpKey === saveKey ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="inline-flex items-center gap-1.5 bg-white border-2 border-blue-600 rounded-xl px-2 py-1 shadow-md">
                                  <span className="font-black text-slate-500 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    autoFocus
                                    value={tempAmountInput}
                                    onChange={(e) => setTempAmountInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        saveInlineAmount(emp, saveKey);
                                      } else if (e.key === 'Escape') {
                                        cancelInlineAmount();
                                      }
                                    }}
                                    className="w-24 text-right font-black text-sm text-slate-900 bg-transparent focus:outline-none"
                                    placeholder="Amount"
                                  />
                                  <button
                                    type="button"
                                    disabled={savingPaymentId === saveKey}
                                    onClick={() => saveInlineAmount(emp, saveKey)}
                                    className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center justify-center"
                                    title="Save Amount"
                                  >
                                    {savingPaymentId === saveKey ? (
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelInlineAmount}
                                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-[9px] font-semibold text-blue-600">
                                  Click ✓ to save
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <div className="inline-flex items-center justify-end gap-1.5 group">
                                  <span className="font-black text-sm text-slate-900">
                                    ₹{empPayableAmount.toLocaleString('en-IN')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => startEditingAmount(saveKey, empPayableAmount)}
                                    className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition shadow-2xs"
                                    title="Edit Amount"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px]">
                                  {empPayableAmount !== stats.payable ? (
                                    <span className="font-semibold text-blue-700 flex items-center gap-1">
                                      <span>✏️ Admin Override</span>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setCustomPayableAmounts((prev) => {
                                            const copy = { ...prev };
                                            delete copy[saveKey];
                                            return copy;
                                          });
                                          await handleSavePaymentStatus(emp, stats.payable);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 underline text-[9px] ml-0.5"
                                        title="Reset to calculated formula amount"
                                      >
                                        (Reset ₹{stats.payable.toLocaleString('en-IN')})
                                      </button>
                                    </span>
                                  ) : stats.joinedThisMonth ? (
                                    <span className="font-semibold text-amber-600">
                                      Pro-rated from start date
                                    </span>
                                  ) : stats.upcomingDays > 0 ? (
                                    <span className="text-slate-500 font-medium">
                                      Calculated till today ({stats.payableDays} of {stats.payableDays + stats.absents} elapsed)
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">
                                      Calculated from attendance
                                    </span>
                                  )}
                                </div>
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
                                  onClick={() => handleSavePaymentStatus(emp, empPayableAmount)}
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
      {/* TAB: MONTHLY ATTENDANCE CALENDAR (ABSENT, HALF DAY, PRESENT BY DATE) */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (() => {
        const calEmp = employees.find((e) => e.id === calendarEmpId) || employees[0];
        if (!calEmp) {
          return (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No registered employees found.</p>
            </div>
          );
        }

        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        // Day of week for 1st of month: 0=Sun, 1=Mon, ..., 6=Sat
        const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay();
        // Monday-based offset: 0=Mon, 1=Tue, ..., 6=Sun
        const mondayOffset = (firstDayOfWeek + 6) % 7;

        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthTitle = `${monthNames[monthNum - 1]} ${selectedYear}`;
        const calStats = getMonthlyStatsForEmployee(calEmp);
        const isPerm = calEmp.paymentType === 'fixed_salary';

        // Check if salary for this selected month and employee has been paid
        const currentMonthSalaryPayment = (allSalaryPayments.length > 0 ? allSalaryPayments : salaryPayments).find(
          (p) => p.labourId === calEmp.id && p.month === `${selectedYear}-${selectedMonth}`
        );
        const isMonthPaid = currentMonthSalaryPayment?.status === 'Paid';
        const paymentPaidAt = currentMonthSalaryPayment?.paidAt ? currentMonthSalaryPayment.paidAt.split('T')[0] : '';
        const paidAmount = currentMonthSalaryPayment?.amount ?? calStats.payable;

        // Count Sundays
        let sundaysCount = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          if (new Date(yearNum, monthNum - 1, d).getDay() === 0) {
            sundaysCount++;
          }
        }

        return (
          <div className="space-y-4">
            {/* Calendar Controls & Staff Selector */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-xs text-slate-800">
                  <Calendar className="w-4 h-4 text-dp-orange" />
                  <span className="font-extrabold text-sm text-slate-900">{monthTitle}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Quick Month Selectors */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none"
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
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              {/* Employee Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Staff Member:
                </span>
                <select
                  value={calendarEmpId}
                  onChange={(e) => setCalendarEmpId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-blue-600 bg-white font-black text-xs text-slate-900 focus:outline-none shadow-xs"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.workType}) {e.startDate ? `• Joined ${e.startDate}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Banner if viewing month before joining date */}
            {calStats.notJoinedYet && (
              <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-sm block text-rose-950">
                    ⚠️ Error: {calEmp.name} Joined on {calEmp.startDate}
                  </span>
                  <p className="text-rose-800 font-medium">
                    You are viewing <strong>{monthTitle}</strong>, which is prior to the employee&apos;s official joining date ({calEmp.startDate}). Attendance and salary calculation are not valid before joining.
                  </p>
                </div>
              </div>
            )}

            {/* Employee Monthly Summary Card & Legend */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center shrink-0">
                    {calEmp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-slate-900">{calEmp.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {isPerm ? 'Permanent (Fixed Salary)' : 'Temporary (Daily / Work)'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-3 mt-0.5">
                      <span>{calEmp.workType}</span>
                      <span>•</span>
                      <span>Rate: ₹{calEmp.defaultRate.toLocaleString('en-IN')}{isPerm ? '/month' : '/day'}</span>
                      {calEmp.startDate && (
                        <>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold">Joining Date: {calEmp.startDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditEmployee(calEmp)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Joining Date</span>
                  </button>
                </div>
              </div>

              {/* Monthly Stat Badges */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                let calPresentCount = 0;
                let calHalfCount = 0;
                let calAbsentCount = 0;
                let calSundayCount = 0;
                let calUpcomingCount = 0;
                let calPreJoiningCount = 0;

                for (let d = 1; d <= daysInMonth; d++) {
                  const dStr = `${selectedYear}-${selectedMonth}-${String(d).padStart(2, '0')}`;
                  const dayOfWeek = new Date(yearNum, monthNum - 1, d).getDay();
                  const isSun = dayOfWeek === 0;
                  const isBefore = Boolean(calEmp.startDate && dStr < calEmp.startDate);
                  const rec = attendances.find((a) => a.labourId === calEmp.id && a.date === dStr);

                  if (isBefore) {
                    calPreJoiningCount++;
                  } else if (rec) {
                    if (rec.status === 'full_day') calPresentCount++;
                    else if (rec.status === 'half_day') calHalfCount++;
                    else if (rec.status === 'absent') calAbsentCount++;
                    else if (rec.status === 'holiday') calSundayCount++;
                  } else if (isSun) {
                    calSundayCount++;
                  } else if (dStr > todayStr) {
                    calUpcomingCount++;
                  } else {
                    if (isPerm) {
                      calPresentCount++;
                    }
                  }
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-center text-xs">
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">🟢 Present (Full)</span>
                      <span className="text-lg font-black text-emerald-800">{calPresentCount} Days</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">🟡 Half Day</span>
                      <span className="text-lg font-black text-amber-800">{calHalfCount} Days</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">🔴 Absent</span>
                      <span className="text-lg font-black text-rose-800">{calAbsentCount} Days</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">⚪ Weekly Off</span>
                      <span className="text-lg font-black text-slate-700">{calSundayCount} Days</span>
                    </div>
                    <div className="bg-slate-100/90 border border-slate-300 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">⏳ Upcoming</span>
                      <span className="text-lg font-black text-slate-700">{calUpcomingCount} Days</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">💰 Payable Salary</span>
                      <span className="text-lg font-black text-indigo-900">
                        ₹{getPayableAmountForEmp(calEmp, calStats.payable).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Status Color Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Legend:</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  Full Day (Present)
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Half Day (0.5)
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                  Absent (0)
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  Weekly Off / Sunday
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                  Upcoming (Future Date)
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-300 inline-block" />
                  Pre-Employment (Locked)
                </span>
              </div>
            </div>

            {/* 7-Column Calendar Grid */}
            <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              {/* Day of Week Headers (Mon -> Sun) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center font-bold text-xs text-slate-600 uppercase pb-2 border-b border-slate-200">
                <div className="py-1">Mon</div>
                <div className="py-1">Tue</div>
                <div className="py-1">Wed</div>
                <div className="py-1">Thu</div>
                <div className="py-1">Fri</div>
                <div className="py-1">Sat</div>
                <div className="py-1 text-rose-600 font-extrabold">Sun</div>
              </div>

              {/* Grid of Days */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
                {/* Blank padding cells before 1st of month: Displays Paid Status & Covered Dates in Top Blank Space */}
                {mondayOffset > 0 && (
                  <div
                    style={{ gridColumn: `span ${mondayOffset} / span ${mondayOffset}` }}
                    className={`min-h-[90px] sm:min-h-[105px] rounded-xl border p-3 flex flex-col justify-between shadow-xs transition ${
                      isMonthPaid
                        ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/90 border-emerald-300'
                        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/90 border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                            isMonthPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isMonthPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-pulse" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isMonthPaid ? 'bg-emerald-200 text-emerald-900 border border-emerald-300' : 'bg-amber-200 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {isMonthPaid ? '✓ SALARY PAID' : '⏳ PAYMENT DUE'}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              ₹{paidAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {monthTitle} &bull; {calEmp.name}
                          </div>
                        </div>
                      </div>

                      {isMonthPaid ? (
                        <span className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                          Settled
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleSavePaymentStatus(calEmp, calStats.payable, `${selectedYear}-${selectedMonth}`, 'Paid')
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Pay Now ✓</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-[11px] space-y-0.5 text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-slate-500 font-medium">
                          {isMonthPaid ? 'Dates Paid & Covered:' : 'Dates Covered (Liability):'}
                        </span>
                        <strong className="text-slate-900">
                          1st to{' '}
                          {selectedYear === String(new Date().getFullYear()) &&
                          selectedMonth === String(new Date().getMonth() + 1).padStart(2, '0')
                            ? Math.min(daysInMonth, new Date().getDate())
                            : daysInMonth}{' '}
                          {monthNames[monthNum - 1]} ({calStats.payableDays} days)
                        </strong>
                      </div>
                      {isMonthPaid ? (
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-slate-500 font-medium">Payment Disbursed:</span>
                          <strong className="text-emerald-900 font-semibold">
                            {paymentPaidAt || selectedDate} via {currentMonthSalaryPayment?.paymentMethod || 'Cash'}
                          </strong>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-slate-500 font-medium">Financial Status:</span>
                          <span className="text-amber-900 font-bold bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                            ⚠️ Unpaid Liability (Salary Due)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Day cells 1 .. daysInMonth */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${selectedYear}-${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
                  const dayOfWeek = new Date(yearNum, monthNum - 1, dayNum).getDay();
                  const isSunday = dayOfWeek === 0;
                  const isBeforeJoining = Boolean(calEmp.startDate && dateStr < calEmp.startDate);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isFuture = dateStr > todayStr;
                  const isToday = dateStr === todayStr;
                  const attRec = attendances.find((a) => a.labourId === calEmp.id && a.date === dateStr);

                  // Determine display status
                  let currentDayStatus: AttendanceStatus | 'sunday_off' | 'pre_joining' | 'upcoming' | 'unmarked';
                  if (isBeforeJoining) {
                    currentDayStatus = 'pre_joining';
                  } else if (attRec) {
                    currentDayStatus = attRec.status;
                  } else if (isSunday) {
                    currentDayStatus = 'sunday_off';
                  } else if (isFuture) {
                    currentDayStatus = 'upcoming';
                  } else if (isPerm) {
                    currentDayStatus = 'full_day';
                  } else {
                    currentDayStatus = 'unmarked';
                  }

                  // Day container styling
                  let containerBg = 'bg-white border-slate-200';
                  let statusBadge = null;

                  if (isBeforeJoining) {
                    containerBg = 'bg-slate-50/60 border-dashed border-rose-200 opacity-60';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 block text-center truncate">
                        🔒 Not Joined
                      </span>
                    );
                  } else if (currentDayStatus === 'upcoming') {
                    containerBg = 'bg-slate-50/70 border-dashed border-slate-300 text-slate-500 hover:border-slate-400';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 text-slate-600 block text-center truncate">
                        ⏳ Upcoming
                      </span>
                    );
                  } else if (currentDayStatus === 'full_day') {
                    containerBg = 'bg-emerald-50/80 border-emerald-300 text-emerald-950';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white block text-center truncate">
                        🟢 Present
                      </span>
                    );
                  } else if (currentDayStatus === 'half_day') {
                    containerBg = 'bg-amber-50/80 border-amber-300 text-amber-950';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white block text-center truncate">
                        🟡 Half Day
                      </span>
                    );
                  } else if (currentDayStatus === 'absent') {
                    containerBg = 'bg-rose-50/90 border-rose-300 text-rose-950';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white block text-center truncate">
                        🔴 Absent
                      </span>
                    );
                  } else if (currentDayStatus === 'holiday' || currentDayStatus === 'sunday_off') {
                    containerBg = 'bg-slate-100 border-slate-200 text-slate-700';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500 text-white block text-center truncate">
                        {isSunday ? '⚪ Sunday Off' : '⚪ Holiday'}
                      </span>
                    );
                  } else {
                    containerBg = 'bg-slate-50 border-slate-200 text-slate-500';
                    statusBadge = (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-600 block text-center truncate">
                        ⚪ Unmarked
                      </span>
                    );
                  }

                  if (isToday) {
                    containerBg += ' ring-2 ring-blue-500 shadow-xs';
                  }

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`min-h-[90px] sm:min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition ${containerBg}`}
                    >
                      {/* Top Bar: Date Number and Indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs sm:text-sm font-black ${isSunday ? 'text-rose-600' : 'text-slate-900'}`}>
                            {dayNum}
                          </span>
                          {isToday && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-black bg-blue-600 text-white uppercase tracking-wider shadow-xs">
                              Today
                            </span>
                          )}
                          {isMonthPaid && !isFuture && !isBeforeJoining && currentDayStatus !== 'absent' && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Paid
                            </span>
                          )}
                        </div>
                        {isSunday && (
                          <span className="text-[9px] font-bold text-rose-500 uppercase">Sun</span>
                        )}
                      </div>

                      {/* Middle: Status Pill */}
                      <div className="my-1">
                        {statusBadge}
                      </div>

                      {/* Bottom: Quick Select Dropdown to change directly in calendar */}
                      {isBeforeJoining ? (
                        <div className="text-[9px] text-rose-500 text-center font-semibold italic">
                          Starts {calEmp.startDate}
                        </div>
                      ) : isFuture && !attRec ? (
                        <select
                          value="upcoming"
                          onChange={(e) => {
                            if (e.target.value !== 'upcoming') {
                              handleCalendarMarkDay(calEmp, dateStr, e.target.value as AttendanceStatus);
                            }
                          }}
                          className="w-full text-[9px] sm:text-[10px] font-semibold py-0.5 px-1 rounded-md border border-slate-200 bg-white/95 text-slate-600 cursor-pointer focus:outline-none hover:bg-white transition"
                        >
                          <option value="upcoming" disabled>⏳ Upcoming</option>
                          <option value="full_day">🟢 Mark Present</option>
                          <option value="half_day">🟡 Mark Half Day</option>
                          <option value="absent">🔴 Mark Absent</option>
                          <option value="holiday">⚪ Mark Off</option>
                        </select>
                      ) : (
                        <select
                          value={attRec?.status || (isSunday ? 'holiday' : isPerm ? 'full_day' : '')}
                          onChange={(e) => handleCalendarMarkDay(calEmp, dateStr, e.target.value as AttendanceStatus)}
                          className="w-full text-[9px] sm:text-[10px] font-bold py-0.5 px-1 rounded-md border border-slate-200 bg-white/90 text-slate-800 cursor-pointer focus:outline-none hover:bg-white transition"
                        >
                          {!isPerm && !attRec && <option value="" disabled>⚪ Unmarked</option>}
                          <option value="full_day">🟢 Present (Full)</option>
                          <option value="half_day">🟡 Half Day</option>
                          <option value="absent">🔴 Absent</option>
                          <option value="holiday">⚪ Off / Holiday</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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
                        const empPayableAmount = getPayableAmountForEmp(emp, stats.payable);

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

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {editingAmountEmpKey === saveKey ? (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="inline-flex items-center gap-1.5 bg-white border-2 border-blue-600 rounded-xl px-2 py-1 shadow-md">
                                    <span className="font-black text-slate-500 text-xs">₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      autoFocus
                                      value={tempAmountInput}
                                      onChange={(e) => setTempAmountInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          saveInlineAmount(emp, saveKey);
                                        } else if (e.key === 'Escape') {
                                          cancelInlineAmount();
                                        }
                                      }}
                                      className="w-24 text-right font-black text-sm text-slate-900 bg-transparent focus:outline-none"
                                      placeholder="Amount"
                                    />
                                    <button
                                      type="button"
                                      disabled={savingPaymentId === saveKey}
                                      onClick={() => saveInlineAmount(emp, saveKey)}
                                      className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center justify-center"
                                      title="Save Amount"
                                    >
                                      {savingPaymentId === saveKey ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelInlineAmount}
                                      className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span className="text-[9px] font-semibold text-blue-600">
                                    Click ✓ to save
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="inline-flex items-center justify-end gap-1.5 group">
                                    <span className="font-black text-sm text-slate-900">
                                      ₹{empPayableAmount.toLocaleString('en-IN')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => startEditingAmount(saveKey, empPayableAmount)}
                                      className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition shadow-2xs"
                                      title="Edit Amount"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {empPayableAmount !== stats.payable && (
                                    <span className="text-[10px] font-semibold text-blue-700">
                                      ✏️ Custom Amount
                                    </span>
                                  )}
                                </div>
                              )}
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
                                  onClick={() => handleSavePaymentStatus(emp, empPayableAmount)}
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
