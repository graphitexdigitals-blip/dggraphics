import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobNumber = searchParams.get('jobNumber') || undefined;
    const category = searchParams.get('category') || undefined;

    const expenses = db.getExpenses({ jobNumber, category });
    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.category || !body.description || !body.amount) {
      return NextResponse.json({ success: false, error: 'Category, Description, and Amount are required' }, { status: 400 });
    }

    const expense = db.recordExpense({
      id: body.id || `exp-${Date.now()}`,
      date: body.date || new Date().toISOString().split('T')[0],
      jobNumber: body.jobNumber || undefined,
      category: body.category,
      description: body.description,
      amount: Number(body.amount),
      paymentStatus: body.paymentStatus || 'Paid',
      paymentMethod: body.paymentMethod || 'Cash',
      vendorId: body.vendorId,
      vendorName: body.vendorName,
      labourId: body.labourId,
      labourName: body.labourName,
      materialId: body.materialId,
      vendorWorkOrderId: body.vendorWorkOrderId,
      notes: body.notes || '',
      receiptUrl: body.receiptUrl,
      createdAt: body.createdAt || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id || !body.paymentStatus) {
      return NextResponse.json({ success: false, error: 'Expense id and paymentStatus are required' }, { status: 400 });
    }
    const updated = db.updateExpenseStatus(body.id, body.paymentStatus, body.paymentMethod);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Expense id is required' }, { status: 400 });
    }
    const deleted = db.deleteExpense(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
