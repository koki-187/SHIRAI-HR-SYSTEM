from typing import Optional


# 日本の祝日データ（2024-2025年）
HOLIDAYS_2024 = [
    {"date": "2024-01-01", "name": "元日", "month": 1, "day": 1, "impact": "high"},
    {"date": "2024-01-08", "name": "成人の日", "month": 1, "day": 8, "impact": "medium"},
    {"date": "2024-02-11", "name": "建国記念の日", "month": 2, "day": 11, "impact": "medium"},
    {"date": "2024-02-12", "name": "建国記念の日 振替休日", "month": 2, "day": 12, "impact": "low"},
    {"date": "2024-02-23", "name": "天皇誕生日", "month": 2, "day": 23, "impact": "medium"},
    {"date": "2024-03-20", "name": "春分の日", "month": 3, "day": 20, "impact": "medium"},
    {"date": "2024-04-29", "name": "昭和の日", "month": 4, "day": 29, "impact": "high"},
    {"date": "2024-04-30", "name": "GW連休（国民の休日）", "month": 4, "day": 30, "impact": "high"},
    {"date": "2024-05-03", "name": "憲法記念日", "month": 5, "day": 3, "impact": "high"},
    {"date": "2024-05-04", "name": "みどりの日", "month": 5, "day": 4, "impact": "high"},
    {"date": "2024-05-05", "name": "こどもの日", "month": 5, "day": 5, "impact": "high"},
    {"date": "2024-05-06", "name": "こどもの日 振替休日", "month": 5, "day": 6, "impact": "high"},
    {"date": "2024-07-15", "name": "海の日", "month": 7, "day": 15, "impact": "medium"},
    {"date": "2024-08-11", "name": "山の日", "month": 8, "day": 11, "impact": "high"},
    {"date": "2024-08-12", "name": "山の日 振替休日", "month": 8, "day": 12, "impact": "high"},
    {"date": "2024-09-16", "name": "敬老の日", "month": 9, "day": 16, "impact": "medium"},
    {"date": "2024-09-22", "name": "秋分の日", "month": 9, "day": 22, "impact": "medium"},
    {"date": "2024-10-14", "name": "スポーツの日", "month": 10, "day": 14, "impact": "medium"},
    {"date": "2024-11-03", "name": "文化の日", "month": 11, "day": 3, "impact": "medium"},
    {"date": "2024-11-04", "name": "文化の日 振替休日", "month": 11, "day": 4, "impact": "low"},
    {"date": "2024-11-23", "name": "勤労感謝の日", "month": 11, "day": 23, "impact": "medium"},
    {"date": "2024-12-23", "name": "年末休暇開始（慣例）", "month": 12, "day": 23, "impact": "high"},
    {"date": "2024-12-28", "name": "官公庁御用納め", "month": 12, "day": 28, "impact": "high"},
    {"date": "2024-12-29", "name": "年末年始連休", "month": 12, "day": 29, "impact": "high"},
    {"date": "2024-12-30", "name": "年末年始連休", "month": 12, "day": 30, "impact": "high"},
    {"date": "2024-12-31", "name": "大晦日", "month": 12, "day": 31, "impact": "high"},
]

HOLIDAYS_2025 = [
    {"date": "2025-01-01", "name": "元日", "month": 1, "day": 1, "impact": "high"},
    {"date": "2025-01-02", "name": "年始連休", "month": 1, "day": 2, "impact": "high"},
    {"date": "2025-01-03", "name": "年始連休", "month": 1, "day": 3, "impact": "high"},
    {"date": "2025-01-13", "name": "成人の日", "month": 1, "day": 13, "impact": "medium"},
    {"date": "2025-02-11", "name": "建国記念の日", "month": 2, "day": 11, "impact": "medium"},
    {"date": "2025-02-23", "name": "天皇誕生日", "month": 2, "day": 23, "impact": "medium"},
    {"date": "2025-02-24", "name": "天皇誕生日 振替休日", "month": 2, "day": 24, "impact": "low"},
    {"date": "2025-03-20", "name": "春分の日", "month": 3, "day": 20, "impact": "medium"},
    {"date": "2025-04-29", "name": "昭和の日", "month": 4, "day": 29, "impact": "high"},
    {"date": "2025-05-03", "name": "憲法記念日", "month": 5, "day": 3, "impact": "high"},
    {"date": "2025-05-04", "name": "みどりの日", "month": 5, "day": 4, "impact": "high"},
    {"date": "2025-05-05", "name": "こどもの日", "month": 5, "day": 5, "impact": "high"},
    {"date": "2025-05-06", "name": "こどもの日 振替休日", "month": 5, "day": 6, "impact": "high"},
    {"date": "2025-07-21", "name": "海の日", "month": 7, "day": 21, "impact": "medium"},
    {"date": "2025-08-11", "name": "山の日", "month": 8, "day": 11, "impact": "high"},
    {"date": "2025-09-15", "name": "敬老の日", "month": 9, "day": 15, "impact": "medium"},
    {"date": "2025-09-23", "name": "秋分の日", "month": 9, "day": 23, "impact": "medium"},
    {"date": "2025-10-13", "name": "スポーツの日", "month": 10, "day": 13, "impact": "medium"},
    {"date": "2025-11-03", "name": "文化の日", "month": 11, "day": 3, "impact": "medium"},
    {"date": "2025-11-23", "name": "勤労感謝の日", "month": 11, "day": 23, "impact": "medium"},
    {"date": "2025-11-24", "name": "勤労感謝の日 振替休日", "month": 11, "day": 24, "impact": "low"},
    {"date": "2025-12-28", "name": "官公庁御用納め", "month": 12, "day": 28, "impact": "high"},
    {"date": "2025-12-29", "name": "年末年始連休", "month": 12, "day": 29, "impact": "high"},
    {"date": "2025-12-30", "name": "年末年始連休", "month": 12, "day": 30, "impact": "high"},
    {"date": "2025-12-31", "name": "大晦日", "month": 12, "day": 31, "impact": "high"},
]

# 主要イベント・需要ピーク
EVENTS = [
    {
        "name": "年末年始",
        "months": [12, 1],
        "period": "12月28日〜1月4日",
        "impact": "very_high",
        "description": "帰省・旅行需要で宿泊費が年間最高水準。都市部・観光地ともに満室続出。"
    },
    {
        "name": "桜シーズン（花見）",
        "months": [3, 4],
        "period": "3月下旬〜4月中旬",
        "impact": "very_high",
        "description": "全国の観光地で需要急増。京都・東京・大阪は特に顕著。インバウンド客も集中。"
    },
    {
        "name": "ゴールデンウィーク（GW）",
        "months": [4, 5],
        "period": "4月29日〜5月6日",
        "impact": "very_high",
        "description": "国内最大の連休。宿泊施設の価格が平均の2〜3倍に上昇するエリアも。早期予約必須。"
    },
    {
        "name": "夏休み・お盆",
        "months": [7, 8],
        "period": "7月下旬〜8月中旬（特に8月10日〜16日）",
        "impact": "very_high",
        "description": "帰省・海水浴・テーマパーク需要が重なる。リゾート地・ビーチエリアは最繁忙期。"
    },
    {
        "name": "紅葉シーズン",
        "months": [10, 11],
        "period": "10月中旬〜11月下旬",
        "impact": "high",
        "description": "京都・日光・東北エリアで需要急増。インバウンド客にも人気の高い時期。"
    },
    {
        "name": "クリスマス・年末",
        "months": [12],
        "period": "12月23日〜12月31日",
        "impact": "high",
        "description": "カップル・ファミリー需要で都市部ホテルが高騰。イルミネーション観光も集客要因。"
    },
    {
        "name": "シルバーウィーク",
        "months": [9],
        "period": "9月中旬〜下旬（年により変動）",
        "impact": "high",
        "description": "敬老の日・秋分の日前後。5連休以上になる年は特に需要が高まる。"
    },
    {
        "name": "インバウンドピーク（春）",
        "months": [3, 4, 5],
        "period": "3月〜5月",
        "impact": "high",
        "description": "外国人旅行者の春の来日ピーク。桜・GWと重なり、都市部の高単価ホテルが恩恵を受ける。"
    },
    {
        "name": "インバウンドピーク（秋）",
        "months": [10, 11],
        "period": "10月〜11月",
        "impact": "high",
        "description": "外国人旅行者の秋の来日ピーク。紅葉観光・文化体験で京都・奈良・金沢等が人気。"
    },
    {
        "name": "連休需要（ハッピーマンデー）",
        "months": [1, 2, 7, 9, 10],
        "period": "各月の第2・第3月曜日前後",
        "impact": "medium",
        "description": "成人の日・海の日・敬老の日・スポーツの日等の3連休。近距離旅行需要が発生。"
    },
    {
        "name": "学会・MICE需要",
        "months": [3, 6, 9, 11],
        "period": "年4回の学会・展示会シーズン",
        "impact": "medium",
        "description": "大型国際会議・展示会（幕張メッセ・パシフィコ横浜等）開催時は周辺ホテルが数週間前から満室に。"
    },
    {
        "name": "受験シーズン",
        "months": [1, 2],
        "period": "1月中旬〜2月下旬",
        "impact": "medium",
        "description": "センター試験・大学入試期間。試験会場周辺ホテルが受験生・保護者で混雑。"
    },
]

# 季節別天候メモ
WEATHER_NOTES_BY_MONTH = {
    1: "冬季（1月）: 全国的に寒波・降雪リスク。スキーリゾートは最繁忙期。太平洋側は乾燥・晴天が多い。",
    2: "冬季（2月）: 最寒期。積雪地域では交通障害も。梅の開花が始まり、一部の観光地で客足回復。",
    3: "春先（3月）: 気候が改善し旅行需要が急増。桜前線が南から北上開始。花粉シーズンも重なる。",
    4: "春（4月）: 桜満開・GW前半で年間最高の需要期。好天に恵まれる日が多く観光に最適。",
    5: "春〜初夏（5月）: GW後半から初夏へ。新緑が美しく旅行者が多い。天候は安定。",
    6: "梅雨（6月）: 本州は梅雨入りで旅行需要がやや低下。北海道は梅雨なし・ラベンダーシーズン開始で人気。",
    7: "夏（7月）: 梅雨明け後は猛暑。海水浴・夏祭り・花火大会で需要急増。熱中症対策が宿の差別化要素に。",
    8: "夏〜お盆（8月）: 年間最高気温。お盆を中心に国内最大の移動需要。早期予約・高価格が常態化。",
    9: "初秋（9月）: 台風シーズン（9月が最多）。被害を受けたエリアは需要が急低下することも。秋の旅行シーズン準備期。",
    10: "秋（10月）: 気候が安定し行楽シーズン本格化。インバウンド需要も旺盛。スポーツの日連休で国内旅行活況。",
    11: "晩秋（11月）: 紅葉ピーク。京都・日光・東北の需要が特に高まる。文化の日・勤労感謝の日の連休効果も。",
    12: "冬〜年末（12月）: 前半は比較的閑散だが、クリスマス・年末年始に向け急上昇。スキーリゾートも繁忙期入り。",
}


def get_factors(year: int, month: Optional[int] = None) -> dict:
    """
    指定年（・月）の日本の祝日・イベント・要因データを返す。

    Args:
        year: 対象年（2024または2025推奨）
        month: 対象月（1-12）。Noneの場合は全月を返す。

    Returns:
        holidays, events, weather_notes, inbound_trend, forex_note, cpi_note を含む辞書
    """
    # 祝日データの選択
    if year == 2024:
        all_holidays = HOLIDAYS_2024
    elif year == 2025:
        all_holidays = HOLIDAYS_2025
    else:
        # 範囲外の年は2024データを基に返す
        all_holidays = HOLIDAYS_2024

    # 月フィルタリング
    if month is not None:
        holidays = [h for h in all_holidays if h["month"] == month]
        events = [e for e in EVENTS if month in e["months"]]
        weather_notes = WEATHER_NOTES_BY_MONTH.get(month, "天候データなし")
    else:
        holidays = all_holidays
        events = EVENTS
        # 通年サマリー
        weather_notes = (
            "春（3〜5月）: 桜・GW需要で最繁忙。"
            "夏（7〜8月）: お盆ピーク・海水浴需要。"
            "秋（10〜11月）: 紅葉シーズン・インバウンド活発。"
            "冬（12〜2月）: 年末年始ピーク・スキーリゾート需要。"
            "梅雨（6月）: 本州の旅行需要が一時的に低下。"
        )

    inbound_trend = (
        f"{year}年のインバウンド動向: "
        "2024年は訪日外国人数が3,600万人を超え過去最高を記録（推計）。"
        "円安（1ドル=150〜160円水準）が外国人旅行者の購買力を押し上げ、"
        "高単価ホテル・旅館の稼働率が向上。"
        "特に欧米・東南アジアからの旅行者が急増し、"
        "東京・京都・大阪の三大都市圏だけでなく、地方都市・農村部への分散も進展。"
        "2025年も引き続き高水準が見込まれ、宿泊施設不足が一部エリアで深刻化。"
    )

    forex_note = (
        "為替動向（円安の影響）: "
        "2024年は歴史的な円安水準（年間平均1ドル=約151円）が継続。"
        "外国人旅行者にとっての日本の宿泊コストが相対的に低下し、"
        "インバウンド需要を強力に下支え。"
        "国内ホテルの外国人客向け単価引き上げが進み、"
        "ADR（平均客室単価）の上昇に寄与している。"
        "一方、円高に転じた場合はインバウンド需要の減少リスクに注意が必要。"
    )

    cpi_note = (
        "宿泊費・CPI動向: "
        "2024年の旅行・宿泊サービスの消費者物価指数（CPI）は前年比+8〜12%上昇。"
        "コロナ禍での宿泊需要回復に加え、人件費・光熱費の高騰が宿泊単価を押し上げ。"
        "特にビジネスホテルの一人泊単価は2019年比で20〜30%高い水準に達するエリアも。"
        "高級ホテル・リゾート施設は更に高い価格上昇率を記録しており、"
        "土地仕入れ判断においては中長期的な単価上昇トレンドを織り込むことが重要。"
    )

    return {
        "holidays": holidays,
        "events": events,
        "weather_notes": weather_notes,
        "inbound_trend": inbound_trend,
        "forex_note": forex_note,
        "cpi_note": cpi_note,
    }
