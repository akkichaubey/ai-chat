/**
 * GitHub Public Profile Fetcher
 * Fetches a user's public data via the GitHub REST API and returns
 * a compact Markdown-formatted context string suitable for injecting into AI prompts.
 */

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  fork: boolean;
}

export interface GitHubProfileData {
  user: GitHubUser;
  topRepos: GitHubRepo[];
  languages: string[];
  contextMarkdown: string;
}

function buildHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return headers;
}

export async function fetchGitHubProfile(
  username: string,
  token?: string
): Promise<GitHubProfileData | null> {
  if (!username.trim()) return null;

  const headers = buildHeaders(token);
  const base = 'https://api.github.com';

  try {
    // 1. Fetch user profile
    const userRes = await fetch(`${base}/users/${encodeURIComponent(username.trim())}`, { headers });
    if (!userRes.ok) {
      console.warn(`[GitHub] Failed to fetch profile for "${username}": ${userRes.status}`);
      return null;
    }
    const user: GitHubUser = await userRes.json();

    // 2. Fetch top repos sorted by stars (up to 30, filter out forks)
    const reposRes = await fetch(
      `${base}/users/${encodeURIComponent(username.trim())}/repos?sort=pushed&per_page=30&type=owner`,
      { headers }
    );
    const allRepos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
    const ownRepos = allRepos.filter((r) => !r.fork);
    const topRepos = [...ownRepos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 8);

    // 3. Extract unique languages
    const langCounts: Record<string, number> = {};
    for (const repo of ownRepos) {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    }
    const languages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    // 4. Build compact markdown context
    const contextMarkdown = buildContextMarkdown(user, topRepos, languages);

    return { user, topRepos, languages, contextMarkdown };
  } catch (err) {
    console.error('[GitHub] Fetch error:', err);
    return null;
  }
}

function buildContextMarkdown(
  user: GitHubUser,
  topRepos: GitHubRepo[],
  languages: string[]
): string {
  const lines: string[] = [];

  lines.push(`## GitHub Profile: @${user.login}`);
  if (user.name) lines.push(`**Name:** ${user.name}`);
  if (user.bio) lines.push(`**Bio:** ${user.bio}`);
  if (user.company) lines.push(`**Company:** ${user.company}`);
  if (user.location) lines.push(`**Location:** ${user.location}`);
  if (user.email) lines.push(`**Email:** ${user.email}`);
  if (user.blog) lines.push(`**Website:** ${user.blog}`);
  if (user.twitter_username) lines.push(`**Twitter:** @${user.twitter_username}`);

  lines.push('');
  lines.push(`**Stats:** ${user.public_repos} repos · ${user.followers} followers · ${user.following} following · Member since ${new Date(user.created_at).getFullYear()}`);

  if (languages.length > 0) {
    lines.push('');
    lines.push(`**Primary Languages:** ${languages.slice(0, 8).join(', ')}`);
  }

  if (topRepos.length > 0) {
    lines.push('');
    lines.push('### Top Repositories');
    for (const repo of topRepos) {
      const langTag = repo.language ? ` [${repo.language}]` : '';
      const stars = repo.stargazers_count > 0 ? ` ⭐${repo.stargazers_count}` : '';
      const forks = repo.forks_count > 0 ? ` 🍴${repo.forks_count}` : '';
      lines.push(`- **${repo.name}**${langTag}${stars}${forks}${repo.description ? ` — ${repo.description}` : ''}`);
      if (repo.topics?.length) {
        lines.push(`  Topics: ${repo.topics.join(', ')}`);
      }
    }
  }

  lines.push('');
  lines.push(`**Profile URL:** ${user.html_url}`);

  return lines.join('\n');
}
