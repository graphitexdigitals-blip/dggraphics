'use client';

import React, { useState, useEffect } from 'react';
import { Material, Order, Vendor } from '@/types';
import { Boxes, PlusCircle, AlertTriangle, Search, CheckCircle2, X, Building2, Store } from 'lucide-react';

export default function AdminInventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'registered' | 'unregistered'>('all');

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Flex Rolls');
  const [unit, setUnit] = useState('roll');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [usageCost, setUsageCost] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(5);
  const [minStockAlert, setMinStockAlert] = useState(2);

  // Supplier / Vendor State
  const [supplierType, setSupplierType] = useState<'registered' | 'unregistered'>('registered');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [customVendorName, setCustomVendorName] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Auto Expense State
  const [recordExpense, setRecordExpense] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Offline UPI' | 'Bank Transfer'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');

  const categoryDefaultUnits: Record<string, string> = {
    'Flex Rolls': 'roll',
    'Vinyl Rolls': 'roll',
    'Mug Blanks': 'pcs',
    'T-Shirts': 'pcs',
    'Printing Ink': 'bottle',
    'Paper & Board': 'sheet',
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (categoryDefaultUnits[newCat]) {
      setUnit(categoryDefaultUnits[newCat]);
    }
  };

  // Consume State
  const [consumeJobNumber, setConsumeJobNumber] = useState('');
  const [consumeQty, setConsumeQty] = useState(1);

  const loadData = async () => {
    try {
      const [mRes, oRes, vRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/orders'),
        fetch('/api/vendors'),
      ]);
      const [mData, oData, vData] = await Promise.all([
        mRes.json(),
        oRes.json(),
        vRes.json(),
      ]);
      if (mData.success) setMaterials(mData.materials);
      if (oData.success) {
        setOrders(oData.orders);
        if (oData.orders.length > 0) setConsumeJobNumber(oData.orders[0].jobNumber);
      }
      if (vData.success && Array.isArray(vData.vendors)) {
        setVendors(vData.vendors);
        if (vData.vendors.length > 0) {
          setSelectedVendorId((prev) => prev || vData.vendors[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStockValue = materials.reduce((s, m) => s + m.purchasePrice * m.stockQuantity, 0);
  const lowStockCount = materials.filter((m) => m.stockQuantity <= m.minStockAlert).length;

  const filteredMaterials = materials.filter((m) => {
    if (sourceFilter === 'registered') return m.supplierType === 'registered_vendor' || (m.vendorId && m.vendorName);
    if (sourceFilter === 'unregistered') return m.supplierType === 'unregistered_shop';
    return true;
  });

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalVendorId: string | undefined = undefined;
      let finalVendorName: string | undefined = undefined;

      if (supplierType === 'registered') {
        const v = vendors.find((item) => item.id === selectedVendorId) || vendors[0];
        if (v) {
          finalVendorId = v.id;
          finalVendorName = v.businessName ? `${v.businessName} (${v.name})` : v.name;
        }
      } else {
        finalVendorId = undefined;
        finalVendorName = customVendorName.trim() || 'Local Shop (Unlisted)';
      }

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || `SKU-${Date.now()}`,
          category,
          unit,
          purchasePrice: Number(purchasePrice),
          usageCostPerUnit: Number(usageCost) || Number(purchasePrice),
          stockQuantity: Number(stockQuantity),
          minStockAlert: Number(minStockAlert),
          vendorId: finalVendorId,
          vendorName: finalVendorName,
          supplierType: supplierType === 'registered' ? 'registered_vendor' : 'unregistered_shop',
          supplierNotes: supplierNotes.trim() || undefined,
          recordExpense,
          paymentMethod,
          paymentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName('');
        setSku('');
        setCustomVendorName('');
        setSupplierNotes('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'consume',
          orderId: consumeJobNumber,
          jobNumber: consumeJobNumber,
          materialId: selectedMaterial.id,
          materialName: selectedMaterial.name,
          quantityUsed: consumeQty,
          unit: selectedMaterial.unit,
          totalCost: consumeQty * selectedMaterial.usageCostPerUnit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConsumeModalOpen(false);
        setConsumeQty(1);
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">Total Stock Valuation</span>
          <div className="text-xl font-bold text-slate-800 mt-1">₹{totalStockValue.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400">Total raw stock asset value</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">Tracked Material SKUs</span>
          <div className="text-xl font-bold text-slate-800 mt-1">{materials.length}</div>
          <span className="text-[11px] text-slate-400">Rolls, blanks, apparel & inks</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 block">Low Stock Alerts</span>
          <div className="text-xl font-bold text-amber-700 mt-1">{lowStockCount}</div>
          <span className="text-[11px] text-slate-400">Items below minimum threshold</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800">Materials & Stock Directory</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredMaterials.length} of {materials.length} items
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Source */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  sourceFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sources ({materials.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('registered')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                  sourceFilter === 'registered'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>
                  Registered ({materials.filter((m) => m.supplierType === 'registered_vendor' || (m.vendorId && m.vendorName)).length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('unregistered')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                  sourceFilter === 'unregistered'
                    ? 'bg-white text-amber-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3 h-3 text-amber-600" />
                <span>
                  Local / Unlisted ({materials.filter((m) => m.supplierType === 'unregistered_shop').length})
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                setModalOpen(true);
                if (vendors.length > 0 && !selectedVendorId) {
                  setSelectedVendorId(vendors[0].id);
                }
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Stock Material</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Material Name</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Supplier / Source</th>
                <th className="py-2.5 px-4">Stock Level</th>
                <th className="py-2.5 px-4">Purchase Price</th>
                <th className="py-2.5 px-4">Usage Rate</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Job Consumption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((m) => {
                const isLow = m.stockQuantity <= m.minStockAlert;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{m.sku}</td>
                    <td className="py-3 px-4">{m.category}</td>
                    <td className="py-3 px-4">
                      {m.supplierType === 'unregistered_shop' ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 w-fit">
                            <Store className="w-3 h-3 text-amber-600" />
                            <span>{m.vendorName || 'Local Shop (Unlisted)'}</span>
                          </span>
                          {m.supplierNotes && (
                            <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]" title={m.supplierNotes}>
                              {m.supplierNotes}
                            </span>
                          )}
                        </div>
                      ) : m.vendorName ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 w-fit">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>{m.vendorName}</span>
                          </span>
                          {m.supplierNotes && (
                            <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]" title={m.supplierNotes}>
                              {m.supplierNotes}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {m.stockQuantity} <span className="text-[10px] text-slate-400 font-normal">{m.unit}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">₹{m.purchasePrice}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{m.usageCostPerUnit}</td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Low Stock ({m.stockQuantity})</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedMaterial(m);
                          setConsumeModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-dp-navy bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        Deduct for Job &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">Add Inventory Material</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sublimation Mug Box (36 pcs)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. MUG-WHT-36"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Flex Rolls">Flex Rolls</option>
                    <option value="Vinyl Rolls">Vinyl Rolls</option>
                    <option value="Mug Blanks">Mug Blanks</option>
                    <option value="T-Shirts">T-Shirt Blanks</option>
                    <option value="Printing Ink">Printing Ink</option>
                    <option value="Paper & Board">Paper & Board</option>
                  </select>
                </div>
              </div>

              {/* Purchase Source / Vendor Selection */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase text-[11px] tracking-wide">
                    Purchased / Ordered From
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Source Tracking</span>
                </div>

                {/* Option Toggle Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSupplierType('registered')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      supplierType === 'registered'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Registered Vendor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierType('unregistered')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      supplierType === 'unregistered'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Unknown / Local Shop</span>
                  </button>
                </div>

                {/* Registered Vendor selector */}
                {supplierType === 'registered' && (
                  <div className="space-y-2 pt-1">
                    {vendors.length > 0 ? (
                      <>
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Select Registered Partner
                        </label>
                        <select
                          value={selectedVendorId}
                          onChange={(e) => setSelectedVendorId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-medium"
                        >
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.businessName ? `${v.businessName} — ${v.name}` : v.name} ({v.category || 'Vendor'}{v.phone ? ` • 📞 ${v.phone}` : ''})
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const cur = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
                          if (!cur) return null;
                          return (
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                              <span className="font-semibold text-slate-800">🏢 {cur.businessName || cur.name}</span>
                              <span>📞 {cur.phone}</span>
                              {cur.address && <span className="text-slate-500">📍 {cur.address}</span>}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
                        No registered vendors found in Partner Directory yet. You can add them under the <strong>Vendors</strong> tab, or choose <strong>Unknown / Local Shop</strong> above.
                      </div>
                    )}
                  </div>
                )}

                {/* Unknown / Local Shop input */}
                {supplierType === 'unregistered' && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Shop / Store Name <span className="text-slate-400 font-normal">(Local / Not Listed)</span>
                      </label>
                      <input
                        type="text"
                        value={customVendorName}
                        onChange={(e) => setCustomVendorName(e.target.value)}
                        placeholder="e.g. Laxmi Flex Mart, City Market Wholesale, Local Stationery"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Purchase Notes / Bill No. / Location <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={supplierNotes}
                        onChange={(e) => setSupplierNotes(e.target.value)}
                        placeholder="e.g. Cash purchase, Bill #849, Shop #12 Market Road"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Unit <span className="text-[10px] font-normal text-slate-400 lowercase">(pcs, roll, etc.)</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. pcs, roll, sheet"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['pcs', 'roll', 'sheet', 'box', 'bottle'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                          unit.toLowerCase() === u
                            ? 'bg-dp-navy text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Purchase Cost</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* Real-time Business Expense Link Card */}
              {purchasePrice > 0 && stockQuantity > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 block">
                        💰 Total Purchase Cost:
                      </span>
                      <span className="text-sm font-black text-emerald-800">
                        ₹{(purchasePrice * stockQuantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-emerald-950 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-xs hover:bg-emerald-50">
                      <input
                        type="checkbox"
                        checked={recordExpense}
                        onChange={(e) => setRecordExpense(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Auto-record in Expenses</span>
                    </label>
                  </div>

                  {recordExpense && (
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                          Payment Mode
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e: any) => setPaymentMethod(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Offline UPI">Offline UPI (GPay / PhonePe)</option>
                          <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={paymentStatus}
                          onChange={(e: any) => setPaymentStatus(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium"
                        >
                          <option value="Paid">Paid Immediately</option>
                          <option value="Pending">Due / Unpaid Credit</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-dp-navy text-white rounded-lg shadow"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consume Modal */}
      {consumeModalOpen && selectedMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">Deduct Material for Job</h3>
              <button onClick={() => setConsumeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConsume} className="space-y-3">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="font-bold text-dp-navy">{selectedMaterial.name}</span>
                <div className="text-[11px] text-slate-500">Current Stock: {selectedMaterial.stockQuantity} {selectedMaterial.unit}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Link to Customer Job Number</label>
                <select
                  value={consumeJobNumber}
                  onChange={(e) => setConsumeJobNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono bg-white"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.jobNumber}>
                      {o.jobNumber} ({o.customerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Quantity Consumed ({selectedMaterial.unit})</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConsumeModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-dp-navy text-white rounded-lg shadow"
                >
                  Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
