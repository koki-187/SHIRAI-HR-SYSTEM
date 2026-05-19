'use client';
import { ScrapeResponse } from '@/types';

export default function ExportButtons({ data }: { data: ScrapeResponse }) {
  const exportExcel = async () => {
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();

    // シート1: ホテル一覧
    const hotelRows = data.hotels.map(h => ({
      'ホテル名': h.name,
      '料金/泊': h.price_per_night,
      '評価': h.rating ?? '',
      'クチコミ数': h.review_count ?? '',
      'URL': h.url,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hotelRows), 'ホテル一覧');

    // シート2: 月別統計
    const statRows = data.monthly_stats.map(s => ({
      '月': s.month,
      '平日平均': s.weekday_avg,
      '休日平均': s.weekend_avg,
      '繁忙期平均': s.peak_avg ?? '',
      '最低': s.min_price,
      '最高': s.max_price,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statRows), '月別統計');

    // シート3: サマリー
    const avg = data.hotels.reduce((s, h) => s + h.price_per_night, 0) / data.hotels.length;
    const summaryRows = [
      { '項目': '調査エリア', '値': data.search_address },
      { '項目': '調査ホテル数', '値': data.hotels.length },
      { '項目': '平均料金', '値': Math.round(avg) },
      { '項目': '最低料金', '値': Math.min(...data.hotels.map(h => h.price_per_night)) },
      { '項目': '最高料金', '値': Math.max(...data.hotels.map(h => h.price_per_night)) },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'サマリー');

    XLSX.writeFile(
      wb,
      `HotelScope_${data.search_address.substring(0, 20)}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('HotelScope 市場調査レポート', 20, 20);

    doc.setFontSize(11);
    doc.text(`調査エリア: ${data.search_address}`, 20, 35);
    doc.text(`調査日: ${new Date().toLocaleDateString('ja-JP')}`, 20, 43);
    doc.text(`調査ホテル数: ${data.hotels.length}件`, 20, 51);

    const avg = data.hotels.reduce((s, h) => s + h.price_per_night, 0) / data.hotels.length;
    doc.text(`平均料金: ¥${Math.round(avg).toLocaleString()}`, 20, 59);

    doc.setFontSize(13);
    doc.text('月別統計', 20, 75);

    doc.setFontSize(9);
    data.monthly_stats.forEach((s, i) => {
      const y = 83 + i * 8;
      if (y > 280) return;
      doc.text(
        `${s.month}  平日:¥${s.weekday_avg.toLocaleString()}  休日:¥${s.weekend_avg.toLocaleString()}`,
        20,
        y
      );
    });

    doc.save(`HotelScope_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={exportExcel}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        Excel出力
      </button>
      <button
        onClick={exportPdf}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        PDF出力
      </button>
    </div>
  );
}
