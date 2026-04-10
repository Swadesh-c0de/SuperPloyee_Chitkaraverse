import { NextRequest } from "next/server";

function buildRepoData(r: any, owner: string) {
  return {
    id: `github-${owner}-${r.name}`,
    name: r.name,
    fullName: r.full_name,
    description: r.description || "",
    language: r.language || "Unknown",
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics || [],
    defaultBranch: r.default_branch,
    updatedAt: r.pushed_at,
    url: r.html_url,
    isArchived: r.archived,
    openIssues: r.open_issues_count,
  };
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || !url.includes("github.com/")) {
    return Response.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Parse path: strip trailing slash, split into parts
  const path = url.split("github.com/")[1].replace(/\/$/, "");
  const parts = path.split("/").filter(Boolean);
  const owner = parts[0];
  const repoName = parts[1]; // present only for specific-repo URLs

  // ── CASE 1: Specific repo URL (github.com/user/repo) ──────────────────────
  if (repoName) {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoRes.ok) {
      return Response.json({ error: `Repo not found: ${owner}/${repoName}` }, { status: 404 });
    }
    const repoRaw = await repoRes.json();
    const repo = buildRepoData(repoRaw, owner);

    return Response.json({
      mode: "single",
      org: owner,
      entityType: "repo",
      entityMeta: {
        name: `${owner}/${repoName}`,
        description: repoRaw.description || "",
        publicRepos: 1,
        htmlUrl: repoRaw.html_url,
      },
      repos: [repo],
      total: 1,
    });
  }

  // ── CASE 2: Org/user URL (github.com/user) — fetch ALL public repos ────────
  let entityType: "org" | "user" = "org";
  let entityMeta: any = null;

  const orgRes = await fetch(`https://api.github.com/orgs/${owner}`, { headers });
  if (orgRes.ok) {
    entityMeta = await orgRes.json();
    entityType = "org";
  } else {
    const userRes = await fetch(`https://api.github.com/users/${owner}`, { headers });
    if (userRes.ok) {
      entityMeta = await userRes.json();
      entityType = "user";
    }
  }

  let repos: any[] = [];
  for (let page = 1; page <= 2; page++) {
    const endpoint =
      entityType === "org"
        ? `https://api.github.com/orgs/${owner}/repos?type=public&per_page=100&page=${page}&sort=updated`
        : `https://api.github.com/users/${owner}/repos?type=public&per_page=100&page=${page}&sort=updated`;

    const res = await fetch(endpoint, { headers });
    if (!res.ok) break;
    const batch: any[] = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    repos = [...repos, ...batch];
    if (batch.length < 100) break;
  }

  const repoData = repos.map((r: any) => buildRepoData(r, owner));

  return Response.json({
    mode: "org",
    org: owner,
    entityType,
    entityMeta: entityMeta
      ? {
          name: entityMeta.name || owner,
          description: entityMeta.description || "",
          publicRepos: entityMeta.public_repos,
          avatarUrl: entityMeta.avatar_url,
          htmlUrl: entityMeta.html_url,
        }
      : null,
    repos: repoData,
    total: repoData.length,
  });
}
