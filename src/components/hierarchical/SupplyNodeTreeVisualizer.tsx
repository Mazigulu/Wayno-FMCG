import React, { useState, useMemo } from 'react';
import {
  Network,
  Building2,
  Store,
  Compass,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowRight,
  GitFork,
  Radio,
  Search,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Truck,
  Database,
  ExternalLink,
  Activity,
  Clock,
  Zap,
  BarChart3,
  ArrowDown,
} from 'lucide-react';
import { SUPPLY_NODES, geoEngine } from '../../services/hierarchicalGeofenceEngine';
import { SupplyNode, SupplyNodeLevel, Order } from '../../types/wayno';
import { ZonePerformanceMetricsCard } from '../operations/ZonePerformanceMetricsCard';

interface NodePosition {
  x: number;
  y: number;
  node: SupplyNode;
  levelIndex: number;
}

interface SupplyNodeTreeVisualizerProps {
  initialSelectedNodeId?: string;
  onSelectNode?: (node: SupplyNode) => void;
  className?: string;
  orders?: Order[];
}

export const SupplyNodeTreeVisualizer: React.FC<SupplyNodeTreeVisualizerProps> = ({
  initialSelectedNodeId = 'node_eastleigh_20km',
  onSelectNode,
  className = '',
  orders = [],
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSelectedNodeId);
  const [inspectorTab, setInspectorTab] = useState<'HIERARCHY' | 'FULFILLMENT'>('HIERARCHY');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPathHighlighted, setIsPathHighlighted] = useState<boolean>(true);
  const [showCoverageRadius, setShowCoverageRadius] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'TREE_CANVAS' | 'TOPOLOGY_GRID'>('TREE_CANVAS');
  const [simulatedOrderDuka, setSimulatedOrderDuka] = useState<{
    name: string;
    lat: number;
    lng: number;
    targetNodeId: string;
  }>({
    name: 'Mama Sarah Provision Duka (Kariobangi South)',
    lat: -1.2585,
    lng: 36.8834,
    targetNodeId: 'node_eastleigh_20km',
  });

  // Active selected node
  const selectedNode = useMemo(() => {
    return SUPPLY_NODES.find((n) => n.id === selectedNodeId) || SUPPLY_NODES[0];
  }, [selectedNodeId]);

  // Ancestor hierarchy chain for selected node
  const ancestorHierarchy = useMemo(() => {
    return geoEngine.getAncestorHierarchy(selectedNode.id);
  }, [selectedNode]);

  // Direct children of selected node
  const childNodes = useMemo(() => {
    return SUPPLY_NODES.filter((n) => n.parentZoneId === selectedNode.id);
  }, [selectedNode]);

  // Sibling nodes (shares same parent)
  const siblingNodes = useMemo(() => {
    if (!selectedNode.parentZoneId) return [];
    return SUPPLY_NODES.filter(
      (n) => n.parentZoneId === selectedNode.parentZoneId && n.id !== selectedNode.id
    );
  }, [selectedNode]);

  // Root node
  const rootNode = useMemo(() => {
    return SUPPLY_NODES.find((n) => n.level === 'ROOT') || SUPPLY_NODES[0];
  }, []);

  // Regional nodes
  const regionalNodes = useMemo(() => {
    return SUPPLY_NODES.filter((n) => n.level === 'REGION');
  }, []);

  // Local 20km nodes
  const localNodes = useMemo(() => {
    return SUPPLY_NODES.filter((n) => n.level === 'LOCAL_NODE');
  }, []);

  // Node filtering
  const filteredNodes = useMemo(() => {
    return SUPPLY_NODES.filter((node) => {
      const matchesLevel = filterLevel === 'ALL' || node.level === filterLevel;
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.wholesalerName && node.wholesalerName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesLevel && matchesSearch;
    });
  }, [filterLevel, searchQuery]);

  // Geometric coordinates for interactive SVG Tree
  const treePositions = useMemo(() => {
    const map = new Map<string, NodePosition>();

    // Canvas dimensions
    const width = 860;
    const rootY = 65;
    const regionY = 210;
    const localY = 380;

    // Root (Level 0)
    map.set(rootNode.id, {
      x: width / 2,
      y: rootY,
      node: rootNode,
      levelIndex: 0,
    });

    // Regions (Level 1)
    const nairobiRegion = regionalNodes.find((r) => r.id === 'region_nairobi_metro') || regionalNodes[0];
    const westernRegion = regionalNodes.find((r) => r.id === 'region_western_kenya') || regionalNodes[1];

    const nairobiX = width * 0.38;
    const westernX = width * 0.82;

    if (nairobiRegion) {
      map.set(nairobiRegion.id, {
        x: nairobiX,
        y: regionY,
        node: nairobiRegion,
        levelIndex: 1,
      });
    }

    if (westernRegion) {
      map.set(westernRegion.id, {
        x: westernX,
        y: regionY,
        node: westernRegion,
        levelIndex: 1,
      });
    }

    // Local 20km Nodes (Level 2)
    // Under Nairobi: Eastleigh, Industrial Area, Nairobi West
    const nairobiChildren = localNodes.filter((l) => l.parentZoneId === 'region_nairobi_metro');
    const nairobiSpacing = 160;
    const nairobiStartX = nairobiX - ((nairobiChildren.length - 1) * nairobiSpacing) / 2;

    nairobiChildren.forEach((node, i) => {
      map.set(node.id, {
        x: nairobiStartX + i * nairobiSpacing,
        y: localY,
        node,
        levelIndex: 2,
      });
    });

    // Under Western: Bungoma Central
    const westernChildren = localNodes.filter((l) => l.parentZoneId === 'region_western_kenya');
    westernChildren.forEach((node, i) => {
      map.set(node.id, {
        x: westernX,
        y: localY,
        node,
        levelIndex: 2,
      });
    });

    return map;
  }, [rootNode, regionalNodes, localNodes]);

  // Edges between parent and child
  const treeEdges = useMemo(() => {
    const edges: Array<{
      from: NodePosition;
      to: NodePosition;
      isHighlighted: boolean;
    }> = [];

    treePositions.forEach((pos) => {
      if (pos.node.parentZoneId && treePositions.has(pos.node.parentZoneId)) {
        const parentPos = treePositions.get(pos.node.parentZoneId)!;
        const isChildInChain = ancestorHierarchy.some((a) => a.id === pos.node.id);
        const isParentInChain = ancestorHierarchy.some((a) => a.id === parentPos.node.id);
        const isHighlighted = isPathHighlighted && isChildInChain && isParentInChain;

        edges.push({
          from: parentPos,
          to: pos,
          isHighlighted,
        });
      }
    });

    return edges;
  }, [treePositions, ancestorHierarchy, isPathHighlighted]);

  const handleNodeClick = (node: SupplyNode) => {
    setSelectedNodeId(node.id);
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  const getLevelBadge = (level: SupplyNodeLevel) => {
    switch (level) {
      case 'ROOT':
        return (
          <span className="bg-rose-500/15 text-rose-700 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Root (National)
          </span>
        );
      case 'REGION':
        return (
          <span className="bg-sky-500/15 text-sky-800 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Region Corridor
          </span>
        );
      case 'LOCAL_NODE':
        return (
          <span className="bg-emerald-500/15 text-emerald-800 border border-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            20 km Local Leaf Node
          </span>
        );
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs ${className}`}>
      {/* Visualizer Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/30 flex items-center space-x-1">
              <Network className="w-3 h-3 inline mr-1" />
              Interactive Supply Graph
            </span>
            <span className="text-slate-400 text-xs font-mono">parent_zone_id relational tree</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Hierarchical Geographic Supply Node Tree</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Interactive visualization of WAYNO's 20 km local nodes, regional distribution corridors, and national buffer terminal, highlighting parent-child escalation pathways and anchor wholesalers.
          </p>
        </div>

        {/* View mode toggle & Quick stats */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('TREE_CANVAS')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                viewMode === 'TREE_CANVAS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              SVG Tree Map
            </button>
            <button
              onClick={() => setViewMode('TOPOLOGY_GRID')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                viewMode === 'TOPOLOGY_GRID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Matrix Explorer
            </button>
          </div>
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <span className="text-slate-500 font-medium">Filter Level:</span>
          <div className="inline-flex rounded-md shadow-2xs">
            {(['ALL', 'ROOT', 'REGION', 'LOCAL_NODE'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 text-[11px] font-medium border first:rounded-l-md last:rounded-r-md -ml-px transition-colors cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold z-10'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {lvl === 'ALL' ? 'All (7 Nodes)' : lvl === 'LOCAL_NODE' ? '20 km Local (4)' : lvl}
              </button>
            ))}
          </div>

          {/* Path Highlight Toggle */}
          <label className="flex items-center space-x-1.5 ml-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPathHighlighted}
              onChange={(e) => setIsPathHighlighted(e.target.checked)}
              className="accent-emerald-600 rounded w-3.5 h-3.5"
            />
            <span className="text-slate-700 font-medium">Highlight Escalation Path</span>
          </label>

          {/* Coverage Radius Toggle */}
          <label className="flex items-center space-x-1.5 ml-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCoverageRadius}
              onChange={(e) => setShowCoverageRadius(e.target.checked)}
              className="accent-emerald-600 rounded w-3.5 h-3.5"
            />
            <span className="text-slate-700 font-medium">Show 20 km Territory Halo</span>
          </label>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search node, code, wholesaler..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left/Center Canvas: SVG Interactive Tree */}
        <div className="lg:col-span-8 p-4 bg-slate-900/5 relative overflow-x-auto min-h-[440px] flex flex-col justify-between">
          {viewMode === 'TREE_CANVAS' ? (
            <div className="relative min-w-[780px] w-full flex justify-center py-2">
              <svg
                viewBox="0 0 860 460"
                className="w-full max-w-[860px] h-[440px] select-none"
                style={{ overflow: 'visible' }}
              >
                {/* SVG Definitions for Gradients and Filters */}
                <defs>
                  {/* Subtle Grid Background */}
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="0.7"
                      strokeDasharray="2,2"
                    />
                  </pattern>

                  {/* Gradient for Active Escalation Connectors */}
                  <linearGradient id="activeLinkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                  </linearGradient>

                  {/* Marker for directed escalation arrows */}
                  <marker
                    id="arrowhead-active"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#059669" />
                  </marker>
                  <marker
                    id="arrowhead-muted"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 2.5, 0 5" fill="#94A3B8" />
                  </marker>
                </defs>

                {/* Background Pattern */}
                <rect width="860" height="460" fill="url(#grid)" rx="10" />

                {/* Territory Coverage Radial Halos (if enabled) */}
                {showCoverageRadius && (
                  <g className="transition-opacity duration-300">
                    {/* Root coverage */}
                    <circle
                      cx={treePositions.get(rootNode.id)?.x || 430}
                      cy={treePositions.get(rootNode.id)?.y || 65}
                      r="54"
                      fill="#F43F5E"
                      fillOpacity="0.04"
                      stroke="#FDA4AF"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    {/* Regional Halos */}
                    {regionalNodes.map((r) => {
                      const pos = treePositions.get(r.id);
                      if (!pos) return null;
                      return (
                        <circle
                          key={`halo-${r.id}`}
                          cx={pos.x}
                          cy={pos.y}
                          r="58"
                          fill="#0284C7"
                          fillOpacity="0.04"
                          stroke="#BAE6FD"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                      );
                    })}
                    {/* 20 km Local Halos */}
                    {localNodes.map((l) => {
                      const pos = treePositions.get(l.id);
                      if (!pos) return null;
                      const isSelected = selectedNodeId === l.id;
                      return (
                        <circle
                          key={`halo-${l.id}`}
                          cx={pos.x}
                          cy={pos.y}
                          r="62"
                          fill={isSelected ? '#059669' : '#10B981'}
                          fillOpacity={isSelected ? 0.08 : 0.03}
                          stroke={isSelected ? '#059669' : '#6EE7B7'}
                          strokeWidth={isSelected ? 1.5 : 1}
                          strokeDasharray={isSelected ? 'none' : '3,3'}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Connecting Edges */}
                <g>
                  {treeEdges.map((edge, index) => {
                    const fromX = edge.from.x;
                    const fromY = edge.from.y + 24; // bottom of parent
                    const toX = edge.to.x;
                    const toY = edge.to.y - 24; // top of child

                    // Smooth Bezier Curve
                    const midY = (fromY + toY) / 2;
                    const pathD = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

                    return (
                      <g key={`edge-${index}`}>
                        {/* Shadow line for highlighted path */}
                        {edge.isHighlighted && (
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#A7F3D0"
                            strokeWidth="7"
                            strokeLinecap="round"
                            opacity="0.7"
                          />
                        )}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={edge.isHighlighted ? '#059669' : '#CBD5E1'}
                          strokeWidth={edge.isHighlighted ? 2.5 : 1.5}
                          strokeDasharray={edge.isHighlighted ? 'none' : '4,3'}
                          markerEnd={
                            edge.isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead-muted)'
                          }
                          className="transition-all duration-300"
                        />
                        {/* Escalation directional label */}
                        {edge.isHighlighted && (
                          <text
                            x={(fromX + toX) / 2 + 10}
                            y={midY}
                            fill="#065F46"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            className="select-none bg-white"
                          >
                            parent_zone_id
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Tree Nodes */}
                <g>
                  {Array.from(treePositions.values()).map(({ x, y, node }) => {
                    const isSelected = selectedNodeId === node.id;
                    const isInAncestorChain = ancestorHierarchy.some((a) => a.id === node.id);
                    const isParent = selectedNode.parentZoneId === node.id;
                    const isChild = node.parentZoneId === selectedNode.id;

                    let badgeColor = '#0F172A';
                    let borderColor = '#94A3B8';
                    let boxWidth = 148;
                    let boxHeight = 52;

                    if (node.level === 'ROOT') {
                      badgeColor = '#E11D48';
                      borderColor = isSelected ? '#BE123C' : '#FDA4AF';
                      boxWidth = 168;
                    } else if (node.level === 'REGION') {
                      badgeColor = '#0284C7';
                      borderColor = isSelected ? '#0369A1' : '#BAE6FD';
                      boxWidth = 158;
                    } else {
                      badgeColor = '#059669';
                      borderColor = isSelected ? '#047857' : '#A7F3D0';
                    }

                    return (
                      <g
                        key={`node-${node.id}`}
                        transform={`translate(${x - boxWidth / 2}, ${y - boxHeight / 2})`}
                        onClick={() => handleNodeClick(node)}
                        className="cursor-pointer group"
                      >
                        {/* Outer halo when active or parent */}
                        {isSelected && (
                          <rect
                            x="-4"
                            y="-4"
                            width={boxWidth + 8}
                            height={boxHeight + 8}
                            rx="10"
                            fill="none"
                            stroke="#059669"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                            className="animate-pulse"
                          />
                        )}

                        {/* Node Card Box */}
                        <rect
                          width={boxWidth}
                          height={boxHeight}
                          rx="8"
                          fill={isSelected ? '#FFFFFF' : '#FFFFFF'}
                          stroke={isSelected ? '#059669' : borderColor}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                          className="transition-all duration-200 group-hover:stroke-slate-700"
                        />

                        {/* Level Header Strip */}
                        <path
                          d={`M 0 8 Q 0 0 8 0 L ${boxWidth - 8} 0 Q ${boxWidth} 0 ${boxWidth} 8 L ${boxWidth} 16 L 0 16 Z`}
                          fill={badgeColor}
                        />

                        {/* Header Text: Node Code & Radius */}
                        <text
                          x="8"
                          y="11.5"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.code}
                        </text>
                        <text
                          x={boxWidth - 8}
                          y="11.5"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontFamily="monospace"
                          textAnchor="end"
                          opacity="0.95"
                        >
                          {node.radiusKm} km {node.level === 'LOCAL_NODE' ? 'Radius' : ''}
                        </text>

                        {/* Node Name */}
                        <text
                          x="8"
                          y="29"
                          fill="#0F172A"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {node.name.length > 21 ? `${node.name.substring(0, 19)}...` : node.name}
                        </text>

                        {/* Anchor Wholesaler Snippet */}
                        <text
                          x="8"
                          y="42"
                          fill="#64748B"
                          fontSize="8.5"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {node.wholesalerName
                            ? node.wholesalerName.length > 22
                              ? `${node.wholesalerName.substring(0, 20)}...`
                              : node.wholesalerName
                            : 'No Primary Wholesaler'}
                        </text>

                        {/* Small relationship indicator pin */}
                        {isParent && (
                          <g transform={`translate(${boxWidth - 14}, 22)`}>
                            <circle r="5" fill="#0284C7" />
                            <text
                              textAnchor="middle"
                              y="2.5"
                              fill="#FFF"
                              fontSize="6"
                              fontWeight="bold"
                            >
                              P
                            </text>
                          </g>
                        )}
                        {isChild && (
                          <g transform={`translate(${boxWidth - 14}, 22)`}>
                            <circle r="5" fill="#10B981" />
                            <text
                              textAnchor="middle"
                              y="2.5"
                              fill="#FFF"
                              fontSize="6"
                              fontWeight="bold"
                            >
                              C
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          ) : (
            /* Topology Matrix Explorer View */
            <div className="space-y-4 py-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>All Registered Geographic Supply Nodes ({filteredNodes.length})</span>
                <span className="text-slate-400 text-[11px]">Click node card to inspect relational ties</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const parentNode = node.parentZoneId
                    ? SUPPLY_NODES.find((n) => n.id === node.parentZoneId)
                    : null;

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleNodeClick(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                            {node.code}
                          </span>
                          {getLevelBadge(node.level)}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {node.radiusKm} km radius
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 mb-1">{node.name}</div>

                      <div className="text-[11px] text-slate-600 flex items-center space-x-1 mb-2">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{node.wholesalerName}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          parent: <strong className="text-slate-800">{parentNode?.name || 'ROOT (None)'}</strong>
                        </span>
                        <span className="text-emerald-700 font-semibold">{node.shopsCount} Dukas mapped</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Diagram Legend */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Level 0: Root (National Buffer)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                <span>Level 1: Region Corridors</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>Level 2: 20 km Wholesaler Territory Nodes</span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              PostGIS FK: <code className="bg-slate-200 px-1 py-0.5 rounded">service_zones.parent_zone_id</code>
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Node Inspector & Parent-Child Relational Ties */}
        <div className="lg:col-span-4 p-5 space-y-5 bg-white">
          {/* Header Card */}
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {selectedNode.code}
              </span>
              {getLevelBadge(selectedNode.level)}
            </div>
            <h4 className="text-sm font-bold text-slate-900">{selectedNode.name}</h4>
            <p className="text-xs text-slate-500">
              {selectedNode.level === 'LOCAL_NODE'
                ? 'Primary last-mile 20 km territory anchored to wholesale inventory.'
                : selectedNode.level === 'REGION'
                ? 'Regional consolidation depot backstopping subordinate local nodes.'
                : 'National buffer terminal providing terminal stockout guarantee.'}
            </p>
          </div>

          {/* Inspector Tab Switcher */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setInspectorTab('HIERARCHY')}
              className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                inspectorTab === 'HIERARCHY'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Relational Topology
            </button>
            <button
              onClick={() => setInspectorTab('FULFILLMENT')}
              className={`pb-2 px-3 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                inspectorTab === 'FULFILLMENT'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fulfillment & SLA</span>
            </button>
          </div>

          {inspectorTab === 'FULFILLMENT' ? (
            <div className="space-y-4">
              {/* Node Fulfillment Quick Card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-1.5 text-emerald-400">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Live Fulfillment Telemetry</span>
                  </span>
                  <span className="text-emerald-400 font-mono">
                    SLA &lt; 35m
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-800/80 rounded p-2.5 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Avg Delivery Turnaround</span>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-xl font-black text-white font-mono">
                        {selectedNode.id === 'node_eastleigh_20km' ? '22.4' :
                         selectedNode.id === 'node_industrial_area_20km' ? '24.1' :
                         selectedNode.id === 'node_nairobi_west_20km' ? '25.3' :
                         selectedNode.id === 'node_bungoma_04_20km' ? '28.5' :
                         selectedNode.id === 'region_western_kenya' ? '29.1' : '24.0'}
                      </span>
                      <span className="text-[10px] text-slate-400">mins</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-medium">Target: &lt;35 mins</span>
                  </div>

                  <div className="bg-slate-800/80 rounded p-2.5 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-medium">SLA Compliance</span>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-xl font-black text-emerald-400 font-mono">98.4%</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">On-Time Orders</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Anchor Depot:</span>
                    <span className="font-semibold text-white truncate max-w-[170px]">
                      {selectedNode.wholesalerName || 'Designated Anchor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Territory Envelope:</span>
                    <span className="font-mono text-emerald-300">{selectedNode.radiusKm} km Geofence</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Mapped Retail Dukas:</span>
                    <span className="font-mono text-white">{selectedNode.shopsCount} Shops</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Stock Inventory Coverage:</span>
                    <span className="font-mono text-emerald-400">{selectedNode.inventoryCoveragePct}%</span>
                  </div>
                </div>
              </div>

              {/* Call-to-action to see the complete time-series chart below */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Daily Fulfillment Efficiency Time-Series</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Inspect historical daily orders vs. delivery turnaround minutes, multi-day trends, and active wholesale depots for <strong>{selectedNode.name}</strong> directly below the tree visualizer.
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById('node-fulfillment-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <span>View Full Time-Series Chart</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Anchor Wholesaler Spotlight */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Designated Anchor Wholesaler</span>
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {selectedNode.inventoryCoveragePct}% stock
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-white">
                    {selectedNode.wholesalerName || 'No Primary Anchor'}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                    wholesaler_id: {selectedNode.wholesalerId || 'NULL'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Territory Radius</span>
                    <span className="text-emerald-300 font-bold font-mono">
                      {selectedNode.radiusKm} km Envelope
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mapped Retail Dukas</span>
                    <span className="text-white font-bold font-mono">{selectedNode.shopsCount} Shops</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Node GPS Center</span>
                    <span className="text-slate-300 font-mono text-[10px]">
                      {selectedNode.centerPoint.lat.toFixed(4)}, {selectedNode.centerPoint.lng.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Operating Status</span>
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      {selectedNode.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upward Escalation Hierarchy Chain (Ancestors) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upward Parent-Child Traversal:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {ancestorHierarchy.length} Tier{ancestorHierarchy.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {ancestorHierarchy.map((ancestor, index) => {
                    const isCurrent = ancestor.id === selectedNode.id;
                    return (
                      <div
                        key={ancestor.id}
                        onClick={() => handleNodeClick(ancestor)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-white border border-slate-200 text-slate-700">
                            Tier {index + 1}
                          </span>
                          <div className="truncate">
                            <div className="text-xs truncate font-medium">{ancestor.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {ancestor.level} &bull; {ancestor.radiusKm} km
                            </div>
                          </div>
                        </div>
                        {index < ancestorHierarchy.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subordinate Children or Adjacent Siblings */}
              {childNodes.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Subordinate Child Nodes ({childNodes.length}):</span>
                    <span className="text-[10px] text-emerald-700 font-mono">parent_zone_id target</span>
                  </div>
                  <div className="space-y-1.5">
                    {childNodes.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => handleNodeClick(child)}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-400 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{child.name}</div>
                          <div className="text-[10px] text-slate-500">{child.wholesalerName}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {child.radiusKm} km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : siblingNodes.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Sibling Nodes (Escape Path Peers):</span>
                    <span className="text-[10px] text-sky-700 font-mono">Cross-Node Sourcing</span>
                  </div>
                  <div className="space-y-1.5">
                    {siblingNodes.map((sibling) => (
                      <div
                        key={sibling.id}
                        onClick={() => handleNodeClick(sibling)}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-sky-400 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{sibling.name}</div>
                          <div className="text-[10px] text-slate-500">{sibling.wholesalerName}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                          Adjacent 20km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Duka Binding Micro-Simulator */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Duka Geographic Placement Rule:</span>
                </div>
                <p className="text-[11px] text-emerald-900">
                  When retail shop <strong className="text-slate-900">{simulatedOrderDuka.name}</strong> places an FMCG order, WAYNO first executes a spatial containment query against this node ({selectedNode.name}). If stockouts occur, it automatically traverses upward to <strong className="text-slate-900">{selectedNode.parentZoneId ? 'Regional Parent' : 'National Root'}</strong> or activates adjacent sibling escape nodes.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Node Performance Metrics & Daily Fulfillment Efficiency Time-Series */}
      <div id="node-fulfillment-section" className="border-t border-slate-200 p-5 bg-slate-50/60">
        <ZonePerformanceMetricsCard
          selectedNode={selectedNode}
          orders={orders}
        />
      </div>
    </div>
  );
};
