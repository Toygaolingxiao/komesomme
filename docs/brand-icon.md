# KomeSomme アイコンシステム

米粒と味わいの探針。侍・刀・キャラクターは使わない。

## 推奨方向

**Grain + Tasting Probe**。縦の米粒（上部に浅い胚の切れ込み）、粒内右下の等深線、金の今日の一点、珊瑚の探針、細い軌道。ボード全体は [references/grain-probe-brand-board.png](./references/grain-probe-brand-board.png)。

- 金点: 今日の一膳
- 珊瑚の点と線: 味わいを探す探針
- 等深線: 味わいの地図のニュアンス
- 軌道: コンパス

## サイズ別

| 用途 | ファイル | 内容 |
|---|---|---|
| 16–24px favicon | `src/app/icon.tsx` | 米白地・墨の線・金点。塗りつぶしの黒は使わない |
| 32px 以上・UI | `public/brand/mark.svg` | 線画 + 等深線 + 軌道 + 探針 |
| 180 Apple | `src/app/apple-icon.tsx` | 米白地に標準マーク |
| 512 / アバター | `public/brand/icon-light.svg` `icon-mono.svg` | 角丸スクエア（墨地版は置かない） |
| ヘッダー | `BrandLockup` | 標準マーク + 明朝の KomeSomme |

モノクロは `mark-mono.svg` / `lockup-mono.svg` / `icon-mono.svg`。

## クリアスペースと最小サイズ

- クリアスペース: マーク高さの **1/4** を四辺に空ける
- 最小: favicon **16px**、UI バッジ **24px**、標準マーク **32px**、lockup 幅 **120px**、アプリアイコン **32px**

## コントラスト

- 金 `#D49A2A` on 墨 `#302820`: 約 5.8:1。点・線のグラフィック用途（WCAG 非テキスト 3:1 を満たす）。本文には使わない
- 米白 `#FFF5E5` on 墨: 本文 AA 以上
- 珊瑚 `#E56B3F` on 墨: アクセント点のみ
- Favicon / Apple アイコンは米白地に墨の線。墨で盤面を塗らない

## カラー

墨 `#302820` / 米白 `#FFF5E5` / 紙 `#F6EBDD` / 金 `#D49A2A` / 収穫珊瑚 `#E56B3F`
