'use client';

import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Search, 
  Pin, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  Terminal
} from 'lucide-react';
import { useLocalProjectStore, FileNode } from '../store/useLocalProjectStore';

interface CodebaseExplorerProps {
  projectId: string;
  onClose?: () => void;
}

export default function CodebaseExplorer({ projectId, onClose }: CodebaseExplorerProps) {
  const {
    activeDirectoryHandle: dirHandle,
    directoryPermissionStatus: permStatus,
    isIndexing,
    indexedFiles,
    projectSummary,
    attachedFiles,
    indexingProgress,
    fileTree,
    requestDirectoryPermission,
    scanDirectory,
    toggleFileAttachment,
    clearAttachments,
    disconnectDirectory
  } = useLocalProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true, // Auto-expand src by default
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Helper to render tree nodes recursively
  const renderTreeNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders[node.path];
    const hasChildren = node.isDir && node.children && node.children.length > 0;
    const isAttached = attachedFiles.includes(node.path);

    if (node.isDir) {
      return (
        <div key={node.path} className="space-y-0.5 select-none">
          <button
            type="button"
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1.5 w-full py-1.5 px-2 hover:bg-slate-800/60 rounded-lg text-slate-300 hover:text-white transition-all text-xs text-left"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="truncate font-sans font-medium">{node.name}</span>
          </button>
          
          {isExpanded && hasChildren && (
            <div className="space-y-0.5">
              {node.children!.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => toggleFileAttachment(node.path)}
          className={`flex items-center justify-between w-full py-1.5 px-2 rounded-lg transition-all text-xs text-left select-none group ${
            isAttached 
              ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' 
              : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <File className={`w-3.5 h-3.5 shrink-0 ${isAttached ? 'text-emerald-450' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="truncate font-sans font-medium">{node.name}</span>
          </div>
          {isAttached ? (
            <Pin className="w-3.5 h-3.5 text-emerald-450 shrink-0 animate-bounce" />
          ) : (
            <Pin className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-primary" />
          )}
        </button>
      );
    }
  };

  // Filter tree based on search query
  const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;

    const lowerQuery = query.toLowerCase();
    
    return nodes
      .map(node => {
        if (node.isDir && node.children) {
          const filteredChildren = filterTree(node.children, query);
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
        }
        if (node.name.toLowerCase().includes(lowerQuery) || node.path.toLowerCase().includes(lowerQuery)) {
          return node;
        }
        return null;
      })
      .filter((n): n is FileNode => n !== null);
  };

  const filteredFileTree = filterTree(fileTree, searchQuery);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700/80 w-80 shrink-0 font-sans shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workspace Folder</span>
          <span className="text-sm font-bold text-slate-100 truncate mt-0.5">
            {dirHandle ? dirHandle.name : 'No Folder Linked'}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
            title="Close Explorer"
          >
            <XCloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Permissions / Status Checks */}
      {dirHandle && permStatus !== 'granted' && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/15 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-550 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-amber-400">Directory Access Required</h5>
              <p className="text-[10px] text-slate-400 leading-normal">
                Browser security requires folder re-authorization on each session load to access local project files.
              </p>
            </div>
          </div>
          <button
            onClick={requestDirectoryPermission}
            className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            Re-authorize Access
          </button>
        </div>
      )}

      {dirHandle && permStatus === 'granted' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Indexing status & metadata summary */}
          {isIndexing ? (
            <div className="p-4 border-b border-slate-800 bg-slate-950/45 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>Scanning local files...</span>
                </div>
                <span>
                  {indexingProgress.current} / {indexingProgress.total || '?'}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ 
                    width: `${indexingProgress.total ? (indexingProgress.current / indexingProgress.total) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          ) : projectSummary ? (
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Detected Framework</span>
                </div>
                <span className="text-[9px] bg-slate-850 border border-slate-700/60 text-[#a8c7fa] px-1.5 py-0.5 rounded font-mono font-semibold">
                  {projectSummary.framework}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium leading-normal bg-slate-950/50 p-2 rounded-lg border border-slate-800/80 font-mono">
                {projectSummary.structureSummary}
              </p>
            </div>
          ) : null}

          {/* Search box */}
          <div className="p-3 border-b border-slate-850">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search files by path..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 transition-all font-sans"
              />
            </div>
          </div>

          {/* Attached Files Counter & Clear Button */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-450 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3" />
                {attachedFiles.length} File{attachedFiles.length > 1 ? 's' : ''} Attached
              </span>
              <button
                type="button"
                onClick={clearAttachments}
                className="text-[9px] font-bold text-slate-500 hover:text-slate-350 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* File Tree View */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin space-y-0.5">
            {filteredFileTree.length > 0 ? (
              filteredFileTree.map(node => renderTreeNode(node))
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-slate-600 space-y-1.5 mt-8">
                <File className="w-8 h-8 text-slate-750" />
                <p className="text-xs font-semibold">No files matched search</p>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>Total files: {indexedFiles.length}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scanDirectory(projectId)}
                className="text-primary hover:text-white transition-colors cursor-pointer flex items-center gap-0.5"
                disabled={isIndexing}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                Rescan
              </button>
              <span className="text-slate-800">|</span>
              <button
                type="button"
                onClick={() => disconnectDirectory(projectId)}
                className="text-rose-450 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linked Folder Prompt */}
      {!dirHandle && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Folder className="w-12 h-12 text-slate-700 stroke-[1.5]" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-300">Local Codebase Access</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
              Link this workspace project to a local folder to browse files, attach source code to prompts, and query the entire codebase.
            </p>
          </div>
          <button
            onClick={() => useLocalProjectStore.getState().selectDirectory(projectId)}
            className="px-4 py-2 bg-primary text-slate-950 hover:bg-primary/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg hover:scale-[1.01]"
          >
            Connect Local Directory
          </button>
        </div>
      )}
    </div>
  );
}

// Subtle Close Icon component for Explorer header
function XCloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
