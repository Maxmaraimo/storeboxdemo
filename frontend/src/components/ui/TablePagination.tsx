import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface TablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  busy?: boolean;
}

export function TablePagination({ total, page, pageSize, onPageChange, onPageSizeChange, busy = false }: TablePaginationProps) {
  const { lang } = useAuth();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const first = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);
  const range = lang === "ru"
    ? `${first}–${last} из ${total} записей`
    : lang === "en"
    ? `${first}–${last} of ${total} records`
    : `${total} ta yozuvdan ${first}–${last} ko'rsatilgan`;
  const actions = [
    { Icon: ChevronsLeft, page: 1, disabled: currentPage === 1, label: lang === "ru" ? "Первая страница" : lang === "en" ? "First page" : "Birinchi sahifa" },
    { Icon: ChevronLeft, page: currentPage - 1, disabled: currentPage === 1, label: lang === "ru" ? "Предыдущая страница" : lang === "en" ? "Previous page" : "Oldingi sahifa" },
    { Icon: ChevronRight, page: currentPage + 1, disabled: currentPage === pageCount, label: lang === "ru" ? "Следующая страница" : lang === "en" ? "Next page" : "Keyingi sahifa" },
    { Icon: ChevronsRight, page: pageCount, disabled: currentPage === pageCount, label: lang === "ru" ? "Последняя страница" : lang === "en" ? "Last page" : "Oxirgi sahifa" },
  ];

  return (
    <div aria-busy={busy} className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-b-[inherit] border-t border-[#e6e3eb] bg-white px-4 py-3 text-xs text-[#767084] dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-400">
      <label className="inline-flex items-center gap-2.5">
        <span>{lang === "ru" ? "Показывать" : lang === "en" ? "Show" : "Ko'rsatish"}</span>
        <select
          value={pageSize}
          disabled={busy}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="min-h-8 rounded-lg border border-[#e6e3eb] bg-[#f7f6f9] py-1 pl-2.5 pr-2 text-xs tabular-nums text-[#211b2e] focus:border-[#211b2e] focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-[#30263f] dark:text-white"
        >
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <span role="status" className="tabular-nums sm:ml-auto">{range}</span>
      <nav className="ml-auto flex items-center gap-1 sm:ml-0" aria-label={lang === "ru" ? "Страницы таблицы" : lang === "en" ? "Table pages" : "Jadval sahifalari"}>
        {actions.map(({ Icon, page: targetPage, disabled, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            disabled={busy || disabled}
            onClick={() => onPageChange(targetPage)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#767084] transition-colors hover:bg-[#f0edf4] hover:text-[#211b2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#767084] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white dark:disabled:hover:text-zinc-300"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </nav>
    </div>
  );
}
