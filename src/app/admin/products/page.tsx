'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { Package, PlusCircle, Search, Edit2, Trash2, X, Check, ArrowRight } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [pricingType, setPricingType] = useState<'fixed' | 'sqft'>('fixed');
  const [requiresDimensions, setRequiresDimensions] = useState(false);
  const [basePrice, setBasePrice] = useState<number>(100);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [minBillableArea, setMinBillableArea] = useState<number>(5);
  const [turnaroundTime, setTurnaroundTime] = useState('24 Hours');

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products?active=false'),
        fetch('/api/categories'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.success) setProducts(pData.products);
      if (cData.success) {
        setCategories(cData.categories);
        if (cData.categories.length > 0 && !categoryId) {
          setCategoryId(cData.categories[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPricingType('fixed');
    setRequiresDimensions(false);
    setBasePrice(250);
    setMinQuantity(1);
    setMinBillableArea(5);
    setTurnaroundTime('24-48 Hours');
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.categoryId);
    setDescription(p.description);
    setPricingType(p.pricingType);
    setRequiresDimensions(Boolean(p.requiresDimensions ?? p.pricingType === 'sqft'));
    setBasePrice(p.basePrice);
    setMinQuantity(p.minQuantity);
    setMinBillableArea(p.minBillableArea || 5);
    setTurnaroundTime(p.turnaroundTime || '24 Hours');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingProduct?.id,
      name: name.trim(),
      categoryId,
      description: description.trim(),
      pricingType,
      requiresDimensions: Boolean(requiresDimensions),
      basePrice: Number(basePrice),
      minQuantity: Number(minQuantity),
      minBillableArea: pricingType === 'sqft' ? Number(minBillableArea) : undefined,
      turnaroundTime,
      images: editingProduct?.images || [],
      materials: editingProduct?.materials || [],
      finishingOptions: editingProduct?.finishingOptions || [],
      isActive: true,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Products Table Card (AdminLTE 4 Standard) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800">Product & Rate Catalog</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filtered.length} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 bg-slate-50/50"
              />
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Product Name & Category</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Pricing Model</th>
                <th className="py-2.5 px-4">Rate / Unit</th>
                <th className="py-2.5 px-4">Turnaround</th>
                <th className="py-2.5 px-4">Min Order</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No products found matching &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {cat ? cat.name : 'General Printing'}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px] leading-relaxed">
                        <span className="line-clamp-2">{prod.description}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            prod.pricingType === 'sqft'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {prod.pricingType === 'sqft' ? 'Square Feet' : 'Fixed Price'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        ₹{prod.basePrice}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          {prod.pricingType === 'sqft' ? '/ sq.ft.' : 'per unit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {prod.turnaroundTime || '24 Hours'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-600">
                        <div>Min Qty: <strong className="text-slate-800">{prod.minQuantity || 1}</strong></div>
                        {prod.pricingType === 'sqft' && (
                          <div className="text-[10px] text-slate-400">{prod.minBillableArea || 5} sq.ft. min</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-dp-navy hover:text-white hover:bg-dp-navy border border-slate-200 inline-flex items-center gap-1.5 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 lg:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pricing Model *</label>
                  <select
                    value={pricingType}
                    onChange={(e: any) => {
                      const newType = e.target.value as 'fixed' | 'sqft';
                      setPricingType(newType);
                      setRequiresDimensions(newType === 'sqft');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    <option value="fixed">Fixed Unit Price (Mugs, T-Shirts, Cards)</option>
                    <option value="sqft">Square Feet Pricing (Flex, Vinyl, Banners)</option>
                  </select>
                </div>
              </div>

              {/* Dimension requirement checkbox */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={requiresDimensions}
                    onChange={(e) => setRequiresDimensions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Requires Dimensions / Size Input (e.g. Width × Height for Banners, Vinyl, Boards)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5 ml-6">
                  {requiresDimensions
                    ? '✓ Dimensions input will be shown when taking orders for this product.'
                    : '✕ Dimensions will be hidden for this product (standard items like Mugs, Cards, Apparel).'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {pricingType === 'sqft' ? 'Rate / Sq.Ft. (₹)' : 'Base Unit Price (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Min. Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                {pricingType === 'sqft' && (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Min. Billable Sqft</label>
                    <input
                      type="number"
                      value={minBillableArea}
                      onChange={(e) => setMinBillableArea(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                ></textarea>
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
                  className="px-4 py-2 font-bold bg-dp-navy text-white rounded-lg shadow hover:bg-dp-orange transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
