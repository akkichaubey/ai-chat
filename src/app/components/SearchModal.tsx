'use client';

import React, { useState } from 'react';
import { X, Search, Folder, MessageSquare, Calendar, Filter } from 'lucide-react';

import { useChatStore } from '../store/useChatStore';
import { useProjectStore } from '../store/useProjectStore';

export default function SearchModal() {
  const { isSearchOpen: isOpen, setSearchOpen, projects } = useProjectStore();
  const { sessions, messagesMap, setActiveSessionId: onSelectSession } = useChatStore();

  const onClose = () => setSearchOpen(false);
  const [query, setQuery] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [filterPersona, setFilterPersona] = useState<string>('all');
  const [mountedNow, setMountedNow] = useState(0);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setMountedNow(Date.now());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter sessions first based on project, date, and query
  const searchResults = sessions.filter(session => {
    // 1. Filter by Project
    if (filterProjectId !== 'all' && session.projectId !== filterProjectId) {
      return false;
    }

    // 2. Filter by Persona
    if (filterPersona !== 'all' && (session.persona || 'general') !== filterPersona) {
      return false;
    }

    // 3. Filter by Date Range
    const sessionTime = parseInt(session.id, 10);
    if (!isNaN(sessionTime) && filterDateRange !== 'all') {
      const diff = (mountedNow || sessionTime) - sessionTime;
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (filterDateRange === 'today' && diff > oneDay) return false;
      if (filterDateRange === '7days' && diff > 7 * oneDay) return false;
      if (filterDateRange === '30days' && diff > 30 * oneDay) return false;
    }

    // 4. Filter by Query
    if (query.trim()) {
      const matchTitle = session.title.toLowerCase().includes(query.toLowerCase());
      
      // Match in messages contents
      const sessionMsgs = messagesMap[session.id] || [];
      const matchMessage = sessionMsgs.some(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      
      return matchTitle || matchMessage;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl shadow-black/60 space-y-4 flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 text-primary">
            <Search className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">Global Workspace Search</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative shrink-0">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Type keywords to search chats and messages contents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Filter Toolbar Controls */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0 bg-slate-950/50 p-3 rounded-2xl border border-slate-700/30">
          {/* Project selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1">
              <Folder className="w-2.5 h-2.5" /> Project Group
            </span>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-2.5 text-[10px] text-slate-300 focus:outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date range selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> Date Created
            </span>
            <select
              value={filterDateRange}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterDateRange(e.target.value as 'all' | 'today' | '7days' | '30days')}
              className="bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-2.5 text-[10px] text-slate-300 focus:outline-none"
            >
              <option value="all">Anytime</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Persona selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1">
              <Filter className="w-2.5 h-2.5" /> Persona type
            </span>
            <select
              value={filterPersona}
              onChange={(e) => setFilterPersona(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl py-1.5 px-2.5 text-[10px] text-slate-300 focus:outline-none"
            >
              <option value="all">All Personas</option>
              <option value="general">General</option>
              <option value="code">Developer</option>
              <option value="writer">Writer</option>
            </select>
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic font-sans">
              No matching conversation threads found. Try expanding filters.
            </div>
          ) : (
            searchResults.map(session => {
              const sessionMsgs = messagesMap[session.id] || [];
              const project = projects.find(p => p.id === session.projectId);
              
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className="p-3 bg-slate-950/30 hover:bg-slate-900/60 border border-slate-700/30 hover:border-neutral-700/80 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-primary transition-colors" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                        {session.title}
                      </div>
                      <div className="text-[9px] text-slate-500 flex items-center gap-2 mt-0.5 select-none font-sans">
                        <span>{sessionMsgs.length} messages</span>
                        {project && (
                          <span className="flex items-center gap-0.5 text-primary font-bold">
                            <Folder className="w-2.5 h-2.5" /> {project.name}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(parseInt(session.id, 10) || mountedNow).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-[9px] px-2 py-0.5 bg-neutral-800 text-slate-400 rounded-md font-sans shrink-0 uppercase tracking-widest font-bold">
                    {session.persona || 'general'}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
