# 試験結果レポート

生成: **2026-08-29T17:09:14.318Z** · 式样: [test-specification.md](./test-specification.md) · 製品: [`VERSION`](../VERSION)

## 総合判定

**PASS**

| スイート | 結果 | 備考 |
| --- | --- | --- |
| Vitest unit | 7/7 passed | — |
| Playwright E2E | 34 passed / 0 failed / 3 skipped | 12108 ms |

## メモ

- CI 既定: `SEMANTIC_RECOMMEND_ENABLED=false`（TS-CONSULT-01 劣化モード）
- Live 相談（TS-CONSULT-03）は本番スモーク手動
- HTML レポート: `playwright-report/index.html`（`npx playwright show-report`）

## トレーサビリティ

式样書の `TS-*` と e2e / unit ファイル名を対応。失敗時は Playwright trace / screenshot を `test-results` 配下で確認。
