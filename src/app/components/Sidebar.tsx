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
  Code,
  Compass,
  PanelLeftClose,
  SquarePen,
  MoreHorizontal
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  pinned?: boolean;
  persona?: string;
  customSystemPrompt?: string;
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
  onOpenExploreGpts
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

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

  // Filter sessions by search query
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group into pinned and unpinned
  const pinnedSessions = filteredSessions.filter(s => s.pinned);
  const unpinnedSessions = filteredSessions.filter(s => !s.pinned);

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
                  className="absolute right-0 top-7 z-50 bg-[#212121] border border-neutral-850 rounded-lg shadow-xl py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session.id);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs text-[#ececf1] hover:bg-neutral-800 transition-colors"
                  >
                    <Pin className={`w-3.5 h-3.5 ${session.pinned ? 'fill-current text-[#a8c7fa]' : ''}`} />
                    {session.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(e, session.id, session.title);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs text-[#ececf1] hover:bg-neutral-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                      setActiveDropdownId(null);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs text-rose-450 hover:bg-rose-950/20 transition-colors border-t border-neutral-850/40 mt-1"
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
        className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col h-full bg-[#171717] border-r border-neutral-800/40 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:-translate-x-full md:w-0 border-r-0 overflow-hidden'
        }`}
      >
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
        <div className="px-3.5 mb-2.5 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#212121]/60 border border-transparent focus:border-neutral-800 rounded-lg py-1.5 pl-9 pr-8 text-xs text-[#ececf1] placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-800 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Explore GPTs trigger row */}
        <div className="px-3.5 mb-2 shrink-0">
          <button
            onClick={onOpenExploreGpts}
            className="flex items-center gap-2.5 w-full py-2 px-2.5 rounded-lg text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121]/50 border border-transparent transition-all text-xs font-semibold cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#a8c7fa]" />
            Explore GPTs
          </button>
        </div>

        {/* Chat List Grouped Chronologically */}
        <div className="flex-1 overflow-y-auto px-1 space-y-4 mb-2 scrollbar-thin">
          {filteredSessions.length === 0 ? (
            <div className="text-center text-xs text-neutral-500 py-8 px-4 font-sans leading-relaxed">
              {searchQuery ? 'No matching chats found.' : 'No conversations yet.'}
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
        <div className="p-3.5 bg-[#171717] border-t border-neutral-800/40 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-3 w-full py-2 px-2.5 rounded-lg text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#212121] transition-all text-sm cursor-pointer border border-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a8c7fa] to-purple-500 flex items-center justify-center text-[10px] font-bold text-[#131314] shadow-inner select-none shrink-0">
              AU
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold text-[#ececf1] truncate leading-normal">AI User</div>
              <div className="text-[10px] text-neutral-500 truncate leading-none">Settings & Instructions</div>
            </div>
            <Settings className="w-4 h-4 text-neutral-500 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
