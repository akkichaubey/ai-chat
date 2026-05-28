'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Info, Save } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: number;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null; // Null means creating a new one
  onSave: (name: string, description: string, instructions: string) => void;
}

export default function ProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
}: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  // Reset fields when modal opens or active project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setInstructions(project.instructions || '');
    } else {
      setName('');
      setDescription('');
      setInstructions('');
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), instructions.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-[#303134] rounded-3xl p-6 shadow-2xl shadow-black/60 space-y-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#303134] pb-4">
          <div className="flex items-center gap-2.5 text-[#a8c7fa]">
            <FolderPlus className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              {project ? 'Edit Project Workspace' : 'Create Project Workspace'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2d2f31] text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. My SaaS Startup, Marketing Q3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-all font-sans"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Brief description of this project's purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-all font-sans"
            />
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                Project System Instructions (Prompt Injection)
              </label>
              <div className="group relative flex items-center cursor-help">
                <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
                <div className="absolute right-0 bottom-6 z-50 hidden group-hover:block w-64 bg-[#2d2f31] border border-[#3c4043] rounded-xl p-3 shadow-xl text-[10px] text-slate-300 font-normal leading-relaxed">
                  These instructions are automatically appended to all chats inside this project. Define rules, preferences, tech stacks, or business facts so the AI never forgets them.
                </div>
              </div>
            </div>
            <textarea
              placeholder="e.g. Always write responses in Spanish. Our tech stack is React + Vite + Next.js. Avoid suggesting Tailwind CSS."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-all font-sans resize-none scrollbar-thin"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#303134]">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-2xl border border-[#303134] hover:bg-[#2d2f31] hover:border-[#3c4043] text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="py-2.5 px-5 rounded-2xl bg-[#a8c7fa] text-[#131314] font-semibold text-xs hover:bg-[#c2e7ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5 hover:scale-[1.01]"
            >
              <Save className="w-3.5 h-3.5" />
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
