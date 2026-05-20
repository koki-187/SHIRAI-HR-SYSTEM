'use client';
import { useState, useEffect } from 'react';
import { ScrapeResponse, FactorsData, SurveyParams } from '@/types';
import OverviewTab from './tabs/OverviewTab';
import ComparisonTab from './tabs/ComparisonTab';
import TrendTab from './tabs/TrendTab';
import FactorsTab from './tabs/FactorsTab';
import MapTab from './tabs/MapTab';
import AIAnalysis from './AIAnalysis';
import ExportButtons from './ExportButtons';

const TABS = [
  { id: 'overview', label: '概要' },
  { id: 'comparison', label: '比較表' },
  { id: 'trend', label: '価格推移' },
  { id: 'factors', label: '要因分析' },
  { id: 'map', label: '地図' },
];

interface Props {
  data: ScrapeResponse;
  params: SurveyParams;
}

export default function ResultTabs({ data, params }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [factors, setFactors] = useState<FactorsData | null>(null);

  useEffect(() => {
    fetch('/api/factors?year=2024')
      .then(r => r.json())
      .then(setFactors)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-800">{data.search_address}</h2>
          {data.data_source && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              data.data_source === 'rakuten' ? 'bg-red-100 text-red-700' :
              data.data_source === 'seed'    ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-500'
            }`}>
              {data.data_source === 'rakuten' ? '🔴 楽天トラベル' :
               data.data_source === 'seed'    ? '📊 実在データ' :
                                               '🧪 モック'}
            </span>
          )}
        </div>
        <ExportButtons data={data} />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition min-w-[80px] ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'comparison' && <ComparisonTab hotels={data.hotels} />}
        {activeTab === 'trend' && <TrendTab stats={data.monthly_stats} />}
        {activeTab === 'factors' && <FactorsTab factors={factors} />}
        {activeTab === 'map' && (
          <MapTab
            hotels={data.hotels}
            centerLat={data.geocoded_lat}
            centerLng={data.geocoded_lng}
          />
        )}
      </div>

      <AIAnalysis data={data} />
    </div>
  );
}
