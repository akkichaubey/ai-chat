'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Settings, 
  Search,
  Pin,
  Sparkles,
  Brain,
  Code,
  Compass,
  PanelLeftClose,
  SquarePen,
  MoreHorizontal,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderInput
} from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: number;
}

interface ChatSession {
  id: string;
  title: string;
  pinned?: boolean;
  persona?: string;
  customSystemPrompt?: string;
  projectId?: string;
}

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenExploreGpts: () => void;
  userProfile?: { name: string; email: string; avatar_url?: string } | null;
  onSignOut?: () => void;
  projects?: Project[];
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onMoveSessionToProject?: (sessionId: string, projectId?: string) => void;
  onOpenSearch?: () => void;
  onOpenPromptLibrary?: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onOpenSettings,
  isOpen,
  onToggleOpen,
  onOpenExploreGpts,
  userProfile,
  onSignOut,
  projects = [],
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onMoveSessionToProject,
  onOpenSearch,
  onOpenPromptLibrary
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [isMoveToProjectOpen, setIsMoveToProjectOpen] = useState(false);
  const [activeMoveSessionId, setActiveMoveSessionId] = useState<string | null>(null);

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setTempTitle(currentTitle);
    setActiveDropdownId(null);
  };

  const handleSaveRename = (e: React.FormEvent | React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (tempTitle.trim()) {
      onRenameSession(id, tempTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  // All session filtering is handled by the SearchModal — use sessions directly
  const filteredSessions = sessions;

  // Group into pinned and unpinned (excluding project chats)
  const pinnedSessions = filteredSessions.filter(s => s.pinned && !s.projectId);
  const unpinnedSessions = filteredSessions.filter(s => !s.pinned && !s.projectId);

  // Helper to group unpinned sessions chronologically
  const getChronologicalGroup = (id: string): string => {
    const timestamp = parseInt(id, 10);
    if (isNaN(timestamp)) return 'Recent';

    const now = new Date();
    const date = new Date(timestamp);

    // Strip time parts to compare dates only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (date >= today) return 'Today';
    if (date >= yesterday) return 'Yesterday';
    if (date >= sevenDaysAgo) return 'Previous 7 Days';
    if (date >= thirtyDaysAgo) return 'Previous 30 Days';
    return 'Older';
  };

  const groupsOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];
  
  const groupedUnpinnedSessions: Record<string, ChatSession[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    'Older': []
  };

  unpinnedSessions.forEach(session => {
    const group = getChronologicalGroup(session.id);
    if (groupedUnpinnedSessions[group]) {
      groupedUnpinnedSessions[group].push(session);
    } else {
      groupedUnpinnedSessions['Older'].push(session);
    }
  });

  // Render a badge based on persona
  const renderPersonaBadge = (persona?: string) => {
    if (!persona || persona === 'general') return null;
    
    let label = '';
    let classes = '';
    let Icon = Compass;

    if (persona === 'writer') {
      label = 'Writer';
      classes = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-850/40 text-violet-300';
      Icon = Compass;
    } else if (persona === 'code') {
      label = 'Code';
      classes = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-850/40 text-emerald-300';
      Icon = Code;
    } else if (persona === 'custom') {
      label = 'Custom';
      classes = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-850/40 text-amber-300';
      Icon = Sparkles;
    } else {
      return null;
    }

    return (
      <span className={`${classes} flex items-center gap-0.5 shrink-0 ml-1.5`} title={`${label} Persona`}>
        <Icon className="w-2.5 h-2.5" />
        {label}
      </span>
    );
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = session.id === editingSessionId;
    const isDropdownOpen = activeDropdownId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center justify-between py-2 px-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-155 select-none ${
          isActive 
            ? 'bg-[#212121] text-white font-medium shadow-sm' 
            : 'text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121]/40 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-6">
          <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-neutral-200' : 'text-neutral-500 opacity-60 group-hover:opacity-100'}`} />
          
          {isEditing ? (
            <form 
              onSubmit={(e) => handleSaveRename(e, session.id)}
              className="flex items-center flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-neutral-700 text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 text-slate-200 font-sans"
                autoFocus
              />
            </form>
          ) : (
            <div className="flex items-center min-w-0 flex-1">
              <span className="text-sm truncate leading-relaxed">
                {session.title}
              </span>
              {renderPersonaBadge(session.persona)}
            </div>
          )}
        </div>

        {/* Three-dots menu for actions (Pin, Rename, Delete) */}
        {!isEditing && (
          <div className="absolute right-2 flex items-center">
            {/* Show Pin icon if pinned and dropdown/hover is not active */}
            {session.pinned && !isDropdownOpen && (
              <Pin className="w-3.5 h-3.5 fill-[#a8c7fa] text-[#a8c7fa] group-hover:opacity-0 transition-opacity mr-1" />
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownId(isDropdownOpen ? null : session.id);
              }}
              className={`p-1 rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-all ${
                isDropdownOpen ? 'opacity-100 text-neutral-200 bg-neutral-800' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown on click outside */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(null);
                  }}
                />
                <div 
                  className="absolute right-0 top-7 z-50 bg-[#1e1f20] border border-[#303134] rounded-2xl shadow-2xl p-1.5 w-36 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session.id);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#2d2f31]/80 rounded-xl transition-all cursor-pointer"
                  >
                    <Pin className={`w-3.5 h-3.5 text-slate-400 ${session.pinned ? 'fill-current text-[#a8c7fa]' : ''}`} />
                    {session.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(e, session.id, session.title);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#2d2f31]/80 rounded-xl transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMoveSessionId(session.id);
                      setIsMoveToProjectOpen(true);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#2d2f31]/80 rounded-xl transition-all cursor-pointer"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                    Move to...
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left text-xs font-semibold text-rose-450 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isEditing && (
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={(e) => handleSaveRename(e, session.id)}
              className="p-1 rounded text-emerald-450 hover:bg-emerald-950/20 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelRename}
              className="p-1 rounded text-rose-450 hover:bg-rose-950/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={onToggleOpen}
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col h-full bg-[#171717] border-r border-neutral-800/40 transition-all duration-300 ease-in-out sidebar-container ${
          isOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-[68px] overflow-visible'
        }`}
      >
        {isOpen ? (
          <>
        {/* Top Header Row (ChatGPT Style: Close button & New Chat button) */}
        <div className="flex items-center justify-between p-3.5 h-[60px] shrink-0 text-slate-200">
          <button
            onClick={onToggleOpen}
            className="p-2 rounded-lg text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
          
          <button
            onClick={onCreateSession}
            className="p-2 rounded-lg text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
            title="New chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Search Session Bar */}
        <div className="px-3.5 mb-2.5 shrink-0" onClick={onOpenSearch}>
          <div className="relative flex items-center cursor-pointer">
            <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search chats & contents..."
              readOnly
              className="w-full bg-[#212121]/60 border border-transparent focus:border-neutral-800 rounded-lg py-1.5 pl-9 pr-8 text-xs text-[#ececf1] placeholder-neutral-500 cursor-pointer focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Explore GPTs & Prompt Library trigger row */}
        <div className="px-3.5 mb-3.5 shrink-0 grid grid-cols-2 gap-2 select-none">
          <button
            onClick={onOpenExploreGpts}
            className="group flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl bg-[#212121]/30 hover:bg-[#2d2f31]/60 border border-neutral-800/40 hover:border-[#a8c7fa]/30 transition-all duration-300 cursor-pointer shadow-sm text-center"
          >
            <div className="w-7 h-7 rounded-lg bg-[#a8c7fa]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4 text-[#a8c7fa]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-255 leading-none group-hover:text-white transition-colors">Explore GPTs</span>
              <span className="text-[8px] text-slate-500 mt-1 font-sans leading-none">Custom Agents</span>
            </div>
          </button>
          <button
            onClick={onOpenPromptLibrary}
            className="group flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl bg-[#212121]/30 hover:bg-[#2d2f31]/60 border border-neutral-800/40 hover:border-[#a8c7fa]/30 transition-all duration-300 cursor-pointer shadow-sm text-center"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-255 leading-none group-hover:text-white transition-colors">Prompt Lib</span>
              <span className="text-[8px] text-slate-500 mt-1 font-sans leading-none">Templates</span>
            </div>
          </button>
        </div>

        {/* Projects Section */}
        <div className="px-3.5 mb-3.5 shrink-0 pb-3">
          <div className="flex items-center justify-between text-neutral-400 mb-2 px-1 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 select-none">
              <FolderOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              Project Workspaces
            </span>
            {onCreateProject && (
              <button 
                onClick={onCreateProject}
                className="p-1 rounded-lg bg-[#212121]/30 hover:bg-[#a8c7fa]/10 text-slate-400 hover:text-[#a8c7fa] border border-neutral-800/40 hover:border-[#a8c7fa]/20 transition-all cursor-pointer"
                title="Create Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {projects.length === 0 ? (
              <div 
                onClick={onCreateProject}
                className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-dashed border-neutral-800/60 hover:border-[#a8c7fa]/30 bg-[#212121]/10 hover:bg-[#212121]/30 transition-all duration-300 cursor-pointer select-none text-center"
              >
                <FolderPlus className="w-5 h-5 text-neutral-600 group-hover:text-slate-400 transition-colors mb-1.5" />
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-350 transition-colors">Create Workspace</span>
                <span className="text-[8px] text-slate-600 group-hover:text-slate-500 transition-colors mt-0.5 max-w-[170px]">Organize and custom-instruct your chat sessions</span>
              </div>
            ) : (
              projects.map(project => {
                const isExpanded = !!expandedProjects[project.id];
                const projectSessions = filteredSessions.filter(s => s.projectId === project.id);
                
                return (
                  <div key={project.id} className="rounded-lg overflow-hidden bg-neutral-900/30 border border-neutral-800/20">
                    <div 
                      onClick={() => setExpandedProjects(prev => ({ ...prev, [project.id]: !isExpanded }))}
                      className="group flex items-center justify-between py-1.5 px-2 hover:bg-[#212121]/30 cursor-pointer select-none text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-neutral-300 font-semibold truncate flex-1 pr-2">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
                        {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-[#a8c7fa]" /> : <Folder className="w-3.5 h-3.5 text-[#a8c7fa]" />}
                        <span className="truncate" title={project.name}>{project.name}</span>
                        {projectSessions.length > 0 && (
                          <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1 rounded-full">{projectSessions.length}</span>
                        )}
                      </div>
                      
                      {/* Project actions (Edit, Delete) on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProject(project);
                            }}
                            className="p-0.5 rounded text-neutral-500 hover:text-white hover:bg-neutral-850 cursor-pointer"
                            title="Edit project"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${project.name}"? Chats inside will be moved back to general list.`)) {
                                onDeleteProject(project.id);
                              }
                            }}
                            className="p-0.5 rounded text-neutral-500 hover:text-rose-450 hover:bg-rose-950/20 cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Collapsible Nested Chats */}
                    {isExpanded && (
                      <div className="pl-2.5 pr-1 py-1 space-y-0.5 bg-neutral-950/20 border-t border-neutral-800/10">
                        {projectSessions.length === 0 ? (
                          <div className="text-[10px] text-neutral-600 italic px-2 py-1 select-none">
                            No chats in this project.
                          </div>
                        ) : (
                          projectSessions.map(session => renderSessionItem(session))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat List Grouped Chronologically */}
        <div className="flex-1 overflow-y-auto px-1 space-y-4 mb-2 scrollbar-thin">
          {filteredSessions.length === 0 ? (
            <div className="text-center text-xs text-neutral-500 py-8 px-4 font-sans leading-relaxed">
              {'No conversations yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned Chats Section */}
              {pinnedSessions.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 mt-1 select-none">
                    <Pin className="w-2.5 h-2.5 text-[#a8c7fa]" /> Pinned
                  </div>
                  {pinnedSessions.map(renderSessionItem)}
                </div>
              )}

              {/* Chronological Chat Sections */}
              {groupsOrder.map(groupName => {
                const groupSessions = groupedUnpinnedSessions[groupName];
                if (!groupSessions || groupSessions.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-0.5">
                    <div className="px-4 text-[10px] font-bold text-neutral-500 tracking-wider mb-1.5 mt-2 select-none">
                      {groupName}
                    </div>
                    {groupSessions.map(renderSessionItem)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer ChatGPT style User Settings row */}
        <div className="p-3.5 bg-[#171717] border-t border-neutral-800/40 shrink-0 space-y-2 sidebar-footer-row">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-3 w-full py-2 px-2.5 rounded-lg text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all text-sm cursor-pointer border border-transparent"
          >
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.name} 
                className="w-8 h-8 rounded-full object-cover shrink-0 select-none" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a8c7fa] to-purple-500 flex items-center justify-center text-[10px] font-bold text-[#131314] shadow-inner select-none shrink-0">
                {(userProfile?.name || 'AI').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold text-[#ececf1] truncate leading-normal">
                {userProfile?.name || 'AI User'}
              </div>
              <div className="text-[10px] text-neutral-500 truncate leading-none">Settings & Instructions</div>
            </div>
            <Settings className="w-4 h-4 text-neutral-500 shrink-0" />
          </button>
          
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center justify-center w-full py-1.5 px-2.5 rounded-lg border border-neutral-800/40 text-neutral-500 hover:text-rose-450 hover:bg-rose-950/15 transition-all text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
        </>
        ) : (
          /* ================= COLLAPSED MINI-VIEW ================= */
          <div className="flex flex-col h-full items-center justify-between py-4 select-none shrink-0 w-[68px] bg-[#171717] sidebar-narrow-strip">
            {/* Collapsed top bar items */}
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Gemma/Bot logo with expand panel action */}
              <button
                onClick={onToggleOpen}
                className="p-2 rounded-xl text-[#a8c7fa] bg-[#a8c7fa]/10 hover:bg-[#a8c7fa]/20 transition-all cursor-pointer hover:scale-105"
                title="Expand sidebar"
              >
                <Brain className="w-5.5 h-5.5" />
              </button>

              <div className="w-8 h-px bg-neutral-800/60 my-1" />

              {/* New Chat */}
              <button
                onClick={onCreateSession}
                className="p-2.5 rounded-xl text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
                title="New chat"
              >
                <SquarePen className="w-5 h-5" />
              </button>

              {/* Search */}
              {onOpenSearch && (
                <button
                  onClick={onOpenSearch}
                  className="p-2.5 rounded-xl text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
                  title="Search chats & contents"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Explore GPTs */}
              <button
                onClick={onOpenExploreGpts}
                className="p-2.5 rounded-xl text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
                title="Explore Custom GPTs"
              >
                <Compass className="w-5 h-5 text-[#a8c7fa]" />
              </button>

              {/* Prompt Library */}
              {onOpenPromptLibrary && (
                <button
                  onClick={onOpenPromptLibrary}
                  className="p-2.5 rounded-xl text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
                  title="Prompt Library Templates"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </button>
              )}
            </div>

            {/* Collapsed bottom profile bar */}
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Settings Trigger Icon */}
              <button
                onClick={onOpenSettings}
                className="p-2.5 rounded-xl text-neutral-500 hover:text-[#ececf1] hover:bg-[#212121] transition-all cursor-pointer"
                title="Settings & Instructions"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Avatar Circle */}
              <button
                onClick={onOpenSettings}
                className="cursor-pointer transition-transform hover:scale-105"
                title="User Profile Settings"
              >
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt={userProfile.name} 
                    className="w-8 h-8 rounded-full border border-neutral-700/60 object-cover shrink-0 select-none" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a8c7fa] to-purple-500 flex items-center justify-center text-[10px] font-bold text-[#131314] shadow-md select-none shrink-0 border border-neutral-700/40">
                    {(userProfile?.name || 'AI').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Move to Project Modal */}
      {isMoveToProjectOpen && activeMoveSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsMoveToProjectOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#1e1f20] border border-[#303134] rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#303134] pb-3 text-slate-100">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <FolderInput className="w-4 h-4 text-[#a8c7fa]" /> Move Chat to Project
              </span>
              <button 
                onClick={() => setIsMoveToProjectOpen(false)} 
                className="p-1 rounded-full hover:bg-neutral-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-2 py-1 max-h-60 overflow-y-auto scrollbar-thin">
              {/* Unassigned / Clear project */}
              <button
                onClick={() => {
                  if (onMoveSessionToProject) {
                    onMoveSessionToProject(activeMoveSessionId, undefined);
                  }
                  setIsMoveToProjectOpen(false);
                }}
                className="w-full text-left text-xs p-2.5 rounded-xl border border-[#303134] hover:bg-neutral-850 hover:border-neutral-750 text-neutral-300 transition-all font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5 text-neutral-500" />
                Unassigned (Move out of project)
              </button>
              
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    if (onMoveSessionToProject) {
                      onMoveSessionToProject(activeMoveSessionId, project.id);
                    }
                    setIsMoveToProjectOpen(false);
                  }}
                  className="w-full text-left text-xs p-2.5 rounded-xl border border-transparent bg-neutral-900/60 hover:bg-neutral-800 text-slate-200 transition-all font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5 text-[#a8c7fa]" />
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
