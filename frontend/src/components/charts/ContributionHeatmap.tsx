import React, { useState, useRef } from "react";

export interface HeatmapDay {
  date: string;
  count: number;
  revenue: number;
  level: number; // 0..4, -1 for future
  weekday: number; // 0=Mon, 6=Sun
  month: number;
  day: number;
  year: number;
  is_today: boolean;
  is_future?: boolean;
}

export interface HeatmapWeek {
  week_index: number;
  month_label?: string | null;
  days: HeatmapDay[];
}

export interface DashboardHeatmap {
  total_orders: number;
  total_revenue: number;
  active_days: number;
  max_orders_day: number;
  best_date: string | null;
  longest_streak: number;
  current_streak: number;
  start_date: string;
  end_date: string;
  weeks: HeatmapWeek[];
  days: HeatmapDay[];
}

interface Props {
  heatmap?: DashboardHeatmap;
  currency: "UZS" | "USD";
  formatMoney: (sum: number) => string;
}

const UZ_MONTH_NAMES = [
  "",
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

const RU_MONTH_NAMES = [
  "",
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export const ContributionHeatmap: React.FC<Props> = ({
  heatmap,
  currency,
  formatMoney,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    day: HeatmapDay;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!heatmap || !heatmap.weeks || heatmap.weeks.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs font-medium space-y-2">
        <span>Faollik ma'lumotlari yuklanmoqda...</span>
      </div>
    );
  }

  const {
    total_orders,
    weeks,
    active_days,
    max_orders_day,
    current_streak,
    best_date,
  } = heatmap;

  const formatDateLabel = (day: HeatmapDay) => {
    const uzStr = `${day.day}-${UZ_MONTH_NAMES[day.month]}, ${day.year}`;
    const ruStr = `${day.day} ${RU_MONTH_NAMES[day.month]} ${day.year}`;
    return { uzStr, ruStr };
  };

  const getCellColorClass = (day: HeatmapDay) => {
    if (day.is_future) {
      return "opacity-0 pointer-events-none";
    }
    switch (day.level) {
      case 1:
        return "bg-[#9be9a8] dark:bg-[#0e4429] border border-[#9be9a8]/80 dark:border-[#006d32]/60";
      case 2:
        return "bg-[#40c463] dark:bg-[#006d32] border border-[#40c463]/80 dark:border-[#26a641]/60";
      case 3:
        return "bg-[#30a14e] dark:bg-[#26a641] border border-[#30a14e]/80 dark:border-[#39d353]/60";
      case 4:
        return "bg-[#216e39] dark:bg-[#39d353] border border-[#216e39]/80 dark:border-[#39d353]/80";
      default:
        // Level 0: empty
        return "bg-neutral-100 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04]";
    }
  };

  return (
    <div className="w-full flex flex-col justify-between select-none relative" ref={containerRef}>
      {/* 1. Header Summary Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-black/[0.04] dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-neutral-900 dark:text-white tracking-tight">
            {total_orders.toLocaleString()} ta buyurtma
          </span>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
            (so'nggi 1 yilda)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {active_days > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-medium">
              <span>Faol kunlar: {active_days} kun</span>
            </div>
          )}
          {max_orders_day > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
              <span>Eng faol kun: <strong className="text-neutral-800 dark:text-neutral-200">{max_orders_day} ta</strong></span>
            </div>
          )}
          {current_streak > 0 && (
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
              <span>Streak: <strong className="text-emerald-600 dark:text-emerald-400">{current_streak} kun</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Heatmap Calendar Matrix */}
      <div className="overflow-x-auto no-scrollbar py-2">
        <div className="min-w-[760px] flex flex-col">
          {/* Months Row */}
          <div className="flex items-center ml-8 mb-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono h-4">
            {weeks.map((week, idx) => (
              <div
                key={`m-${idx}`}
                className="w-3 mr-1 text-left whitespace-nowrap overflow-visible"
              >
                {week.month_label ? (
                  <span className="font-semibold">{week.month_label}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Days Grid: Left labels + 53 Columns */}
          <div className="flex items-start">
            {/* Weekday labels on left (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] text-neutral-400 dark:text-neutral-500 font-mono pr-2 h-[105px] select-none">
              <span className="h-3 leading-3">Dush</span>
              <span className="h-3 leading-3 opacity-0">Sesh</span>
              <span className="h-3 leading-3">Chor</span>
              <span className="h-3 leading-3 opacity-0">Pay</span>
              <span className="h-3 leading-3">Juma</span>
              <span className="h-3 leading-3 opacity-0">Shan</span>
              <span className="h-3 leading-3 opacity-0">Yak</span>
            </div>

            {/* Matrix Columns */}
            <div className="flex items-center gap-1">
              {weeks.map((week) => (
                <div
                  key={`w-${week.week_index}`}
                  className="flex flex-col gap-1"
                >
                  {week.days.map((day) => {
                    const isHovered = hoveredCell?.day.date === day.date;
                    return (
                      <div
                        key={day.date}
                        className={`w-3 h-3 rounded-[2.5px] transition-all duration-150 relative ${getCellColorClass(
                          day
                        )} ${
                          !day.is_future
                            ? "cursor-pointer hover:scale-135 hover:z-30 hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-400"
                            : ""
                        } ${isHovered ? "scale-135 ring-2 ring-emerald-400 z-30 shadow-md" : ""}`}
                        onMouseEnter={(e) => {
                          if (!day.is_future && containerRef.current) {
                            const containerRect = containerRef.current.getBoundingClientRect();
                            const cellRect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              day,
                              x: cellRect.left - containerRect.left + cellRect.width / 2,
                              y: cellRect.top - containerRect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legend & Real-time Indicator */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-black/[0.04] dark:border-white/5 text-[11px] text-neutral-400 dark:text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-neutral-600 dark:text-neutral-400">
            Real vaqtdagi buyurtmalar faolligi
          </span>
        </div>

        {/* Legend Scale: Kamroq [ ] [ ] [ ] [ ] [ ] Ko'proq */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">Kamroq</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-100 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04]" title="0 buyurtma" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429] border border-[#9be9a8]/80 dark:border-[#006d32]/60" title="1-2 buyurtma" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#40c463] dark:bg-[#006d32] border border-[#40c463]/80 dark:border-[#26a641]/60" title="3-5 buyurtma" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641] border border-[#30a14e]/80 dark:border-[#39d353]/60" title="6-9 buyurtma" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#216e39] dark:bg-[#39d353] border border-[#216e39]/80" title="10+ buyurtma" />
          <span className="text-[10px]">Ko'proq</span>
        </div>
      </div>

      {/* 4. Floating Precision Tooltip */}
      {hoveredCell && (() => {
        const containerWidth = containerRef.current?.clientWidth || 800;
        const isNearRight = hoveredCell.x > containerWidth - 140;
        const isNearLeft = hoveredCell.x < 120;
        const transformClass = isNearRight
          ? "-translate-x-[92%] -translate-y-full"
          : isNearLeft
          ? "-translate-x-[8%] -translate-y-full"
          : "-translate-x-1/2 -translate-y-full";
        const arrowLeft = isNearRight ? "92%" : isNearLeft ? "8%" : "50%";

        return (
          <div
            className={`absolute pointer-events-none z-50 transform ${transformClass} mb-1 px-3 py-2 rounded-xl bg-neutral-900/95 dark:bg-neutral-800/95 text-white backdrop-blur-md shadow-2xl border border-white/10 text-xs font-sans whitespace-nowrap transition-all duration-150`}
            style={{
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y - 6}px`,
            }}
          >
            {hoveredCell.day.count > 0 ? (
              <div>
                <div className="font-black text-emerald-400 flex items-center gap-1.5">
                  <span>
                    {hoveredCell.day.count} ta buyurtma
                  </span>
                  <span className="text-white/60 font-normal text-[11px]">
                    ({formatMoney(hoveredCell.day.revenue)})
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300 mt-0.5">
                  {formatDateLabel(hoveredCell.day).uzStr}
                </div>
                <div className="text-[10px] text-neutral-400 italic">
                  {hoveredCell.day.count === 1 ? "1 заказ" : `${hoveredCell.day.count} заказа`} • {formatDateLabel(hoveredCell.day).ruStr}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-bold text-neutral-300">
                  Buyurtmalar bo'lmagan
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {formatDateLabel(hoveredCell.day).uzStr}
                </div>
                <div className="text-[10px] text-neutral-500 italic">
                  Заказов не было • {formatDateLabel(hoveredCell.day).ruStr}
                </div>
              </div>
            )}

            {/* Micro arrow pointing down */}
            <div
              className="absolute -bottom-1 transform -translate-x-1/2 w-2 h-2 bg-neutral-900/95 dark:bg-neutral-800/95 rotate-45 border-r border-b border-white/10"
              style={{ left: arrowLeft }}
            />
          </div>
        );
      })()}
    </div>
  );
};
