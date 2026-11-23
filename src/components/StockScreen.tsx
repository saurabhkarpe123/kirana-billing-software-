import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  formatQuantity,
  formatRupees,
  formatUnitRateLabel,
  matchesProductQuery,
  translations,
} from '../i18n/translations';
import { Language, Product, UnitType } from '../types/pos';

interface StockScreenProps {
  lang: Language;
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

type StockFilter = 'all' | 'low' | 'kg';

export function StockScreen({
  lang,
  products,
  onSaveProduct,
  onDeleteProduct,
}: StockScreenProps) {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form fields
  const [nameMr, setNameMr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState<UnitType>('kg');
  const [bagWeightKg, setBagWeightKg] = useState('30');
  const [rate, setRate] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('5');

  const openAddModal = () => {
    setIsAddingNew(true);
    setEditingProduct(null);
    setConfirmDelete(false);
    setNameMr('');
    setNameEn('');
    setPhonetic('');
    setBarcode('');
    setUnit('kg');
    setBagWeightKg('30');
    setRate('');
    setStock('10');
    setLowStockLimit('5');
  };

  const openEditModal = (product: Product) => {
    setIsAddingNew(false);
    setEditingProduct(product);
    setConfirmDelete(false);
    setNameMr(product.nameMr);
    setNameEn(product.nameEn);
    setPhonetic(product.phonetic || '');
    setBarcode(product.barcode);
    setUnit(product.unit);
    setBagWeightKg(String(product.bagWeightKg || 30));
    setRate(String(product.rate));
    setStock(String(product.stock));
    setLowStockLimit(String(product.lowStockLimit));
  };

  const closeModal = () => {
    setIsAddingNew(false);
    setEditingProduct(null);
    setConfirmDelete(false);
  };

  const handleGenerateBarcode = () => {
    const randomPart = Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(`8901${randomPart}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mr = nameMr.trim() || nameEn.trim();
    const en = nameEn.trim() || nameMr.trim();
    const parsedRate = Number(rate);
    const parsedStock = Math.max(0, Number(stock) || 0);
    const parsedLowLimit = Math.max(0, Number(lowStockLimit) || 5);

    if (!mr || Number.isNaN(parsedRate) || parsedRate <= 0) return;

    const parsedBagWeight = Math.max(1, Number(bagWeightKg) || 30);

    const saved: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      nameMr: mr,
      nameEn: en,
      phonetic: phonetic.trim() || en.toLowerCase(),
      barcode:
        barcode.trim() ||
        `8901${Math.floor(100000000 + Math.random() * 900000000)}`,
      unit,
      bagWeightKg: unit === 'katta' ? parsedBagWeight : undefined,
      rate: Math.round(parsedRate * 100) / 100,
      stock: Math.round(parsedStock * 1000) / 1000,
      lowStockLimit: parsedLowLimit,
    };

    onSaveProduct(saved);
    closeModal();
  };

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.lowStockLimit).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filter === 'low' && p.stock > p.lowStockLimit) return false;
      if (filter === 'kg' && p.unit !== 'kg') return false;
      return matchesProductQuery(p, searchQuery);
    });
  }, [products, searchQuery, filter]);

  const modalOpen = isAddingNew || editingProduct !== null;

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] sm:text-[30px] font-extrabold text-slate-900">
            {t.stockTitle}
          </h2>
          <p className="text-[19px] font-semibold text-slate-600 mt-0.5">
            {products.length} {t.itemsCountLabel}
            {lowStockCount > 0 && (
              <span className="ml-3 text-amber-800 font-bold">
                · {lowStockCount} {t.lowStockCountLabel}
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-6 py-3.5 min-h-[58px] rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-[20px] font-extrabold flex items-center gap-2.5 transition cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-6 h-6 shrink-0" />
          <span>{t.addItemBtn}</span>
        </button>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-6 h-6 text-slate-500 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchStockPlaceholder}
            className="w-full h-15 pl-14 pr-12 rounded-2xl bg-white border-2 border-slate-300 focus:border-blue-600 text-[19px] font-semibold text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t.closeBtn}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="inline-flex items-center p-1.5 bg-white border-2 border-slate-300 rounded-2xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setFilter('low')}
            className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'low'
                ? 'bg-amber-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.filterLowStock} ({lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('kg')}
            className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'kg'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.filterLooseKg}
          </button>
        </div>
      </div>

      {/* Items & Stock Table */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-[21px] font-bold text-slate-500">
            {t.noStockItemsFound}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 text-[18px] text-slate-700">
                  <th className="py-4 px-5 font-extrabold">{t.colItemName}</th>
                  <th className="py-4 px-5 font-extrabold">{t.colBarcode}</th>
                  <th className="py-4 px-5 font-extrabold">{t.colUnit}</th>
                  <th className="py-4 px-5 font-extrabold text-right">
                    {t.colRate}
                  </th>
                  <th className="py-4 px-5 font-extrabold text-right">
                    {t.colStock}
                  </th>
                  <th className="py-4 px-5 font-extrabold text-right">
                    {t.colAction}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[19px]">
                {filteredProducts.map((product) => {
                  const isLow = product.stock <= product.lowStockLimit;
                  return (
                    <tr
                      key={product.id}
                      className={
                        isLow
                          ? 'bg-yellow-100/90 hover:bg-yellow-100 transition-colors'
                          : 'hover:bg-slate-50 transition-colors'
                      }
                    >
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 text-[20px]">
                          {lang === 'mr' ? product.nameMr : product.nameEn}
                        </div>
                        <div className="text-[18px] text-slate-600 font-medium">
                          {lang === 'mr' ? product.nameEn : product.nameMr}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-[18px] text-slate-700 whitespace-nowrap tabular-nums">
                        {product.barcode}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-800 whitespace-nowrap">
                        {formatUnitRateLabel(
                          product.unit,
                          lang,
                          product.bagWeightKg
                        )}
                      </td>
                      <td className="py-4 px-5 text-right font-extrabold text-blue-900 whitespace-nowrap tabular-nums text-[21px]">
                        {formatRupees(product.rate)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 tabular-nums text-[20px]">
                          {formatQuantity(
                            product.stock,
                            product.unit,
                            lang,
                            product.bagWeightKg
                          )}
                        </div>
                        {isLow && (
                          <div className="inline-flex items-center gap-1 text-[18px] font-extrabold text-amber-900 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                            <span>{t.lowStockBadge}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[46px] rounded-xl bg-white hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-600 text-slate-900 text-[18px] font-bold transition cursor-pointer"
                        >
                          <Pencil className="w-5 h-5 text-blue-700" />
                          <span>{t.editBtn}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT ITEM MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[580px] w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="text-[23px] font-extrabold">
                {editingProduct ? t.editItemModalTitle : t.addItemModalTitle}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t.closeBtn}
                className="w-11 h-11 rounded-xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                    {t.nameMrLabel}
                  </label>
                  <input
                    type="text"
                    required={!nameEn.trim()}
                    autoFocus
                    value={nameMr}
                    onChange={(e) => setNameMr(e.target.value)}
                    placeholder="उदा. मूग डाळ"
                    className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white text-[19px] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                    {t.nameEnLabel}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Moong Dal"
                    className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white text-[19px] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.phoneticLabel}
                </label>
                <input
                  type="text"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  placeholder={t.phoneticPlaceholder}
                  className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white text-[19px] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.barcodeLabel}
                </label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="8901001000999"
                    className="flex-1 h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white font-mono text-[19px] font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="px-4 h-14 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-900 text-[18px] font-bold whitespace-nowrap cursor-pointer"
                  >
                    {t.generateBarcodeBtn}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.unitLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUnit('piece')}
                    className={`min-h-[54px] px-3 rounded-xl border-2 text-[18px] font-extrabold transition cursor-pointer ${
                      unit === 'piece'
                        ? 'bg-blue-600 border-blue-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {t.unitPiece}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('kg')}
                    className={`min-h-[54px] px-3 rounded-xl border-2 text-[18px] font-extrabold transition cursor-pointer ${
                      unit === 'kg'
                        ? 'bg-blue-600 border-blue-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {t.unitKg}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('katta')}
                    className={`min-h-[54px] px-3 rounded-xl border-2 text-[18px] font-extrabold transition cursor-pointer ${
                      unit === 'katta'
                        ? 'bg-blue-600 border-blue-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {t.unitKatta}
                  </button>
                </div>

                {unit === 'katta' && (
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                    <label className="text-[18px] font-bold text-blue-950">
                      {t.bagWeightLabel}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={bagWeightKg}
                      onChange={(e) => setBagWeightKg(e.target.value)}
                      placeholder={t.bagWeightPlaceholder}
                      className="w-36 h-12 px-3 rounded-xl bg-white border-2 border-blue-400 focus:border-blue-600 text-[22px] font-extrabold text-slate-900 tabular-nums text-right"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                    {t.rateLabel}
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    step="any"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0"
                    className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white text-[22px] font-extrabold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                    {t.currentStockLabel}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white text-[22px] font-extrabold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                    {t.lowStockLimitLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={lowStockLimit}
                    onChange={(e) => setLowStockLimit(e.target.value)}
                    placeholder="5"
                    className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white text-[22px] font-extrabold tabular-nums"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                {editingProduct ? (
                  confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProduct(editingProduct.id);
                          closeModal();
                        }}
                        className="px-4 py-3 min-h-[52px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[18px] font-extrabold cursor-pointer"
                      >
                        {t.deleteBtn} ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-3 min-h-[52px] rounded-xl bg-slate-100 text-slate-800 text-[18px] font-bold cursor-pointer"
                      >
                        {t.cancelBtn}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-2 px-4 py-3 min-h-[52px] rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[18px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>{t.deleteBtn}</span>
                    </button>
                  )
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 min-h-[54px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[19px] font-bold cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-7 min-h-[54px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[20px] font-extrabold cursor-pointer"
                  >
                    {t.saveBtn}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
