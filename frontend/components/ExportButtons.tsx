'use client';
import { ScrapeResponse } from '@/types';

export default function ExportButtons({ data }: { data: ScrapeResponse }) {
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // シート1: ホテル一覧
    const hotelRows = data.hotels.map((h, i) => ({
      'No.': i + 1,
      'ホテル名': h.name,
      '料金/泊 (円)': h.price_per_night,
      '評価スコア': h.rating ?? '',
      'クチコミ数': h.review_count ?? '',
      'データソース': h.source,
      'URL': h.url,
    }));
    const ws1 = XLSX.utils.json_to_sheet(hotelRows);
    ws1['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'ホテル一覧');

    // シート2: 月別統計
    const statRows = data.monthly_stats.map(s => ({
      '月': s.month,
      '平日平均 (円)': s.weekday_avg,
      '休日平均 (円)': s.weekend_avg,
      '繁忙期平均 (円)': s.peak_avg ?? '',
      '最低価格 (円)': s.min_price,
      '最高価格 (円)': s.max_price,
      '平日/休日差異': `+${Math.round((s.weekend_avg / s.weekday_avg - 1) * 100)}%`,
    }));
    const ws2 = XLSX.utils.json_to_sheet(statRows);
    ws2['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, '月別統計');

    // シート3: サマリー
    const avg = data.hotels.reduce((s, h) => s + h.price_per_night, 0) / data.hotels.length;
    const ratedHotels = data.hotels.filter(h => h.rating);
    const avgRating = ratedHotels.length > 0
      ? ratedHotels.reduce((s, h) => s + (h.rating || 0), 0) / ratedHotels.length
      : null;
    const weekdayAvg = data.monthly_stats.reduce((s, m) => s + m.weekday_avg, 0) / data.monthly_stats.length;
    const weekendAvg = data.monthly_stats.reduce((s, m) => s + m.weekend_avg, 0) / data.monthly_stats.length;
    const peakMonths = data.monthly_stats.filter(m => m.peak_avg);
    const peakAvg = peakMonths.length > 0
      ? peakMonths.reduce((s, m) => s + (m.peak_avg || 0), 0) / peakMonths.length
      : null;

    const summaryRows = [
      { '項目': '調査エリア', '値': data.search_address },
      { '項目': '調査日', '値': new Date().toLocaleDateString('ja-JP') },
      { '項目': '調査ホテル数', '値': `${data.hotels.length}件` },
      { '項目': '平均料金/泊', '値': `¥${Math.round(avg).toLocaleString()}` },
      { '項目': '最低料金', '値': `¥${Math.min(...data.hotels.map(h => h.price_per_night)).toLocaleString()}` },
      { '項目': '最高料金', '値': `¥${Math.max(...data.hotels.map(h => h.price_per_night)).toLocaleString()}` },
      { '項目': '平均評価スコア', '値': avgRating ? `${avgRating.toFixed(1)} / 10` : 'N/A' },
      { '項目': '年間平日ADR', '値': `¥${Math.round(weekdayAvg).toLocaleString()}` },
      { '項目': '年間休日ADR', '値': `¥${Math.round(weekendAvg).toLocaleString()}` },
      { '項目': '繁忙期平均ADR', '値': peakAvg ? `¥${Math.round(peakAvg).toLocaleString()}` : 'N/A' },
      { '項目': '繁忙期/平日 倍率', '値': peakAvg ? `${(peakAvg / weekdayAvg).toFixed(2)}倍` : 'N/A' },
    ];
    const ws3 = XLSX.utils.json_to_sheet(summaryRows);
    ws3['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'サマリー');

    XLSX.writeFile(
      wb,
      `HotelScope_${data.search_address.substring(0, 20)}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 15;
    const contentW = W - margin * 2;
    let y = 0;

    // ── ヘッダー ──
    doc.setFillColor(30, 64, 175); // blue-800
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HotelScope', margin, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Market Survey Report', margin, 20);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('ja-JP')}`, W - margin, 20, { align: 'right' });
    y = 36;

    // ── エリア情報 ──
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Survey Area', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(data.search_address, margin, y);
    doc.text(`Lat: ${data.geocoded_lat.toFixed(4)}, Lng: ${data.geocoded_lng.toFixed(4)}`, margin, y + 5);
    y += 14;

    // ── サマリーカード（4つ横並び）──
    const avg = data.hotels.reduce((s, h) => s + h.price_per_night, 0) / data.hotels.length;
    const minP = Math.min(...data.hotels.map(h => h.price_per_night));
    const maxP = Math.max(...data.hotels.map(h => h.price_per_night));
    const weekdayAvg = data.monthly_stats.reduce((s, m) => s + m.weekday_avg, 0) / data.monthly_stats.length;

    const cards = [
      { label: 'Hotels', value: `${data.hotels.length}` },
      { label: 'Avg Price/Night', value: `Y${Math.round(avg).toLocaleString()}` },
      { label: 'Min Price', value: `Y${minP.toLocaleString()}` },
      { label: 'Weekday ADR', value: `Y${Math.round(weekdayAvg).toLocaleString()}` },
    ];

    const cardW = contentW / 4 - 2;
    cards.forEach((card, i) => {
      const cx = margin + i * (cardW + 2.7);
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(cx, y, cardW, 16, 2, 2, 'F');
      doc.setTextColor(96, 96, 96);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, cx + cardW / 2, y + 5, { align: 'center' });
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, cx + cardW / 2, y + 12, { align: 'center' });
    });
    y += 22;

    // ── ホテル一覧テーブル ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Hotel List', margin, y);
    y += 5;

    // ヘッダー行
    const colWidths = [8, 75, 28, 18, 22];
    const colX = [margin, margin + 8, margin + 83, margin + 111, margin + 129];
    const colLabels = ['#', 'Hotel Name', 'Price/Night', 'Rating', 'Source'];

    doc.setFillColor(30, 64, 175);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    colLabels.forEach((label, i) => {
      doc.text(label, colX[i] + 1, y + 4.8);
    });
    y += 7;

    // データ行
    doc.setFont('helvetica', 'normal');
    const hotelsSorted = [...data.hotels].sort((a, b) => a.price_per_night - b.price_per_night);
    hotelsSorted.forEach((hotel, i) => {
      if (y > 245) return; // ページ溢れ防止
      const isEven = i % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentW, 6, 'F');
      }
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(7);
      doc.text(`${i + 1}`, colX[0] + 1, y + 4.2);
      // ホテル名を切り詰め
      const name = hotel.name.length > 28 ? hotel.name.substring(0, 28) + '...' : hotel.name;
      doc.text(name, colX[1] + 1, y + 4.2);
      doc.setTextColor(21, 128, 61);
      doc.text(`Y${hotel.price_per_night.toLocaleString()}`, colX[2] + 1, y + 4.2);
      doc.setTextColor(60, 60, 60);
      doc.text(hotel.rating ? `${hotel.rating.toFixed(1)}` : '-', colX[3] + 1, y + 4.2);
      doc.text(hotel.source || '-', colX[4] + 1, y + 4.2);

      // ボーダーライン
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 6, margin + contentW, y + 6);
      y += 6;
    });
    y += 6;

    // ── 月別統計テーブル ──
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Monthly Price Statistics', margin, y);
    y += 5;

    const statColX = [margin, margin + 22, margin + 52, margin + 82, margin + 112, margin + 142];
    const statLabels = ['Month', 'Weekday', 'Weekend', 'Peak', 'Min', 'Max'];

    doc.setFillColor(30, 64, 175);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    statLabels.forEach((label, i) => {
      doc.text(label, statColX[i] + 1, y + 4.8);
    });
    y += 7;

    const PEAK_MONTHS = [3, 4, 5, 8, 12];
    doc.setFont('helvetica', 'normal');
    data.monthly_stats.forEach((s, i) => {
      const monthNum = parseInt(s.month.split('-')[1]);
      const isPeak = PEAK_MONTHS.includes(monthNum);
      if (isPeak) {
        doc.setFillColor(255, 247, 237);
      } else if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, contentW, 6, 'F');

      doc.setTextColor(isPeak ? 180 : 60, isPeak ? 60 : 60, 60);
      doc.setFontSize(7);
      doc.text(`${monthNum}月${isPeak ? ' ★' : ''}`, statColX[0] + 1, y + 4.2);
      doc.setTextColor(60, 60, 60);
      doc.text(`Y${s.weekday_avg.toLocaleString()}`, statColX[1] + 1, y + 4.2);
      doc.text(`Y${s.weekend_avg.toLocaleString()}`, statColX[2] + 1, y + 4.2);
      doc.text(s.peak_avg ? `Y${s.peak_avg.toLocaleString()}` : '-', statColX[3] + 1, y + 4.2);
      doc.setTextColor(130, 130, 130);
      doc.text(`Y${s.min_price.toLocaleString()}`, statColX[4] + 1, y + 4.2);
      doc.text(`Y${s.max_price.toLocaleString()}`, statColX[5] + 1, y + 4.2);

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 6, margin + contentW, y + 6);
      y += 6;
    });
    y += 8;

    // ── フッター ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 287, W, 10, 'F');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.setFont('helvetica', 'normal');
      doc.text('HotelScope - Hotel Market Survey System', margin, 293);
      doc.text(`Page ${p} / ${pageCount}`, W - margin, 293, { align: 'right' });
    }

    doc.save(`HotelScope_Report_${data.search_address.substring(0, 15)}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        onClick={exportExcel}
        aria-label="Excel形式でデータをエクスポート"
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel出力
      </button>
      <button
        onClick={exportPdf}
        aria-label="PDF形式でレポートをエクスポート"
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PDF出力
      </button>
    </div>
  );
}
