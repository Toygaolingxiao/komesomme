/**
 * Shared by ops-alert.yml (github-script after checkout).
 * Finds an open issue by exact title and comments; otherwise opens a new one.
 */
async function upsertOpsIssue({ github, context, title, body, comment }) {
  const { owner, repo } = context.repo;
  const { data: issues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 50,
  });
  const existing = issues.find((issue) => issue.title === title && !issue.pull_request);
  if (existing) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: existing.number,
      body: comment,
    });
    return;
  }

  try {
    await github.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: ["ops-alert"],
    });
  } catch {
    await github.rest.issues.create({
      owner,
      repo,
      title,
      body,
    });
  }
}

module.exports = { upsertOpsIssue };
