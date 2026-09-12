import React, { useState } from 'react';
import { 
  Package, 
  Barcode, 
  Tag, 
  Search, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { Product, SupplierProduct } from '../../types/wayno';
import { PRODUCTS, SUPPLIER_PRODUCTS } from '../../data/mockData';

export const ProductsMasterCatalog: React.FC = () => {
  const [products] = useState<Product[]>(PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = Array.from(new Set(products.map(p => p.internalCategory)));
  const brands = Array.from(new Set(products.map(p => p.brand)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || p.internalCategory === categoryFilter;
    const matchesBrand = brandFilter === 'ALL' || p.brand === brandFilter;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Master SKU Catalog</span>
          <span className="text-base font-bold text-slate-900 font-mono">{products.length} Master SKUs</span>
          <span className="text-[10px] text-emerald-700 block font-medium">Standardized Kenyan FMCG</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Supplier Price Feeds</span>
          <span className="text-base font-bold text-slate-900 font-mono">{SUPPLIER_PRODUCTS.length} Depot Links</span>
          <span className="text-[10px] text-slate-500 block">Multi-wholesaler price comparison</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Sheng / Swahili Synonyms</span>
          <span className="text-base font-bold text-emerald-800 font-mono">
            {products.reduce((sum, p) => sum + p.aliases.length, 0)} Search Aliases
          </span>
          <span className="text-[10px] text-slate-500 block">Sub-50ms OpenSearch indexed</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">EAN Barcode Compliance</span>
          <span className="text-base font-bold text-slate-900 font-mono">100% GS1 Verified</span>
          <span className="text-[10px] text-slate-500 block">Zero collision rate</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-4 h-4 text-slate-700" />
              <span>Master FMCG Product Catalog & Price Index</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Canonical Kenyan FMCG SKUs decoupled from distributors, barcode linkages, wholesale price spreads, and Swahili search aliases.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, brand, barcode, or Sheng alias..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-64"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Brands</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Master SKU & Brand</th>
                <th className="py-2.5 px-3">Barcode & Category</th>
                <th className="py-2.5 px-3">Pack Specification</th>
                <th className="py-2.5 px-3">Recommended RRP</th>
                <th className="py-2.5 px-3">Lowest Wholesale</th>
                <th className="py-2.5 px-3">Duka Margin</th>
                <th className="py-2.5 px-3">Suppliers</th>
                <th className="py-2.5 px-3 text-right">Aliases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const suppliers = SUPPLIER_PRODUCTS.filter(sp => sp.productId === product.id);
                const availableSuppliers = suppliers.filter(sp => sp.availability && sp.stockQty > 0);
                const lowestWholesale = suppliers.length > 0 
                  ? Math.min(...suppliers.map(sp => sp.price)) 
                  : product.recommendedRetailPrice;
                const marginKES = product.recommendedRetailPrice - lowestWholesale;
                const marginPercent = Math.round((marginKES / product.recommendedRetailPrice) * 100);
                const hasMarginInversion = lowestWholesale >= product.recommendedRetailPrice;
                const isOutOfStock = availableSuppliers.length === 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block line-clamp-1 max-w-xs">
                            {product.name}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <span className="font-medium text-slate-800">{product.brand}</span>
                            <span>•</span>
                            <span>{product.manufacturer}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-700">
                        <Barcode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{product.barcode}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {product.internalCategory}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-900 block font-semibold text-xs">
                        {product.packSize}
                      </span>
                      <span className="text-[10px] text-slate-400">Unit: {product.unit}</span>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      KES {product.recommendedRetailPrice.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      KES {lowestWholesale.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      {hasMarginInversion ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          Margin Inverted!
                        </span>
                      ) : (
                        <div>
                          <span className="text-emerald-800 font-bold font-mono text-xs block">
                            +{marginPercent}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            (KES {marginKES.toLocaleString()})
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          Depot Stockout
                        </span>
                      ) : (
                        <div>
                          <span className="font-mono font-semibold text-slate-900 text-xs block">
                            {availableSuppliers.length} depots
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {suppliers.reduce((a, b) => a + b.stockQty, 0)} units total
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1 max-w-[140px] ml-auto">
                        {product.aliases.slice(0, 2).map(alias => (
                          <span key={alias} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {alias}
                          </span>
                        ))}
                        {product.aliases.length > 2 && (
                          <span className="text-[9px] text-slate-400">
                            +{product.aliases.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
