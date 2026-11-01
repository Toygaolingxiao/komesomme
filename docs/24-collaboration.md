# 并行协作（人与 AI）

正本。主人、Cursor 云代理（Grok Bot「Komesomme」）、Muse，以及其他助手，都用 GitHub 账号 `Toygaolingxiao` 推送。作者靠分支前缀和 PR 正文区分，不靠 commit 的显示名。

版本号政策见 [01-versioning.md](./01-versioning.md)。主人当场说「推送 / push / 推到本番」时，按 `.cursor/rules/ship-main.mdc` 把**已经在 `main` 上的提交**推到 `origin`。那不是往 `main` 上直接 commit 的许可。近端做什么、不做什么，各端都守 [25-dev-playbook.md](./25-dev-playbook.md) 和 `.cursor/rules/dev-playbook.mdc`。

## 1. 一人一条分支

一个人（人或 AI）做一件事，只用自己的一条分支。不直接 commit 到 `main`。不 push 到别人的分支，即使远程账号相同。

| 谁 | 分支 |
| --- | --- |
| Cursor 云代理 | `cursor/<topic>`（云代理后缀如 `-274f` 保留） |
| Muse | `muse/<topic>` |
| 主人 | `feat/<topic>`、`fix/<topic>`、`docs/<topic>` |
| 其他助手 | 自定一个稳定前缀，不占用上表。已有例子：`copilot/` |

前缀跟仓库里已有分支保持同一套，不另起写法。

## 2. PR 小，并写明作者

一个 PR 只做一件事。正文写清是哪个 agent（或主人）、动了哪些文件或区域。栏位在 [`.github/pull_request_template.md`](../.github/pull_request_template.md)。

## 3. 开 PR 前、合并前再查一遍

两次都做：列出未合并的 PR，看文件或同一块是否重叠，正文里写上相关 PR。

容易撞车：`VERSION`、`package.json`、`package-lock.json`、`docs/10-changelog.md`、`src/data/editorial/collections.ts`。

rebase 到最新 `main`，冲突在自己的分支上解决。版本号由**后合并的人**在 rebase 之后改成下一个号。两个 PR 不声称同一个版本。文档整理、Cursor rule、与运行时无关的内部整理不升号。

## 4. 交叉审查

每个 PR 由作者以外的 agent 或主人看过，并留下 review comment。大家都用同一个 GitHub 账号，正式 Approve 往往点不了自己的 PR，评论里写明结论即可。

审查看四件事：范围是否单目的、和其他 open PR 是否冲突、CI、品牌与文案（`.cursor/rules/japanese-copy.mdc`、[08-ui-design.md](./08-ui-design.md)）。

合并的最后一句 OK 由主人给。agent 只在主人明确说可以合并时才合并。

## 5. 合并

- 最新 rebase 后的 head 上，必需检查 `lint · typecheck · validate · build` 为绿
- 本地全部门禁跑过：`npm run lint`、`npm run typecheck`、`npm run validate:rice`、`npm run test:unit`、`npm run build`、`npm run assert:client-bundle`、`npm run test:e2e`（先 build）
- squash merge，合并后删除分支
- 部署后按 [smoke-test.md](./smoke-test.md) 核对本番

## 6. 被取代的 PR

关掉，评论里链到替代 PR。
