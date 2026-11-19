import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const labour = db.getLabour();
    return NextResponse.json({ success: true, labour });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a transaction record
    if (body.action === 'transaction') {
      if (!body.labourId || !body.amount || !body.description) {
        return NextResponse.json({ success: false, error: 'Labour, Amount, and Description are required' }, { status: 400 });
      }
      const tx = db.recordLabourTransaction({
        id: `lab-tx-${Date.now()}`,
        labourId: body.labourId,
        labourName: body.labourName || 'Worker',
        orderId: body.orderId,
        jobNumber: body.jobNumber,
        description: body.description,
        amount: Number(body.amount),
        isPaid: body.isPaid === true,
        date: body.date || new Date().toISOString().split('T')[0],
        paymentMethod: body.paymentMethod || 'Cash',
        created_at: new Date().toISOString(),
      } as any);

      if (body.isPaid) {
        // Record as an expense too
        db.recordExpense({
          id: `exp-lab-${Date.now()}`,
          date: body.date || new Date().toISOString().split('T')[0],
          jobNumber: body.jobNumber,
          category: 'Labour Charges',
          description: `Labour payment to ${body.labourName || 'Worker'} (${body.description})`,
          amount: Number(body.amount),
          paymentStatus: 'Paid',
          paymentMethod: body.paymentMethod || 'Cash',
          labourId: body.labourId,
          labourName: body.labourName,
          createdAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, transaction: tx });
    }

    // Add or edit labour profile
    if (!body.name || !body.phone) {
      return NextResponse.json({ success: false, error: 'Name and Phone are required' }, { status: 400 });
    }

    const worker = db.saveLabour({
      id: body.id || `lab-${Date.now()}`,
      name: body.name,
      phone: body.phone,
      workType: body.workType || 'Production Operator',
      paymentType: body.paymentType || 'per_job',
      defaultRate: Number(body.defaultRate) || 0,
      startDate: body.startDate || (body.id ? undefined : new Date().toISOString().split('T')[0]),
      totalEarnings: Number(body.totalEarnings) || 0,
      totalPaid: Number(body.totalPaid) || 0,
      pendingAmount: Number(body.pendingAmount) || 0,
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, labour: worker });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
