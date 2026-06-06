'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sandpack } from '@codesandbox/sandpack-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import ImageLightbox, { LightboxImage } from './ImageLightbox';
import { 
  Send, 
  Square,
  Bot, 
  User, 
  Sparkles, 
  HelpCircle, 
  Settings,
  ArrowDown,
  Mic,
  MicOff,
  Paperclip,
  Globe,
  Brain,
  RefreshCw,
  Download,
  Check,
  X,
  FileText,
  Play,
  Edit2,
  Headphones,
  Code,
  ChevronUp,
  ChevronDown,
  PanelLeft,
  Feather,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Camera,
  Languages,
  Plus,
  Eye,
  FileDown,
  Printer,
  Copy,
  Trash,
  Key,
  AlertTriangle,
  AlertCircle,
  Volume2,
  VolumeX,
  Star,
  MessageSquare,
  Image,
  Video,
  Zap,
  Box,
  WifiOff,
  FolderOpen,
  Terminal,
  Pin
} from 'lucide-react';
import { useLocalProjectStore } from '../store/useLocalProjectStore';
import { useGitHubRepoStore } from '../store/useGitHubRepoStore';
import CodebaseExplorer from './CodebaseExplorer';
import GitHubRepoPanel from './GitHubRepoPanel';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data string
  previewUrl?: string;
  textContent?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

// Zustand Store imports
import { useChatStore } from '../store/useChatStore';
import { useProjectStore } from '../store/useProjectStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelMonitorStore } from '../store/useModelMonitorStore';
import { useUsageStore, getTodayKey } from '../store/useUsageStore';

const STARTER_PROMPTS = [
  {
    title: 'Featured',
    desc: 'Test out our most advanced and newest models.',
    prompt: 'Tell me about the most advanced Gemini 2.5 models and what capabilities they bring to developer workspaces.',
    icon: Star,
    color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30'
  },
  {
    title: 'Code and Chat',
    desc: 'Build chatbots, agents, and code with Gemini 2.5.',
    prompt: 'Write a Python script that integrates the Google Gen AI SDK to build a conversational assistant with system instructions.',
    icon: MessageSquare,
    color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30'
  },
  {
    title: 'Image Generation',
    desc: 'Create and edit images with Imagen 3.',
    prompt: 'Help me write an optimized text prompt for Imagen 3 to generate a highly professional, minimalist developer workspace illustration in dark mode.',
    icon: Image,
    color: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-900/30'
  },
  {
    title: 'Video Generation',
    desc: 'Generate videos with Veo models.',
    prompt: 'Provide a structured guide on how to programmatically use Veo models for text-to-video generation tasks.',
    icon: Video,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30'
  },
  {
    title: 'Speech and Music',
    desc: 'Explore our text to speech and music generation.',
    prompt: 'Give me an overview of the Audio and Speech-to-Text capabilities of the latest multimodal Google models.',
    icon: Mic,
    color: 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-450 dark:bg-rose-950/20 dark:border-rose-900/30'
  },
  {
    title: 'Real-time',
    desc: 'Real-time voice and video with Live API.',
    prompt: 'Explain how to establish a bidirectional WebSockets connection to Google Multimodal Live API for real-time speech.',
    icon: Zap,
    color: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-450 dark:bg-orange-950/20 dark:border-orange-900/30'
  }
];


const parseMultiFileCode = (code: string): Record<string, string> | null => {
  const fileMarkerRegex = /(?:---\s*\n\s*File:\s*([^\n\r]+?)\s*\n\s*---|---\s*File:\s*([^\n\r-]+?)\s*---)/g;
  const files: Record<string, string> = {};
  
  let match;
  const indices: { filename: string; index: number; matchLength: number }[] = [];
  
  fileMarkerRegex.lastIndex = 0;
  while ((match = fileMarkerRegex.exec(code)) !== null) {
    const filename = (match[1] || match[2]).trim();
    indices.push({
      filename,
      index: match.index + match[0].length,
      matchLength: match[0].length
    });
  }
  
  if (indices.length === 0) {
    return null;
  }
  
  for (let i = 0; i < indices.length; i++) {
    const current = indices[i];
    const next = indices[i + 1];
    const rawContent = next 
      ? code.substring(current.index, next.index - current.matchLength)
      : code.substring(current.index);
      
    let cleanFilename = current.filename.replace(/^\.\//, '').trim();
    if (!cleanFilename.startsWith('/')) {
      cleanFilename = '/' + cleanFilename;
    }
    files[cleanFilename] = rawContent.trim();
  }
  
  return files;
};

const extractFilename = (code: string, language?: string): string | null => {
  const lines = code.split('\n');
  if (lines.length === 0) return null;
  const firstLine = lines[0].trim();
  
  // Match comments like:
  // // filename.ext
  // /* filename.ext */
  // # filename.ext
  // <!-- filename.ext -->
  // file: filename.ext
  const match = firstLine.match(/^(?:\/\/\/|\/\/|#|<!--|\/\*)\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\s*(?:-->|\*\/)?$/) ||
                firstLine.match(/^(?:\/\/\/|\/\/|#|<!--|\/\*)\s*[Ff]ile:\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\s*(?:-->|\*\/)?$/) ||
                firstLine.match(/^[Ff]ile:\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)$/);
  
  if (match && match[1]) {
    return match[1].replace(/^\.\//, '').trim();
  }
  return null;
};

const ArtifactContext = React.createContext<{
  onRunCode: (files: Record<string, string>, title: string, rawCode: string, language: string, isRunnable: boolean) => void;
} | null>(null);

const CodeBlockRenderer = ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
  const context = React.useContext(ArtifactContext);
  const match = /language-(\w+)/.exec(className || '');
  const isCodeBlock = match || String(children).includes('\n');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const copyToClipboard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = match ? match[1].toLowerCase() : '';
  const codeStr = String(children);
  const parsedFiles = parseMultiFileCode(codeStr);
  const filename = extractFilename(codeStr, language);
  const lineCount = codeStr.split('\n').length;
  
  const isArtifact = isCodeBlock && (lineCount > 12 || filename !== null);
  const isRunnable = ['javascript', 'js', 'html', 'css', 'typescript', 'ts', 'jsx', 'tsx'].includes(language) || parsedFiles !== null;

  const handleDownloadCode = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    let dlFilename = filename;
    if (!dlFilename || dlFilename === 'Artifact' || dlFilename === 'multi-file project' || dlFilename === 'Untitled Code') {
      const ext = language === 'javascript' ? 'js' :
                  language === 'typescript' ? 'ts' :
                  language === 'html' ? 'html' :
                  language === 'css' ? 'css' :
                  language === 'python' ? 'py' : 'txt';
      dlFilename = `code_artifact.${ext}`;
    }

    const blob = new Blob([codeStr], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', dlFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunCode = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    let files: Record<string, string> = {};
    if (parsedFiles) {
      files = parsedFiles;
    } else {
      if (language === 'html') {
        files = { '/index.html': codeStr };
      } else if (language === 'css') {
        files = {
          '/styles.css': codeStr,
          '/index.html': `<link rel="stylesheet" href="./styles.css">\n<div class="p-4">CSS Preview</div>`
        };
      } else if (language === 'tsx' || language === 'jsx') {
        files = { '/App.tsx': codeStr };
      } else {
        files = { '/index.js': codeStr };
      }
    }

    if (context) {
      context.onRunCode(files, filename || (parsedFiles ? 'multi-file project' : `${language || 'code'} file`), codeStr, language, isRunnable);
    }
  };

  if (!isCodeBlock) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/30 text-indigo-300 font-mono text-[11px]" {...props}>
        {children}
      </code>
    );
  }

  if (isArtifact) {
    const displayTitle = filename || (parsedFiles ? 'multi-file project' : 'Untitled Code');
    const linesText = `${lineCount} line${lineCount === 1 ? '' : 's'}`;
    const langText = language ? `${language.toUpperCase()} • ` : '';
    
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-md">
        {/* Artifact Card Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-slate-950/40 border-b border-slate-800/80 hover:bg-slate-950/60 transition-colors cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-800 text-primary border border-slate-700/50 shrink-0">
              <Code className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate font-mono">
                {displayTitle}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {langText}{linesText}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download Action */}
            <button
              type="button"
              onClick={handleDownloadCode}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
              title="Download code file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Copy Action */}
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* View / Open Artifact in Sidebar */}
            <button
              type="button"
              onClick={handleRunCode}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 shrink-0"
              title="Open in Side Panel"
            >
              <Eye className="w-3 h-3" />
              <span>Open Artifact</span>
            </button>
            
            {/* Toggle Inline Visibility Chevron */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
              title={expanded ? "Collapse code inline" : "Expand code inline"}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Inline Expanded Code View */}
        {expanded && (
          <div className="relative border-t border-slate-800/50">
            <div className="p-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-350 bg-slate-950 scrollbar-thin max-h-96">
              <SyntaxHighlighter
                language={language || 'text'}
                useInlineStyles={false}
                className="prism-theme-override bg-transparent! p-0!"
              >
                {codeStr.replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-lg shadow-black/35">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
        <span className="uppercase tracking-wider font-semibold">{parsedFiles ? 'multi-file component' : (match ? match[1] : 'code')}</span>
        <div className="flex items-center gap-2">
          {isRunnable && (
            <button
              type="button"
              onClick={handleRunCode}
              className="px-2 py-0.5 rounded transition-all font-medium flex items-center gap-1 hover:text-slate-200 hover:bg-slate-800/60"
            >
              <Play className="w-2.5 h-2.5" />
              Run Code
            </button>
          )}
          <button
            type="button"
            onClick={copyToClipboard}
            className={`px-2 py-0.5 rounded transition-all font-medium ${
              copied 
                ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30' 
                : 'hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300 scrollbar-thin">
        <SyntaxHighlighter
          language={language || 'text'}
          useInlineStyles={false}
          className="prism-theme-override bg-transparent! p-0!"
        >
          {codeStr.replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const markdownComponents = {
  code: CodeBlockRenderer
};

export interface ModelItem {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter';
  description?: string;
}

export const AVAILABLE_MODELS: ModelItem[] = [
  // Gemini Models
  { id: 'gemma-4-31b-it', name: 'Gemma 4 (31B IT)', provider: 'gemini', description: "Google's lightweight open model family, 31B parameter instruction-tuned" },
  { id: 'gemma-2-27b-it', name: 'Gemma 2 (27B IT)', provider: 'gemini', description: "Google's high-efficiency open model, 27B parameter instruction-tuned" },
  { id: 'gemma-2-9b-it', name: 'Gemma 2 (9B IT)', provider: 'gemini', description: "Google's efficient smaller model, 9B parameter instruction-tuned" },
  { id: 'gemma-2-2b-it', name: 'Gemma 2 (2B IT)', provider: 'gemini', description: "Google's ultra-lightweight open model, 2B parameter instruction-tuned" },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', description: 'Next-generation speed and quality for general multimodal tasks' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', description: "Google's most capable multimodal model for complex reasoning" },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Fast, lightweight multimodal model optimized for real-time tasks' },
  { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', provider: 'gemini', description: 'Advanced experimental model with explicit reasoning traces' },
  { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro', provider: 'gemini', description: 'High-performing experimental model with strong reasoning' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', description: "Google's standard high-speed multimodal model" },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', description: "Google's capability leader for general long-context reasoning" },

  // OpenAI Models
  { id: 'gpt-5.5', name: 'GPT-5.5', provider: 'openai', description: 'A new class of intelligence for professional work' },
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'openai', description: 'Intelligence at scale for agents & professional work' },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4-mini', provider: 'openai', description: 'Faster, cost-efficient version of GPT-5.4' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Omni model with high intelligence and high speed' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Cost-efficient, fast omni model for general tasks' },
  { id: 'o1-mini', name: 'o1-mini', provider: 'openai', description: 'Reasoning model optimized for coding and STEM fields' },
  { id: 'o1-preview', name: 'o1-preview', provider: 'openai', description: "Early preview of OpenAI's advanced reasoning model" },
  { id: 'o3-mini', name: 'o3-mini', provider: 'openai', description: 'Next-generation cost-efficient reasoning model' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'High-intelligence model with deep domain knowledge' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Classic high-intelligence legacy GPT-4 model' },
  { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', provider: 'openai', description: "Preview of OpenAI's advanced GPT-4.5 model" },

  // Claude Models (Anthropic)
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: "Anthropic's state-of-the-art model for coding and reasoning" },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'anthropic', description: "Anthropic's fastest and most cost-effective model" },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: "Anthropic's powerful classic reasoning model" },

  // Groq Models
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'groq', description: "Meta's highly capable 70B parameter model on Groq hardware" },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', provider: 'groq', description: "Meta's fast 8B parameter model on Groq hardware" },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq)', provider: 'groq', description: 'High-speed Mixture of Experts (MoE) model on Groq' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B (Groq)', provider: 'groq', description: 'DeepSeek R1 distilled on Llama 70B via Groq' },

  // OpenRouter Models
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (Router)', provider: 'openrouter', description: 'Llama 3.3 70B instruction-tuned model via OpenRouter' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Router)', provider: 'openrouter', description: 'DeepSeek R1 full reasoning model via OpenRouter' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (Router)', provider: 'openrouter', description: 'Gemini 2.5 Pro via OpenRouter' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Router)', provider: 'openrouter', description: 'Claude 3.5 Sonnet via OpenRouter' }
];

export default function ChatArea() {
  const {
    activeSessionId,
    sessions,
    messagesMap,
    isLoading,
    thinkingEnabled,
    webSearchEnabled,
    setThinkingEnabled,
    setWebSearchEnabled,
    sendMessage: onSendMessage,
    editMessage: onEditMessage,
    regenerateMessage: onRegenerateMessage,
    deleteMessage: onDeleteMessage,
    setVoiceModeOpen,
    stopGeneration: onStopGeneration,
    updateSessionField
  } = useChatStore();

  const {
    isSidebarOpen,
    setSidebarOpen,
    setPromptLibraryOpen,
    injectedPrompt,
    setInjectedPrompt
  } = useProjectStore();

  const { settings, toggleSettings, setSettings } = useSettingsStore();

  const {
    healthMap,
    isVerifying,
    checkAllForProvider
  } = useModelMonitorStore();

  const { stats } = useUsageStore();

  const {
    activeDirectoryHandle,
    directoryPermissionStatus,
    attachedFiles,
    chatWithCodebase,
    loadSavedDirectory,
    requestDirectoryPermission,
    toggleFileAttachment,
    clearAttachments,
    setChatWithCodebase
  } = useLocalProjectStore();

  const [showExplorer, setShowExplorer] = useState(false);
  const [showGitHubPanel, setShowGitHubPanel] = useState(false);

  const { isIndexed: ghIsIndexed, owner: ghOwner, repo: ghRepo } = useGitHubRepoStore();

  // Derived Values
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSessionId ? (messagesMap[activeSessionId] || []) : [];
  const activeSessionTitle = activeSession?.title || 'Chat';
  const selectedModel = settings.model;
  const provider = settings.provider || 'gemini';
  const apiKey = settings.apiKeys?.[provider] || settings.apiKey || '';

  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  const activeModelName = activeModel ? activeModel.name : selectedModel;

  const gptName = activeSession?.gptName;
  const gptAvatarEmoji = activeSession?.gptAvatarEmoji;
  const gptAvatarBg = activeSession?.gptAvatarBg;
  const gptDescription = activeSession?.gptDescription;
  const gptStarterPrompts = activeSession?.gptStarterPrompts;

  const activeStyle = activeSession?.activeStyle || 'normal';
  const activeSkill = activeSession?.activeSkill || 'default';

  // Handlers
  const onOpenSettings = () => toggleSettings(true);
  const onOpenVoiceMode = () => setVoiceModeOpen(true);
  const onOpenPromptLibrary = () => setPromptLibraryOpen(true);
  const onToggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const clearInjectedPrompt = () => setInjectedPrompt('');

  const onModelChange = (model: string) => {
    const matched = AVAILABLE_MODELS.find(m => m.id === model);
    setSettings({ model, provider: matched?.provider || 'gemini' });
  };

  const onStyleChange = (styleId: string) => {
    if (activeSessionId) {
      updateSessionField(activeSessionId, 'activeStyle', styleId);
    }
  };

  const onSkillChange = (skillId: string) => {
    if (activeSessionId) {
      updateSessionField(activeSessionId, 'activeSkill', skillId);
    }
  };
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'styles' | 'skills'>('main');
  const [isListening, setIsListening] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadedPreviewImages, setUploadedPreviewImages] = useState<LightboxImage[]>([]);

  // Gather all image attachments in the entire conversation in order
  const conversationImages = React.useMemo(() => {
    const collected: LightboxImage[] = [];
    messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          if (att.type.startsWith('image/')) {
            collected.push({
              messageId: msg.id,
              name: att.name,
              type: att.type,
              data: att.data
            });
          }
        });
      }
    });
    return collected;
  }, [messages]);

  const handleInputImageClick = (clickedAtt: Attachment) => {
    const uploadedImages = attachments
      .filter(att => att.type.startsWith('image/'))
      .map(att => ({
        messageId: 'input-preview',
        name: att.name,
        type: att.type,
        data: att.data
      }));

    const index = uploadedImages.findIndex(img => img.name === clickedAtt.name);
    if (index !== -1) {
      setLightboxIndex(index);
      setUploadedPreviewImages(uploadedImages);
    }
  };
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string> | null>(null);
  const [sandboxTitle, setSandboxTitle] = useState('Artifact');
  const [sandboxActiveTab, setSandboxActiveTab] = useState<'code' | 'preview'>('code');
  const [sandboxRawCode, setSandboxRawCode] = useState('');
  const [sandboxLanguage, setSandboxLanguage] = useState('');
  const [sandboxRunnable, setSandboxRunnable] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Stop any active text-to-speech when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleDownloadSandboxCode = () => {
    if (!sandboxRawCode) return;
    
    let filename = sandboxTitle;
    if (!filename || filename === 'Artifact' || filename === 'multi-file project' || filename === 'Untitled Code') {
      const ext = sandboxLanguage === 'javascript' ? 'js' :
                  sandboxLanguage === 'typescript' ? 'ts' :
                  sandboxLanguage === 'html' ? 'html' :
                  sandboxLanguage === 'css' ? 'css' :
                  sandboxLanguage === 'python' ? 'py' : 'txt';
      filename = `code_artifact.${ext}`;
    }

    const blob = new Blob([sandboxRawCode], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Stop previous narration
    window.speechSynthesis.cancel();

    // Clean up Markdown and partition markers from the text for fluid speech
    const cleanText = text
      .replace(/\[ERROR\]/g, 'Error.')
      .replace(/---\s*File:\s*[^\s\-]+\s*---/g, '') // remove sandbox file headers
      .replace(/[\#\*\_`~>\-]/g, ' ') // remove markdown symbols
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // link text fallback
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Auto-detect Hindi characters for native pronunciation
    const hasHindi = /[\u0900-\u097F]/.test(cleanText);
    const voices = window.speechSynthesis.getVoices();
    if (hasHindi) {
      const hiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Inject prompt library template when selected
  useEffect(() => {
    if (injectedPrompt) {
      const timer = setTimeout(() => {
        setInput(prev => prev ? prev + '\n' + injectedPrompt : injectedPrompt);
        if (clearInjectedPrompt) {
          clearInjectedPrompt();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [injectedPrompt, clearInjectedPrompt]);

  const [serverProviders, setServerProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/providers')
      .then(res => res.json())
      .then(data => setServerProviders(data))
      .catch(err => console.warn('Failed to load server fallback providers:', err));
  }, []);

  // Automatically detect health status for all models of the active provider in the background
  useEffect(() => {
    if (provider && apiKey) {
      checkAllForProvider(provider, apiKey);
    }
  }, [provider, apiKey, checkAllForProvider]);

  // Load saved codebase folder when active session or active project changes
  useEffect(() => {
    if (activeSession?.projectId) {
      loadSavedDirectory(activeSession.projectId);
    } else {
      useLocalProjectStore.setState({ 
        activeDirectoryHandle: null, 
        directoryPermissionStatus: 'prompt',
        indexedFiles: [],
        fileTree: [],
        projectSummary: null,
        attachedFiles: []
      });
    }
  }, [activeSession?.projectId, loadSavedDirectory]);

  const displayedModels = AVAILABLE_MODELS.filter(m => {
    // 1. Check if the server-side env key is configured
    if (serverProviders[m.provider]) return true;
    // 2. Check if the client-side active key is configured for this provider
    if (provider === m.provider && apiKey) return true;
    return false;
  });

  // Fallback to showing Gemini models if no keys are configured
  const finalModels = displayedModels.length > 0
    ? displayedModels
    : AVAILABLE_MODELS.filter(m => m.provider === 'gemini');

  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  const friendlyModelName = webSearchEnabled 
    ? 'Gemini 2.5 Flash Grounded' 
    : activeModelObj 
      ? activeModelObj.name 
      : selectedModel;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto'; // reset height first
    const newHeight = Math.min(180, textarea.scrollHeight); // expand up to 180px maximum height
    textarea.style.height = `${newHeight}px`;
  };

  const refocusInput = () => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Adjust height automatically when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Auto-focus textarea on mount or when chat session changes
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeSessionTitle]);

  const scrollToBottom = (smooth = false) => {
    isNearBottomRef.current = true;
    if (!chatContainerRef.current) return;
    
    if (smooth) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const prevLength = prevMessagesLengthRef.current;
    const currentLength = messages.length;
    prevMessagesLengthRef.current = currentLength;

    // Force scroll to bottom if a new message is added
    if (currentLength > prevLength) {
      isNearBottomRef.current = true;
      scrollToBottom(true);
    } else if (isNearBottomRef.current) {
      // Stream update: scroll instantly to prevent smooth scroll animation queues
      scrollToBottom(false);
    }
  }, [messages, isLoading]);

  // Prevent browser navigation when files are dropped outside the chat zone
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  // Escape key to stop generation
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoading && onStopGeneration) {
        onStopGeneration();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLoading, onStopGeneration]);

  // Close dropdowns on any scroll in the window (capturing phase)
  useEffect(() => {
    const handleGlobalScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // If scroll happens inside the model selector or plus menu container, do not close them!
      if (target && (target.closest('.model-dropdown-container') || target.closest('.plus-menu-container'))) {
        return;
      }
      setShowModelDropdown(false);
      setShowPlusMenu(false);
    };

    window.addEventListener('scroll', handleGlobalScroll, true);
    return () => {
      window.removeEventListener('scroll', handleGlobalScroll, true);
    };
  }, []);

  // Speech Recognition Hook initialization
  useEffect(() => {
    const SpeechRecognition = ((window as unknown) as Record<string, new () => SpeechRecognitionInstance>).SpeechRecognition || ((window as unknown) as Record<string, new () => SpeechRecognitionInstance>).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      
      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Handle scroll tracking
  const handleScroll = () => {
    // Close active input toolbar dropdowns on scroll
    if (showModelDropdown) {
      setShowModelDropdown(false);
    }
    if (showPlusMenu) {
      setShowPlusMenu(false);
    }

    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    
    // Check if the user is near the bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isNearBottomRef.current = isNearBottom;

    // Show floating scroll to bottom button if user scrolled up more than 300px
    const isUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBtn(isUp);
  };

  const handleTakeScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            
            setAttachments(prev => [...prev, {
              name: `screenshot_${Date.now()}.png`,
              type: 'image/png',
              data: base64,
              previewUrl: dataUrl
            }]);
          }
          
          stream.getTracks().forEach(track => track.stop());
        }, 300);
      };
    } catch (err) {
      console.warn("Screenshot capture canceled or failed", err);
    }
  };

  const triggerQuickAction = (actionPrompt: string) => {
    if (isLoading) return;
    onSendMessage(actionPrompt, attachments);
    setAttachments([]);
    if (isListening) {
      recognitionRef.current?.stop();
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (isListening) {
      recognitionRef.current?.stop();
    }
    
    // Refocus textarea so typing cursor remains active
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to process uploaded or pasted files
  const processFiles = (files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 15MB.`);
        continue;
      }

      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          setAttachments(prev => [...prev, {
            name: file.name || `pasted_image_${Date.now()}.png`,
            type: file.type,
            data: base64,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
          }]);
        };
      } else {
        // Plain text documents
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          setAttachments(prev => [...prev, {
            name: file.name,
            type: file.type || 'text/plain',
            data: '',
            textContent: reader.result as string
          }]);
        };
      }
    }
  };

  // File uploading handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clipboard paste handler for screenshots and documents
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData.files;
    if (!files || files.length === 0) return;

    let hasFiles = false;
    const filesArray: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        hasFiles = true;
        filesArray.push(file);
      }
    }

    if (hasFiles) {
      e.preventDefault();
      processFiles(filesArray);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the root container (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Export chat to Markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    let mdContent = `# Chat Session: ${activeSessionTitle}\n\n`;
    messages.forEach(msg => {
      const roleName = msg.role === 'user' ? 'User' : 'Assistant';
      mdContent += `## ${roleName}\n\n${msg.content}\n\n`;
      if (msg.attachments && msg.attachments.length > 0) {
        mdContent += `*Attachments:*\n`;
        msg.attachments.forEach(att => {
          mdContent += `- ${att.name} (${att.type})\n`;
        });
        mdContent += `\n`;
      }
      mdContent += `---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const sanitizedTitle = activeSessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `chat_${sanitizedTitle}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export chat to Plain Text
  const handleExportTxt = () => {
    if (messages.length === 0) return;
    
    let txtContent = `Chat Session: ${activeSessionTitle}\n========================================\n\n`;
    messages.forEach(msg => {
      const roleName = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      txtContent += `[${roleName}]\n${msg.content}\n\n----------------------------------------\n\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const sanitizedTitle = activeSessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `chat_${sanitizedTitle}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable PDF Layout Generation — renders markdown via marked.js CDN
  const handlePrintChat = () => {
    if (messages.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const msgRows = messages.map(m => (
      `<div class="msg ${m.role}">`
      + `<div class="role">${m.role === 'user' ? '&#128100; You' : '&#129302; Assistant'}</div>`
      + `<div class="content" data-role="${m.role}" data-raw="${escapeHtml(m.content)}"></div>`
      + `</div>`
    )).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Chat: ${activeSessionTitle}</title>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:36px 44px;color:#1f2937;line-height:1.7;font-size:14px;max-width:840px;margin:0 auto}
        h1{border-bottom:2px solid #e5e7eb;padding-bottom:14px;margin-bottom:28px;font-size:20px;font-weight:700;color:#111827}
        .msg{margin-bottom:22px;padding:16px 18px;border-radius:10px;border:1px solid #e5e7eb;page-break-inside:avoid}
        .msg.user{background:#eff6ff;border-color:#bfdbfe}
        .msg.assistant{background:#f9fafb}
        .role{font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:8px}
        .msg.user .role{color:#3b82f6}
        .content{font-size:13.5px;color:#1f2937}
        .content p{margin-bottom:.7em}
        .content h1,.content h2,.content h3{margin:1em 0 .5em;font-weight:700}
        .content h1{font-size:1.35em}.content h2{font-size:1.2em}.content h3{font-size:1.05em}
        .content ul,.content ol{padding-left:1.5em;margin-bottom:.7em}
        .content li{margin-bottom:.2em}
        .content code{background:#f1f5f9;color:#dc2626;padding:2px 5px;border-radius:4px;font-size:12px;font-family:monospace}
        .content pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;margin:.7em 0;font-size:12px;overflow-x:auto}
        .content pre code{background:transparent;color:inherit;padding:0}
        .content table{width:100%;border-collapse:collapse;margin:.7em 0;font-size:13px}
        .content th,.content td{border:1px solid #e5e7eb;padding:6px 10px;text-align:left}
        .content th{background:#f9fafb;font-weight:600}
        .content blockquote{border-left:3px solid #d1d5db;padding-left:12px;color:#6b7280;margin:.7em 0}
        @media print{body{padding:0}}
      </style>
    </head><body>
      <h1>Chat Session: ${activeSessionTitle}</h1>
      ${msgRows}
      <script>
        window.onload=function(){
          document.querySelectorAll('.content').forEach(function(el){
            var raw=el.getAttribute('data-raw')||'';
            if(el.getAttribute('data-role')==='assistant'){
              el.innerHTML=marked.parse(raw);
            } else {
              var d=document.createElement('div');
              d.style.whiteSpace='pre-wrap';
              d.textContent=raw;
              el.appendChild(d);
            }
          });
          setTimeout(function(){window.print();},400);
        };
      <\/script>
    </body></html>`);
    printWindow.document.close();
  };

  // Editing Message triggers
  const handleStartEdit = (id: string, currentContent: string) => {
    setEditingMessageId(id);
    setEditInput(currentContent);
  };

  const handleSaveEdit = (id: string) => {
    if (editInput.trim()) {
      onEditMessage(id, editInput.trim());
    }
    setEditingMessageId(null);
  };
  const handleRunCode = (files: Record<string, string>, title: string, rawCode: string, language: string, isRunnable: boolean) => {
    setSandboxFiles(files);
    setSandboxTitle(title);
    setSandboxRawCode(rawCode);
    setSandboxLanguage(language);
    setSandboxRunnable(isRunnable);
    setSandboxActiveTab(isRunnable ? 'preview' : 'code');
    setIsSandboxOpen(true);
  };

  let imgCounter = 0;

  return (
    <ArtifactContext.Provider value={{ onRunCode: handleRunCode }}>
      <div className="flex flex-1 h-full min-w-0 bg-slate-950 relative overflow-hidden">
        
        {/* Main Chat Panel */}
        <div
          className="flex flex-col flex-1 h-full min-w-0 relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
      {/* Drag-and-Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4 p-10 rounded-3xl border-2 border-dashed border-primary animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Paperclip className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">Drop files here</p>
              <p className="text-sm text-slate-400 mt-1">Images, PDFs, code files and more</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-950/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 mr-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
              title="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
          {gptAvatarEmoji ? (
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 select-none ${gptAvatarBg || 'bg-gradient-to-tr from-blue-500 to-indigo-500'}`}>
              {gptAvatarEmoji}
            </div>
          ) : (
            <Bot className="w-5 h-5 text-primary shrink-0" />
          )}
          <span className="font-semibold text-sm text-slate-200 truncate">
            {activeSessionTitle}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wide shrink-0">
            {activeModelName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Mode Button */}
          <button
            onClick={onOpenVoiceMode}
            className="p-1.5 rounded-lg text-primary hover:text-[#c2e7ff] hover:bg-slate-800 transition-colors"
            title="Open Voice Chat Mode"
          >
            <Headphones className="w-4.5 h-4.5" />
          </button>
          
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Export Markdown (.md)"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleExportTxt}
                className="p-1.5 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Export Text (.txt)"
              >
                <FileDown className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handlePrintChat}
                className="p-1.5 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Print Thread / Save PDF"
              >
                <Printer className="w-4.5 h-4.5" />
              </button>
            </>
          )}
          {activeSession?.projectId && activeDirectoryHandle && directoryPermissionStatus === 'granted' && (
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showExplorer 
                  ? 'bg-primary/15 text-primary border border-primary/35' 
                  : 'text-slate-300 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
              title="Toggle Codebase Explorer"
            >
              <FolderOpen className="w-4.5 h-4.5" />
            </button>
          )}
          {/* GitHub Repo Reader Button */}
          <button
            onClick={() => setShowGitHubPanel(!showGitHubPanel)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
              showGitHubPanel
                ? 'bg-primary/15 text-primary border border-primary/35'
                : 'text-slate-300 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            }`}
            title="GitHub Repo Reader"
          >
            <span className="text-base leading-none">🐙</span>
            {ghIsIndexed && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Codebase re-authorization request banner */}
      {activeDirectoryHandle && directoryPermissionStatus !== 'granted' && (
        <div className="bg-amber-500/10 border-b border-amber-500/15 py-2 px-4 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 text-slate-350 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-550 shrink-0" />
            <span className="truncate">
              Local codebase directory <strong>{activeDirectoryHandle.name}</strong> access requires re-authorization to read files.
            </span>
          </div>
          <button
            onClick={requestDirectoryPermission}
            className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 hover:border-amber-500/40 rounded-xl text-amber-300 hover:text-white text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
          >
            Re-authorize Access
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin relative bg-slate-950"
      >
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-10 space-y-8 select-none">
            <div className="text-center space-y-3">
              <div className={`inline-flex p-3.5 rounded-2xl shadow-xl shadow-indigo-500/5 pulse-glow mb-2 ${
                gptAvatarEmoji ? `${gptAvatarBg || 'bg-gradient-to-tr from-blue-500 to-indigo-500'} text-white text-3xl` : 'bg-slate-800 border border-slate-700 text-primary'
              }`}>
                {gptAvatarEmoji ? (
                  <span className="w-8 h-8 flex items-center justify-center select-none">{gptAvatarEmoji}</span>
                ) : (
                  <Bot className="w-8 h-8" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                {gptName ? `Chat with ${gptName}` : 'How can I help you today?'}
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
                {gptDescription ? gptDescription : 'Ask questions, write scripts, execute code sandboxes, or converse using voice mode with high-reasoning intelligence.'}
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gptStarterPrompts && gptStarterPrompts.length > 0 ? (
                gptStarterPrompts.map((promptText, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSendMessage(promptText, [])}
                    className="p-4 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all duration-200 flex flex-col items-start gap-2.5 group text-left justify-center h-full min-h-[90px]"
                  >
                    <div className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-primary shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                        {promptText}
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Click to ask</p>
                    </div>
                  </div>
                ))
              ) : (
                STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSendMessage(item.prompt, [])}
                      className="p-4 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all duration-200 flex flex-col items-start gap-3 group text-left"
                    >
                      <div className={`p-2 rounded-lg border ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              const isEditing = editingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-4 group/msg ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Icon for Assistant */}
                  {isAssistant && (
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
                      gptAvatarEmoji ? `${gptAvatarBg || 'bg-gradient-to-tr from-blue-500 to-indigo-500'} border-transparent text-sm` : 'bg-slate-900 border-slate-700 text-primary'
                    }`}>
                      {gptAvatarEmoji ? (
                        <span className="select-none">{gptAvatarEmoji}</span>
                      ) : (
                        <Bot className="w-4.5 h-4.5" />
                      )}
                    </div>
                  )}

                  {/* Message Bubble + Actions Wrap */}
                  <div className="flex flex-col max-w-[85%] gap-1">
                    <div
                      className={`rounded-2xl text-sm leading-relaxed transition-all relative ${
                        isAssistant
                          ? 'bg-transparent border-transparent text-slate-200 pr-10 px-0 py-1'
                          : 'bg-slate-800 border-slate-700 text-slate-200 shadow-md shadow-black/5 px-4.5 py-3 border'
                      }`}
                    >
                      {/* Speaker Read Aloud Button */}
                      {isAssistant && message.content && !isEditing && (
                        <button
                          onClick={() => handleToggleSpeak(message.id, message.content)}
                          className={`absolute top-2 right-2 p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-all z-20 cursor-pointer ${
                            speakingMessageId === message.id 
                              ? 'bg-primary/10 text-primary border-primary/30 animate-pulse opacity-100' 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          title={speakingMessageId === message.id ? "Stop Reading Aloud" : "Read Aloud"}
                        >
                          {speakingMessageId === message.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      {/* User message edit mode */}
                      {isEditing ? (
                        <div className="space-y-2 py-1 w-full min-w-[280px] md:min-w-[450px]">
                          <textarea
                            value={editInput}
                            onChange={(e) => setEditInput(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(message.id)}
                              className="px-3 py-1.5 rounded-lg bg-primary text-[#131314] hover:bg-primary/80 font-medium transition-colors"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ) : isAssistant ? (
                        message.content === '' ? (
                          /* Render bouncing dots loader inside empty assistant bubble */
                          <div className="flex items-center gap-1.5 py-1 px-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        ) : message.content.startsWith('[ERROR]') ? (
                          (() => {
                            const isApiKeyError = 
                              message.content.toLowerCase().includes('api key') ||
                              message.content.includes('API_KEY_INVALID') ||
                              message.content.includes('key is missing') ||
                              message.content.includes('Key is missing') ||
                              message.content.toLowerCase().includes('expired') ||
                              message.content.includes('invalid_api_key');
                            
                            const isQuotaError = 
                              message.content.includes('RESOURCE_EXHAUSTED') ||
                              message.content.toLowerCase().includes('quota exceeded') ||
                              message.content.toLowerCase().includes('rate limit') ||
                              message.content.includes('429') ||
                              message.content.toLowerCase().includes('exhausted') ||
                              message.content.toLowerCase().includes('out of tokens') ||
                              message.content.toLowerCase().includes('token finish');
                            
                            const isNetworkError =
                              message.content.toLowerCase().includes('network error') ||
                              message.content.toLowerCase().includes('failed to fetch') ||
                              message.content.toLowerCase().includes('offline') ||
                              message.content.toLowerCase().includes('networkerror');
                            
                            if (isApiKeyError) {
                              return (
                                <div className="flex flex-col gap-3 py-1 font-sans text-slate-200">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-450 shrink-0 mt-0.5 border border-rose-500/10">
                                      <AlertTriangle className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="font-bold text-sm text-rose-400">
                                        API Key Expired or Invalid
                                      </h4>
                                      <p className="text-xs text-slate-400 leading-relaxed">
                                        The active provider API key is expired, invalid, or was not configured. Please renew your credentials in the Control Center.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2.5 pl-11 pt-0.5">
                                    <button
                                      onClick={onOpenSettings}
                                      className="px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 hover:border-rose-500/40 rounded-xl text-rose-300 hover:text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                                    >
                                      <Key className="w-3.5 h-3.5 animate-pulse" />
                                      Renew API Key in Settings
                                    </button>
                                  </div>
                                </div>
                              );
                            } else if (isQuotaError) {
                              return (
                                <div className="flex flex-col gap-3 py-1 font-sans text-slate-200">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-405 shrink-0 mt-0.5 border border-amber-500/10">
                                      <AlertTriangle className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="font-bold text-sm text-amber-400">
                                        Token Quota or Rate Limit Exceeded
                                      </h4>
                                      <p className="text-xs text-slate-400 leading-relaxed">
                                        The active key has run out of tokens, hit request rate limits, or exhausted its active quota. Please wait a moment or switch to an alternative provider.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2.5 pl-11 pt-0.5">
                                    <button
                                      onClick={onOpenSettings}
                                      className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 hover:border-amber-500/40 rounded-xl text-amber-300 hover:text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                      Switch Provider or Key in Settings
                                    </button>
                                  </div>
                                </div>
                              );
                            } else if (isNetworkError) {
                              return (
                                <div className="flex flex-col gap-3 py-1 font-sans text-slate-200">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-450 shrink-0 mt-0.5 border border-amber-500/10">
                                      <WifiOff className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="font-bold text-sm text-amber-400">
                                        Network Connection Failed
                                      </h4>
                                      <p className="text-xs text-slate-400 leading-relaxed">
                                        Your device is offline or the AI server endpoint is unreachable. Please verify your internet connection.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2.5 pl-11 pt-0.5">
                                    <button
                                      onClick={() => onRegenerateMessage(message.id)}
                                      className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 hover:border-amber-500/40 rounded-xl text-amber-300 hover:text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                                      Retry Request
                                    </button>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex flex-col gap-3 py-1 font-sans text-slate-200">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-450 shrink-0 mt-0.5 border border-amber-500/10">
                                      <AlertCircle className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="space-y-1 w-full min-w-0">
                                      <h4 className="font-bold text-sm text-amber-400">
                                        API Request Failed
                                      </h4>
                                      <p className="text-[10px] text-slate-400 leading-relaxed font-mono select-text bg-slate-950 p-3 rounded-xl border border-slate-700 mt-2 break-all max-h-48 overflow-y-auto scrollbar-thin">
                                        {message.content.replace('[ERROR] An error occurred:', '').trim()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2.5 pl-11 pt-0.5">
                                    <button
                                      onClick={onOpenSettings}
                                      className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 hover:border-amber-500/40 rounded-xl text-amber-300 hover:text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                      Check Provider Settings
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          })()
                        ) : (
                          <div className="prose prose-invert max-w-none text-slate-200 space-y-2">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <div className="whitespace-pre-wrap select-text">{message.content}</div>
                      )}

                      {/* Attachment display inside bubbles */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-slate-700/30">
                          {message.attachments.map((att, idx) => {
                            const isImage = att.type.startsWith('image/');
                            let currentImgIndex = -1;
                            if (isImage) {
                              currentImgIndex = imgCounter;
                              imgCounter++;
                            }
                            return (
                              <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs">
                                {isImage ? (
                                  <img 
                                    src={`data:${att.type};base64,${att.data}`} 
                                    alt={att.name} 
                                    className="w-16 h-16 object-cover rounded border border-slate-700 cursor-pointer hover:opacity-85 transition-opacity" 
                                    onClick={() => setLightboxIndex(currentImgIndex)}
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 px-1">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">{att.name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quick action buttons underneath message */}
                    {!isEditing && (
                      <div className={`flex items-center gap-2 text-slate-500 opacity-0 group-hover/msg:opacity-100 transition-opacity mt-1 ${isAssistant ? 'justify-start px-2' : 'justify-end px-2'}`}>
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="p-1 rounded hover:text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-1"
                          title="Copy Message"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-450" />
                              <span className="text-[10px] font-medium font-sans text-emerald-450">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-medium font-sans">Copy</span>
                            </>
                          )}
                        </button>

                        {!isAssistant && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(message.id, message.content)}
                            className="p-1 rounded hover:text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-1"
                            title="Edit Message"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium font-sans">Edit</span>
                          </button>
                        )}
                        {isAssistant && (
                          <button
                            type="button"
                            onClick={() => onRegenerateMessage(message.id)}
                            className="p-1 rounded hover:text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-1"
                            title="Regenerate Response"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium font-sans">Regenerate</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        {onDeleteMessage && (
                          <button
                            type="button"
                            onClick={() => onDeleteMessage(message.id)}
                            className="p-1 rounded hover:text-rose-450 hover:bg-rose-950/20 transition-all flex items-center gap-1"
                            title="Delete Message"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium font-sans">Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Icon for User */}
                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-[#303134] border border-slate-700 flex items-center justify-center text-white shrink-0 shadow-md">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  )}
                </div>
              );
            })}



            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-36 right-8 z-10 p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-all shadow-xl hover:scale-105"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Bottom Text Input Panel */}
      <footer className="p-4 md:p-6 bg-slate-950/80 backdrop-blur-md shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          
          <div className="relative flex flex-col bg-slate-900 border border-slate-700 rounded-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-lg shadow-black/25 p-2">
            
            {/* Local Codebase File Attachments */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1 border-b border-slate-700/30 mb-2">
                {attachedFiles.map((path) => {
                  const filename = path.split('/').pop() || path;
                  return (
                    <div key={path} className="relative group flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-450">
                      <Pin className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span className="truncate max-w-[150px] text-emerald-300 font-sans font-medium" title={path}>{filename}</span>
                      <button
                        type="button"
                        onClick={() => toggleFileAttachment(path)}
                        className="p-0.5 rounded-full hover:bg-emerald-500/20 text-emerald-450 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* File attachment previews */}
            {attachments.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1 border-b border-slate-700/30 mb-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative group flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                      {att.type.startsWith('image/') ? (
                        <img 
                          src={att.previewUrl} 
                          className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-85 transition-opacity" 
                          onClick={() => handleInputImageClick(att)} 
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-primary" />
                      )}
                      <span className="truncate max-w-[120px] text-slate-300 font-sans">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Context-aware Quick Action pills */}
                <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                  {attachments.some(att => att.type.startsWith('image/')) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please convert this layout/design image into fully responsive frontend code using React, TypeScript, and Tailwind CSS. Ensure it has smooth animations, follows modern layout patterns, and contains no placeholders.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Code className="w-3 h-3 text-primary" /> Convert to Code
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please perform a professional UX/UI audit on this layout image. Focus on visual hierarchy, alignment, accessibility guidelines, contrast, and action affordances. Suggest clear improvements.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-primary" /> UX/UI Audit
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Explain the design layout in this screenshot and suggest 3 different visual layout variations or structural improvements. Tell me how to implement them.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-primary" /> Suggest Variations
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please transcribe all readable text from this image exactly as it appears. Group the text by sections or layout areas.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-primary" /> Extract Text (OCR)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please summarize this document. Extract the main objectives, key findings, and a high-level summary paragraph.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-slate-800/60 text-slate-300 hover:bg-neutral-700 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-primary" /> Summarize Takeaways
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please extract any key data points, figures, stats, tables, or charts from this document and present them in clear markdown tables.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-slate-800/60 text-slate-300 hover:bg-neutral-700 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Sliders className="w-3 h-3 text-primary" /> Extract Key Figures
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please translate the contents of this document into clear, natural English. Maintain structural headings.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-slate-800/60 text-slate-300 hover:bg-neutral-700 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Languages className="w-3 h-3 text-primary" /> Translate to English
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Hidden native input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              onChange={handleFileChange}
              className="hidden" 
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={`Ask Anything`}
              rows={1}
              className="w-full bg-transparent resize-none pl-4 pr-14 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none scrollbar-thin font-medium font-sans leading-relaxed transition-all"
            />
            
            {/* Input Toolbar */}
            <div className="flex items-center justify-between border-t border-slate-700/40 pt-2 px-2">
              <div className="flex items-center gap-2">
                
                {/* Plus popover menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(!showPlusMenu);
                      setActiveSubmenu('main');
                      refocusInput();
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      showPlusMenu 
                        ? 'bg-neutral-800 text-primary' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Add content, style, or skills"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>

                  {showPlusMenu && (
                    <>
                      {/* Backdrop to close dropdown on click outside */}
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => {
                          setShowPlusMenu(false);
                          setActiveSubmenu('main');
                        }}
                      />
                      <div className="plus-menu-container absolute left-0 bottom-11 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 w-60 text-slate-200 select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {activeSubmenu === 'main' && (
                          <div className="flex flex-col">
                            {/* Attach Files */}
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowPlusMenu(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <Paperclip className="w-4 h-4 text-primary" />
                              Add files or photos
                            </button>

                            {/* Take Screenshot */}
                            <button
                              type="button"
                              onClick={() => {
                                handleTakeScreenshot();
                                setShowPlusMenu(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <Camera className="w-4 h-4 text-slate-400" />
                              Take a screenshot
                            </button>

                            {/* Prompt Library */}
                            {onOpenPromptLibrary && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenPromptLibrary();
                                  setShowPlusMenu(false);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                              >
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Prompt Library
                              </button>
                            )}

                            <div className="h-px bg-[#303134]/60 my-1" />

                            {/* Web Search Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                setWebSearchEnabled(!webSearchEnabled);
                              }}
                              className="flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <div className="flex items-center gap-2.5">
                                <Globe className="w-4 h-4 text-sky-400" />
                                Web search
                              </div>
                              {webSearchEnabled && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>

                            {/* Use Style Submenu trigger */}
                            <button
                              type="button"
                              onClick={() => setActiveSubmenu('styles')}
                              className="flex items-between justify-between px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <div className="flex items-center gap-2.5 flex-1">
                                <Feather className="w-4 h-4 text-amber-400" />
                                Use style
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </button>

                            {/* Skills Submenu trigger */}
                            <button
                              type="button"
                              onClick={() => setActiveSubmenu('skills')}
                              className="flex items-between justify-between px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <div className="flex items-center gap-2.5 flex-1">
                                <Sliders className="w-4 h-4 text-purple-400" />
                                Skills
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        )}

                        {activeSubmenu === 'styles' && (
                          <div className="flex flex-col">
                            {/* Back Header */}
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-700/40 mb-1">
                              <button
                                type="button"
                                onClick={() => setActiveSubmenu('main')}
                                className="p-0.5 rounded hover:bg-slate-750 text-slate-400 hover:text-white"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Use Style</span>
                            </div>

                            {/* Style presets */}
                            {[
                              { id: 'normal', name: 'Normal', desc: 'Default Gemini conversational output' },
                              { id: 'learning', name: 'Learning', desc: 'Simplifies concepts, friendly tutoring tone' },
                              { id: 'concise', name: 'Concise', desc: 'Extremely brief, direct, no filler' },
                              { id: 'explanatory', name: 'Explanatory', desc: 'In-depth step-by-step paragraphs' },
                              { id: 'formal', name: 'Formal', desc: 'Academic, professional, polite tone' }
                            ].map((style) => (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => {
                                  onStyleChange(style.id);
                                  setShowPlusMenu(false);
                                }}
                                className="flex items-center justify-between px-3 py-1.5 text-left hover:bg-slate-800 transition-colors cursor-pointer w-full"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-slate-200">{style.name}</span>
                                  <span className="text-[9px] text-slate-500 line-clamp-1">{style.desc}</span>
                                </div>
                                {activeStyle === style.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeSubmenu === 'skills' && (
                          <div className="flex flex-col">
                            {/* Back Header */}
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-700/40 mb-1">
                              <button
                                type="button"
                                onClick={() => setActiveSubmenu('main')}
                                className="p-0.5 rounded hover:bg-slate-755 text-slate-400 hover:text-white"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills</span>
                            </div>

                            {/* Skill presets */}
                            {[
                              { id: 'default', name: 'Default Assistant', desc: 'Standard workspace capabilities' },
                              { id: 'debugger', name: 'Code Debugger', desc: 'Checks syntax, complexity, writes unit tests' },
                              { id: 'inspector', name: 'UI/UX Inspector', desc: 'Heuristics design audits & accessibility criteria' },
                              { id: 'tutor', name: 'Language Tutor', desc: 'Grammar coaching and translations' }
                            ].map((skill) => (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => {
                                  onSkillChange(skill.id);
                                  setShowPlusMenu(false);
                                }}
                                className="flex items-center justify-between px-3 py-1.5 text-left hover:bg-slate-800 transition-colors cursor-pointer w-full"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-slate-200">{skill.name}</span>
                                  <span className="text-[9px] text-slate-500 line-clamp-1">{skill.desc}</span>
                                </div>
                                {activeSkill === skill.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Speech Dictation */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleSpeech();
                    refocusInput();
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    isListening 
                      ? 'text-red-400 bg-red-950/20 border border-red-900/40 animate-pulse' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={isListening ? "Stop listening" : "Speech to Text dictation"}
                >
                  {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                </button>

                <div className="h-4 w-px bg-[#303134] mx-1" />

                {/* Web Search Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setWebSearchEnabled(!webSearchEnabled);
                    refocusInput();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all ${
                    webSearchEnabled 
                      ? 'bg-primary/15 border-primary/35 text-primary' 
                      : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                  }`}
                  title="Search the web with Google Search grounding (Forces Gemini 2.5 Flash)"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Search
                </button>

                {/* Thinking Mode Toggle */}
                <button
                  type="button"
                  disabled={webSearchEnabled}
                  onClick={() => {
                    setThinkingEnabled(!thinkingEnabled);
                    refocusInput();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all ${
                    thinkingEnabled && !webSearchEnabled
                      ? 'bg-primary/15 border-primary/35 text-primary' 
                      : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  title={webSearchEnabled ? "Thinking Mode cannot be combined with Web Search" : "Enable Deep Reasoning (Gemma 4 high-thinking mode)"}
                >
                  <Brain className="w-3.5 h-3.5" />
                  Thinking
                </button>

                {activeDirectoryHandle && directoryPermissionStatus === 'granted' && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatWithCodebase(!chatWithCodebase);
                      refocusInput();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all ${
                      chatWithCodebase
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-bold' 
                        : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    }`}
                    title="Toggle codebase grounding search to automatically retrieve context"
                  >
                    <Code className="w-3.5 h-3.5" />
                    Codebase
                  </button>
                )}

                <div className="h-4 w-px bg-[#303134] mx-1" />

                {/* Model Selector Dropdown */}


                <div className="relative">
                  <button
                    type="button"
                    disabled={webSearchEnabled}
                    onClick={() => {
                      const nextOpen = !showModelDropdown;
                      setShowModelDropdown(nextOpen);
                      refocusInput();
                      if (nextOpen && provider && apiKey) {
                        checkAllForProvider(provider, apiKey);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all select-none ${
                      webSearchEnabled
                        ? 'bg-transparent border-slate-700/50 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                    title={webSearchEnabled ? "Model is locked to Gemini 2.5 Flash Grounded while Web Search is ON" : "Change active AI model"}
                  >
                    <span>{friendlyModelName}</span>
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {showModelDropdown && !webSearchEnabled && (
                    <>
                      {/* Backdrop to close dropdown on click outside */}
                      <div 
                        className="fixed inset-0 z-20 cursor-default" 
                        onClick={() => {
                          setShowModelDropdown(false);
                          refocusInput();
                        }}
                      />
                      <div className="model-dropdown-container absolute bottom-full left-0 mb-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 p-1.5 max-h-80 overflow-y-auto scrollbar-thin">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                          Select AI Model
                        </div>
                        {finalModels.map((m) => {
                          const health = healthMap[m.id] || { status: 'untested' };
                          const checking = isVerifying[m.id];
                          const isFailed = health.status === 'failed';
                          const isHealthy = health.status === 'healthy';

                          return (
                            <button
                              key={m.id}
                              type="button"
                              disabled={isFailed}
                              onClick={() => {
                                onModelChange(m.id);
                                setShowModelDropdown(false);
                                refocusInput();
                              }}
                              className={`flex items-start gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-xs font-sans transition-all ${
                                m.id === selectedModel
                                  ? 'bg-slate-850 text-primary'
                                  : isFailed
                                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                                    : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                              }`}
                              title={
                                isFailed 
                                  ? `Model Unavailable: ${health.error}` 
                                  : checking 
                                    ? 'Verifying model health...' 
                                    : m.description
                              }
                            >
                              <div className="relative p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 shrink-0 mt-0.5">
                                <Box className="w-3.5 h-3.5" />
                                {checking ? (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                ) : isHealthy ? (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                                ) : isFailed ? (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
                                ) : (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" title="Untested model" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-100">{m.name}</span>
                                  {m.provider === 'openai' && (
                                    <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-1 py-0.2 rounded border border-emerald-900/30 font-mono scale-90 origin-left">
                                      OpenAI
                                    </span>
                                  )}
                                  {m.provider === 'gemini' && (
                                    <span className="text-[9px] bg-indigo-950/40 text-indigo-400 px-1 py-0.2 rounded border border-indigo-900/30 font-mono scale-90 origin-left">
                                      Gemini
                                    </span>
                                  )}
                                  {m.provider === 'anthropic' && (
                                    <span className="text-[9px] bg-amber-950/40 text-amber-400 px-1 py-0.2 rounded border border-amber-900/30 font-mono scale-90 origin-left">
                                      Claude
                                    </span>
                                  )}
                                  {m.provider === 'groq' && (
                                    <span className="text-[9px] bg-rose-950/40 text-rose-400 px-1 py-0.2 rounded border border-rose-900/30 font-mono scale-90 origin-left">
                                      Groq
                                    </span>
                                  )}
                                  {m.provider === 'openrouter' && (
                                    <span className="text-[9px] bg-sky-950/40 text-sky-400 px-1 py-0.2 rounded border border-sky-900/30 font-mono scale-90 origin-left">
                                      Router
                                    </span>
                                  )}
                                  {isHealthy && health.latency !== undefined && (
                                    <span className="text-[9px] font-mono text-emerald-450/90 font-bold scale-90 origin-left">
                                      ({health.latency}ms)
                                    </span>
                                  )}
                                </div>
                                {isFailed ? (
                                  <p className="text-[9px] text-rose-400 mt-1 leading-normal font-medium">
                                    Offline: {health.error}
                                  </p>
                                ) : checking ? (
                                  <div className="h-3 w-32 bg-slate-800 rounded animate-pulse mt-1.5" />
                                ) : m.description ? (
                                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                                    {m.description}
                                  </p>
                                ) : null}
                              </div>
                              {m.id === selectedModel && <Check className="w-4 h-4 text-primary shrink-0 mt-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Send / Stop Button */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2 rounded-xl transition-all shadow-md bg-rose-500 hover:bg-rose-400 text-white shadow-rose-900/40 hover:scale-105 active:scale-95"
                  title="Stop generation (Escape)"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && attachments.length === 0}
                  className={`p-2 rounded-xl transition-all shadow-md ${
                    (input.trim() || attachments.length > 0)
                      ? 'bg-primary hover:bg-primary/80 text-[#131314] shadow-md hover:scale-105'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-transparent'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              )}

            </div>

          </div>
          <div className="text-center text-[10px] text-slate-600 mt-2 font-medium tracking-normal font-sans">
            AI Chat can make mistakes. Verify important information independently.
          </div>
        </form>
      </footer>

      {/* Slide-over Sandpack Drawer / Artifact Viewer */}
      {isSandboxOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSandboxOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-4xl h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-700 bg-[#1a1a1a]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-800 text-primary border border-slate-700/50 shrink-0">
                  <Code className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-slate-200 block truncate font-mono">{sandboxTitle}</span>
                  {sandboxLanguage && (
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{sandboxLanguage}</span>
                  )}
                </div>
              </div>

              {/* Tabs selector */}
              {sandboxRunnable && (
                <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setSandboxActiveTab('code')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all select-none ${
                      sandboxActiveTab === 'code'
                        ? 'bg-slate-800 text-primary border border-slate-750 shadow-sm'
                        : 'text-slate-405 hover:text-slate-200'
                    }`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setSandboxActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all select-none ${
                      sandboxActiveTab === 'preview'
                        ? 'bg-slate-800 text-primary border border-slate-750 shadow-sm'
                        : 'text-slate-405 hover:text-slate-200'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              )}

              {/* Action buttons (Download, Close) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSandboxCode}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setIsSandboxOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Sandbox Drawer Body */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
              {sandboxActiveTab === 'code' || !sandboxRunnable ? (
                /* Code Tab: Syntax Highlighted view */
                <div className="flex-1 flex flex-col overflow-hidden p-6 relative">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <span className="text-xs text-slate-450 font-mono">Source Code</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sandboxRawCode);
                      }}
                      className="px-2.5 py-1 text-[10px] font-semibold text-slate-350 bg-slate-900 border border-slate-800 rounded-lg hover:text-slate-100 hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Code
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300 scrollbar-thin">
                    <SyntaxHighlighter
                      language={sandboxLanguage || 'text'}
                      useInlineStyles={false}
                      showLineNumbers={true}
                      className="prism-theme-override bg-transparent! p-0! line-numbers"
                    >
                      {sandboxRawCode.replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                /* Preview Tab: Sandpack Execution container */
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                  {sandboxFiles && (
                    <Sandpack
                      template={
                        Object.keys(sandboxFiles).some(k => k.endsWith('.tsx') || k.endsWith('.ts') || k.endsWith('.jsx'))
                          ? 'react-ts'
                          : 'static'
                      }
                      theme="dark"
                      files={sandboxFiles}
                      options={{
                        showNavigator: true,
                        showTabs: true,
                        closableTabs: false,
                        showLineNumbers: true,
                        editorHeight: "calc(100vh - 190px)",
                        externalResources: [
                          "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
                        ]
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Enhanced Image Lightbox Viewer */}
      {lightboxIndex !== null && (
        <ImageLightbox
          isOpen={lightboxIndex !== null}
          onClose={() => {
            setLightboxIndex(null);
            setUploadedPreviewImages([]);
          }}
          images={uploadedPreviewImages.length > 0 ? uploadedPreviewImages : conversationImages}
          currentIndex={lightboxIndex}
          onIndexChange={(idx) => setLightboxIndex(idx)}
        />
      )}
      </div> {/* Close Main Chat Panel */}

      {/* Codebase Explorer Sibling Panel */}
      {showExplorer && activeSession?.projectId && activeDirectoryHandle && directoryPermissionStatus === 'granted' && (
        <CodebaseExplorer 
          projectId={activeSession.projectId} 
          onClose={() => setShowExplorer(false)} 
        />
      )}

      {/* GitHub Repo Reader Sibling Panel */}
      {showGitHubPanel && (
        <div className="w-80 shrink-0 border-l border-slate-800 h-full flex flex-col">
          <GitHubRepoPanel onClose={() => setShowGitHubPanel(false)} />
        </div>
      )}

      </div> {/* Close Root Flex Wrapper */}
    </ArtifactContext.Provider>
  );
}
