'use client';

import React, { useState, useEffect } from 'react';
import { Material, Order } from '@/types';
import { Boxes, PlusCircle, AlertTriangle, Search, CheckCircle2, X } from 'lucide-react';

export default function AdminInventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Flex Rolls');
  const [unit, setUnit] = useState('roll');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [usageCost, setUsageCost] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(5);
  const [minStockAlert, setMinStockAlert] = useState(2);

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
      const [mRes, oRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/orders'),
      ]);
      const mData = await mRes.json();
      const oData = await oRes.json();
      if (mData.success) setMaterials(mData.materials);
      if (oData.success) {
        setOrders(oData.orders);
        if (oData.orders.length > 0) setConsumeJobNumber(oData.orders[0].jobNumber);
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

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName('');
        setSku('');
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
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800">Materials & Stock Directory</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {materials.length} items
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Stock Material</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Material Name</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Stock Level</th>
                <th className="py-2.5 px-4">Purchase Price</th>
                <th className="py-2.5 px-4">Usage Rate</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Job Consumption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((m) => {
                const isLow = m.stockQuantity <= m.minStockAlert;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{m.sku}</td>
                    <td className="py-3 px-4">{m.category}</td>
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
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">Add Inventory Material</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3">
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
