"use client";

import { useEffect, useMemo, useState } from "react";
import { yahooShoppingSearchUrl } from "@/lib/affiliate";
import type { YahooAffiliateSheetRow } from "@/lib/affiliate/yahooShortLinks";

type Filter = "all" | "todo" | "filled" | "none";

function formatRecordedAt(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function StatusBadge({ row }: { row: YahooAffiliateSheetRow }) {
  if (row.promoUrl) {
    return (
      <span className="rounded-full bg-[#7ca83b]/20 px-2 py-0.5 text-[10px] font-medium text-[#b6d47a]">
        已填
      </span>
    );
  }
  if (row.noProducts) {
    return (
      <span className="rounded-full bg-[#9a8774]/20 px-2 py-0.5 text-[10px] font-medium text-[#cbb9a4]">
        暂无商品
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#d49a2a]/15 px-2 py-0.5 text-[10px] font-medium text-[#f0d59a]">
      待办
    </span>
  );
}

export function YahooAffiliateSheet({
  initialRows,
  tableReady,
}: {
  initialRows: YahooAffiliateSheetRow[];
  tableReady: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialRows.map((row) => [row.brandId, row.promoUrl ?? ""])),
  );
  const [filter, setFilter] = useState<Filter>("todo");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Server refresh / navigation must replace local draft state.
  const sheetFingerprint = initialRows
    .map((row) => `${row.brandId}:${row.promoUrl ?? ""}:${row.noProducts}:${row.recordedAt ?? ""}`)
    .join("|");
  useEffect(() => {
    setRows(initialRows);
    setDrafts(Object.fromEntries(initialRows.map((row) => [row.brandId, row.promoUrl ?? ""])));
  }, [sheetFingerprint, initialRows]);

  const filled = rows.filter((row) => row.promoUrl).length;
  const noProducts = rows.filter((row) => row.noProducts).length;
  const todo = rows.filter((row) => !row.promoUrl && !row.noProducts).length;

  const visible = useMemo(() => {
    const needle = query.trim();
    return rows.filter((row) => {
      if (filter === "todo" && (row.promoUrl || row.noProducts)) return false;
      if (filter === "filled" && !row.promoUrl) return false;
      if (filter === "none" && !row.noProducts) return false;
      if (!needle) return true;
      return `${row.name}${row.searchKeyword}${row.prefecture}${row.brandId}`.includes(needle);
    });
  }, [rows, filter, query]);

  function applyRow(row: YahooAffiliateSheetRow) {
    setRows((prev) => prev.map((item) => (item.brandId === row.brandId ? row : item)));
    setDrafts((prev) => ({ ...prev, [row.brandId]: row.promoUrl ?? "" }));
  }

  async function savePromo(brandId: string) {
    const next = (drafts[brandId] ?? "").trim();
    const current = rows.find((row) => row.brandId === brandId)?.promoUrl ?? "";
    if (next === current) return;

    setSavingId(brandId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/ops/yahoo-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, promoUrl: next }),
      });
      const payload = (await response.json()) as {
        message?: string;
        row?: YahooAffiliateSheetRow;
      };
      if (!response.ok || !payload.row) {
        setError(
          response.status === 400
            ? "只接受 https://yahoo.jp/xxxx 这种搜索结果短链（可含连字符或下划线）。"
            : payload.message === "table missing"
              ? "还没有建表。请先执行 0006。"
              : "保存失败。",
        );
        return;
      }
      applyRow(payload.row);
      setNotice(`${payload.row.name} 推广链已保存`);
    } catch {
      setError("保存失败。");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleNoProducts(brandId: string, next: boolean) {
    setSavingId(brandId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/ops/yahoo-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, noProducts: next }),
      });
      const payload = (await response.json()) as {
        message?: string;
        row?: YahooAffiliateSheetRow;
      };
      if (!response.ok || !payload.row) {
        setError(
          payload.message === "column missing"
            ? "还没有 no_products 列。请执行 0009。"
            : "标记失败。",
        );
        return;
      }
      applyRow(payload.row);
      setNotice(
        next ? `${payload.row.name} 已标为暂无商品` : `${payload.row.name} 已取消暂无标记`,
      );
    } catch {
      setError("标记失败。");
    } finally {
      setSavingId(null);
    }
  }

  async function syncCatalog() {
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/ops/yahoo-links", { method: "POST" });
      const payload = (await response.json()) as {
        message?: string;
        upserted?: number;
        filled?: number;
        noProducts?: number;
        rows?: YahooAffiliateSheetRow[];
      };
      if (!response.ok) {
        setError(
          payload.message === "table missing"
            ? "还没有建表。请先执行 0006。"
            : "无法从目录写入空行。",
        );
        return;
      }
      if (payload.rows) {
        setRows(payload.rows);
        setDrafts(
          Object.fromEntries(payload.rows.map((row) => [row.brandId, row.promoUrl ?? ""])),
        );
      }
      setNotice(
        `已对齐目录 ${payload.upserted} 行：已填 ${payload.filled}，暂无 ${payload.noProducts ?? 0}。`,
      );
    } catch {
      setError("无法从目录写入空行。");
    }
  }

  return (
    <div>
      {!tableReady ? (
        <p className="mt-4 rounded-xl border border-[#e56b3f]/40 bg-[#e56b3f]/10 px-3 py-2 text-sm text-[#f0b4a4]">
          Supabase 里还没有这张表。打开 SQL Editor，执行
          <code className="mx-1 text-[12px]">supabase/migrations/0006_yahoo_shopping_affiliate_links.sql</code>
          后再点「对齐目录」。
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-[#cbb9a4]">
          待办{" "}
          <span className="tabular-nums text-[#f0d59a]">{todo}</span>
          {" · "}
          已填{" "}
          <span className="tabular-nums text-[#b6d47a]">{filled}</span>
          {" · "}
          暂无{" "}
          <span className="tabular-nums text-[#cbb9a4]">{noProducts}</span>
          {" · "}
          共 <span className="tabular-nums text-[#fff5e5]">{rows.length}</span>
          。刷新后已填链接会从数据库读回。
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todo", "待办"],
              ["filled", "已填"],
              ["none", "暂无"],
              ["all", "全部"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                filter === id
                  ? "bg-[#d49a2a] font-semibold text-[#1a1410]"
                  : "border border-[#3d2f24] text-[#cbb9a4] hover:text-[#fff5e5]"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void syncCatalog()}
            className="rounded-full border border-[#3d2f24] px-3 py-1.5 text-xs text-[#cbb9a4] hover:text-[#fff5e5]"
          >
            对齐目录
          </button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">筛选铭柄</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜铭柄名或产地"
          className="h-11 w-full max-w-md rounded-xl border border-[#3d2f24] bg-[#1a1410] px-3 text-sm text-[#fff5e5] outline-none placeholder:text-[#766658] focus:border-[#d49a2a]"
        />
      </label>

      {notice ? <p className="mt-3 text-sm text-[#7ca83b]">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#e56b3f]">{error}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="sticky top-0 bg-[#1a1410] text-[11px] tracking-[0.08em] text-[#9a8774]">
            <tr>
              <th className="px-4 py-3 font-normal">铭柄</th>
              <th className="px-3 py-3 font-normal">状态</th>
              <th className="px-3 py-3 font-normal">搜索词</th>
              <th className="px-3 py-3 font-normal">产地</th>
              <th className="px-3 py-3 font-normal">推广链接</th>
              <th className="px-3 py-3 font-normal">暂无商品</th>
              <th className="px-4 py-3 font-normal">计入时间</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-[#9a8774]">
                  待办已清空。点「已填」可核对已保存的短链。
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.brandId}
                  className={`border-t border-[#2a211a] ${
                    row.promoUrl ? "bg-[#7ca83b]/5" : row.noProducts ? "bg-[#2a211a]/40" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="text-[#fff5e5]">{row.name}</div>
                    <div className="font-mono text-[11px] text-[#766658]">{row.brandId}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge row={row} />
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={yahooShoppingSearchUrl(row.searchKeyword)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#fff5e5] underline decoration-[#5c4e42] underline-offset-2 hover:decoration-[#d49a2a]"
                    >
                      {row.searchKeyword}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-[#cbb9a4]">
                    {row.prefecture}
                    <div className="text-[11px] text-[#766658]">{row.region}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      value={drafts[row.brandId] ?? ""}
                      disabled={!tableReady || savingId === row.brandId || row.noProducts}
                      onChange={(event) =>
                        setDrafts((prev) => ({ ...prev, [row.brandId]: event.target.value }))
                      }
                      onBlur={() => void savePromo(row.brandId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      placeholder={row.noProducts ? "已标暂无，无需短链" : "https://yahoo.jp/xxxx"}
                      spellCheck={false}
                      className="h-10 w-full min-w-[16rem] rounded-lg border border-[#3d2f24] bg-[#241c16] px-2.5 font-mono text-[12px] text-[#fff5e5] outline-none placeholder:text-[#5c4e42] focus:border-[#d49a2a] disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <label className="inline-flex items-center gap-2 text-xs text-[#cbb9a4]">
                      <input
                        type="checkbox"
                        checked={row.noProducts}
                        disabled={!tableReady || savingId === row.brandId}
                        onChange={(event) =>
                          void toggleNoProducts(row.brandId, event.target.checked)
                        }
                        className="size-4 rounded border-[#5c4e42] bg-[#241c16] accent-[#d49a2a]"
                      />
                      暂无
                    </label>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-[#cbb9a4]">
                    {savingId === row.brandId ? "写入中…" : formatRecordedAt(row.recordedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
