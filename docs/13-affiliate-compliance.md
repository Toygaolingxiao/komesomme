# 购买导流合规方案（乐天 API × 多商城联盟）

本文是工程设计，**不是法律意见**。条文以乐天现行「ウェブサービス利用規約」「楽天アフィリエイトパートナー規約」为准。Amazon / Yahoo / さとふる / ValueCommerce 的要点与正文链接见 [14-affiliate-programs.md](./14-affiliate-programs.md)。

**已落地：** 混排 4 CTA 卡只接收各平台 href。乐天 Item Search 的商品名・价格不进该卡（第 8 条 4 项隔离）。乐天官方 [クレジット](https://webservice.rakuten.co.jp/guide/credit) 与 Amazon 第 5 条在 **页脚**（HTML 不改）。CTA 旁只标 ※PR。Yahoo / さとふる 的 ValueCommerce 转链已预留。表面清单 [15-disclosure-surfaces.md](./15-disclosure-surfaces.md)。规约链接与条号表见 [14-affiliate-programs.md](./14-affiliate-programs.md) §2。

正文：[楽天ウェブサービス規約](https://webservice.rakuten.co.jp/guide/rule)（日本語原文が正文）。

---

## 1. 先分清两套系统

| | 楽天ウェブサービス（API） | 楽天アフィリエイト |
|---|---|---|
| 后台 | [アプリ一覧](https://webservice.rakuten.co.jp/app/list) | 楽天アフィリエイト管理画面 / リンク作成 |
| 凭证 | `RAKUTEN_APPLICATION_ID`、`RAKUTEN_ACCESS_KEY` | `RAKUTEN_AFFILIATE_ID` / `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` |
| 作用 | 按关键词搜在售商品，返回店名、价格、`itemUrl` | 给 URL 打跟踪，成交后分佣 |
| 会不会付钱 | 不会 | 会 |
| 适用规约 | ウェブサービス利用規約（第 8、10 条等） | アフィリエイトパートナー規約 |

结论：**赚钱靠アフィリエイト。API 只负责「选到哪一件货」。** 两套 ID 不一样是正常的，要一起用，不是二选一。

没有 API、只有アフィリエイト：搜索结果页也能计成果，这就是今天的线上行为。

---

## 2. 和 KomeSomme 相关的条文（工作读法）

### 2.1 第 3 条（アフィリエイト）

用ウェブサービス导流去可计成果的乐天商品时，链接必须用楽天アフィリエイト生成（API 的 `affiliateId` → `affiliateUrl`，或 `hb.afl.rakuten.co.jp/ichiba/{id}/?pc=`）。

### 2.2 第 8 条 4 项（最关键）

> アプリケーション上の**ウェブサービスを使用した部分**においては、楽天サイト以外のウェブサイトへのリンクを設置してはならない。

工作读法：

- 「使用した部分」= **渲染了 API 返回字段的 DOM 子树**（商品名、价格、图、店铺、`affiliateUrl`）。
- 该子树内：只允许乐天集团站点（楽天市場、楽天ふるさと等）。
- 该子树外：Yahoo / Amazon / さとふる可以用**品种名**做自己的搜索转链，**不得引用**乐天 API 的图、价、店、itemCode。

过宽读法（一旦全站调过 API 就不能挂别家）没有写在「部分」这两个字里，但第 10 条 1-(4) 仍可能被拿来做更严解释。所以隔离要做满，不要只靠「按钮是分开的」。

### 2.3 第 10 条 1-(4) / (5)

- **(4)** 禁止借ウェブサービス用乐天联盟以外的方式赚钱。  
  禁止：把 API 的商品卡挂上 Amazon 链接或站外红包。  
  允许：别的区块用 Amazon/Yahoo **自己的**搜索联盟，且不使用乐天 API 数据。
- **(5)** 禁止对**同一件乐天成果对象商品**再走别家联盟。  
  「つや姫」这个品种去 Amazon 搜另一家店，不是同一条乐天 SKU。  
  禁止：把 `kawasaki-beikoku:10000016` 这条乐天货再包一层 Amazon 联盟。

### 2.4 第 10 条 1-(6)

禁止用ウェブサービス做与乐天竞争的服务（全站比价引擎、宣称「乐天比 Amazon 贵 X 円」）。  
KomeSomme 定位是侍米師（选米案内）/ 风味匹配，不抓取海量 SKU 做比价。UI 文案禁止比价、禁止「最安」。

### 2.5 第 10 条 1-(7) / (9)

API 拿到的商品信息只用于当场导流，不进公开 catalog、不写进 `src/data/rice`、不当作长期公开资料库。短时服务端缓存（例如数小时、按 keyword 键）可以，缓存内容不要出现在前端 HTML 以外的公开文件里。

**在库审计（运维）：** 用 `npm run inventory:audit` 走乐天 Ichiba / Yahoo ItemSearch 官方 API，**禁止**爬 Amazon / 楽天 / Yahoo 商品页 HTML。完整结果写在 gitignore 的 `scripts/data/shop-inventory/`；可提交的只有无商品名/价/URL 的 `shop-inventory-gaps.md`。

### 2.6 第 13 条 + クレジットガイド

[クレジット表示方法と注意](https://webservice.rakuten.co.jp/guide/credit) 写明：使用 API 的应用必须展示官方徽章三选一，**不得改 HTML / 图**。已用文本版 `Supported by Rakuten Developers`。若改为展示 API 商品名/价格，再在 `.km-rakuten` 内加「商品情報は楽天ウェブサービスにより提供」类说明。

---

## 3. 今天的状态（混排卡 + href 隔离）

```
[ お店で探す ※PR ]
  Amazon | 楽天市場 | Yahoo! | さとふる
```

页脚（ライブラリ / 法务。首页因 100dvh 没有页脚）:

```
Amazon 第5条 / アフィリエイト広告を含みます / Supported by Rakuten Developers
```

表面正本：[15-disclosure-surfaces.md](./15-disclosure-surfaces.md)。

- 乐天 href：`/api/rice/shop-links` → Item Search 成功则商品 URL（アフィ包装），失败则搜索アフィ
- **不展示** API 的商品名、价格、店铺、缩略图（第 8 条 4 项：API 字段未进入与他店并排的 DOM）
- クレジット用官方文本 snippet、不改 HTML，只放 `SiteFooter` 的 `AffiliateDisclosure variant="full"`。CTA 旁只有 `variant="pr"`（※PR）
- 若以后要在卡上画出乐天商品名・价格，必须先拆成 §4 的独立 `.km-rakuten` 区块

---

## 4. 明天的目标信息架构（隔离版）

购买区拆成**两个互不嵌套的区块**，不要做「一张卡里三个商城按钮，其中乐天走 API」。

```
#km-purchase
  section.km-rakuten          ← 唯一允许消费 Ichiba API 的子树
    見出し: 楽天市場で探す
    任意: 商品名 / 価格 / サムネ（全部来自 API）
    CTA: 仅 affiliateUrl 或 楽天ふるさと（楽天グループ）
    注记: 商品情報は楽天ウェブサービスにより提供

  section.km-other-shops      ← 禁止出现 API 的任何字段
    見出し: 他の店で銘柄名を探す
    CTA: Amazon / Yahoo!ショッピング（仅 rice.name 或自有 keyword）
    ふるさと: Yahoo!ふるさと / さとふる（仅 prefecture + name）
```

DOM 硬规则：

1. `.km-rakuten` 内不得出现 `amazon.`、`yahoo.`、`satofull` 的 `href`。
2. `.km-other-shops` 内不得出现 API 的 `itemName`、`itemPrice`、`itemCode`、店铺名、乐天缩略图。
3. 其他商城的 query 只用 catalog 里的 `name` / `rakuten_search_keyword` / `furusato_keywords`，不用 API 返回值。
4. 代码上拆组件：`RakutenOffer`（server 或独立 fetch）与 `OtherShopLinks`（纯函数 URL）。禁止把 `RakutenRecommend` 对象传入 `OtherShopLinks`。

### 4.1 楽天ふるさと放哪

楽天ふるさと属于楽天グループ，可放在 `.km-rakuten`。  
Yahoo!ふるさと与さとふる放在 `.km-other-shops`。

### 4.2 上部 CTA（PurchaseLead）

保持「購入候補を見る」页内锚点。  
「ふるさと納税で探す」若仍链さとふる，不要和乐天 API 卡片画在同一块里。

---

## 5. 数据与接口约定

### 5.1 乐天专区

- 输入：catalog `id` → 服务端查 `rakuten_search_keyword`（禁止客户端把任意 keyword 当代理）。
- 调用：Ichiba Item Search（2026-07-01），带 `applicationId`、`accessKey`、`affiliateId`，以及 Node 原生 HTTPS 的 `Referer` / `Origin`（`fetch` 会丢掉 Referer）。
- アプリ设定：許可されたWebサイト 登记生产域（如 `https://komesomme.vercel.app`）。
- 输出给 UI 的 DTO 仅用于 `.km-rakuten`：

```ts
type RakutenOfferDto = {
  url: string; // affiliateUrl，必须是 hb.afl.rakuten.co.jp
  source: "item" | "search";
  itemName?: string;
  itemPrice?: number;
};
```

- `source: "search"`：API 失败或匹配分不够时，仍跳アフィ搜索，且**不要画假商品卡**（没有图价就只显示按钮「楽天市場で探す」）。
- 匹配规则沿用品牌名、5kg、排除訳あり等；匹配失败宁可搜索，也不要推错品种。

### 5.2 其他商城

```ts
amazonUrl(keyword)  // 明天加 tag=
yahooShoppingUrl(keyword)  // 明天加 ValueCommerce SID
```

`keyword` 只来自 `shopKeyword(rice)` / `furusatoKeyword(rice)`。

---

## 6. 文案与披露

- 购买区用语保持「探す」，不做レジ、最安、比较表。
- 乐天 API クレジット：公式スニペットを改変しない（`src/lib/rakuten/credit.ts` → `AffiliateDisclosure`）。
- 页脚（ライブラリ / 法务；首页无页脚）：Amazon 第 5 条定型文 + 「アフィリエイト広告」。CTA 旁只标 `※PR`。清单见 [15-disclosure-surfaces.md](./15-disclosure-surfaces.md)。
- 不要写「最安」「公式最安」「楽天グループ公式」。

---

## 7. 明确禁止

| 禁止 | 原因 |
|---|---|
| 乐天 API 商品卡内放 Amazon / Yahoo | 第 8 条 4 项 |
| 用 API 的图/价去给 Amazon 导流 | 第 10 条 1-(4)(5) |
| 把 API 商品写入公开铭柄 JSON | 第 10 条 1-(7)(9) |
| 做价格比较模块或「乐天比 Amazon 贵」 | 第 10 条 1-(6) |
| 仅有 API、没有アフィリエイト ID | 第 3 条；无法计佣 |
| 客户端暴露 `accessKey` | 第 5 条；安全 |

---

## 8. 明天开发顺序（建议）

1. **UI 隔离**：先改 `PurchaseLinks` 为两节 DOM，乐天节仍用搜索 URL（行为与今天相同）。
2. **再接通 API**：仅 `RakutenOffer` 请求 `/api/rice/rakuten-item`；有 `item` 才展示名称/价格。
3. **披露文案**。
4. **Amazon アソシエイト / ValueCommerce**：有 tag/SID 再写进 `amazonUrl` / Yahoo URL；未批下来按钮可保留为无 tag 搜索，或标「準備中」。
5. **本番**：Vercel 写入与 `.env.local` 相同的乐天三件套；アプリ「許可サイト」加生产域名。
6. **抽检**：点乐天须进 `hb.afl.rakuten.co.jp` 或带 `affiliateId` 的商品页；点 Amazon 不得带乐天 `itemCode`。

---

## 9. 明天申请清单（联盟，不是 API）

乐天商品 API 已有。缺的是别家**计佣账号**：

1. [Amazonアソシエイト](https://affiliate.amazon.co.jp/) → `tag`（搜索 URL 即可先赚钱；PA-API 可后补）。
2. [バリューコマース](https://www.valuecommerce.ne.jp/)（Yahoo!ショッピング）→ SID。
3. ふるさと各平台是否允许联盟，以各社条款为准；未批则只做无 tag 搜索或隐藏。

---

## 10. 验收（隔离版做完后）

- [ ] `.km-rakuten` 源码中无 amazon/yahoo/satofull 链接
- [ ] `.km-other-shops` 源码中无乐天 API 的 itemName/price/image
- [ ] 乐天点击 URL 含アフィリエイト跟踪
- [ ] API 失败时乐天仍是搜索アフィ，不展示错误商品
- [ ] 有アフィリエイト参加の注记と楽天公式クレジット（HTML 未改変）
- [ ] 无最安/比价文案
