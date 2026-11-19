'use client';

import React, { useState, useEffect } from 'react';
import { Labour, Order } from '@/types';
import { UserCheck, PlusCircle, DollarSign, Phone, CheckCircle2, X } from 'lucide-react';

export default function AdminLabourPage() {
  const [workers, setWorkers] = useState<Labour[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Labour | null>(null);

  // New Worker Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workType, setWorkType] = useState('Machine Operator');
  const [paymentType, setPaymentType] = useState<'fixed_salary' | 'per_job' | 'per_unit'>('per_job');
  const [defaultRate, setDefaultRate] = useState<number>(250);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Assign Labour to Job Form
  const [assignJobNumber, setAssignJobNumber] = useState('');
  const [assignDesc, setAssignDesc] = useState('Flex Printing & Trimming');
  const [assignAmount, setAssignAmount] = useState<number>(200);
  const [assignIsPaid, setAssignIsPaid] = useState(true);

  const loadData = async () => {
    try {
      const [lRes, oRes] = await Promise.all([
        fetch('/api/labour'),
        fetch('/api/orders'),
      ]);
      const lData = await lRes.json();
      const oData = await oRes.json();
      if (lData.success) setWorkers(lData.labour);
      if (oData.success) {
        setOrders(oData.orders);
        if (oData.orders.length > 0) setAssignJobNumber(oData.orders[0].jobNumber);
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

  const totalPendingWages = workers.reduce((s, w) => s + w.pendingAmount, 0);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/labour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          workType,
          paymentType,
          defaultRate: Number(defaultRate),
          startDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkerModalOpen(false);
        setName('');
        setPhone('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    try {
      const res = await fetch('/api/labour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transaction',
          labourId: selectedWorker.id,
          labourName: selectedWorker.name,
          jobNumber: assignJobNumber,
          description: assignDesc,
          amount: Number(assignAmount),
          isPaid: assignIsPaid,
          paymentMethod: 'Cash',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dp-navy tracking-tight">
            Labour & Workforce Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage graphic designers, flex operators, screen printers, and on-site installers. Attribute wages to specific jobs.
          </p>
        </div>

        <button
          onClick={() => setWorkerModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-dp-navy hover:bg-dp-orange text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition"
        >
          <PlusCircle className="w-4 h-4 text-dp-orange" />
          <span>Add Staff / Worker</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Active Personnel</span>
          <div className="text-2xl font-black text-dp-navy mt-1">{workers.length}</div>
          <span className="text-[11px] text-slate-400">Designers, operators & fabricators</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Wages Disbursed</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{workers.reduce((s, w) => s + w.totalPaid, 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">Cumulative payments cleared</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-600 block">Pending Worker Dues</span>
          <div className="text-2xl font-black text-amber-700 mt-1">₹{totalPendingWages.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400">Accrued wages payable</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {workers.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {w.workType}
              </span>
              <h3 className="font-extrabold text-dp-navy text-base mt-1">{w.name}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{w.phone}</span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1">
                Type: <strong className="capitalize">{w.paymentType.replace('_', ' ')}</strong> (Default: ₹{w.defaultRate})
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Earned</span>
                  <span className="font-bold text-slate-900">₹{w.totalEarnings}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Pending Due</span>
                  <span className="font-black text-amber-700">₹{w.pendingAmount}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedWorker(w);
                  setAssignAmount(w.defaultRate);
                  setAssignModalOpen(true);
                }}
                className="w-full text-center py-1.5 text-xs font-bold text-dp-navy hover:text-dp-orange bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Assign Job & Record Wage &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Worker Modal */}
      {workerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">Add Staff or Labour Worker</h3>
              <button onClick={() => setWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Employee Start / Joining Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Role / Work Type</label>
                  <input
                    type="text"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    placeholder="e.g. Graphic Designer / Fabricator"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
                  <select
                    value={paymentType}
                    onChange={(e: any) => setPaymentType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="per_job">Per Job</option>
                    <option value="fixed_salary">Monthly Salary</option>
                    <option value="per_unit">Per Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Default Rate / Wage (₹)</label>
                <input
                  type="number"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWorkerModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-dp-navy text-white rounded-lg shadow"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Labour to Job Modal */}
      {assignModalOpen && selectedWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-dp-navy">Assign Task to {selectedWorker.name}</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignLabour} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Job Number</label>
                <select
                  value={assignJobNumber}
                  onChange={(e) => setAssignJobNumber(e.target.value)}
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Task Description</label>
                <input
                  type="text"
                  required
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Wage Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={assignAmount}
                  onChange={(e) => setAssignAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPaidCheck"
                  checked={assignIsPaid}
                  onChange={(e) => setAssignIsPaid(e.target.checked)}
                  className="rounded text-dp-orange focus:ring-dp-orange"
                />
                <label htmlFor="isPaidCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Mark Paid Immediately (Record as cash expense)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-dp-navy text-white rounded-lg shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
