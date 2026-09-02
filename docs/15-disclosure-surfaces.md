# 公开披露表面清单（正本）

改 **Amazon / PR / 乐天クレジット / 味わい免责** 时先读本文，再只改 `src/lib/affiliate.ts`（乐天官方 HTML 只改 `src/lib/rakuten/credit.ts`）。不要在组件里再写一份定型文，也不要全仓 grep 一遍。

条文与各社链接仍看 [14-affiliate-programs.md](./14-affiliate-programs.md)。乐天 API 隔离看 [13-affiliate-compliance.md](./13-affiliate-compliance.md)。本文不是法律意见。

---

## 1. 分层（能少则少）

| 层 | 显示什么 | 为什么 |
| --- | --- | --- |
| CTA 旁 | `AFFILIATE_PR_LABEL`（`※PR`） | 景表法：链接附近能认出是宣传。不堆 Amazon 定型、不列 ASP 名 |
| `SiteFooter`（全站唯一 `full`） | Amazon 第 5 条 + `AFFILIATE_PR_NOTICE`（含「アフィリエイト広告」）+ 乐天官方クレジット + `TASTE_DISCLAIMER` | Amazon 目立つ位置；乐天クレジットガイド；产品诚实 |
| `/terms` | `AFFILIATE_PR_NOTICE_DETAIL`（列 ASP）+ Amazon 定型 + 不赞助声明 | 名单只放法务页 |
| `/privacy` `/tokushoho` | 各页自己的法务叙述（计量方、特商法、味わい保证） | 不是 chrome 定型，勿与 CTA 文案混用 |

**不要做：** 购买卡再贴一遍 Amazon 墙；CTA 下列 Amazon / 楽天；把 `AFFILIATE_PR_NOTICE_DETAIL` 贴进页脚。

---

## 2. 文案常量（只改这里）

文件：[`src/lib/affiliate.ts`](../src/lib/affiliate.ts)

| 常量 | 用途 |
| --- | --- |
| `AMAZON_ASSOCIATE_DISCLOSURE` | Amazon 运营规约第 5 条。只进 `AffiliateDisclosure` `full` 与 `/terms` |
| `AFFILIATE_PR_LABEL` | CTA 旁 `※PR` |
| `AFFILIATE_PR_NOTICE` | 页脚短句。必须含「アフィリエイト広告」 |
| `AFFILIATE_PR_NOTICE_DETAIL` | `/terms` 专用，列 ASP |
| `TASTE_DISCLAIMER` | 页脚 |
| `TASTE_DISCLAIMER_DETAIL` | 品鉴 overlay / ライブラリ事典（`shared.ts` 再导出为 `DISCLAIMER`） |

乐天官方 HTML（**不得改标签**）：[`src/lib/rakuten/credit.ts`](../src/lib/rakuten/credit.ts) → `RAKUTEN_WEB_SERVICE_CREDIT_HTML`。

组件：[`src/components/AffiliateDisclosure.tsx`](../src/components/AffiliateDisclosure.tsx)

- `variant="pr"` → label + `title={AFFILIATE_PR_NOTICE}`
- `variant="full"` → Amazon + 短 PR + 乐天クレジット

页脚：[`src/components/SiteFooter.tsx`](../src/components/SiteFooter.tsx)（唯一默认 `full`）。

---

## 3. 画面表面

| 表面 | 文件 | 披露 |
| --- | --- | --- |
| 首页 Desktop 右栏「お店で探す」 | `FlavorMatrix.tsx` + `RecommendationRail.tsx` → `ShopLinksStrip` `expandMode="disclosure"` `disclosure="pr"` | `※PR`。**无** Amazon 定型、**无** 乐天クレジット（`e2e/home.spec.ts` 锁定） |
| 首页 Mobile 地图下商店条 | `FlavorMatrix.tsx` 同上 | 同上 |
| 品鉴 overlay 顶部条 | `PurchaseLead` → `ShopLinksStrip` `disclosure="pr"` | `※PR` |
| 品鉴 overlay / ライブラリ `#km-purchase` | `PurchaseLinks` → `RiceProductCard` → `ShopLinksStrip` `disclosure="pr"` | `※PR`。完整定型在同页 `SiteFooter`（overlay 无页脚，Amazon 定型靠 `/terms` 与ライブラリ页脚） |
| ライブラリ一覧・記事 | `src/app/library/page.tsx`、`library/[id]/page.tsx` | `SiteFooter` = `full` |
| 法务三页 | `LegalPage.tsx` | 同上 |
| 首页整体 | `src/app/page.tsx` | **没有** `SiteFooter`（Desktop `100dvh`）。顶栏 `SiteLegalNav` 链到规约。Amazon 第 5 条不出现在首页（有意） |

`ShopLinksStrip` 默认已是 `pr`。不要再给购买卡传 `disclosure="full"`。

---

## 4. 法务页（正文，不是 chrome）

| 页 | 文件 | 写什么 |
| --- | --- | --- |
| 利用规约 §4 | `src/app/terms/page.tsx` | 从 `affiliate.ts` 引入 DETAIL + Amazon 定型，另写不赞助 / 非乐天站 / Yahoo 公式アフィリエイト |
| 隐私 §4 | `src/app/privacy/page.tsx` | 计量方名单（Amazon / 楽天 / Yahoo 公式等）。这是数据处理说明，不是 PR 徽章 |
| 特商法 | `src/app/tokushoho/page.tsx` | アフィリエイト案内；味わい「保证しない」用该页自己的句子 |

品味 overlay / 事典末的 `DISCLAIMER` 与 encyclopedia JSON 的 `caveats` 是**产品诚实**，不是 ASP 规则。不要删 tasting 免责去「少显示广告字」。

**SEO / 页首不要放免责。** `/library` 的 `metadata.description` 和 `LibraryBrowser` 首段是 Google 摘要来源。公的測定・編集評価は页脚与 `/terms`，不要写进 title / meta / H1 下第一句。

---

## 5. 试验

| 位置 | 约定 |
| --- | --- |
| `e2e/home.spec.ts` | 商店条可见 `※PR`；展开后 Amazon 定型 **0 条** |
| `e2e/brand.spec.ts` | `#km-purchase`：通販 tab 3 CTA → ふるさと tab 3 CTA；**页面上**（页脚即可）有 Amazon 定型、「アフィリエイト広告」、`Supported by Rakuten Developers` |
| `docs/test-specification.md` TS-BRAND-02 | 完整披露在页脚，不要求印在购买卡内 |

---

## 6. 改文案时的检查

1. 只改 `affiliate.ts`（和必要时的 `credit.ts`）。
2. `/terms` 应继续从同一常量引入，避免再手写第 5 条。
3. 首页不要加回 Amazon 墙（布局 + e2e）。
4. 新 CTA 面：`ShopLinksStrip` `disclosure="pr"`（或 `none` 且同页已有页脚 `full`）。
5. 更新本节表格，而不是让下一次再全仓搜索。
