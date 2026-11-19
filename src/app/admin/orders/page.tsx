'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Order, Product, Customer } from '@/types';
import {
  Search,
  PlusCircle,
  Printer,
  Receipt,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  User,
  X,
  Phone,
  FileText,
  Building2,
  Calendar,
} from 'lucide-react';

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialAction = searchParams.get('action') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(initialAction === 'new');
  const [jobCardOrder, setJobCardOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);

  // Payment Recording State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Offline UPI' | 'Bank Transfer'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Walk-in Order Form State
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinSelectedProduct, setWalkinSelectedProduct] = useState('');
  const [walkinQuantity, setWalkinQuantity] = useState(1);
  const [walkinDimensions, setWalkinDimensions] = useState('');
  const [showCustomDimensions, setShowCustomDimensions] = useState(false);
  const [walkinMaterial, setWalkinMaterial] = useState('');
  const [walkinPrintingCharge, setWalkinPrintingCharge] = useState(500);
  const [walkinDesignCharge, setWalkinDesignCharge] = useState(0);
  const [walkinDiscount, setWalkinDiscount] = useState(0);
  const [walkinAdvancePaid, setWalkinAdvancePaid] = useState(0);
  const [walkinMethod, setWalkinMethod] = useState<'in_house' | 'vendor_outsourced' | 'hybrid'>('in_house');
  const [walkinExpectedDate, setWalkinExpectedDate] = useState('');
  const [walkinNotes, setWalkinNotes] = useState('');

  // Helper to determine if product requires dimensions (sqft products or explicit requiresDimensions flag)
  const productRequiresDimensions = (prod?: Product | null) => {
    if (!prod) return false;
    if (typeof prod.requiresDimensions === 'boolean') return prod.requiresDimensions;
    return prod.pricingType === 'sqft';
  };

  const handleProductSelect = (productId: string) => {
    setWalkinSelectedProduct(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const needsDims = productRequiresDimensions(prod);
      setWalkinDimensions(needsDims ? '5x3 ft' : '');
      setShowCustomDimensions(false);
      setWalkinMaterial(prod.materials?.[0]?.name || '');
      setWalkinPrintingCharge(prod.basePrice * walkinQuantity);
    }
  };

  const loadData = async () => {
    try {
      const [ordRes, prodRes, custRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products?active=false'),
        fetch('/api/customers'),
      ]);
      const ordData = await ordRes.json();
      const prodData = await prodRes.json();
      const custData = await custRes.json();

      if (ordData.success) setOrders(ordData.orders);
      if (prodData.success) {
        setProducts(prodData.products);
        if (prodData.products.length > 0) {
          const first = prodData.products[0];
          setWalkinSelectedProduct(first.id);
          const needsDims = productRequiresDimensions(first);
          setWalkinDimensions(needsDims ? '5x3 ft' : '');
          setWalkinMaterial(first.materials?.[0]?.name || '');
          setWalkinPrintingCharge(first.basePrice);
        }
      }
      if (custData.success) setCustomers(custData.customers);
    } catch (e) {
      console.error('Failed to load orders data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update order status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Submit new walk-in order
  const handleCreateWalkinOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === walkinSelectedProduct);
    const subtotal = walkinPrintingCharge;
    const grandTotal = Math.max(0, subtotal + walkinDesignCharge - walkinDiscount);
    const balanceDue = Math.max(0, grandTotal - walkinAdvancePaid);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'walk_in',
          customerName: walkinName.trim(),
          customerPhone: walkinPhone.trim(),
          deliveryMethod: 'shop_collection',
          items: [
            {
              id: `item-${Date.now()}`,
              productId: prod?.id || 'prod-custom',
              productName: prod?.name || 'Custom Print Job',
              pricingType: prod?.pricingType || 'fixed',
              quantity: walkinQuantity,
              material: walkinMaterial,
              specialInstructions: walkinDimensions.trim() ? `Dimensions: ${walkinDimensions.trim()}` : '',
              totalPrice: subtotal,
            },
          ],
          subtotal,
          designCharges: walkinDesignCharge,
          additionalCharges: 0,
          discount: walkinDiscount,
          deliveryCharges: 0,
          grandTotal,
          advancePaid: walkinAdvancePaid,
          balanceDue,
          orderStatus: 'Order Received',
          paymentStatus: balanceDue === 0 ? 'Paid' : walkinAdvancePaid > 0 ? 'Partially Paid' : 'Unpaid',
          productionMethod: walkinMethod,
          expectedCompletionDate: walkinExpectedDate || undefined,
          internalNotes: walkinNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setWalkinName('');
        setWalkinPhone('');
        setWalkinAdvancePaid(0);
        setWalkinNotes('');
        loadData();
      } else {
        alert('Failed to create order: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error creating order: ' + err.message);
    }
  };

  // Submit offline payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder || paymentAmount <= 0) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobNumber: paymentModalOrder.jobNumber,
          orderId: paymentModalOrder.id,
          customerId: paymentModalOrder.customerId,
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes.trim() || 'Offline shop counter payment',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentModalOrder(null);
        setPaymentAmount(0);
        setPaymentNotes('');
        loadData();
      } else {
        alert('Failed to record payment: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error recording payment: ' + err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter && o.orderStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchJob = o.jobNumber.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchProd = o.items.some((i) => i.productName.toLowerCase().includes(q));
      if (!matchJob && !matchName && !matchPhone && !matchProd) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Orders Table Card (AdminLTE 4 Standard) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800">Orders Directory</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredOrders.length} orders
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 bg-slate-50/50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Order Received">Order Received</option>
              <option value="Design Pending">Design Pending</option>
              <option value="Design Approved">Design Approved</option>
              <option value="Work in Progress">Work in Progress</option>
              <option value="Printing Completed">Printing Completed</option>
              <option value="Ready for Collection">Ready for Collection</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Walk-in Order</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Job Number</th>
                <th className="py-2.5 px-4">Customer Details</th>
                <th className="py-2.5 px-4">Items / Specs</th>
                <th className="py-2.5 px-4">Grand Total</th>
                <th className="py-2.5 px-4">Advance</th>
                <th className="py-2.5 px-4">Balance</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Status & Action</th>
                <th className="py-2.5 px-4 text-right">Job Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading database orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-dp-navy whitespace-nowrap">
                      {ord.jobNumber}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ord.customerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {ord.items.map((it) => (
                        <div key={it.id} className="truncate">
                          <span className="font-semibold text-slate-800">{it.productName}</span>{' '}
                          <span className="text-slate-500">x{it.quantity}</span>
                          {it.material && <span className="text-[10px] text-slate-400 ml-1">({it.material})</span>}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      ₹{ord.grandTotal}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700 whitespace-nowrap">
                      ₹{ord.advancePaid}
                    </td>
                    <td className="py-3 px-4 font-bold whitespace-nowrap">
                      {ord.balanceDue === 0 ? (
                        <span className="text-emerald-600 font-bold">Cleared (₹0)</span>
                      ) : (
                        <button
                          onClick={() => {
                            setPaymentModalOrder(ord);
                            setPaymentAmount(ord.balanceDue);
                          }}
                          className="text-amber-700 hover:text-amber-900 underline font-bold"
                          title="Click to record offline payment"
                        >
                          ₹{ord.balanceDue} (Collect)
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.productionMethod === 'hybrid'
                            ? 'bg-purple-100 text-purple-800'
                            : ord.productionMethod === 'vendor_outsourced'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.productionMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-slate-200 bg-white font-medium focus:outline-none"
                      >
                        <option value="Order Received">Order Received</option>
                        <option value="Design Pending">Design Pending</option>
                        <option value="Design Approved">Design Approved</option>
                        <option value="Work in Progress">Work in Progress</option>
                        <option value="Printing Completed">Printing Completed</option>
                        <option value="Ready for Collection">Ready for Collection</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setJobCardOrder(ord)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-dp-navy transition"
                        title="Print Job Card"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: WALK-IN / OFFLINE ORDER CREATION */}
      {/* ========================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-dp-navy">Create Walk-in / Offline Order</h3>
                <p className="text-xs text-slate-500">
                  Instantly creates unified Job Number, customer profile, and job card.
                </p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkinOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    placeholder="e.g. Ramesh Babu"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Base Product</label>
                  <select
                    value={walkinSelectedProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy bg-white font-medium"
                  >
                    {products.map((p) => {
                      const req = productRequiresDimensions(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {req ? '• (Requires Dimensions / Size)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={walkinQuantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      setWalkinQuantity(qty);
                      const prod = products.find((p) => p.id === walkinSelectedProduct);
                      if (prod) {
                        setWalkinPrintingCharge(prod.basePrice * qty);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
              </div>

              {/* Dimensions & Material Specification (Only show dimensions when required or toggled) */}
              {(() => {
                const currentProd = products.find((p) => p.id === walkinSelectedProduct);
                const reqDims = productRequiresDimensions(currentProd);
                const shouldShow = reqDims || showCustomDimensions;

                if (shouldShow) {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Dimensions / Size {reqDims ? '*' : ''}
                          </label>
                          {!reqDims && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomDimensions(false);
                                setWalkinDimensions('');
                              }}
                              className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={walkinDimensions}
                          onChange={(e) => setWalkinDimensions(e.target.value)}
                          placeholder="e.g. 10x4 ft / 5x3 ft"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Material Specification</label>
                        <input
                          type="text"
                          value={walkinMaterial}
                          onChange={(e) => setWalkinMaterial(e.target.value)}
                          placeholder={currentProd?.materials?.[0]?.name || "e.g. Star Flex 340 GSM"}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Material Specification
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCustomDimensions(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        + Add Dimensions / Size (Optional)
                      </button>
                    </div>
                    <input
                      type="text"
                      value={walkinMaterial}
                      onChange={(e) => setWalkinMaterial(e.target.value)}
                      placeholder={currentProd?.materials?.[0]?.name || "e.g. Premium White Ceramic"}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                    />
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Printing Charges (₹)</label>
                  <input
                    type="number"
                    value={walkinPrintingCharge}
                    onChange={(e) => setWalkinPrintingCharge(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Design Fee (₹)</label>
                  <input
                    type="number"
                    value={walkinDesignCharge}
                    onChange={(e) => setWalkinDesignCharge(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={walkinDiscount}
                    onChange={(e) => setWalkinDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Advance Paid at Counter (₹)</label>
                  <input
                    type="number"
                    value={walkinAdvancePaid}
                    onChange={(e) => setWalkinAdvancePaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Production Method</label>
                  <select
                    value={walkinMethod}
                    onChange={(e: any) => setWalkinMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy bg-white"
                  >
                    <option value="in_house">In-House Production</option>
                    <option value="vendor_outsourced">Vendor Outsourced</option>
                    <option value="hybrid">Hybrid (Internal + Vendor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={walkinExpectedDate}
                    onChange={(e) => setWalkinExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={walkinNotes}
                    onChange={(e) => setWalkinNotes(e.target.value)}
                    placeholder="e.g. Eyelets on 4 corners"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-dp-navy text-white rounded-lg hover:bg-dp-orange transition shadow"
                >
                  Generate Order & Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PRINTABLE JOB CARD (SECTION 14 REQUIREMENT) */}
      {/* ========================================================= */}
      {jobCardOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-200 no-print">
              <span className="font-bold text-xs sm:text-sm text-slate-500 uppercase tracking-wider">
                Production Job Card Proof
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => window.print()}
                  className="bg-dp-navy hover:bg-dp-orange text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4 Job Card</span>
                </button>
                <button onClick={() => setJobCardOrder(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="space-y-5 text-xs text-dp-charcoal">
              {/* Job Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="text-xl font-black text-dp-navy">DG graphics</div>
                  <div className="text-[11px] text-slate-500">Commercial Printing & Graphic Design Studio</div>
                  <div className="text-[10px] text-slate-400">Indiranagar, Bengaluru &bull; +91 98450 12345</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PRODUCTION JOB CARD</div>
                  <div className="text-2xl font-mono font-black text-dp-orange">{jobCardOrder.jobNumber}</div>
                  <div className="text-[10px] text-slate-500">
                    Order Date: {new Date(jobCardOrder.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-[11px] uppercase text-slate-400">Customer Name</strong>
                  <span className="font-bold text-sm text-slate-900">{jobCardOrder.customerName}</span>
                  <div className="text-[11px] text-slate-600">Ph: {jobCardOrder.customerPhone}</div>
                </div>
                <div>
                  <strong className="block text-[11px] uppercase text-slate-400">Expected Completion</strong>
                  <span className="font-bold text-sm text-slate-900">
                    {jobCardOrder.expectedCompletionDate || 'Immediate / 24h'}
                  </span>
                  <div className="text-[11px] text-slate-600">
                    Method: {jobCardOrder.deliveryMethod.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Items & Fabrication Specs */}
              <div>
                <strong className="block text-xs uppercase text-slate-500 mb-2 font-bold">
                  Fabrication & Machine Specifications
                </strong>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-slate-200 min-w-[500px]">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                      <tr>
                        <th className="p-2 border border-slate-200">Product</th>
                        <th className="p-2 border border-slate-200">Qty</th>
                        <th className="p-2 border border-slate-200">Dimensions / Material</th>
                        <th className="p-2 border border-slate-200">Finishing / Add-on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobCardOrder.items.map((it) => (
                        <tr key={it.id} className="border-t border-slate-200">
                          <td className="p-2 border border-slate-200 font-bold">{it.productName}</td>
                          <td className="p-2 border border-slate-200">{it.quantity}</td>
                          <td className="p-2 border border-slate-200">
                            {it.width ? `${it.width} x ${it.height} ${it.unit} (${it.areaSqft} sq.ft)` : it.selectedSize || ''}
                            <br />
                            <span className="text-[10px] text-slate-500">{it.material || 'Standard Media'}</span>
                          </td>
                          <td className="p-2 border border-slate-200">
                            {it.finishing?.join(', ') || 'Standard cut'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Custom Instructions */}
              {(jobCardOrder.customerNotes || jobCardOrder.internalNotes) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <strong className="block text-[11px] text-amber-900 uppercase font-bold">
                    Special Production Instructions:
                  </strong>
                  <p className="text-xs text-amber-950">
                    {jobCardOrder.internalNotes || jobCardOrder.customerNotes}
                  </p>
                </div>
              )}

              {/* Production Routing & QA Sign-off */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Design Checked</span>
                  <div className="h-6 sm:h-8"></div>
                  <span className="text-[10px] text-slate-500">Sign: ______________</span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Printing Done</span>
                  <div className="h-6 sm:h-8"></div>
                  <span className="text-[10px] text-slate-500">Operator: ______________</span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">QA / Packing</span>
                  <div className="h-6 sm:h-8"></div>
                  <span className="text-[10px] text-slate-500">Checked: ______________</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: OFFLINE PAYMENT RECORDING */}
      {/* ========================================================= */}
      {paymentModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">
                Record Offline Payment &bull; {paymentModalOrder.jobNumber}
              </h3>
              <button onClick={() => setPaymentModalOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <span>Customer: <strong>{paymentModalOrder.customerName}</strong></span>
                <span>Outstanding: <strong className="text-amber-700">₹{paymentModalOrder.balanceDue}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModalOrder.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy bg-white"
                >
                  <option value="Cash">Cash (Counter)</option>
                  <option value="Offline UPI">Offline UPI (GPay / PhonePe / QR)</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid cash at shop upon mug collection"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-dp-navy"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow"
                >
                  Record Payment & Clear Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
