import { 
  MarketIntelligenceSnapshot, 
  MarketEvent, 
  PipelineStageInfo, 
  WholesalePriceDispersion, 
  ZoneLiquidityMetric, 
  BrandMarketShare, 
  FMCGBasketIndexPoint, 
  MarketAnomalyAlert,
  PipelineStageId 
} from '../types/marketIntelligence';
import { 
  PIPELINE_STAGES_SPEC, 
  WHOLESALE_PRICE_DISPERSIONS, 
  ZONE_LIQUIDITY_METRICS, 
  BRAND_MARKET_SHARES, 
  FMCG_BASKET_INDEX_HISTORY, 
  INITIAL_MARKET_ANOMALIES, 
  SAMPLE_MARKET_STREAM_EVENTS 
} from '../data/marketIntelligenceData';

// ---------------------------------------------------------------------------
// MARKET INTELLIGENCE PIPELINE STATE STORE
// ---------------------------------------------------------------------------

class MarketIntelligenceEngine {
  private stages: PipelineStageInfo[] = [...PIPELINE_STAGES_SPEC];
  private eventsStream: MarketEvent[] = [];
  private priceDispersions: WholesalePriceDispersion[] = [...WHOLESALE_PRICE_DISPERSIONS];
  private zoneLiquidity: ZoneLiquidityMetric[] = [...ZONE_LIQUIDITY_METRICS];
  private brandShares: BrandMarketShare[] = [...BRAND_MARKET_SHARES];
  private basketIndex: FMCGBasketIndexPoint[] = [...FMCG_BASKET_INDEX_HISTORY];
  private anomalies: MarketAnomalyAlert[] = [...INITIAL_MARKET_ANOMALIES];
  private totalEvents24h: number = 3845200;
  private liveEventsPerSec: number = 1480;
  private isStreaming: boolean = true;
  private timer: any = null;
  private subscribers: Set<() => void> = new Set();
  private syndicatedSubscribersCount: number = 24; // e.g. Unga, Unilever, 18 depots, 4 banks

  constructor() {
    this.seedInitialEvents();
    this.startStreaming();
  }

  private seedInitialEvents(): void {
    const now = Date.now();
    SAMPLE_MARKET_STREAM_EVENTS.forEach((tmpl, idx) => {
      this.eventsStream.push({
        id: `evt_seed_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: `${idx * 15 + 4}s ago`,
        type: tmpl.type,
        source: tmpl.source,
        zone: tmpl.zone,
        payload: { ...tmpl.payload },
        pipelineStage: tmpl.pipelineStage,
        latencyMs: Math.round(12 + Math.random() * 28),
      });
    });
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    this.subscribers.forEach((cb) => cb());
  }

  public startStreaming(): void {
    if (this.timer) clearInterval(this.timer);
    this.isStreaming = true;
    this.timer = setInterval(() => {
      this.simulateNextEvent();
    }, 4500);
  }

  public stopStreaming(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isStreaming = false;
    this.notify();
  }

  public toggleStreaming(): boolean {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      this.startStreaming();
    }
    return this.isStreaming;
  }

  public isLiveStreaming(): boolean {
    return this.isStreaming;
  }

  public simulateNextEvent(): MarketEvent {
    const eventTemplates = SAMPLE_MARKET_STREAM_EVENTS;
    const picked = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];

    const stages: PipelineStageId[] = [
      'STREAM_INGESTION',
      'CLEANSING_ETL',
      'AGGREGATION_ROLLUP',
      'ML_INFERENCE',
      'SYNDICATION_ACTION',
    ];
    const assignedStage = stages[Math.floor(Math.random() * stages.length)];
    const latency = Math.round(8 + Math.random() * 32);

    const newEvent: MarketEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: 'Just now',
      type: picked.type,
      source: picked.source,
      zone: picked.zone,
      payload: { ...picked.payload },
      pipelineStage: assignedStage,
      latencyMs: latency,
    };

    // Prepend new event & keep max 40 in memory
    this.eventsStream = [newEvent, ...this.eventsStream.slice(0, 39)];
    this.totalEvents24h += 1;
    this.liveEventsPerSec = Math.round(1450 + (Math.random() * 80 - 40));

    // Jitter stage metrics slightly for live telemetry pulse
    this.stages = this.stages.map((st) => {
      const deltaQ = Math.floor(Math.random() * 9) - 4;
      return {
        ...st,
        queueDepth: Math.max(10, st.queueDepth + deltaQ),
        latencyMs: Math.max(5, st.latencyMs + Math.round(Math.random() * 4 - 2)),
        processed24h: st.processed24h + 1,
      };
    });

    this.notify();
    return newEvent;
  }

  public getSnapshot(): MarketIntelligenceSnapshot {
    const avgLatency = Math.round(
      this.stages.reduce((sum, s) => sum + s.latencyMs, 0) / this.stages.length
    );

    return {
      pipelineHealth: 'OPTIMAL',
      stages: this.stages,
      totalEventsProcessed24h: this.totalEvents24h,
      liveEventsPerSec: this.liveEventsPerSec,
      avgPipelineLatencyMs: avgLatency,
      activeAnomaliesCount: this.anomalies.filter((a) => a.status === 'ACTIVE').length,
      zoneLiquidity: this.zoneLiquidity,
      priceDispersion: this.priceDispersions,
      brandShares: this.brandShares,
      basketIndex: this.basketIndex,
      recentAnomalies: this.anomalies,
      syndicatedSubscribersCount: this.syndicatedSubscribersCount,
    };
  }

  public resolveAnomaly(anomalyId: string): MarketAnomalyAlert | undefined {
    let targetAnomaly: MarketAnomalyAlert | undefined;
    this.anomalies = this.anomalies.map((a) => {
      if (a.id === anomalyId) {
        targetAnomaly = { ...a, status: 'RESOLVED' };
        return targetAnomaly;
      }
      return a;
    });

    if (targetAnomaly) {
      // Ingest an operational resolution event into the live stream
      const resolutionEvent: MarketEvent = {
        id: `evt_action_${Date.now()}`,
        timestamp: 'Just now',
        type: 'DEPOT_STOCK_SYNC',
        source: 'Automated Action Dispatcher',
        zone: targetAnomaly.affectedZone,
        payload: {
          action: targetAnomaly.automatedAction.label,
          targetService: targetAnomaly.automatedAction.targetService,
          status: 'EXECUTED_SUCCESSFULLY',
          mitigationNotes: targetAnomaly.automatedAction.description,
        },
        pipelineStage: 'SYNDICATION_ACTION',
        latencyMs: 14,
      };

      this.eventsStream = [resolutionEvent, ...this.eventsStream.slice(0, 39)];

      // If resolving sugar deficit in Westlands, restore stockStatus
      if (anomalyId === 'anom_01') {
        this.priceDispersions = this.priceDispersions.map((pd) => {
          if (pd.skuId === 'prod_mumias') {
            return {
              ...pd,
              depotPrices: pd.depotPrices.map((dp) =>
                dp.depotId === 'depot_03' ? { ...dp, stockStatus: 'IN_STOCK', price: 2790 } : dp
              ),
              spreadKES: 90,
              arbitrageRisk: 'LOW',
            };
          }
          return pd;
        });

        this.zoneLiquidity = this.zoneLiquidity.map((z) => {
          if (z.zoneId === 'zone_kawangware') {
            return {
              ...z,
              supplyBufferHours: 24.5,
              liquidityStatus: 'BALANCED',
              unmetDemandKES: 280000,
            };
          }
          return z;
        });
      }

      this.notify();
    }

    return targetAnomaly;
  }

  public exportIntelligenceFeed(format: 'json' | 'csv'): string {
    const snapshot = this.getSnapshot();

    if (format === 'json') {
      return JSON.stringify(
        {
          meta: {
            system: 'WAYNO Aggregated Market Intelligence Pipeline',
            version: '2.4.0',
            exportedAt: new Date().toISOString(),
            status: snapshot.pipelineHealth,
            subscriberAudience: 'Enterprise Wholesalers & Manufacturers',
          },
          pipelineStages: snapshot.stages,
          zoneLiquidityMatrix: snapshot.zoneLiquidity,
          wholesalePriceDispersion: snapshot.priceDispersion,
          brandMarketShares: snapshot.brandShares,
          fmcgBasketIndex: snapshot.basketIndex,
          activeAnomalies: snapshot.recentAnomalies,
        },
        null,
        2
      );
    }

    // CSV format: Price Dispersion & Zone Liquidity Summary
    const csvRows: string[] = [
      '# WAYNO FMCG AGGREGATED MARKET INTELLIGENCE FEED (CSV EXPORT)',
      `# Exported At: ${new Date().toISOString()}`,
      '',
      '--- SECTION: WHOLESALE PRICE DISPERSION ---',
      'SKU Name,Category,Pack Size,Avg Wholesale KES,Min Wholesale KES,Max Wholesale KES,Spread KES,Spread %,Elasticity,Arbitrage Risk',
      ...snapshot.priceDispersion.map(
        (p) =>
          `"${p.skuName}","${p.category}","${p.packSize}",${p.avgWholesalePrice},${p.minWholesalePrice},${p.maxWholesalePrice},${p.spreadKES},${p.spreadPercent}%,"${p.priceElasticity}","${p.arbitrageRisk}"`
      ),
      '',
      '--- SECTION: REGIONAL ZONE LIQUIDITY ---',
      'Zone Name,Active Dukas,Daily GMV KES,24h Orders,Avg Basket KES,Fulfillment Rate %,Buffer Hours,Status,Unmet Demand KES',
      ...snapshot.zoneLiquidity.map(
        (z) =>
          `"${z.zoneName}",${z.activeDukas},${z.dailyGMVKES},${z.orderCount24h},${z.avgBasketKES},${z.fulfillmentRate}%,${z.supplyBufferHours},"${z.liquidityStatus}",${z.unmetDemandKES}`
      ),
      '',
      '--- SECTION: BRAND MARKET SHARES ---',
      'Category,Brand Name,Manufacturer,Share %,Monthly GMV KES,WoW Shift %,Duka Penetration %',
      ...snapshot.brandShares.flatMap((cat) =>
        cat.brands.map(
          (b) =>
            `"${cat.category}","${b.brandName}","${b.manufacturer}",${b.sharePercent}%,${b.monthlyGMVKES},${b.changeWoW}%,${b.penetrationDukasPercent}%`
        )
      ),
    ];

    return csvRows.join('\n');
  }

  public getEventsStream(): MarketEvent[] {
    return [...this.eventsStream];
  }
}

// Global Singleton Instance for application lifecycle
export const marketIntelligenceEngine = new MarketIntelligenceEngine();
