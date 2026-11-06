"use client";

import { useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OpsChrome } from "@/components/ops/OpsChrome";
import { kpiDelta, type OpsRange, type OpsSummary } from "@/lib/ops/aggregate";

const RANGES: Array<{ id: OpsRange; label: string }> = [
  { id: "1d", label: "近24小时" },
  { id: "7d", label: "近7日" },
  { id: "30d", label: "近30日" },
];

const INK = "#fff5e5";
const MUTED = "#9a8774";
const GRID = "rgba(246,235,221,0.08)";
const GOLD = "#d49a2a";
const HARVEST = "#e56b3f";
const LEAF = "#7ca83b";

function formatDay(day: string) {
  return day.slice(5).replace("-", "/");
}

function rangeCaption(range: OpsRange): string {
  if (range === "1d") return "近 24 小时";
  if (range === "30d") return "近 30 日";
  return "近 7 日";
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function num(value: number): string {
  return value.toLocaleString("zh-CN");
}

const GUIDE: Array<{ title: string; body: string }> = [
  {
    title: "不是后台销量",
    body: "数字来自我们自己记下的点击，不是楽天、Amazon、Yahoo 的联盟后台。成交、承认、佣金去那些网站对。",
  },
  {
    title: "会话 = 标签页",
    body: "会话按标签页的 sid 去重；关标签、开无痕就是新会话。浏览是 page_view 次数，同一人连刷三次记三次。",
  },
  {
    title: "购入率不是成交率",
    body: "购入点击是点了「去这家店找」的次数；购入率 = 购入点击 ÷ 浏览，不代表下单或成交。",
  },
  {
    title: "通販与故乡税别加总",
    body: "通販是楽天市場、Amazon、Yahoo!、メルカリ；故乡税是楽天・Yahoo・さとふる的搜索页。两组点击不要加起来去对联盟后台的订单数。",
  },
  {
    title: "展开店铺的数法",
    body: "只数先收起、再点开「お店で探す」的动作；详情页一开始就展开的不数。",
  },
  {
    title: "漏斗各步独立",
    body: "每行各自计数，不是上一步的人走进下一步；百分比只是占浏览的比例。一个人可以不点地图直接咨询，也可以点好几家店。",
  },
  {
    title: "自己的流量已排除",
    body: "本机 localhost 不写入；登录过观测台的浏览器再访问正式站也不写入。已经进库的早期测试流量拆不出来，看干净趋势用近24小时。",
  },
  {
    title: "时间是滚动窗",
    body: "日趋势按东京日历日切；近7日、近30日是从现在往回滚，不是自然周、自然月。「对上一窗」是紧挨着的前一个同长窗口。",
  },
];

function DeltaLine({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <p className="mt-1 text-[11px] text-[#766658]">— 对上一窗（上一窗为 0）</p>;
  }
  const flat = delta === 0;
  const up = delta > 0;
  const color = flat ? "text-[#766658]" : up ? "text-[#7ca83b]" : "text-[#e56b3f]";
  const arrow = flat ? "—" : up ? "▲" : "▼";
  return (
    <p className={`mt-1 text-[11px] ${color}`}>
      {arrow} {Math.abs(delta * 100).toFixed(0)}% 对上一窗
    </p>
  );
}

function Kpi({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-[#3d2f24] bg-[#1a1410]/80 px-4 py-4">
      <p className="text-[11px] tracking-[0.16em] text-[#9a8774]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-[#fff5e5]">
        {typeof value === "number" ? num(value) : value}
      </p>
      {delta !== undefined ? <DeltaLine delta={delta} /> : null}
      {hint ? <p className="mt-1 text-[11px] text-[#766658]">{hint}</p> : null}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 mt-10 flex items-baseline gap-3">
      <h2 className="font-serif text-lg font-semibold text-[#fff5e5]">{children}</h2>
      <span className="h-px flex-1 translate-y-[-4px] bg-[#3d2f24]" />
    </div>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
      <h3 className="font-serif text-xl text-[#fff5e5]">{title}</h3>
      {caption ? <p className="mt-1 text-xs text-[#9a8774]">{caption}</p> : null}
      {children}
    </section>
  );
}

function ChannelGroup({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: Array<{ id: string; label: string; count: number }>;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div>
      <h4 className="text-sm font-medium text-[#fff5e5]">{title}</h4>
      <p className="mt-0.5 text-[11px] text-[#9a8774]">{note}</p>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-[11px] text-[#9a8774]">
          <tr>
            <th className="pb-2 font-normal">网站</th>
            <th className="pb-2 text-right font-normal">点击</th>
            <th className="pb-2 text-right font-normal">组内占比</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#2a211a]">
              <td className="py-2.5 text-[#fff5e5]">{row.label}</td>
              <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">{num(row.count)}</td>
              <td className="py-2.5 text-right tabular-nums text-[#9a8774]">
                {pct(total > 0 ? row.count / total : 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaderGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ slug: string; views: number; purchaseClicks: number }>;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-[#fff5e5]">{title}</h4>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="text-[11px] text-[#9a8774]">
          <tr>
            <th className="pb-1.5 font-normal">页</th>
            <th className="pb-1.5 text-right font-normal">浏览</th>
            <th className="pb-1.5 text-right font-normal">购入</th>
            <th className="pb-1.5 text-right font-normal">购入率</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-3 text-[#9a8774]">
                暂无
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.slug} className="border-t border-[#2a211a]">
                <td className="max-w-[180px] truncate py-2 font-mono text-[12px] text-[#fff5e5]">
                  {row.slug}
                </td>
                <td className="py-2 text-right tabular-nums text-[#cbb9a4]">{num(row.views)}</td>
                <td className="py-2 text-right tabular-nums text-[#cbb9a4]">
                  {num(row.purchaseClicks)}
                </td>
                <td className="py-2 text-right tabular-nums text-[#9a8774]">
                  {pct(row.views > 0 ? row.purchaseClicks / row.views : 0)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function OpsDashboard({
  initial,
  loadError = false,
}: {
  initial: OpsSummary;
  loadError?: boolean;
}) {
  const [summary, setSummary] = useState(initial);
  const [range, setRange] = useState<OpsRange>(initial.range);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    loadError ? "这一窗的数据没有读到。" : null
  );

  function loadRange(next: OpsRange) {
    setRange(next);
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(`/api/ops/summary?range=${next}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          setError(response.status === 429 ? "刷新太勤，稍后再试。" : "刷新失败。");
          return;
        }
        setSummary((await response.json()) as OpsSummary);
      } catch {
        setError("刷新失败。");
      }
    });
  }

  const prev = summary.previous;
  const prevPurchaseRate =
    prev && prev.pageViews > 0 ? prev.purchaseClicks / prev.pageViews : 0;
  const sourceSessionTotal = summary.sources.reduce((sum, s) => sum + s.sessions, 0);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <OpsChrome title="观测台" subtitle={`${rangeCaption(range)}的站点行为。滚动窗口，东京时间。`}>
        <div className="flex rounded-full border border-[#3d2f24] bg-[#1a1410] p-1">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => loadRange(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                range === item.id
                  ? "bg-[#e56b3f] font-semibold text-[#fffdf7]"
                  : "text-[#cbb9a4] hover:text-[#fff5e5]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </OpsChrome>

      {pending ? (
        <p className="mt-4 text-xs tracking-wide text-[#9a8774]">刷新中…</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-[#e56b3f]">{error}</p> : null}
      {summary.truncated ? (
        <p className="mt-4 rounded-xl border border-[#d49a2a]/35 bg-[#d49a2a]/10 px-3 py-2 text-xs text-[#f0d59a]">
          已超过 1.5 万条上限，只统计最近写入，数字会偏低。缩短区间可看全量。这一窗也不出上一窗对比。
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="会话"
          value={summary.kpis.sessions}
          hint="标签页 sid 去重"
          delta={prev ? kpiDelta(summary.kpis.sessions, prev.sessions) : undefined}
        />
        <Kpi
          label="浏览"
          value={summary.kpis.pageViews}
          hint="page_view 次数"
          delta={prev ? kpiDelta(summary.kpis.pageViews, prev.pageViews) : undefined}
        />
        <Kpi
          label="购入点击"
          value={summary.kpis.purchaseClicks}
          hint="点了去店里找"
          delta={prev ? kpiDelta(summary.kpis.purchaseClicks, prev.purchaseClicks) : undefined}
        />
        <Kpi
          label="购入率"
          value={pct(summary.rates.purchasePerView)}
          hint="点击 ÷ 浏览，不是成交"
          delta={prev ? kpiDelta(summary.rates.purchasePerView, prevPurchaseRate) : undefined}
        />
        <Kpi
          label="咨询提交"
          value={summary.kpis.consultSubmits}
          hint="送出侍米師に相談"
          delta={prev ? kpiDelta(summary.kpis.consultSubmits, prev.consultSubmits) : undefined}
        />
      </section>

      <SectionHeading>人从哪来</SectionHeading>
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="来源" caption="按会话第一次着地时的 UTM / 参照元判定，只认第一次。">
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-[#9a8774]">
              <tr>
                <th className="pb-2 font-normal">来源</th>
                <th className="pb-2 text-right font-normal">会话</th>
                <th className="pb-2 text-right font-normal">占比</th>
              </tr>
            </thead>
            <tbody>
              {summary.sources.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-[#9a8774]">
                    暂无来源数据
                  </td>
                </tr>
              ) : (
                summary.sources.map((row) => (
                  <tr key={row.id} className="border-t border-[#2a211a]">
                    <td className="max-w-[220px] truncate py-2.5 text-[#fff5e5]">{row.label}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                      {num(row.sessions)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#9a8774]">
                      {pct(sourceSessionTotal > 0 ? row.sessions / sourceSessionTotal : 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="落地页" caption="每个会话打开的第一页。着地在哪，决定第一印象。">
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-[#9a8774]">
              <tr>
                <th className="pb-2 font-normal">路径</th>
                <th className="pb-2 text-right font-normal">会话</th>
              </tr>
            </thead>
            <tbody>
              {summary.landingPages.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 text-[#9a8774]">
                    暂无落地数据
                  </td>
                </tr>
              ) : (
                summary.landingPages.map((row) => (
                  <tr key={row.path} className="border-t border-[#2a211a]">
                    <td className="py-2.5 font-mono text-[12px] text-[#fff5e5]">{row.path}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                      {num(row.sessions)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>
      </section>

      <SectionHeading>有没有在找米</SectionHeading>
      <section className="space-y-4">
        <Panel
          title="页型漏斗"
          caption="按页面种类拆开的五步。各行自己计数，条形是占全部浏览的份额。"
        >
          <div className="overflow-x-auto">
            <table className="mt-4 w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] tracking-[0.12em] text-[#9a8774]">
                <tr>
                  <th className="pb-2 font-normal">页型</th>
                  <th className="pb-2 font-normal">浏览</th>
                  <th className="pb-2 text-right font-normal">探索</th>
                  <th className="pb-2 text-right font-normal">展开店铺</th>
                  <th className="pb-2 text-right font-normal">购入</th>
                  <th className="pb-2 text-right font-normal">咨询</th>
                  <th className="pb-2 text-right font-normal">购入率</th>
                </tr>
              </thead>
              <tbody>
                {summary.pageTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-[#9a8774]">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  summary.pageTypes.map((row) => (
                    <tr key={row.id} className="border-t border-[#2a211a]">
                      <td className="py-2.5 text-[#fff5e5]">
                        {row.label}
                        <span className="ml-2 font-mono text-[11px] text-[#766658]">{row.id}</span>
                      </td>
                      <td className="w-[22%] py-2.5 pr-4">
                        <span className="tabular-nums text-[#fff5e5]">{num(row.views)}</span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#2a211a]">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-[#d49a2a] to-[#e56b3f]"
                            style={{
                              width: `${
                                summary.kpis.pageViews > 0
                                  ? Math.max(2, (row.views / summary.kpis.pageViews) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {num(row.explore)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {num(row.shopOpens)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {num(row.purchaseClicks)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {num(row.consults)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {pct(row.purchasePerView)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="日趋势" caption="浏览、购入、咨询 · 东京日历日">
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.byDay} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="buy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={HARVEST} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={HARVEST} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ask" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LEAF} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={LEAF} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatDay}
                  stroke={MUTED}
                  tick={{ fill: MUTED, fontSize: 11 }}
                />
                <YAxis stroke={MUTED} tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1410",
                    border: "1px solid #3d2f24",
                    borderRadius: 12,
                    color: INK,
                  }}
                  labelFormatter={(value) => String(value)}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="浏览"
                  stroke={GOLD}
                  fill="url(#pv)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="purchaseClicks"
                  name="购入"
                  stroke={HARVEST}
                  fill="url(#buy)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="consults"
                  name="咨询"
                  stroke={LEAF}
                  fill="url(#ask)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <SectionHeading>哪页最能送客</SectionHeading>
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="内容效率" caption="内容页各自的浏览与购入。索引页本身不计，只看单页。">
          <div className="mt-5 grid gap-x-6 gap-y-6 sm:grid-cols-2">
            <LeaderGroup title="料理" rows={summary.leaders.pair} />
            <LeaderGroup title="産地" rows={summary.leaders.prefecture} />
            <LeaderGroup title="銘柄くらべ" rows={summary.leaders.compare} />
            <LeaderGroup title="特集" rows={summary.leaders.collection} />
          </div>
        </Panel>

        <Panel title="热门銘柄" caption="銘柄ページ的浏览与购入点击，按购入排。">
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-[#9a8774]">
              <tr>
                <th className="pb-2 font-normal">銘柄</th>
                <th className="pb-2 text-right font-normal">浏览</th>
                <th className="pb-2 text-right font-normal">购入</th>
              </tr>
            </thead>
            <tbody>
              {summary.topBrands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-[#9a8774]">
                    暂无銘柄浏览
                  </td>
                </tr>
              ) : (
                summary.topBrands.map((row) => (
                  <tr key={row.id} className="border-t border-[#2a211a]">
                    <td className="py-2.5 font-mono text-[12px] text-[#fff5e5]">{row.id}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                      {num(row.views)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                      {num(row.purchaseClicks)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>
      </section>

      <SectionHeading>出路往哪走</SectionHeading>
      <section>
        <Panel title="渠道" caption="点了去店里找的次数，按组各算各的占比。不是订单数。">
          <div className="mt-5 space-y-8">
            <ChannelGroup
              title="通販"
              note="楽天市場、Amazon、Yahoo!、メルカリ。"
              rows={summary.retailChannels ?? []}
            />
            <div className="border-t border-[#2a211a] pt-6">
              <ChannelGroup
                title="ふるさと納税"
                note="三家搜索页分开数。不是捐款件数，也不是返礼品订单。"
                rows={summary.furusatoChannels ?? []}
              />
            </div>
          </div>
        </Panel>
      </section>

      <SectionHeading>有没有被传出去</SectionHeading>
      <section>
        <Panel title="分享" caption="分享卡的下载、系统分享与复制链接。图被存走，才有被传出去的机会。">
          <div className="mt-5 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-[#9a8774]">分享总数</p>
              <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-[#fff5e5]">
                {num(summary.shares.total)}
              </p>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-[11px] text-[#9a8774]">
                  <tr>
                    <th className="pb-2 font-normal">方式</th>
                    <th className="pb-2 text-right font-normal">次数</th>
                    <th className="pb-2 text-right font-normal">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.shares.byKind.map((row) => (
                    <tr key={row.id} className="border-t border-[#2a211a]">
                      <td className="py-2.5 text-[#fff5e5]">{row.label}</td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {num(row.count)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[#9a8774]">
                        {pct(summary.shares.total > 0 ? row.count / summary.shares.total : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#fff5e5]">分享最多的銘柄</h4>
              <table className="mt-3 w-full text-left text-sm">
                <thead className="text-[11px] text-[#9a8774]">
                  <tr>
                    <th className="pb-2 font-normal">銘柄</th>
                    <th className="pb-2 text-right font-normal">次数</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.shares.topBrands.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-6 text-[#9a8774]">
                        暂无分享记录
                      </td>
                    </tr>
                  ) : (
                    summary.shares.topBrands.map((row) => (
                      <tr key={row.id} className="border-t border-[#2a211a]">
                        <td className="py-2.5 font-mono text-[12px] text-[#fff5e5]">{row.id}</td>
                        <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                          {num(row.count)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <Panel title="热门路径">
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-[#9a8774]">
              <tr>
                <th className="pb-2 font-normal">路径</th>
                <th className="pb-2 text-right font-normal">浏览</th>
              </tr>
            </thead>
            <tbody>
              {summary.topPaths.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 text-[#9a8774]">
                    暂无浏览
                  </td>
                </tr>
              ) : (
                summary.topPaths.map((row) => (
                  <tr key={row.path} className="border-t border-[#2a211a]">
                    <td className="py-2.5 font-mono text-[12px] text-[#fff5e5]">{row.path}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                      {num(row.count)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="事件清单">
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-[#cbb9a4] transition hover:text-[#fff5e5]">
              这一窗共 {summary.events.length} 种事件，点开看明细
            </summary>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-[11px] tracking-[0.12em] text-[#9a8774]">
                <tr>
                  <th className="pb-2 font-normal">事件</th>
                  <th className="pb-2 text-right font-normal">次数</th>
                </tr>
              </thead>
              <tbody>
                {summary.events.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-[#9a8774]">
                      这一窗还没有事件
                    </td>
                  </tr>
                ) : (
                  summary.events.map((row) => (
                    <tr key={row.event} className="border-t border-[#2a211a]">
                      <td className="py-2.5 font-mono text-[12px] text-[#fff5e5]">{row.event}</td>
                      <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
                        {num(row.count)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </details>
        </Panel>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
        <details>
          <summary className="cursor-pointer font-serif text-xl text-[#fff5e5]">
            读数须知
          </summary>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {GUIDE.map((item) => (
              <div key={item.title}>
                <h3 className="text-[13px] font-medium text-[#fff5e5]">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#9a8774]">{item.body}</p>
              </div>
            ))}
          </div>
        </details>
      </section>

      <footer className="mt-10 border-t border-[#3d2f24] pt-4 text-[11px] text-[#766658]">
        {num(summary.rowCount)} 条事件 · {rangeCaption(range)} · 东京时间
      </footer>
    </main>
  );
}
