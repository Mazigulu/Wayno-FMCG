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
  Filter,
  X,
  Check,
  Plus,
  Edit3,
  Power,
  Image as ImageIcon,
  FolderPlus,
  ShieldCheck,
  ArrowRight,
  Store,
  HelpCircle,
  ExternalLink,
  Globe,
  MapPin,
  Compass,
  Network,
  ChevronRight,
  GitCommit,
  Radio
} from 'lucide-react';
import { Product, SupplierProduct, ProductSearchScope, SupplyNode, SupplyNodeLevel } from '../../types/wayno';
import { useWayno } from '../../context/WaynoContext';
import { SUPPLY_NODES, geoEngine } from '../../services/hierarchicalGeofenceEngine';

const KENYAN_FMCG_IMAGE_PRESETS = [
  { name: 'Maize Flour', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
  { name: 'Cooking Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80' },
  { name: 'Margarine / Dairy', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80' },
  { name: 'Laundry Bar Soap', url: 'https://images.unsplash.com/photo-1607006411601-775c8cc632dc?w=400&auto=format&fit=crop&q=80' },
  { name: 'Tea Leaves / Beverage', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80' },
  { name: 'Peanuts / Snacks', url: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=400&auto=format&fit=crop&q=80' },
];

export const ProductsMasterCatalog: React.FC = () => {
  const {
    products,
    supplierProducts,
    categories,
    handleCreateProduct,
    handleUpdateProduct,
    handleToggleProductStatus,
    handleAddCategory,
  } = useWayno();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [nodeTierFilter, setNodeTierFilter] = useState<'ALL' | 'ROOT' | 'REGION' | 'LOCAL_NODE'>('ALL');
  const [specificNodeFilter, setSpecificNodeFilter] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Form State for Create / Edit
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPackSize, setFormPackSize] = useState('');
  const [formUnit, setFormUnit] = useState('Piece');
  const [formBasePrice, setFormBasePrice] = useState<number>(100);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(85);
  const [formRRP, setFormRRP] = useState<number>(120);
  const [formMOQ, setFormMOQ] = useState<number>(1);
  const [formImage, setFormImage] = useState(KENYAN_FMCG_IMAGE_PRESETS[0].url);
  const [formDescription, setFormDescription] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
  // Supply Node Tree Classification State
  const [formNodeLevel, setFormNodeLevel] = useState<SupplyNodeLevel>('ROOT');
  const [formPrimaryNodeId, setFormPrimaryNodeId] = useState<string>('root_kenya');
  const [formAssignedNodeIds, setFormAssignedNodeIds] = useState<string[]>(['root_kenya']);
  const [formMaxRadiusKm, setFormMaxRadiusKm] = useState<number>(20);

  const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);

  const resetForm = () => {
    setFormName('');
    setFormBrand('');
    setFormManufacturer('');
    setFormCategory(categories[0] || 'Dry Goods');
    setFormPackSize('');
    setFormUnit('Piece');
    setFormBasePrice(100);
    setFormWholesalePrice(85);
    setFormRRP(120);
    setFormMOQ(1);
    setFormImage(KENYAN_FMCG_IMAGE_PRESETS[0].url);
    setFormDescription('');
    setFormBarcode(`6161${Math.floor(100000000 + Math.random() * 900000000)}`);
    setFormKeywords('');
    setFormAliases('');
    setFormStatus('ACTIVE');
    setFormNodeLevel('ROOT');
    setFormPrimaryNodeId('root_kenya');
    setFormAssignedNodeIds(['root_kenya']);
    setFormMaxRadiusKm(20);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormBrand(product.brand);
    setFormManufacturer(product.manufacturer);
    setFormCategory(product.category_internal || product.internalCategory);
    setFormPackSize(product.pack_size || product.packSize);
    setFormUnit(product.unit);
    setFormBasePrice(product.basePrice || product.recommendedRetailPrice * 0.8);
    setFormWholesalePrice(product.wholesalePrice || Math.round(product.recommendedRetailPrice * 0.85));
    setFormRRP(product.recommendedRetailPrice);
    setFormMOQ(product.minimumOrderQuantity || 1);
    setFormImage(product.image);
    setFormDescription(product.description || '');
    setFormBarcode(product.barcode);
    setFormKeywords(product.keywords ? product.keywords.join(', ') : '');
    setFormAliases(product.aliases ? product.aliases.join(', ') : '');
    setFormStatus(product.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');

    // Resolve Supply Node Tree placement
    let level: SupplyNodeLevel = product.supplyNodeLevel || 'ROOT';
    if (!product.supplyNodeLevel && product.searchScope) {
      if (product.searchScope === 'LOCAL' || product.searchScope === 'LOCAL_NODE') level = 'LOCAL_NODE';
      else if (product.searchScope === 'REGION') level = 'REGION';
      else level = 'ROOT';
    }
    setFormNodeLevel(level);

    let primaryNode = product.primarySupplyNodeId;
    if (!primaryNode) {
      if (level === 'ROOT') primaryNode = 'root_kenya';
      else if (level === 'REGION') primaryNode = 'region_nairobi_metro';
      else primaryNode = 'node_eastleigh_20km';
    }
    setFormPrimaryNodeId(primaryNode);

    let assigned = product.assignedSupplyNodeIds ? [...product.assignedSupplyNodeIds] : [];
    if (assigned.length === 0) {
      if (product.targetServiceZones && product.targetServiceZones.length > 0) {
        assigned = product.targetServiceZones.map(z => {
          if (z.includes('east')) return 'node_eastleigh_20km';
          if (z.includes('west')) return 'node_nairobi_west_20km';
          return 'node_industrial_area_20km';
        });
      } else {
        assigned = [primaryNode];
      }
    }
    setFormAssignedNodeIds(assigned);
    setFormMaxRadiusKm(product.maxSearchRadiusKm || 20);
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBrand.trim()) return;

    const keywordsArray = formKeywords.split(',').map(s => s.trim()).filter(Boolean);
    const aliasesArray = formAliases.split(',').map(s => s.trim()).filter(Boolean);

    const productPayload: Omit<Product, 'id'> = {
      product_id: editingProduct?.id,
      name: formName.trim(),
      brand: formBrand.trim(),
      manufacturer: formManufacturer.trim() || formBrand.trim(),
      description: formDescription.trim() || `${formName} manufactured for Kenyan FMCG retail distribution.`,
      packSize: formPackSize.trim() || 'Single Unit',
      pack_size: formPackSize.trim() || 'Single Unit',
      unit: formUnit.trim() || 'Piece',
      internalCategory: formCategory,
      category_internal: formCategory,
      basePrice: Number(formBasePrice),
      wholesalePrice: Number(formWholesalePrice),
      recommendedRetailPrice: Number(formRRP),
      minimumOrderQuantity: Number(formMOQ),
      image: formImage.trim() || KENYAN_FMCG_IMAGE_PRESETS[0].url,
      barcode: formBarcode.trim() || `6161${Math.floor(100000000 + Math.random() * 900000000)}`,
      keywords: keywordsArray.length > 0 ? keywordsArray : [formBrand.toLowerCase(), formName.toLowerCase()],
      synonyms: aliasesArray,
      aliases: aliasesArray,
      status: formStatus,
      // Supply Node Tree placement
      supplyNodeLevel: formNodeLevel,
      primarySupplyNodeId: formPrimaryNodeId,
      assignedSupplyNodeIds: formAssignedNodeIds,
      searchScope: formNodeLevel === 'ROOT' ? 'ROOT' : formNodeLevel,
      targetServiceZones: formAssignedNodeIds,
      maxSearchRadiusKm: formNodeLevel === 'LOCAL_NODE' ? Number(formMaxRadiusKm) : undefined,
    };

    if (editingProduct) {
      handleUpdateProduct(editingProduct.id, productPayload);
    } else {
      handleCreateProduct(productPayload);
    }

    setIsCreateModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      handleAddCategory(newCategoryInput.trim());
      setFormCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      setIsAddCategoryModalOpen(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.aliases?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

    const currentCat = p.category_internal || p.internalCategory;
    const matchesCategory = categoryFilter === 'ALL' || currentCat === categoryFilter;
    const matchesBrand = brandFilter === 'ALL' || p.brand === brandFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    // Supply Node Tree filter
    const pLevel: SupplyNodeLevel = p.supplyNodeLevel || (p.searchScope === 'LOCAL' || p.searchScope === 'LOCAL_NODE' ? 'LOCAL_NODE' : p.searchScope === 'REGION' ? 'REGION' : 'ROOT');
    const matchesTier = nodeTierFilter === 'ALL' || pLevel === nodeTierFilter;
    const matchesSpecificNode = specificNodeFilter === 'ALL' || 
      p.primarySupplyNodeId === specificNodeFilter || 
      p.assignedSupplyNodeIds?.includes(specificNodeFilter);

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesTier && matchesSpecificNode;
  });

  const activeCount = products.filter(p => p.status === 'ACTIVE').length;
  const inactiveCount = products.filter(p => p.status === 'INACTIVE').length;

  return (
    <div className="space-y-4">
      {/* Section 13 Architectural Header Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-md p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                Section 13: Product Management
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                Admin Central Master Catalog
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-1">
              WAYNO Operations Product Management System
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              <strong>Admin governs platform FMCG availability:</strong> Admin creates products, sets benchmark pricing (base, wholesale, and RRP), defines MOQs, manages categories, uploads product imagery, and controls active/inactive status. Wholesalers then adopt approved active products into their depot catalogs and customize their physical stock and selling price.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </button>
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-2 rounded text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>Add Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Master FMCG SKUs</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold text-slate-900 font-mono">{products.length} Total</span>
            <span className="text-[11px] text-emerald-700 font-semibold font-mono">({activeCount} Active)</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Admin-governed catalog</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Wholesaler Depot Links</span>
          <span className="text-base font-bold text-slate-900 font-mono">{supplierProducts.length} Price Feeds</span>
          <span className="text-[10px] text-slate-500 block">Adopted across physical depots</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Product Categories</span>
          <span className="text-base font-bold text-indigo-800 font-mono">{categories.length} Categories</span>
          <span className="text-[10px] text-slate-500 block">Structured FMCG hierarchy</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Disabled / Inactive SKUs</span>
          <span className={`text-base font-bold font-mono ${inactiveCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {inactiveCount} Disabled
          </span>
          <span className="text-[10px] text-slate-500 block">Hidden from wholesale adoption</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-4 h-4 text-slate-700" />
              <span>Section 13 Admin Product Master Index</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage product identity, benchmark wholesale/retail pricing, MOQs, and active distribution flags.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, brand, barcode..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-44 sm:w-56"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            <select
              value={nodeTierFilter}
              onChange={(e) => setNodeTierFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Tree Tiers</option>
              <option value="ROOT">🌐 Level 0: ROOT (National Grid)</option>
              <option value="REGION">🏛️ Level 1: REGION (Corridors)</option>
              <option value="LOCAL_NODE">📍 Level 2: LOCAL_NODE (20km)</option>
            </select>

            <select
              value={specificNodeFilter}
              onChange={(e) => setSpecificNodeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Supply Nodes ({SUPPLY_NODES.length})</option>
              {SUPPLY_NODES.map(node => (
                <option key={node.id} value={node.id}>
                  {node.code}: {node.name}
                </option>
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
                <th className="py-2.5 px-3">Category & Pack</th>
                <th className="py-2.5 px-3">Admin Pricing (Base / WS / RRP)</th>
                <th className="py-2.5 px-3">Admin MOQ</th>
                <th className="py-2.5 px-3">Platform Status</th>
                <th className="py-2.5 px-3">Supply Node Tree Placement</th>
                <th className="py-2.5 px-3">Wholesaler Feeds</th>
                <th className="py-2.5 px-3 text-right">Section 13 Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const suppliers = supplierProducts.filter(sp => sp.productId === product.id);
                const availableSuppliers = suppliers.filter(sp => sp.availability && sp.stockQty > 0);
                const isActive = product.status === 'ACTIVE';
                const cat = product.category_internal || product.internalCategory;
                const pack = product.pack_size || product.packSize;
                const recWholesale = product.wholesalePrice || Math.round(product.recommendedRetailPrice * 0.85);
                const base = product.basePrice || Math.round(product.recommendedRetailPrice * 0.8);
                const moq = product.minimumOrderQuantity || 1;

                // Supply Node metadata
                const pLevel: SupplyNodeLevel = product.supplyNodeLevel || 
                  (product.searchScope === 'LOCAL' || product.searchScope === 'LOCAL_NODE' ? 'LOCAL_NODE' : product.searchScope === 'REGION' ? 'REGION' : 'ROOT');
                const primaryNode = product.primarySupplyNodeId ? geoEngine.getNodeById(product.primarySupplyNodeId) : undefined;
                const nodeHierarchy = product.primarySupplyNodeId ? geoEngine.getNodePath(product.primarySupplyNodeId) : '';

                return (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${!isActive ? 'bg-slate-50/50 opacity-75' : ''}`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0 bg-slate-100"
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
                          <span className="text-[10px] font-mono text-slate-400">
                            EAN: {product.barcode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-slate-800 block">
                        {cat}
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        Pack: {pack}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Unit: {product.unit}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-500 text-[10px] w-12">RRP:</span>
                          <span className="font-bold text-slate-900">KES {product.recommendedRetailPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-500 text-[10px] w-12">Rec WS:</span>
                          <span className="text-indigo-700 font-semibold">KES {recWholesale.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400 text-[10px] w-12">Base:</span>
                          <span className="text-slate-500">KES {base.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className="font-semibold text-slate-900 text-xs">{moq}</span>
                      <span className="text-[10px] text-slate-500 block">{product.unit}(s)</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isActive 
                           ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isActive ? 'Available to Wholesalers' : 'Wholesalers blocked'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {pLevel === 'ROOT' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200">
                              <Globe className="w-2.5 h-2.5 text-blue-600" />
                              <span>ROOT: National Grid</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block">
                              ROOT-KE-01 • Universal Kenya
                            </span>
                          </div>
                        ) : pLevel === 'REGION' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-50 text-purple-800 border border-purple-200">
                              <Layers className="w-2.5 h-2.5 text-purple-600" />
                              <span>REGION: Corridor</span>
                            </span>
                            <span className="text-[10px] text-purple-900 font-semibold block">
                              {primaryNode?.code || 'REG-01'}: {primaryNode?.name.replace(' FMCG Distribution Region', '')}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Subtree Descendants</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              <span>LOCAL_NODE (≤20km)</span>
                            </span>
                            <span className="text-[10px] text-emerald-900 font-semibold block line-clamp-1">
                              {primaryNode?.code || 'NODE-01'}: {primaryNode?.name.split(' ')[0]}
                            </span>
                            {product.assignedSupplyNodeIds && product.assignedSupplyNodeIds.length > 1 && (
                              <span className="text-[9px] text-slate-500 block font-mono">
                                +{product.assignedSupplyNodeIds.length - 1} more local nodes
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-slate-900 text-xs block">
                        {suppliers.length} Adopted Depots
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {availableSuppliers.length} active in stock
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Enable/Disable Toggle */}
                        <button
                          onClick={() => handleToggleProductStatus(product.id)}
                          title={isActive ? 'Disable product on platform' : 'Enable product on platform'}
                          className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors border ${
                            isActive 
                              ? 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline text-[10px]">{isActive ? 'Disable' : 'Enable'}</span>
                        </button>

                        {/* Edit Product */}
                        <button
                          onClick={() => openEditModal(product)}
                          title="Edit product parameters, pricing, MOQ, or image"
                          className="p-1.5 rounded text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden xl:inline text-[10px]">Edit</span>
                        </button>

                        {/* Inspect Schema */}
                        <button
                          onClick={() => setSelectedProduct(product)}
                          title="Inspect canonical schema attributes and wholesaler price feeds"
                          className="p-1.5 rounded text-xs font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT PRODUCT (Section 13 Specifications)                */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingProduct ? 'Edit Product (Section 13)' : 'Create Product (Section 13)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Admin master FMCG product definition for the WAYNO platform
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span>1. Product Identity & Category</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Pembe Fortified Maize Flour 2kg"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Brand <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Pembe"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formManufacturer}
                      onChange={(e) => setFormManufacturer(e.target.value)}
                      placeholder="e.g. Pembe Flour Mills Ltd"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Category <span className="text-rose-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        + Add New
                      </button>
                    </div>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Barcode (EAN-13)
                    </label>
                    <input
                      type="text"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="e.g. 6161102938491"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pack Size <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formPackSize}
                      onChange={(e) => setFormPackSize(e.target.value)}
                      placeholder="e.g. 2kg x 12 Bales"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      <option value="Piece">Piece / Tub</option>
                      <option value="Bale">Bale</option>
                      <option value="Carton">Carton / Crate</option>
                      <option value="Sack">Sack / Bag (50kg)</option>
                      <option value="Dozen">Dozen</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 13 Pricing & MOQ */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span>2. Pricing & Minimum Order Quantity</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Benchmark Base Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">KES</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formBasePrice}
                        onChange={(e) => setFormBasePrice(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded pl-11 pr-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Admin manufacturing baseline</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-indigo-900 mb-1">
                      Wholesale Price (Rec.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">KES</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formWholesalePrice}
                        onChange={(e) => setFormWholesalePrice(Number(e.target.value))}
                        className="w-full border border-indigo-300 rounded pl-11 pr-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-indigo-50/20"
                      />
                    </div>
                    <span className="text-[9px] text-indigo-600 block mt-0.5">Default for adopting wholesalers</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-900 mb-1">
                      Retailer Rec. Price (RRP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">KES</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formRRP}
                        onChange={(e) => setFormRRP(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded pl-11 pr-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-bold"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Standard duka customer price</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Minimum Order Qty (MOQ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formMOQ}
                      onChange={(e) => setFormMOQ(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Minimum units per order</span>
                  </div>
                </div>
              </div>

              {/* Image & Presets */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span>3. Product Image & Platform Status</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-3 flex flex-col items-center">
                    <img 
                      src={formImage} 
                      alt="Product preview" 
                      className="w-20 h-20 rounded border border-slate-200 object-cover bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-slate-400 mt-1">Live Preview</span>
                  </div>

                  <div className="sm:col-span-9 space-y-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                      <input
                        type="url"
                        required
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Quick Kenyan FMCG Presets:</span>
                      <div className="flex flex-wrap gap-1">
                        {KENYAN_FMCG_IMAGE_PRESETS.map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setFormImage(preset.url)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              formImage === preset.url 
                                ? 'bg-slate-900 text-white border-slate-900 font-semibold' 
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center space-x-4">
                      <label className="font-semibold text-slate-700">Platform Status:</label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="ACTIVE"
                          checked={formStatus === 'ACTIVE'}
                          onChange={() => setFormStatus('ACTIVE')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-emerald-800 font-semibold">ACTIVE (Available for Wholesalers)</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="INACTIVE"
                          checked={formStatus === 'INACTIVE'}
                          onChange={() => setFormStatus('INACTIVE')}
                          className="text-slate-600 focus:ring-slate-500"
                        />
                        <span className="text-slate-600">INACTIVE (Disabled)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Supply Node Tree Classification (Searchability & Geofence Hierarchy) */}
              <div className="space-y-3 pt-2">
                <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Network className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4. Supply Node Tree Classification (Search Extent & Geofencing)</span>
                  </h4>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                    HIERARCHICAL ENGINE
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-3.5">
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    Classify SKU position within the hierarchical <strong>Supply Node Tree</strong>. The platform search engine prunes ineligible items before supplier matching based on the duka's geofenced local node and tree ancestry.
                  </div>

                  {/* Level Selection Cards */}
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1.5">
                      Supply Node Tree Tier <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {/* Level 0: ROOT */}
                      <div
                        onClick={() => {
                          setFormNodeLevel('ROOT');
                          setFormPrimaryNodeId('root_kenya');
                          setFormAssignedNodeIds(['root_kenya']);
                        }}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          formNodeLevel === 'ROOT'
                            ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-500 text-blue-950 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs flex items-center space-x-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            <span>Level 0: ROOT</span>
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                            ROOT-KE-01
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] text-blue-900 mb-0.5">National Grid</div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Universal nationwide visibility. Searchable by every duka and retailer across all nodes.
                        </p>
                      </div>

                      {/* Level 1: REGION */}
                      <div
                        onClick={() => {
                          setFormNodeLevel('REGION');
                          setFormPrimaryNodeId('region_nairobi_metro');
                          setFormAssignedNodeIds(['region_nairobi_metro']);
                        }}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          formNodeLevel === 'REGION'
                            ? 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-500 text-purple-950 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs flex items-center space-x-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-600" />
                            <span>Level 1: REGION</span>
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                            CORRIDOR
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] text-purple-900 mb-0.5">Regional Subtree</div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Regional corridor searchability. Available to dukas in all child local nodes in the region.
                        </p>
                      </div>

                      {/* Level 2: LOCAL_NODE */}
                      <div
                        onClick={() => {
                          setFormNodeLevel('LOCAL_NODE');
                          setFormPrimaryNodeId('node_eastleigh_20km');
                          setFormAssignedNodeIds(['node_eastleigh_20km']);
                        }}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          formNodeLevel === 'LOCAL_NODE'
                            ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-500 text-emerald-950 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Level 2: LOCAL_NODE</span>
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            ≤ 20 KM
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] text-emerald-900 mb-0.5">Local Territory</div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Geofenced territory node. Confined strictly to retailer dukas within designated 20km nodes.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Level-Specific Anchor Node Configuration */}
                  {formNodeLevel === 'ROOT' && (
                    <div className="p-3 bg-blue-50/50 rounded border border-blue-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Primary Supply Node Anchor:</span>
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                          ROOT-KE-01 (Kenya National FMCG Grid)
                        </span>
                      </div>
                      <div className="text-[11px] text-blue-800 flex items-center space-x-1.5 font-mono">
                        <span>Hierarchy Tree Path:</span>
                        <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200 text-blue-950">
                          ROOT-KE-01 (Kenya National Grid) ➔ All Regional Corridors ➔ All 20km Local Nodes
                        </span>
                      </div>
                    </div>
                  )}

                  {formNodeLevel === 'REGION' && (
                    <div className="p-3 bg-purple-50/50 rounded border border-purple-200 space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-purple-950 mb-1">
                          Select Regional Supply Corridor Anchor:
                        </label>
                        <select
                          value={formPrimaryNodeId}
                          onChange={(e) => {
                            setFormPrimaryNodeId(e.target.value);
                            setFormAssignedNodeIds([e.target.value]);
                          }}
                          className="w-full border border-purple-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          {geoEngine.getRegionalNodes().map(node => (
                            <option key={node.id} value={node.id}>
                              {node.code}: {node.name} (Subtree anchor: {node.wholesalerName || node.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[11px] text-purple-900 font-mono bg-white/80 p-2 rounded border border-purple-200">
                        <div className="text-[10px] text-purple-600 font-bold uppercase mb-0.5">Topological Hierarchy Path:</div>
                        {geoEngine.getNodePath(formPrimaryNodeId)} ➔ All child 20km local nodes
                      </div>
                    </div>
                  )}

                  {formNodeLevel === 'LOCAL_NODE' && (
                    <div className="p-3 bg-emerald-50/50 rounded border border-emerald-200 space-y-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <label className="font-semibold text-emerald-950">
                            Authorized 20 km Local Supply Nodes (Corridors):
                          </label>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const allLocalIds = SUPPLY_NODES.filter(n => n.level === 'LOCAL_NODE').map(n => n.id);
                                setFormAssignedNodeIds(allLocalIds);
                              }}
                              className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded border border-emerald-300"
                            >
                              ✓ All Local Nodes (Nationwide Local Commodity)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormAssignedNodeIds([formPrimaryNodeId]);
                              }}
                              className="text-[10px] text-slate-600 bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              Single Node Only
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {SUPPLY_NODES.filter(n => n.level === 'LOCAL_NODE').map(node => {
                            const isChecked = formAssignedNodeIds.includes(node.id);
                            return (
                              <label
                                key={node.id}
                                className={`flex items-start space-x-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const updated = [...formAssignedNodeIds, node.id];
                                      setFormAssignedNodeIds(updated);
                                      if (!formAssignedNodeIds.includes(formPrimaryNodeId)) {
                                        setFormPrimaryNodeId(node.id);
                                      }
                                    } else {
                                      const remaining = formAssignedNodeIds.filter(id => id !== node.id);
                                      setFormAssignedNodeIds(remaining.length > 0 ? remaining : [node.id]);
                                      if (formPrimaryNodeId === node.id && remaining.length > 0) {
                                        setFormPrimaryNodeId(remaining[0]);
                                      }
                                    }
                                  }}
                                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                  <div className="flex items-center space-x-1">
                                    <span className="font-bold">{node.code}</span>
                                    <span>•</span>
                                    <span>{node.name.split(' ')[0]}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-normal">
                                    Anchor: {node.wholesalerName || node.name} ({node.radiusKm}km geofence)
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Primary Node & Radius */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/80">
                        <div>
                          <label className="block font-semibold text-emerald-950 mb-1">
                            Primary Anchor Supply Node:
                          </label>
                          <select
                            value={formPrimaryNodeId}
                            onChange={(e) => setFormPrimaryNodeId(e.target.value)}
                            className="w-full border border-emerald-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-900 font-medium focus:outline-none"
                          >
                            {SUPPLY_NODES.filter(n => n.level === 'LOCAL_NODE').map(node => (
                              <option key={node.id} value={node.id}>
                                {node.code}: {node.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-emerald-950 mb-1">
                            Max Geofence Radius from Node
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={formMaxRadiusKm}
                              onChange={(e) => setFormMaxRadiusKm(Number(e.target.value))}
                              className="w-20 border border-emerald-300 rounded px-2 py-1 text-xs bg-white font-mono text-slate-900"
                            />
                            <span className="text-xs text-slate-500">km</span>
                            <div className="flex items-center space-x-1">
                              {[10, 15, 20].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setFormMaxRadiusKm(r)}
                                  className={`text-[10px] px-2 py-0.5 rounded border ${
                                    formMaxRadiusKm === r
                                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                      : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                >
                                  {r}km
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tree Breadcrumb */}
                      <div className="text-[11px] text-emerald-950 font-mono bg-white/80 p-2 rounded border border-emerald-200">
                        <div className="text-[10px] text-emerald-700 font-bold uppercase mb-0.5">Topological Hierarchy Path:</div>
                        {geoEngine.getNodePath(formPrimaryNodeId)}
                      </div>
                    </div>
                  )}

                  {/* Geospace Engine Optimization Note */}
                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded p-2 text-[11px] text-indigo-950 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Hierarchical Node Pruning:</span> Retailer dukas only see products if their registered geofenced node matches or descends from this product's assigned supply node tier.
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Search Aliases */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1">
                  <span>5. Description & Swahili / Sheng Search Aliases</span>
                </h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Kenyan retail FMCG grade product specification..."
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Search Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={formKeywords}
                      onChange={(e) => setFormKeywords(e.target.value)}
                      placeholder="e.g. unga, maize flour, sembe"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sheng / Swahili Aliases (comma separated)</label>
                    <input
                      type="text"
                      value={formAliases}
                      onChange={(e) => setFormAliases(e.target.value)}
                      placeholder="e.g. posho, mahindi, unga ya ugali"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {editingProduct ? 'Updates will immediately sync across platform indexes.' : 'Product will be immediately available for wholesaler adoption.'}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                  >
                    {editingProduct ? 'Save Changes' : 'Create & Publish SKU'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD CATEGORY MODAL                                               */}
      {/* ========================================================================= */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Add Product Category</h3>
              <button 
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewCategory} className="pt-3 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="e.g. Spices & Seasoning"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRODUCT INSPECTOR & WHOLESALER PRICE COMPARISON                  */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-8 h-8 rounded object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedProduct.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Product ID: {selectedProduct.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Specifications</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">RRP</span>
                    <span className="font-bold text-slate-900">KES {selectedProduct.recommendedRetailPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Admin Rec WS</span>
                    <span className="font-bold text-indigo-700">
                      KES {(selectedProduct.wholesalePrice || Math.round(selectedProduct.recommendedRetailPrice * 0.85)).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Admin MOQ</span>
                    <span className="font-bold text-slate-900">{selectedProduct.minimumOrderQuantity || 1} {selectedProduct.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Status</span>
                    <span className={`font-bold ${selectedProduct.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedProduct.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supply Node Tree Placement & Geofence Hierarchy */}
              <div className="bg-slate-50 rounded border border-slate-200 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Network className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Supply Node Tree Placement & Geofence Architecture</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                    {selectedProduct.supplyNodeLevel || selectedProduct.searchScope || 'ROOT'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Tree Classification Tier</span>
                    <div className="mt-1">
                      {(selectedProduct.supplyNodeLevel === 'ROOT' || (!selectedProduct.supplyNodeLevel && selectedProduct.searchScope !== 'LOCAL')) ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 text-blue-900 border border-blue-200">
                          <Globe className="w-3 h-3 text-blue-700" />
                          <span>Level 0: ROOT (National Grid)</span>
                        </span>
                      ) : selectedProduct.supplyNodeLevel === 'REGION' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-100 text-purple-900 border border-purple-200">
                          <Layers className="w-3 h-3 text-purple-700" />
                          <span>Level 1: REGION (Corridor)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-200">
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          <span>Level 2: LOCAL_NODE (20km)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Primary Anchor Node</span>
                    <span className="font-semibold text-slate-800 block text-xs mt-1 font-mono">
                      {selectedProduct.primarySupplyNodeId ? (
                        <>
                          <span className="font-bold text-slate-900">{geoEngine.getNodeById(selectedProduct.primarySupplyNodeId)?.code || 'NODE'}</span>: {geoEngine.getNodeById(selectedProduct.primarySupplyNodeId)?.name}
                        </>
                      ) : (
                        'ROOT-KE-01: Kenya National FMCG Grid'
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Geofence Corridor Constraint</span>
                    <span className="font-mono font-semibold text-slate-800 block text-xs mt-1">
                      {selectedProduct.maxSearchRadiusKm ? `≤ ${selectedProduct.maxSearchRadiusKm} km Radius` : 'Universal / Regional Boundary'}
                    </span>
                  </div>
                </div>

                {/* Topological Hierarchy Breadcrumb */}
                <div className="bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Full Hierarchy Path:
                  </span>
                  <div className="flex items-center space-x-1 text-indigo-900 font-semibold flex-wrap">
                    {geoEngine.getNodePath(selectedProduct.primarySupplyNodeId || 'root_kenya')}
                  </div>
                  {selectedProduct.assignedSupplyNodeIds && selectedProduct.assignedSupplyNodeIds.length > 1 && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      Authorized Multi-Nodes: {selectedProduct.assignedSupplyNodeIds.map(id => geoEngine.getNodeById(id)?.code || id).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Wholesalers Who Adopted This SKU</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {supplierProducts.filter(sp => sp.productId === selectedProduct.id).length} Active Listings
                  </span>
                </h4>

                {supplierProducts.filter(sp => sp.productId === selectedProduct.id).length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded text-center text-amber-800">
                    No wholesalers have adopted this product into their depot catalogs yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="py-2 px-3">Wholesaler Depot</th>
                          <th className="py-2 px-3">Custom WS Price</th>
                          <th className="py-2 px-3">Stock Count</th>
                          <th className="py-2 px-3">Availability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {supplierProducts.filter(sp => sp.productId === selectedProduct.id).map(sp => (
                          <tr key={sp.id}>
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                              {sp.wholesalerName}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-indigo-700">
                              KES {sp.price.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {sp.stockQty} units
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                sp.availability ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                              }`}>
                                {sp.availability ? 'IN STOCK' : 'OUT OF STOCK'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                onClick={() => {
                  const target = selectedProduct;
                  setSelectedProduct(null);
                  openEditModal(target);
                }}
                className="px-3 py-1.5 rounded bg-slate-900 text-white font-semibold text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit This Product</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
