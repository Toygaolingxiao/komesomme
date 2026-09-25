# PJ 文档柜（项目卷宗）

对 GAO。这里放**正本之外**仍要进仓留档的东西：调研备份、对外 Case Study 快照、外部 AI 锐评、固定提示词。

**不是** pmo-kit 的 WBS/甘特替代品。可执行正本仍在 `docs/00`–`22` 与 `.cursor/rules/`。兄弟仓 [pmo-kit](https://github.com/Toygaolingxiao/pmo-kit) 只管咨询交付渲染。

**本仓在职业设计里的位置（2026-09）：** KomeSomme = 可展示的数据产品证据 + 咨询信任背书；常规アフィ不当主 KPI。正本见 [../22-career-positioning.md](../22-career-positioning.md)。**`komesomme.jp` 产品页不要写这套。**

## 目录

| 路径 | 放什么 | 不放什么 |
| --- | --- | --- |
| [prompts/](./prompts/) | 反复使用的评审 / 调研提示词 | 一次性聊天废话 |
| [reviews/](./reviews/) | 外部 AI / 顾问的锐评原文 + 你的批注 | 已吸收进正本后的重复长文（可只留摘要+链到正本变更） |
| [research/](./research/) | 权威 URL、词库、取数笔记的**备份快照** | 仍在演进的唯一正本（那是 `docs/21` 等） |
| [artifacts/](./artifacts/) | Case Study、海报等对外物的索引与导出说明 | 大二进制重复；优先链到 `docs/assets/` |

## 与正本的关系

```text
正本（改产品 / 改定位就改这里）   PJ 柜（留痕 / 备份 / 外部意见）
─────────────────────────────   ────────────────────────────
docs/20 成長計画                  research/ 调研快照
docs/21 SEO 意图                  reviews/ 锐评留档
docs/22 职业定位（对 GAO）        artifacts/ 索引
docs/assets/*-case-study          prompts/ 提示词正本
.cursor/rules/*
```

规则：

1. **正本优先。** 锐评若导致改产品或改职业取舍，改 `docs/20`·`21`·`22`·代码，并在对应 changelog / 锐评文件头写「已吸收 → 链到 commit / 章节」。
2. **调研进柜留备份。** 权威源、长尾词、EEAT 测试记录：正本在 `21`；需要冻结某一天的版本时，复制一份到 `research/YYYY-MM-DD-*.md`。
3. **锐评原文进柜。** 你粘贴给我或自行保存都可以；文件名见 [reviews/README.md](./reviews/README.md)。
4. **提示词只维护一处。** 改评审口吻时只改 `prompts/`，聊天里不要分叉。
5. **Case Study 可以对顾问／招聘读者讲技术决策**（站外叙事）；与公开产品 UI 的「只讲选米」分开。

## 你怎么用（锐评流程）

1. 打开 [prompts/red-team-case-study.md](./prompts/red-team-case-study.md)，整段复制给外部 AI。
2. 把待评材料附上（通常是 [case study HTML](../assets/komesomme-1.4.1-case-study.html) 或导出文本）。
3. 收到回复后：新建 `reviews/YYYY-MM-DD-<source>.md`，用 [reviews/_TEMPLATE.md](./reviews/_TEMPLATE.md)，贴上全文。
4. 下次开聊时丢给我：我会帮你对照正本，标「已吸收 / 暂不采纳 / 需验证」。

## 当前已归档入口

| 主题 | 位置 |
| --- | --- |
| 锐评提示词 | [prompts/red-team-case-study.md](./prompts/red-team-case-study.md) |
| SEO 权威锚点 + 意图库存快照（与 21 同步起始） | [research/2026-09-09-seo-intent-snapshot.md](./research/2026-09-09-seo-intent-snapshot.md) |
| Case Study 1.0.0 | [artifacts/README.md](./artifacts/README.md) → `docs/assets/` |
| Case Study 日文用语基准 | [artifacts/case-study-ja-glossary-2026-09-11.md](./artifacts/case-study-ja-glossary-2026-09-11.md) |
| 锐评 | [reviews/2026-09-09-gpt-5.5-case-study.md](./reviews/2026-09-09-gpt-5.5-case-study.md)（`triaged`） |
| 技术实验前提下的锐评 | [reviews/2026-09-09-copilot-case-study-red-team.md](./reviews/2026-09-09-copilot-case-study-red-team.md)（`triaged`） |
