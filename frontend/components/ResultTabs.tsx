'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ScrapeResponse, FactorsData, SurveyParams, InvestmentParams } from '@/types';
import AIAnalysis from './AIAnalysis';
import ExportButtons from './ExportButtons';
import HotelRankingTab from './HotelRankingTab';

function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 bg-gray-100 rounded-xl w-1/3" />
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="h-24 bg-gray-100 rounded-xl" />
    </div>
  );
}

// 重いタブ（巨大データ・chart.js・Leaflet）— SSR無効
const MapTab = dynamic(() => import('./tabs/MapTab'), { ssr: false, loading: () => <TabSkeleton /> });
const BrandBenchmarkTab = dynamic(() => import('./tabs/BrandBenchmarkTab'), { ssr: false, loading: () => <TabSkeleton /> });
const AnnualADRTab = dynamic(() => import('./tabs/AnnualADRTab'), { ssr: false, loading: () => <TabSkeleton /> });
const DevelopmentCFTab = dynamic(() => import('./tabs/DevelopmentCFTab'), { ssr: false, loading: () => <TabSkeleton /> });
const TrendTab = dynamic(() => import('./tabs/TrendTab'), { ssr: false, loading: () => <TabSkeleton /> });
const InvestmentTab = dynamic(() => import('./tabs/InvestmentTab'), { ssr: false, loading: () => <TabSkeleton /> });

// 軽いタブ（SSR対応）
const OverviewTab = dynamic(() => import('./tabs/OverviewTab'));
const ComparisonTab = dynamic(() => import('./tabs/ComparisonTab'));
const FactorsTab = dynamic(() => import('./tabs/FactorsTab'));
const RoomTab = dynamic(() => import('./tabs/RoomTab'));

interface TabDef {
  id: string;
  label: string;
  badge?: boolean;
}

const TAB_GROUPS: Array<{ label: string; tabs: TabDef[] }> = [
  {
    label: '📊 市場分析',
    tabs: [
      { id: 'overview',   label: '概要' },
      { id: 'comparison', label: '比較表' },
      { id: 'trend',      label: '価格推移' },
      { id: 'factors',    label: '要因分析' },
      { id: 'map',        label: '地図' },
      { id: 'room',       label: '部屋分析' },
    ],
  },
  {
    label: '💰 投資判断',
    tabs: [
      { id: 'investment', label: '投資判断', badge: true },
      { id: 'devcf',      label: '開発CF',   badge: true },
    ],
  },
  {
    label: '🏷️ ベンチマーク',
    tabs: [
      { id: 'annualadr',  label: '年間ADR',    badge: true },
      { id: 'brand',      label: 'ブランドADR', badge: true },
    ],
  },
  {
    label: '🏆 ランキング',
    tabs: [
      { id: 'ranking', label: '🏆 ランキング' },
    ],
  },
];

// 全タブのフラットリストも維持（mountedTabs等で参照用）
const TABS = TAB_GROUPS.flatMap(g => g.tabs);

interface Props {
  data: ScrapeResponse;
  params: SurveyParams;
  investmentParams?: InvestmentParams | null;
}

export default function ResultTabs({ data, params, investmentParams }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));
  const [factors, setFactors] = useState<FactorsData | null>(null);
  const [factorsError, setFactorsError] = useState(false);

  const handleTabChange = (tabId: string) => {
    // investment タブは investmentParams がある場合のみマウント
    if (tabId === 'investment' && !investmentParams) return;
    setActiveTab(tabId);
    setMountedTabs((prev: Set<string>) => { const next = new Set(prev); next.add(tabId); return next; });
  };

  useEffect(() => {
    fetch(`/api/factors?year=${new Date().getFullYear() - 1}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setFactors)
      .catch((e) => {
        console.error('[ResultTabs] factors fetch failed:', e);
        setFactorsError(true);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-800">{data.search_address}</h2>
          {data.data_source && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              data.data_source === 'rakuten' ? 'bg-red-100 text-red-700' :
              data.data_source === 'jalan'   ? 'bg-orange-100 text-orange-700' :
              data.data_source === 'seed'    ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-500'
            }`}>
              {data.data_source === 'rakuten' ? '🔴 楽天トラベル' :
               data.data_source === 'jalan'   ? '🟠 じゃらんnet' :
               data.data_source === 'seed'    ? '📊 実在データ' :
                                               '🧪 モック'}
            </span>
          )}
        </div>
        <ExportButtons data={data} />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-1">
        {TAB_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex items-center gap-1 flex-shrink-0">
            {/* グループ間のセパレータ（初回グループ以外） */}
            {gi > 0 && (
              <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />
            )}
            {/* グループラベル（非クリック） */}
            <span className="text-xs text-gray-400 px-1 flex-shrink-0 hidden lg:inline">
              {group.label}
            </span>
            {/* グループ内タブ */}
            {group.tabs.map(tab => {
              const isInvestment = tab.id === 'investment';
              const showBadge = !!tab.badge && (isInvestment ? !!investmentParams : true);
              if (isInvestment && !investmentParams) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  className={`flex-shrink-0 py-2 min-h-[40px] px-2.5 rounded-lg text-xs sm:text-sm font-medium transition min-w-[52px] sm:min-w-[64px] relative flex items-center justify-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div role="tabpanel" id={`tabpanel-${activeTab}`}>
        {mountedTabs.has('overview') && (
          <div hidden={activeTab !== 'overview'}>
            <OverviewTab data={data} />
          </div>
        )}
        {mountedTabs.has('annualadr') && (
          <div hidden={activeTab !== 'annualadr'}>
            <AnnualADRTab
              lat={data.geocoded_lat}
              lng={data.geocoded_lng}
            />
          </div>
        )}
        {mountedTabs.has('comparison') && (
          <div hidden={activeTab !== 'comparison'}>
            <ComparisonTab hotels={data.hotels} />
          </div>
        )}
        {mountedTabs.has('trend') && (
          <div hidden={activeTab !== 'trend'}>
            <TrendTab
              stats={data.monthly_stats}
              lat={data.geocoded_lat}
              lng={data.geocoded_lng}
            />
          </div>
        )}
        {mountedTabs.has('factors') && (
          <div hidden={activeTab !== 'factors'}>
            <FactorsTab factors={factors} error={factorsError} />
          </div>
        )}
        {mountedTabs.has('map') && (
          <div hidden={activeTab !== 'map'}>
            <MapTab
              hotels={data.hotels}
              centerLat={data.geocoded_lat}
              centerLng={data.geocoded_lng}
            />
          </div>
        )}
        {mountedTabs.has('room') && (
          <div hidden={activeTab !== 'room'}>
            <RoomTab hotels={data.hotels} />
          </div>
        )}
        {mountedTabs.has('investment') && investmentParams && (
          <div hidden={activeTab !== 'investment'}>
            <InvestmentTab params={investmentParams} data={data} />
          </div>
        )}
        {mountedTabs.has('devcf') && (
          <div hidden={activeTab !== 'devcf'}>
            <DevelopmentCFTab />
          </div>
        )}
        {mountedTabs.has('brand') && (
          <div hidden={activeTab !== 'brand'}>
            <BrandBenchmarkTab
              lat={data.geocoded_lat}
              lng={data.geocoded_lng}
            />
          </div>
        )}
        {mountedTabs.has('ranking') && (
          <div hidden={activeTab !== 'ranking'}>
            <HotelRankingTab
              lat={data.geocoded_lat}
              lng={data.geocoded_lng}
            />
          </div>
        )}
      </div>

      <AIAnalysis data={data} autoRun={false} />
    </div>
  );
}
