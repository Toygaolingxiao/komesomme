# 锐评留档

每次外部 AI / 顾问锐评，**原文进仓**一份。

## 命名

```text
YYYY-MM-DD-<source>[-topic].md
```

例：

- `2026-09-10-claude-case-study.md`
- `2026-09-12-gpt-growth-plan.md`
- `2026-09-15-human-advisor-seo.md`

`<source>`：模型名或人名缩写。同一天多次加 `-2` 后缀。

## 流程

1. 复制 [`../prompts/red-team-case-study.md`](../prompts/red-team-case-study.md)（或其它 prompts）给评审方。
2. 附上被评材料（Case Study HTML / `docs/20` / `docs/21` 节选）。
3. 用 [`_TEMPLATE.md`](./_TEMPLATE.md) 新建文件，粘贴全文。
4. 你自己或之后让仓库里的 Agent 填「吸收状态」表。

## 吸收状态（写在每份锐评文首）

| 状态 | 含义 |
| --- | --- |
| `open` | 尚未对照正本 |
| `triaged` | 已分类：采纳 / 暂缓 / 拒绝 |
| `absorbed` | 关键条已写入正本或代码（文内给链接） |
| `wontfix` | 明确不采纳（写理由） |

## 已归档

| 文件 | 来源 | 状态 |
| --- | --- | --- |
| [2026-11-01-cursor-unslop-ui-audit.md](./2026-11-01-cursor-unslop-ui-audit.md) | Cursor · UI unslop 页面设计审查 | `open` |
| [2026-09-09-gpt-5.5-case-study.md](./2026-09-09-gpt-5.5-case-study.md) | GPT-5.5 · 第一轮 | `absorbed` |
| [2026-09-09-gpt-5.5-case-study-r2.md](./2026-09-09-gpt-5.5-case-study-r2.md) | GPT-5.5 · 第二轮 | `absorbed` |
| [2026-09-09-copilot-case-study-red-team.md](./2026-09-09-copilot-case-study-red-team.md) | Copilot SDK · 技术实验前提下的红队评审 | `triaged` |
