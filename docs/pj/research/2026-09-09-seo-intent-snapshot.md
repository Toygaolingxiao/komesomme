# SEO 意图调研快照 · 2026-09-09

**类型:** 备份（非正本）  
**正本:** [`../../21-seo-intent-content.md`](../../21-seo-intent-content.md)  
**取数日:** 2026-09-09  
**目的:** 正本后续迭代时，仍能回看首版权威锚点与门禁定义。

若与正本冲突，**以正本为准**；本文件只作历史备份。

---

## Diff Gate（四条可引用资产）

1. 甘み×粒感坐标与 Top N 排序依据写在页上  
2. `avoid_pairings`「この料理には向かない米」  
3. 人手リード（非 LLM 批量）  
4. 比較表后直リンク CTA + `※PR`

Kill：還元率 / 最安 / ふるさと納税ランキング（价格轴主答）

---

## 权威 URL 登记（首版）

| ID | 机构 | URL | 已核实可引用字段 |
| --- | --- | --- | --- |
| A1 | 農林水産省 | https://www.maff.go.jp/j/seisan/keikaku/soukatu/mr.html | マンスリーレポート索引 |
| A2 | 農林水産省 | https://www.maff.go.jp/j/press/nousan/kikaku/250919.html | 令和7年9月号公表（2025-09-19） |
| A3 | 日本穀物検定協会 | https://www.kokken.or.jp/ranking_area.html | 食味ランキング定義；非流通全量评价 |
| A4 | 日本穀物検定協会 | https://kokken.or.jp/data/R7_shokumi_next.pdf | 令和7年産公表 令和8年2月27日 |
| A5 | 日本穀物検定協会 | https://www.kokken.or.jp/data/rank_gaiyou.pdf | 対象144；特A=43；A=71；A'=30 |
| A6 | ＪＡ全農 | https://www.zennoh.or.jp/press/release/2025/105622.html | ファクトブック公开（7月9日） |
| A7 | ＪＡ全農 | https://www.zennoh.or.jp/ricefactbook/pdf/factbook.pdf | 流通解说 PDF |
| A8 | 米穀機構 | https://www.komenet.jp/ | 机构入口 |
| A9 | 農林水産省 | https://www.maff.go.jp/j/syouan/keikaku/soukatu/komecost.html | コスト指標公表案内（2026-04-07） |
| A10 | 日本経済新聞 | https://www.nikkei.com/article/DGXZQOUA195KR0Z10C26A3000000/ | 二次：报道中的农水试算区间 |

完整 200 词表、EEAT 大纲、AI 红队 Pass/Fail 记录见正本 §5–§9，不在此重复粘贴全文（避免双源漂移）。需要全文冻结时：把当日的 `21-seo-intent-content.md` 再复制为 `2026-09-09-seo-intent-content.full.md`。

---

## 实现衔接（快照时）

- Wave 2A：`/pair/[dish]` 约 20–25；数据 `pairings.ts`；校验扩展；JSON-LD 复用现有 `jsonLd.ts`
- 不做：200 页一一对应、還元率页、改坐标轴
