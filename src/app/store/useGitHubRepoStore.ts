/**
 * useGitHubRepoStore.ts
 * Manages connecting, indexing, and caching a public GitHub repository.
 * Files are fetched via the GitHub REST API and cached in memory for the session.
 */

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface GitHubCachedFile {
  path: string;
  content: string;
  size: number;
}

export interface GitHubRepoState {
  // Connected repo
  repoUrl: string;          // e.g. https://github.com/owner/repo
  owner: string;
  repo: string;
  branch: string;
  token: string;            // optional PAT for private/rate-limit

  // State
  isIndexing: boolean;
  isIndexed: boolean;
  indexingProgress: { current: number; total: number };
  error: string | null;

  // Data
  tree: GitHubTreeItem[];
  cachedFiles: Record<string, string>; // path → content
  repoSummary: string;                 // injected into system prompt

  // Actions
  connectRepo: (url: string, token?: string) => Promise<void>;
  disconnectRepo: () => void;
  getFileContent: (path: string) => string | null;
  searchFiles: (query: string) => GitHubTreeItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage',
  '__pycache__', '.venv', 'venv', 'vendor', '.cache', '.parcel-cache',
  '.turbo', 'storybook-static', '.idea', '.vscode'
]);

const EXCLUDED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'bmp', 'tiff',
  'mp4', 'mp3', 'mov', 'avi', 'webm', 'ogg', 'wav',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'pdf', 'zip', 'tar', 'gz', 'rar', '7z',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'lock', // package-lock.json, yarn.lock etc — too large/noisy
  'map',  // source maps
]);

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const clean = url.trim().replace(/\/$/, '').replace(/\.git$/, '');
    const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

function getExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function shouldExclude(item: GitHubTreeItem): boolean {
  const parts = item.path.split('/');
  // Exclude if any path segment is an excluded directory
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part)) return true;
  }
  if (item.type === 'blob') {
    const ext = getExtension(item.path);
    if (EXCLUDED_EXTENSIONS.has(ext)) return true;
    if (item.size && item.size > 512 * 1024) return true; // skip >512KB files
  }
  return false;
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

async function fetchDefaultBranch(owner: string, repo: string, headers: HeadersInit): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!res.ok) throw new Error(`Repo not found or private: ${res.status}`);
  const data = await res.json();
  return data.default_branch || 'main';
}

async function fetchTree(owner: string, repo: string, branch: string, headers: HeadersInit): Promise<GitHubTreeItem[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );
  if (!res.ok) throw new Error(`Failed to fetch tree: ${res.status}`);
  const data = await res.json();
  if (data.truncated) {
    console.warn('[GitHub Repo] Tree was truncated — very large repo');
  }
  return (data.tree || []) as GitHubTreeItem[];
}

async function fetchFileContent(owner: string, repo: string, path: string, branch: string, headers: HeadersInit): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
    { headers }
  );
  if (!res.ok) return '';
  const data = await res.json();
  if (data.encoding === 'base64' && data.content) {
    try {
      return atob(data.content.replace(/\n/g, ''));
    } catch {
      return '';
    }
  }
  return data.content || '';
}

function buildRepoSummary(owner: string, repo: string, branch: string, tree: GitHubTreeItem[], cachedFiles: Record<string, string>): string {
  const lines: string[] = [];
  lines.push(`## Connected GitHub Repository: ${owner}/${repo} (branch: ${branch})`);
  lines.push(`**URL:** https://github.com/${owner}/${repo}`);
  lines.push('');

  // Package.json / framework detection
  const pkgContent = cachedFiles['package.json'];
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.name) lines.push(`**Package:** ${pkg.name} v${pkg.version || '?'}`);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const frameworks: string[] = [];
      if (deps['next']) frameworks.push('Next.js');
      if (deps['react']) frameworks.push('React');
      if (deps['vue']) frameworks.push('Vue');
      if (deps['@angular/core']) frameworks.push('Angular');
      if (deps['svelte']) frameworks.push('Svelte');
      if (deps['express']) frameworks.push('Express');
      if (deps['fastapi'] || deps['flask']) frameworks.push('Python API');
      if (frameworks.length) lines.push(`**Framework:** ${frameworks.join(', ')}`);
    } catch { /* ignore */ }
  }

  // File tree summary (top-level folders + key files)
  const topLevelDirs = new Set<string>();
  const keyFiles: string[] = [];
  for (const item of tree) {
    const parts = item.path.split('/');
    if (parts.length === 1) {
      if (item.type === 'blob') keyFiles.push(item.path);
    } else {
      topLevelDirs.add(parts[0]);
    }
  }

  lines.push('');
  lines.push(`**Total indexed files:** ${Object.keys(cachedFiles).length}`);
  if (topLevelDirs.size) lines.push(`**Top-level folders:** ${[...topLevelDirs].slice(0, 20).join(', ')}`);
  if (keyFiles.length) lines.push(`**Root files:** ${keyFiles.slice(0, 10).join(', ')}`);

  // Include important file contents
  const IMPORTANT_FILES = [
    'package.json', 'README.md', 'readme.md', 'README.MD',
    'tsconfig.json', 'next.config.js', 'next.config.ts', 'next.config.mjs',
    'vite.config.ts', 'vite.config.js',
    '.env.example', '.env.sample',
    'tailwind.config.js', 'tailwind.config.ts',
  ];

  lines.push('');
  lines.push('### Key Files');
  for (const f of IMPORTANT_FILES) {
    const content = cachedFiles[f];
    if (content) {
      lines.push(`\n---\nFile: ${f}\n---\n${content.slice(0, 3000)}`);
    }
  }

  return lines.join('\n');
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGitHubRepoStore = create<GitHubRepoState>((set, get) => ({
  repoUrl: '',
  owner: '',
  repo: '',
  branch: '',
  token: '',
  isIndexing: false,
  isIndexed: false,
  indexingProgress: { current: 0, total: 0 },
  error: null,
  tree: [],
  cachedFiles: {},
  repoSummary: '',

  connectRepo: async (url: string, token?: string) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      set({ error: 'Invalid GitHub URL. Use https://github.com/owner/repo' });
      return;
    }

    const { owner, repo } = parsed;
    const pat = token?.trim() || '';
    const headers = buildHeaders(pat);

    set({
      isIndexing: true,
      isIndexed: false,
      error: null,
      repoUrl: url,
      owner,
      repo,
      token: pat,
      cachedFiles: {},
      tree: [],
      repoSummary: '',
      indexingProgress: { current: 0, total: 0 },
    });

    try {
      // 1. Get default branch
      const branch = await fetchDefaultBranch(owner, repo, headers);
      set({ branch });

      // 2. Fetch full recursive tree
      const rawTree = await fetchTree(owner, repo, branch, headers);

      // 3. Filter to only readable source files
      const filteredBlobs = rawTree.filter(
        (item) => item.type === 'blob' && !shouldExclude(item)
      );
      const filteredTree = rawTree.filter(item => !shouldExclude(item));

      set({
        tree: filteredTree,
        indexingProgress: { current: 0, total: filteredBlobs.length }
      });

      // 4. Fetch file contents (cap at 150 files to avoid rate limits)
      const filesToFetch = filteredBlobs.slice(0, 150);
      const cachedFiles: Record<string, string> = {};
      let done = 0;

      // Batch in groups of 5 to be respectful of rate limits
      const BATCH = 5;
      for (let i = 0; i < filesToFetch.length; i += BATCH) {
        const batch = filesToFetch.slice(i, i + BATCH);
        await Promise.all(
          batch.map(async (item) => {
            const content = await fetchFileContent(owner, repo, item.path, branch, headers);
            if (content) cachedFiles[item.path] = content;
            done++;
            set({ indexingProgress: { current: done, total: filesToFetch.length } });
          })
        );
      }

      // 5. Build summary for system prompt
      const repoSummary = buildRepoSummary(owner, repo, branch, filteredTree, cachedFiles);

      set({
        isIndexing: false,
        isIndexed: true,
        cachedFiles,
        repoSummary,
      });

    } catch (err: any) {
      set({
        isIndexing: false,
        isIndexed: false,
        error: err?.message || 'Failed to connect repository',
      });
    }
  },

  disconnectRepo: () => {
    set({
      repoUrl: '',
      owner: '',
      repo: '',
      branch: '',
      token: '',
      isIndexing: false,
      isIndexed: false,
      error: null,
      tree: [],
      cachedFiles: {},
      repoSummary: '',
      indexingProgress: { current: 0, total: 0 },
    });
  },

  getFileContent: (path: string) => {
    return get().cachedFiles[path] ?? null;
  },

  searchFiles: (query: string) => {
    const lower = query.toLowerCase();
    return get().tree.filter(
      (item) => item.type === 'blob' && item.path.toLowerCase().includes(lower)
    ).slice(0, 30);
  },
}));
