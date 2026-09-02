"use client";

import { useMemo, useState, useTransition } from "react";
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
import type { OpsRange, OpsSummary } from "@/lib/ops/aggregate";

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

const GUIDE: Array<{ title: string; body: string }> = [
  {
    title: "这张表在看什么",
    body: "过去一段时间里，访客在站点上做了什么。数字来自我们自己记下的点击，不是楽天、Amazon、Yahoo 公式アフィリエイト后台。成交、承认、佣金要去那些网站对。",
  },
  {
    title: "会话和浏览",
    body: "会话是同一个浏览器标签页。关掉标签、开无痕，就会变成新会话。浏览是打开或刷新页面的次数，同一人连刷三次会记三次。",
  },
  {
    title: "购入点击和购入率",
    body: "购入点击 = 点了「去这家店找」的次数，六个按钮分开数。购入率 = 这些点击加起来 ÷ 浏览。它不是成交率，也不是每会话点了几次。",
  },
  {
    title: "通販和ふるさと",
    body: "通販是楽天市場、Yahoo!ショッピング、Amazon。ふるさと是楽天、Yahoo、さとふる各一条搜索结果。两边不要加总去跟联盟后台的订单比。",
  },
  {
    title: "展开店铺和咨询",
    body: "展开店铺只计首页那种先收起、再点开「お店で探す」的动作。详情页一开始就展开的，不计。咨询是点了「侍米師に相談」并送出。",
  },
  {
    title: "漏斗为什么对不齐",
    body: "五步是各自计数，不是「浏览的人里有多少走进下一步」。一个人可以不点地图直接咨询，也可以点好几家店。右侧百分比只是占浏览的比例，方便扫一眼。",
  },
  {
    title: "你自己的操作",
    body: "本机 localhost 不会写入。在观测台登录过的浏览器，再去点正式站也不会写入。已经进库的测试流量拆不出来，看干净趋势用「近24小时」。",
  },
  {
    title: "时间",
    body: "日趋势按东京日历日切。近7日、近30日是从现在往回滚的窗口，不是自然周或自然月。",
  },
];

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function ChannelTable({
  rows,
}: {
  rows: Array<{ id: string; label: string; count: number }>;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead className="text-[11px] text-[#9a8774]">
        <tr>
          <th className="pb-2 font-normal">网站</th>
          <th className="pb-2 text-right font-normal">点击</th>
          <th className="pb-2 text-right font-normal">占比</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-[#2a211a]">
            <td className="py-2.5 text-[#fff5e5]">{row.label}</td>
            <td className="py-2.5 text-right tabular-nums text-[#cbb9a4]">
              {row.count.toLocaleString("zh-CN")}
            </td>
            <td className="py-2.5 text-right tabular-nums text-[#9a8774]">
              {pct(total > 0 ? row.count / total : 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#3d2f24] bg-[#1a1410]/80 px-4 py-4">
      <p className="text-[11px] tracking-[0.16em] text-[#9a8774]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-[#fff5e5]">
        {typeof value === "number" ? value.toLocaleString("zh-CN") : value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-[#766658]">{hint}</p> : null}
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

  const maxFunnel = useMemo(
    () => Math.max(1, ...summary.funnel.map((step) => step.count)),
    [summary.funnel]
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
          已超过 1.5 万条上限，只统计最近写入，数字会偏低。缩短区间可看全量。
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="会话" value={summary.kpis.sessions} hint="标签页 sid 去重" />
        <Kpi label="浏览" value={summary.kpis.pageViews} hint="page_view 次数" />
        <Kpi
          label="购入率"
          value={pct(summary.rates.purchasePerView)}
          hint="点出去 ÷ 浏览，不是成交"
        />
        <Kpi label="展开店铺" value={summary.kpis.shopOpens} hint="点开お店で探す" />
        <Kpi
          label="咨询率"
          value={pct(summary.rates.consultPerView)}
          hint="咨询提交 ÷ 浏览"
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
          <h2 className="font-serif text-xl text-[#fff5e5]">通販</h2>
          <p className="mt-1 text-xs text-[#9a8774]">
            点了去店里找的次数。占比是这三家里的份额，不是占浏览。
          </p>
          <ChannelTable rows={summary.retailChannels ?? []} />
        </div>
        <div className="rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
          <h2 className="font-serif text-xl text-[#fff5e5]">ふるさと納税</h2>
          <p className="mt-1 text-xs text-[#9a8774]">
            三家搜索页分开数。不是捐款件数，也不是返礼品订单。
          </p>
          <ChannelTable rows={summary.furusatoChannels ?? []} />
        </div>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
        <h2 className="font-serif text-xl text-[#fff5e5]">行为漏斗</h2>
        <p className="mt-1 text-xs text-[#9a8774]">各步自己计数。右侧是占浏览的比例，不是一步转化成下一步。</p>
          <ul className="mt-6 space-y-3">
            {summary.funnel.map((step) => (
              <li key={step.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-[#cbb9a4]">{step.label}</span>
                  <span className="tabular-nums text-[#fff5e5]">
                    {step.count.toLocaleString("zh-CN")}
                    <span className="ml-2 text-[11px] text-[#9a8774]">
                      {pct(
                        summary.kpis.pageViews > 0
                          ? step.count / summary.kpis.pageViews
                          : 0
                      )}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#2a211a]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d49a2a] to-[#e56b3f]"
                    style={{
                      width: `${
                        step.count === 0 ? 0 : Math.max(4, (step.count / maxFunnel) * 100)
                      }%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
        <h2 className="font-serif text-xl text-[#fff5e5]">日趋势</h2>
        <p className="mt-1 text-xs text-[#9a8774]">浏览、出向、咨询 · 东京日历日</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.byDay} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
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
                fill="transparent"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="consults"
                name="咨询"
                stroke={LEAF}
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
          <h2 className="font-serif text-xl text-[#fff5e5]">热门路径</h2>
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
                      {row.count.toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
          <h2 className="font-serif text-xl text-[#fff5e5]">事件清单</h2>
          <table className="mt-4 w-full text-left text-sm">
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
                      {row.count.toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-[#3d2f24] bg-[#1a1410]/80 p-5">
        <h2 className="font-serif text-xl text-[#fff5e5]">怎么读这些数</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {GUIDE.map((item) => (
            <div key={item.title}>
              <h3 className="text-[13px] font-medium text-[#fff5e5]">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#9a8774]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-[#3d2f24] pt-4 text-[11px] text-[#766658]">
        {summary.rowCount.toLocaleString("zh-CN")} 条事件 · {rangeCaption(range)} · 东京时间
      </footer>
    </main>
  );
}
