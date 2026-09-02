"use client";

import { useScreenerStore, setPage, setRowsPerPage } from "@/lib/store";

interface PaginationProps {
  totalRows: number;
}

export function Pagination({ totalRows }: PaginationProps) {
  const { rowsPerPage, page } = useScreenerStore();
  const totalPages =
    rowsPerPage === 0 ? 1 : Math.ceil(totalRows / rowsPerPage);

  const start = page * rowsPerPage + 1;
  const end = rowsPerPage === 0 ? totalRows : Math.min((page + 1) * rowsPerPage, totalRows);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push("...");
    for (
      let i = Math.max(1, page - 1);
      i <= Math.min(totalPages - 2, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 3) pages.push("...");
    pages.push(totalPages - 1);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {totalRows === 0
          ? "0 results"
          : `${start.toLocaleString()}–${end.toLocaleString()} of ${totalRows.toLocaleString()}`}
      </div>
      <div className="flex items-center gap-4">
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-700 dark:text-zinc-300"
        >
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
          <option value={0}>All</option>
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-sm rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            Prev
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-zinc-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-2 py-1 text-sm rounded ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {p + 1}
              </button>
            )
          )}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 text-sm rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
