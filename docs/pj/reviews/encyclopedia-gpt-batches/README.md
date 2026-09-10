# 百科長文 · GPT 手動点検パック

- 記事数: 106
- 総文字数（本文フィールド概算）: ~87k
- 使い方: 各 batch を開き、**プロンプト全文 + バッチ JSON** を GPT に貼る
- 出力 JSON をチャットに貼るか `batch-0N-result.json` として置けば、エージェントが `articles/<id>.json` に反映
- **batch 1**: 反映済み（`batch-01-result.json` · 22 篇）
- **batch 2**: 反映済み（`batch-02-result.json` · 22 篇）
- **batch 3**: 反映済み（`batch-03-result.json` · 22 篇）
- **batch 4**: 反映済み（`batch-04-result.json` · 22 篇）
- **batch 5**: 反映済み（`batch-05-result.json` · 18 篇）· **百科全 106 篇改稿完了**

| バッチ | ファイル | 件数 | id 範囲 |
| --- | --- | --- | --- |
| 1 | [batch-01.md](./batch-01.md) | 22 | ai-hitotsubu … goropikari |
| 2 | [batch-02.md](./batch-02.md) | 22 | haenuki … kirara397 |
| 3 | [batch-03.md](./batch-03.md) | 22 | kitakurin … musubi-no-kami |
| 4 | [batch-04.md](./batch-04.md) | 22 | nanatsuboshi … tentakaku |
| 5 | [batch-05.md](./batch-05.md) | 18 | tochigi-no-hoshi … yumepirika |

## コーパスで既に多い癖（参考）

- 「おすすめです」約 69 件
- 「親しまれ〜」約 68 件
- 「〜されています」約 33 件
- 「位置づけ／として知られ／広く知られ／堪能／彩ります」も散見

生成時の強い禁止語は概ね scrub 済み。残るのはプレスリリース調の柔らかい AI 腔。
