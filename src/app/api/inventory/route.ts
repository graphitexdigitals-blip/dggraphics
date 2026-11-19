import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const materials = db.getMaterials();
    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a consumption record
    if (body.action === 'consume') {
      if (!body.orderId || !body.materialId || !body.quantityUsed) {
        return NextResponse.json({ success: false, error: 'Order, Material, and Quantity are required' }, { status: 400 });
      }
      const consumption = db.recordMaterialConsumption({
        id: `mat-c-${Date.now()}`,
        orderId: body.orderId,
        jobNumber: body.jobNumber || '',
        materialId: body.materialId,
        materialName: body.materialName || 'Material',
        quantityUsed: Number(body.quantityUsed),
        unit: body.unit || 'units',
        totalCost: Number(body.totalCost) || 0,
        recordedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, consumption });
    }

    // Otherwise, create or update material
    if (!body.name || !body.sku || body.purchasePrice === undefined) {
      return NextResponse.json({ success: false, error: 'Name, SKU, and Purchase Price are required' }, { status: 400 });
    }

    const material = db.saveMaterial({
      id: body.id || `mat-${Date.now()}`,
      name: body.name,
      sku: body.sku,
      category: body.category || 'General',
      unit: body.unit || 'pcs',
      purchasePrice: Number(body.purchasePrice) || 0,
      usageCostPerUnit: Number(body.usageCostPerUnit) || Number(body.purchasePrice) || 0,
      stockQuantity: Number(body.stockQuantity) || 0,
      minStockAlert: Number(body.minStockAlert) || 5,
      vendorId: body.vendorId,
      vendorName: body.vendorName,
      supplierType: body.supplierType,
      supplierNotes: body.supplierNotes,
      lastPurchaseDate: body.lastPurchaseDate || new Date().toISOString().split('T')[0],
    });

    // Automatically reflect material stock purchase in Business Expenses ledger
    if (body.recordExpense !== false && Number(material.purchasePrice) > 0 && Number(material.stockQuantity) > 0) {
      const totalExpenseAmount = Number(material.purchasePrice) * Number(material.stockQuantity);
      const supplierLabel = material.vendorName ? ` from ${material.vendorName}` : '';
      db.recordExpense({
        id: `exp-mat-${material.id}`,
        date: material.lastPurchaseDate || new Date().toISOString().split('T')[0],
        category: 'Material Purchase',
        description: `Raw Material: ${material.name} (${material.stockQuantity} ${material.unit} @ ₹${material.purchasePrice}/${material.unit})${supplierLabel}`,
        amount: totalExpenseAmount,
        paymentStatus: body.paymentStatus || 'Paid',
        paymentMethod: body.paymentMethod || 'Cash',
        vendorId: material.vendorId,
        vendorName: material.vendorName,
        materialId: material.id,
        notes: material.supplierNotes
          ? `${material.supplierNotes} (Auto-recorded from Inventory stock entry: ${material.sku})`
          : `Auto-recorded from Inventory stock entry (${material.sku})`,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
