'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGitHubRepoStore } from '../store/useGitHubRepoStore';

interface Props {
  onClose: () => void;
}

export default function GitHubRepoPanel({ onClose }: Props) {
  const {
    repoUrl, owner, repo, branch,
    isIndexing, isIndexed, indexingProgress, error,
    tree, cachedFiles,
    connectRepo, disconnectRepo,
  } = useGitHubRepoStore();

  const [inputUrl, setInputUrl] = useState(repoUrl || '');
  const [inputToken, setInputToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build a nested tree structure from flat paths
  const buildDisplayTree = () => {
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      return tree
        .filter(item => item.type === 'blob' && item.path.toLowerCase().includes(lower))
        .slice(0, 50);
    }
    return null; // null means use full tree
  };

  const filteredSearchResults = buildDisplayTree();

  // Build hierarchical folder tree
  const renderTree = () => {
    const nodes: Record<string, { type: 'file' | 'folder'; children: string[]; path: string }> = {};

    for (const item of tree) {
      const parts = item.path.split('/');
      // Register all ancestor folders
      for (let i = 1; i <= parts.length - 1; i++) {
        const folderPath = parts.slice(0, i).join('/');
        if (!nodes[folderPath]) {
          nodes[folderPath] = { type: 'folder', children: [], path: folderPath };
        }
      }
      nodes[item.path] = { type: item.type === 'tree' ? 'folder' : 'file', children: [], path: item.path };

      // Link to parent
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('/');
        if (nodes[parentPath] && !nodes[parentPath].children.includes(item.path)) {
          nodes[parentPath].children.push(item.path);
        }
      }
    }

    // Render only top-level items
    const topLevel = tree
      .filter(item => !item.path.includes('/'))
      .map(item => item.path);

    return topLevel;
  };

  const topLevelPaths = renderTree();
  const allNodes: Record<string, { type: 'file' | 'folder'; children: string[] }> = {};
  for (const item of tree) {
    const parts = item.path.split('/');
    for (let i = 1; i <= parts.length - 1; i++) {
      const folderPath = parts.slice(0, i).join('/');
      if (!allNodes[folderPath]) allNodes[folderPath] = { type: 'folder', children: [] };
    }
    if (!allNodes[item.path]) allNodes[item.path] = { type: item.type === 'tree' ? 'folder' : 'file', children: [] };
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      if (allNodes[parentPath] && !allNodes[parentPath].children.includes(item.path)) {
        allNodes[parentPath].children.push(item.path);
      }
    }
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      ts: '🔷', tsx: '⚛️', js: '📜', jsx: '⚛️',
      json: '📋', md: '📝', css: '🎨', scss: '🎨',
      html: '🌐', py: '🐍', go: '🐹', rs: '🦀',
      php: '🐘', rb: '💎', java: '☕', c: '⚙️', cpp: '⚙️',
      sh: '💲', yml: '📐', yaml: '📐', toml: '📐', env: '🔐',
      sql: '🗃️', graphql: '📡', prisma: '🔷',
    };
    return icons[ext || ''] || '📄';
  };

  const renderNode = (path: string, depth = 0): React.ReactNode => {
    const node = allNodes[path];
    if (!node) return null;
    const name = path.split('/').pop() || path;
    const isExpanded = expandedFolders.has(path);
    const isCached = path in cachedFiles;

    if (node.type === 'folder') {
      return (
        <div key={path}>
          <button
            onClick={() => toggleFolder(path)}
            className="w-full flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-white/5 text-left transition-colors"
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            <span className="text-slate-400 text-[10px]">{isExpanded ? '▼' : '▶'}</span>
            <span className="text-[10px]">📁</span>
            <span className="text-[11px] text-slate-300 font-medium truncate">{name}</span>
          </button>
          {isExpanded && (
            <div>
              {[...new Set(node.children)]
                .sort((a, b) => {
                  const aNode = allNodes[a];
                  const bNode = allNodes[b];
                  if (aNode?.type === 'folder' && bNode?.type !== 'folder') return -1;
                  if (aNode?.type !== 'folder' && bNode?.type === 'folder') return 1;
                  return a.localeCompare(b);
                })
                .map(childPath => renderNode(childPath, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={path}
        className="flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-white/5 transition-colors"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        title={path}
      >
        <span className="text-[10px]">{getFileIcon(path)}</span>
        <span className={`text-[11px] truncate ${isCached ? 'text-slate-300' : 'text-slate-500'}`}>{name}</span>
        {isCached && <span className="ml-auto shrink-0 w-1 h-1 rounded-full bg-emerald-500" title="Content cached" />}
      </div>
    );
  };

  const progress = indexingProgress.total > 0
    ? Math.round((indexingProgress.current / indexingProgress.total) * 100)
    : 0;

  const cachedCount = Object.keys(cachedFiles).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🐙</span>
          <span className="text-sm font-bold text-slate-100">GitHub Repo Reader</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Connect / Status */}
      <div className="p-4 border-b border-slate-800 shrink-0 space-y-3">
        {!isIndexed && !isIndexing && (
          <>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Paste any <strong className="text-slate-200">public GitHub repo URL</strong>. The AI will read all source files and understand the full codebase.
            </p>

            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputUrl.trim()) {
                    connectRepo(inputUrl.trim(), inputToken.trim() || undefined);
                  }
                }}
                placeholder="https://github.com/owner/repo"
                className="w-full bg-slate-900 border border-slate-700 focus:border-primary rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
              />

              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={inputToken}
                  onChange={e => setInputToken(e.target.value)}
                  placeholder="GitHub token (optional — avoids rate limits)"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-primary rounded-xl py-2 px-3 pr-12 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300"
                >
                  {showToken ? 'hide' : 'show'}
                </button>
              </div>

              <button
                onClick={() => {
                  if (inputUrl.trim()) {
                    connectRepo(inputUrl.trim(), inputToken.trim() || undefined);
                  }
                }}
                disabled={!inputUrl.trim()}
                className="w-full py-2 rounded-xl bg-primary hover:bg-primary/80 text-[#131314] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                🔍 Read Repository
              </button>
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px]">
                ⚠️ {error}
              </div>
            )}
          </>
        )}

        {isIndexing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs text-slate-300 font-medium">
                Reading <strong>{owner}/{repo}</strong>…
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Fetching files</span>
                <span>{indexingProgress.current}/{indexingProgress.total}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {isIndexed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <a
                  href={`https://github.com/${owner}/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {owner}/{repo}
                </a>
                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                  {branch}
                </span>
              </div>
              <button
                onClick={() => { disconnectRepo(); setInputUrl(''); }}
                className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                Disconnect
              </button>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-500">
              <span>📄 {cachedCount} files indexed</span>
              <span>·</span>
              <span>🌳 {tree.filter(t => t.type === 'blob').length} total blobs</span>
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="w-full bg-slate-900 border border-slate-700 focus:border-primary rounded-lg py-1.5 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* File Tree */}
      {isIndexed && (
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {filteredSearchResults ? (
            // Search results
            <div className="space-y-0.5 px-2">
              {filteredSearchResults.length === 0 ? (
                <p className="text-[11px] text-slate-500 px-2 py-4 text-center">No files match "{searchQuery}"</p>
              ) : (
                filteredSearchResults.map(item => (
                  <div key={item.path} className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-white/5 transition-colors">
                    <span className="text-[10px]">{getFileIcon(item.path)}</span>
                    <span className="text-[11px] text-slate-300 truncate flex-1" title={item.path}>{item.path}</span>
                    {item.path in cachedFiles && <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Full tree
            <div className="space-y-0.5">
              {topLevelPaths
                .sort((a, b) => {
                  const aIsFolder = allNodes[a]?.type === 'folder';
                  const bIsFolder = allNodes[b]?.type === 'folder';
                  if (aIsFolder && !bIsFolder) return -1;
                  if (!aIsFolder && bIsFolder) return 1;
                  return a.localeCompare(b);
                })
                .map(path => renderNode(path, 0))}
            </div>
          )}
        </div>
      )}

      {/* Footer tip */}
      {isIndexed && (
        <div className="px-4 py-2 border-t border-slate-800 shrink-0">
          <p className="text-[10px] text-slate-600 text-center">
            🤖 AI now has full codebase context. Ask anything about this repo!
          </p>
        </div>
      )}
    </div>
  );
}
