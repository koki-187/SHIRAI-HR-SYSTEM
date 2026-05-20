'use client';
import { FactorsData } from '@/types';

interface Props {
  factors: FactorsData | null;
  error?: boolean;
}

export default function FactorsTab({ factors, error }: Props) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-500 text-sm">要因データの読み込みに失敗しました</p>
      </div>
    );
  }

  if (!factors && !error) {
    return (
      <div className="space-y-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FactorCard title="主要祝日" color="blue">
          <ul className="space-y-1">
            {factors!.holidays.slice(0, 15).map((h, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-gray-400 w-16 shrink-0">{h.date}</span>
                <span>{h.name}</span>
              </li>
            ))}
          </ul>
        </FactorCard>

        <FactorCard title="主要イベント・繁忙期" color="orange">
          <ul className="space-y-2">
            {factors!.events.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{e.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{e.period}</span>
                <p className="text-gray-500 text-xs">{e.impact}</p>
              </li>
            ))}
          </ul>
        </FactorCard>

        <FactorCard title="天候・季節要因" color="cyan">
          <p className="text-sm text-gray-700 whitespace-pre-line">{factors!.weather_notes}</p>
        </FactorCard>

        <FactorCard title="インバウンド動向" color="green">
          <p className="text-sm text-gray-700">{factors!.inbound_trend}</p>
        </FactorCard>

        <FactorCard title="為替動向" color="yellow">
          <p className="text-sm text-gray-700">{factors!.forex_note}</p>
        </FactorCard>

        <FactorCard title="宿泊費・CPI" color="purple">
          <p className="text-sm text-gray-700">{factors!.cpi_note}</p>
        </FactorCard>
      </div>
    </div>
  );
}

function FactorCard({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color: string;
}) {
  const borders: Record<string, string> = {
    blue: 'border-blue-200',
    orange: 'border-orange-200',
    cyan: 'border-cyan-200',
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    purple: 'border-purple-200',
  };
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${borders[color]}`}>
      <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}
