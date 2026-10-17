'use client';

import React, { useState } from 'react';
import { Boxes, Plus, Warehouse, TrendingUp, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { Lang, StockItem } from '../../lib/types';
import { cropLabel } from '../../lib/farmI18n';
import { POPULAR_CROPS } from '../farm/FarmForm';

interface StockSectionProps {
  lang: Lang;
  onNavigateToSale?: (crop: string) => void;
}

export function StockSection({ lang, onNavigateToSale }: StockSectionProps) {
  const isHi = lang === 'hi';

  const [stocks, setStocks] = useState<StockItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kisan-sathi-stocks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      {
        id: 'stock-1',
        crop: 'Wheat',
        quantity: 35,
        unit: 'Quintal',
        harvestDate: '2026-03-25',
        khetName: 'बड़ा चक (उत्तर खेत)',
        storageLocation: 'घर का गोदाम / कोठार',
        expectedPrice: 2450,
        notes: 'लोकवन ग्रेड A सूखा गेहूं',
      },
      {
        id: 'stock-2',
        crop: 'Garlic',
        quantity: 12,
        unit: 'Quintal',
        harvestDate: '2026-03-10',
        khetName: 'नहर वाला चक',
        storageLocation: 'हवादार कमरा (जाली पर)',
        expectedPrice: 9000,
        notes: 'रियावन वैरायटी मोटा लहसुन',
      },
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStock, setNewStock] = useState({
    crop: 'Wheat',
    quantity: '',
    unit: 'Quintal',
    khetName: '',
    storageLocation: '',
    expectedPrice: '',
    notes: '',
  });

  const saveStocks = (updated: StockItem[]) => {
    setStocks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kisan-sathi-stocks', JSON.stringify(updated));
    }
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(newStock.quantity);
    if (!q || q <= 0) return;

    const item: StockItem = {
      id: `stock-${Date.now()}`,
      crop: newStock.crop,
      quantity: q,
      unit: newStock.unit,
      harvestDate: new Date().toISOString().slice(0, 10),
      khetName: newStock.khetName.trim() || undefined,
      storageLocation: newStock.storageLocation.trim() || undefined,
      expectedPrice: parseFloat(newStock.expectedPrice) || undefined,
      notes: newStock.notes.trim() || undefined,
    };

    saveStocks([item, ...stocks]);
    setShowAddModal(false);
    setNewStock({
      crop: 'Wheat',
      quantity: '',
      unit: 'Quintal',
      khetName: '',
      storageLocation: '',
      expectedPrice: '',
      notes: '',
    });
  };

  const handleDelete = (id: string) => {
    saveStocks(stocks.filter((s) => s.id !== id));
  };

  const totalQuintals = stocks.reduce((acc, s) => {
    const q = Number(s.quantity) || 0;
    if (s.unit === 'Kg') return acc + q / 100;
    if (s.unit === 'Ton') return acc + q * 10;
    return acc + q;
  }, 0);

  const totalEstimatedValue = stocks.reduce((acc, s) => {
    const q = Number(s.quantity) || 0;
    const p = Number(s.expectedPrice) || 0;
    return acc + q * p;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
        <div>
          <h2 className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
            <Boxes className="text-emerald-500" size={20} />
            <span>{isHi ? 'गोदाम / भंडार स्टॉक प्रबंधन' : 'Warehouse Inventory'}</span>
          </h2>
          <p className="text-xs text-[var(--sk-muted)] mt-0.5">
            {isHi
              ? 'कटाई के बाद घर या गोदाम में सुरक्षित रखा अनाज व भाव बढ़ने पर बिक्री'
              : 'Stored harvest yield waiting for optimal Mandi market price'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-[var(--sk-muted)] block">{isHi ? 'अनुमानित कुल मूल्य' : 'Estimated Value'}</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{totalEstimatedValue.toLocaleString('en-IN')}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
          >
            <Plus size={15} />
            <span>{isHi ? '+ स्टॉक जोड़ें' : '+ Add Stock'}</span>
          </button>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stocks.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] hover:border-emerald-500/40 transition flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold">
                    🌾
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--sk-text)]">
                      {cropLabel(lang, item.crop)}
                    </h3>
                    <div className="text-[11px] text-[var(--sk-muted)] mt-0.5">
                      {item.storageLocation || (isHi ? 'सुरक्षित भंडार' : 'Storage')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded text-[var(--sk-muted)] hover:text-red-500 transition cursor-pointer"
                  title="हटाएं"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--sk-muted)] block">{isHi ? 'स्टॉक मात्रा' : 'Quantity'}</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.expectedPrice && (
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--sk-muted)] block">{isHi ? 'अपेक्षित भाव' : 'Exp Rate'}</span>
                    <span className="text-xs font-mono font-bold text-[var(--sk-text)]">
                      ₹{item.expectedPrice}/Qtl
                    </span>
                  </div>
                )}
              </div>

              {item.notes && (
                <p className="text-[11px] text-[var(--sk-muted)] mt-2 truncate">
                  📝 {item.notes}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                {item.khetName ? `🌱 ${item.khetName}` : ''}
              </span>
              {onNavigateToSale && (
                <button
                  type="button"
                  onClick={() => onNavigateToSale(item.crop)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <TrendingUp size={13} />
                  <span>{isHi ? 'मंडी में बेचें' : 'Sell to Mandi'}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {stocks.length === 0 && (
          <div className="col-span-full p-8 text-center rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)]">
            <Warehouse size={36} className="mx-auto mb-2 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-300">
              {isHi ? 'गोदाम में कोई स्टॉक दर्ज नहीं है' : 'No inventory records'}
            </h3>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <form
            onSubmit={handleAddStock}
            className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <h3 className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
                <Warehouse size={16} className="text-emerald-500" />
                <span>{isHi ? 'गोदाम में नया स्टॉक दर्ज करें' : 'Add Stock Item'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--sk-muted)] hover:text-[var(--sk-text)] p-1 rounded-lg"
              >
                <Trash2 size={14} className="hidden" />
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">फसल चुनें:</label>
                <select
                  value={newStock.crop}
                  onChange={(e) => setNewStock({ ...newStock, crop: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {POPULAR_CROPS.map((c) => (
                    <option key={c} value={c}>
                      {cropLabel(lang, c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">मात्रा:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="30"
                    value={newStock.quantity}
                    onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-emerald-600 dark:text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">इकाई:</label>
                  <select
                    value={newStock.unit}
                    onChange={(e) => setNewStock({ ...newStock, unit: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Quintal">क्विंटल (Quintal)</option>
                    <option value="Kg">किलो (Kg)</option>
                    <option value="बोरी">बोरी (Bags)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">भंडारण स्थान (Storage Location):</label>
                <input
                  type="text"
                  placeholder="घर का कोठार / गोदाम"
                  value={newStock.storageLocation}
                  onChange={(e) => setNewStock({ ...newStock, storageLocation: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">अपेक्षित बिक्री भाव (₹/क्विंटल):</label>
                <input
                  type="number"
                  placeholder="2500"
                  value={newStock.expectedPrice}
                  onChange={(e) => setNewStock({ ...newStock, expectedPrice: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[var(--sk-border)]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] text-xs font-semibold cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                सुरक्षित करें
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
