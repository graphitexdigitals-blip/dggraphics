'use client';

import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '@/types';
import { Settings, Save, CheckCircle2, MessageSquare, Building, CreditCard } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-slate-400">Loading settings...</div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium px-4 py-2 rounded-md flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business Identity */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Studio Contact & Address</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">WhatsApp Updates Phone</label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 uppercase mb-1">Facility Physical Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Offline Payment Information */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-dp-orange" />
            <span>Offline Counter Payment & Banking Credentials</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Shop UPI ID (Printed on receipts)</label>
              <input
                type="text"
                value={settings.upiId || ''}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">GSTIN</label>
              <input
                type="text"
                value={settings.gstNumber || ''}
                onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Bank Name</label>
              <input
                type="text"
                value={settings.bankName || ''}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>


        {/* Ready For Collection WhatsApp Template (Section 25) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Ready for Collection Notification Template (Section 25)</span>
          </h3>
          <p className="text-xs text-slate-500">
            This message template is formatted when order status transitions to Ready for Collection.
          </p>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 uppercase mb-1">Message Text</label>
            <textarea
              rows={3}
              value={settings.whatsappTemplates?.readyForCollection || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsappTemplates: {
                    ...settings.whatsappTemplates,
                    readyForCollection: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs resize-none"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-xs shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
