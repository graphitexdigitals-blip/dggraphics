import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AttendanceRecord } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const month = searchParams.get('month') || undefined;
    const labourId = searchParams.get('labourId') || undefined;

    const attendances = db.getAttendance({ date, month, labourId });
    const employees = db.getLabour();
    const salaryPayments = db.getSalaryPayments(month);
    const allSalaryPayments = db.getSalaryPayments();

    return NextResponse.json({
      success: true,
      attendances,
      employees,
      salaryPayments,
      allSalaryPayments,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Action 1: Save Salary / Wage Payment Status (Paid / Pending)
    if (body.action === 'save_salary_status') {
      const { labourId, labourName, month, status, amount, paymentMethod, notes } = body;
      if (!labourId || !month) {
        return NextResponse.json({ success: false, error: 'Labour ID and Month are required' }, { status: 400 });
      }
      const isPaid = status === 'Paid';
      const payment = db.saveSalaryPayment({
        id: `sal-${labourId}-${month}`,
        labourId,
        labourName: labourName || 'Staff',
        month,
        status: isPaid ? 'Paid' : 'Pending',
        amount: Number(amount) || 0,
        paymentMethod: paymentMethod || 'Cash',
        paidAt: isPaid ? (body.paidAt || new Date().toISOString()) : undefined,
        notes: notes || undefined,
      });
      return NextResponse.json({ success: true, payment });
    }

    // Action 2: Pay Salary or Wage (Modal Payout)
    if (body.action === 'pay_wage') {
      const { labourId, labourName, amount, description, paymentMethod, date, month } = body;
      if (!labourId || !amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Valid labour and payment amount are required' }, { status: 400 });
      }

      // Record transaction in labour system
      const tx = db.recordLabourTransaction({
        id: `lab-pay-${Date.now()}`,
        labourId,
        labourName: labourName || 'Employee',
        description: description || `Salary / Wage Payout for ${month || new Date().toISOString().substring(0, 7)}`,
        amount: Number(amount),
        isPaid: true,
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
      });

      // Automatically register in studio expense ledger under Labour Charges
      const exp = db.recordExpense({
        id: `exp-sal-${Date.now()}`,
        date: date || new Date().toISOString().split('T')[0],
        category: 'Labour Charges',
        description: `Wages / Salary paid to ${labourName || 'Employee'} (${description || month || 'Monthly'})`,
        amount: Number(amount),
        paymentStatus: 'Paid',
        paymentMethod: paymentMethod || 'Cash',
        labourId,
        labourName,
        notes: `Attendance-based wage disbursement recorded on ${date || new Date().toISOString().split('T')[0]}.`,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, transaction: tx, expense: exp });
    }

    // Action 2: Add or Edit Employee
    if (body.action === 'save_employee') {
      const { id, name, phone, workType, paymentType, defaultRate, startDate } = body;
      if (!name || !phone) {
        return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
      }

      const employee = db.saveLabour({
        id: id || `emp-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        workType: workType || 'Production Operator',
        paymentType: paymentType === 'fixed_salary' ? 'fixed_salary' : 'per_job',
        defaultRate: Number(defaultRate) || 0,
        startDate: startDate || (id ? undefined : new Date().toISOString().split('T')[0]),
        totalEarnings: 0,
        totalPaid: 0,
        pendingAmount: 0,
        isActive: true,
      });

      return NextResponse.json({ success: true, employee });
    }

    // Action 3: Batch Mark Attendance
    if (Array.isArray(body.records)) {
      const saved = db.batchMarkAttendance(body.records);
      return NextResponse.json({ success: true, records: saved });
    }

    // Action 4: Single Mark Attendance
    if (body.labourId && body.date && body.status) {
      const record: AttendanceRecord = {
        id: body.id || `att-${body.labourId}-${body.date}`,
        labourId: body.labourId,
        labourName: body.labourName,
        employmentType: body.employmentType || 'permanent',
        date: body.date,
        status: body.status,
        workNotes: body.workNotes || '',
        wageCalculated: Number(body.wageCalculated) || 0,
        createdAt: new Date().toISOString(),
      };
      const saved = db.markAttendance(record);
      return NextResponse.json({ success: true, record: saved });
    }

    return NextResponse.json({ success: false, error: 'Invalid attendance payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
