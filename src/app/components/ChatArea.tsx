'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sandpack } from '@codesandbox/sandpack-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  Send, 
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
  Printer
} from 'lucide-react';

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

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  activeModelName: string;
  onOpenSettings: () => void;
  
  // Toggles
  thinkingEnabled: boolean;
  setThinkingEnabled: (val: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (val: boolean) => void;

  // Editing and Regenerating
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerateMessage: (messageId: string) => void;

  // Session Title
  activeSessionTitle: string;

  // Voice mode
  onOpenVoiceMode: () => void;

  // Model switching from input toolbar
  selectedModel: string;
  onModelChange: (model: string) => void;

  // Sidebar toggle props
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;

  // Custom GPT optional props
  gptName?: string;
  gptAvatarEmoji?: string;
  gptAvatarBg?: string;
  gptDescription?: string;
  gptStarterPrompts?: string[];

  // Writing Styles and Special Skills optional props
  activeStyle?: string;
  activeSkill?: string;
  onStyleChange: (styleId: string) => void;
  onSkillChange: (skillId: string) => void;

  // Library prompt injection
  injectedPrompt?: string;
  clearInjectedPrompt?: () => void;
  onOpenPromptLibrary?: () => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Brainstorm Ideas',
    desc: 'Generate creative topics for a project or newsletter.',
    prompt: 'I want to write a weekly newsletter for developers. Help me brainstorm 5 unique topic ideas for the upcoming issues. For each topic, write a brief, compelling hook and outline the key points to cover.',
    icon: HelpCircle,
    color: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30'
  },
  {
    title: 'Explain a Concept',
    desc: 'Break down complex topics in simple terms.',
    prompt: 'Explain how quantum computing works in simple terms, using an analogy that a teenager would understand. Highlight the main differences between classical bits and quantum qubits.',
    icon: Sparkles,
    color: 'text-violet-400 bg-violet-950/40 border-violet-900/30'
  },
  {
    title: 'Snake Game Code',
    desc: 'Write single-file game script blocks.',
    prompt: 'Write a complete, single-file HTML and JavaScript implementation of the classic Snake Game. Make the grid clean, handle basic controls, and display the score.',
    icon: Code,
    color: 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-900/30'
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

export default function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  activeModelName,
  onOpenSettings,
  thinkingEnabled,
  setThinkingEnabled,
  webSearchEnabled,
  setWebSearchEnabled,
  onEditMessage,
  onRegenerateMessage,
  activeSessionTitle,
  onOpenVoiceMode,
  selectedModel,
  onModelChange,
  isSidebarOpen,
  onToggleSidebar,
  gptName,
  gptAvatarEmoji,
  gptAvatarBg,
  gptDescription,
  gptStarterPrompts,
  activeStyle = 'normal',
  activeSkill = 'default',
  onStyleChange,
  onSkillChange,
  injectedPrompt,
  clearInjectedPrompt,
  onOpenPromptLibrary
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'styles' | 'skills'>('main');
  const [isListening, setIsListening] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string> | null>(null);

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

  const AVAILABLE_MODELS = [
    { id: 'gemma-4-31b-it', name: 'Gemma 4 (31B IT)' },
    { id: 'gemma-2-27b-it', name: 'Gemma 2 (27B IT)' },
    { id: 'gemma-2-9b-it', name: 'Gemma 2 (9B IT)' },
    { id: 'gemma-2-2b-it', name: 'Gemma 2 (2B IT)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro' },
  ];

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        console.error('Speech recognition error', event.error);
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
        console.error(e);
      }
    }
  };

  // Handle scroll tracking
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
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

  // Printable PDF Layout Generation
  const handlePrintChat = () => {
    if (messages.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
      <head>
        <title>Chat Session: ${activeSessionTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e1f20; line-height: 1.6; }
          h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 12px; font-size: 24px; font-weight: 700; color: #131314; }
          .msg { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0; }
          .role { font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; color: #666; margin-bottom: 5px; }
          .content { font-size: 13.5px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Chat Session: ${activeSessionTitle}</h1>
        ${messages.map(m => `
          <div class="msg">
            <div class="role">${m.role}</div>
            <div class="content">${m.content}</div>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
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

  // Custom markdown code renderer
  const CodeBlockRenderer = ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isCodeBlock = match || String(children).includes('\n');
    const [copied, setCopied] = useState(false);
    
    const copyToClipboard = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const language = match ? match[1].toLowerCase() : '';
    const codeStr = String(children);
    const parsedFiles = parseMultiFileCode(codeStr);
    const isRunnable = ['javascript', 'js', 'html', 'css', 'typescript', 'ts', 'jsx', 'tsx'].includes(language) || parsedFiles !== null;

    const handleRunCode = () => {
      if (parsedFiles) {
        setSandboxFiles(parsedFiles);
      } else {
        // Fallback for single file code blocks
        if (language === 'html') {
          setSandboxFiles({
            '/index.html': codeStr
          });
        } else if (language === 'css') {
          setSandboxFiles({
            '/styles.css': codeStr,
            '/index.html': `<link rel="stylesheet" href="./styles.css">\n<div class="p-4">CSS Preview</div>`
          });
        } else if (language === 'tsx' || language === 'jsx') {
          setSandboxFiles({
            '/App.tsx': codeStr
          });
        } else {
          // JS/TS or fallback
          setSandboxFiles({
            '/index.js': codeStr
          });
        }
      }
      setIsSandboxOpen(true);
    };

    return isCodeBlock ? (
      <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-[#0b0f19] shadow-lg shadow-black/35">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
          <span className="uppercase tracking-wider font-semibold">{parsedFiles ? 'multi-file component' : (match ? match[1] : 'code')}</span>
          <div className="flex items-center gap-2">
            {isRunnable && (
              <button
                onClick={handleRunCode}
                className="px-2 py-0.5 rounded transition-all font-medium flex items-center gap-1 hover:text-slate-200 hover:bg-slate-800/60"
              >
                <Play className="w-2.5 h-2.5" />
                Run Code
              </button>
            )}
            <button
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
    ) : (
      <code className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/30 text-indigo-300 font-mono text-[11px]" {...props}>
        {children}
      </code>
    );
  };

  const markdownComponents = {
    code: CodeBlockRenderer
  };

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-[#131314] relative">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#131314]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 mr-2 rounded-lg text-[#b4b4b4] hover:text-[#ececf1] hover:bg-[#2d2f31] transition-all shrink-0 cursor-pointer"
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
            <Bot className="w-5 h-5 text-[#a8c7fa] shrink-0" />
          )}
          <span className="font-semibold text-sm text-slate-200 truncate">
            {activeSessionTitle}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2d2f31] border border-[#303134] text-[#c4c7c5] uppercase tracking-wide shrink-0">
            {activeModelName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Mode Button */}
          <button
            onClick={onOpenVoiceMode}
            className="p-1.5 rounded-lg text-[#a8c7fa] hover:text-[#c2e7ff] hover:bg-[#2d2f31] transition-colors"
            title="Open Voice Chat Mode"
          >
            <Headphones className="w-4.5 h-4.5" />
          </button>
          
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors cursor-pointer"
                title="Export Markdown (.md)"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleExportTxt}
                className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors cursor-pointer"
                title="Export Text (.txt)"
              >
                <FileDown className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handlePrintChat}
                className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors cursor-pointer"
                title="Print Thread / Save PDF"
              >
                <Printer className="w-4.5 h-4.5" />
              </button>
            </>
          )}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#2d2f31] transition-colors"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin relative bg-[#131314]"
      >
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-10 space-y-8 select-none">
            <div className="text-center space-y-3">
              <div className={`inline-flex p-3.5 rounded-2xl shadow-xl shadow-indigo-500/5 pulse-glow mb-2 ${
                gptAvatarEmoji ? `${gptAvatarBg || 'bg-gradient-to-tr from-blue-500 to-indigo-500'} text-white text-3xl` : 'bg-[#2d2f31] border border-[#303134] text-[#a8c7fa]'
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
                    className="p-4 rounded-2xl border border-[#303134] bg-[#1e1f20] hover:bg-[#2d2f31] hover:border-[#3c4043] cursor-pointer transition-all duration-200 flex flex-col items-start gap-2.5 group text-left justify-center h-full min-h-[90px]"
                  >
                    <div className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-[#a8c7fa] shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-[#a8c7fa] transition-colors line-clamp-2 leading-relaxed">
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
                      className="p-4 rounded-2xl border border-[#303134] bg-[#1e1f20] hover:bg-[#2d2f31] hover:border-[#3c4043] cursor-pointer transition-all duration-200 flex flex-col items-start gap-3 group text-left"
                    >
                      <div className={`p-2 rounded-lg border ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-[#a8c7fa] transition-colors">
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
                      gptAvatarEmoji ? `${gptAvatarBg || 'bg-gradient-to-tr from-blue-500 to-indigo-500'} border-transparent text-sm` : 'bg-[#1e1f20] border-[#303134] text-[#a8c7fa]'
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
                      className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed border transition-all ${
                        isAssistant
                          ? 'bg-[#1e1f20] border-[#303134] text-slate-200 shadow-sm shadow-black/5'
                          : 'bg-[#2d2f31] border-[#303134] text-slate-200 shadow-md shadow-black/5'
                      }`}
                    >
                      {/* User message edit mode */}
                      {isEditing ? (
                        <div className="space-y-2 py-1 w-full min-w-[280px] md:min-w-[450px]">
                          <textarea
                            value={editInput}
                            onChange={(e) => setEditInput(e.target.value)}
                            rows={3}
                            className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-xl p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa]"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#2d2f31] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(message.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#a8c7fa] text-[#131314] hover:bg-[#c2e7ff] font-medium transition-colors"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ) : isAssistant ? (
                        message.content === '' ? (
                          /* Render bouncing dots loader inside empty assistant bubble */
                          <div className="flex items-center gap-1.5 py-1 px-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a8c7fa] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a8c7fa] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a8c7fa] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
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
                        <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-[#303134]/30">
                          {message.attachments.map((att, idx) => {
                            const isImage = att.type.startsWith('image/');
                            return (
                              <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#131314]/80 border border-[#303134] text-xs">
                                {isImage ? (
                                  <img 
                                    src={`data:${att.type};base64,${att.data}`} 
                                    alt={att.name} 
                                    className="w-16 h-16 object-cover rounded border border-[#303134] cursor-pointer hover:opacity-85 transition-opacity" 
                                    onClick={() => window.open(`data:${att.type};base64,${att.data}`)}
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 px-1">
                                    <FileText className="w-4 h-4 text-[#a8c7fa]" />
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
                        {!isAssistant && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(message.id, message.content)}
                            className="p-1 rounded hover:text-slate-300 hover:bg-[#2d2f31] transition-all flex items-center gap-1"
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
                            className="p-1 rounded hover:text-slate-300 hover:bg-[#2d2f31] transition-all flex items-center gap-1"
                            title="Regenerate Response"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium font-sans">Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Icon for User */}
                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-[#303134] border border-[#303134] flex items-center justify-center text-white shrink-0 shadow-md">
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
          onClick={scrollToBottom}
          className="absolute bottom-36 right-8 z-10 p-2 rounded-full bg-[#2d2f31] hover:bg-[#303134] border border-[#303134] text-[#e3e3e3] hover:text-white transition-all shadow-xl hover:scale-105"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Bottom Text Input Panel */}
      <footer className="p-4 md:p-6 bg-[#131314]/80 backdrop-blur-md shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          
          <div className="relative flex flex-col bg-[#1e1f20] border border-[#303134] rounded-2xl focus-within:border-[#a8c7fa] focus-within:ring-1 focus-within:ring-[#a8c7fa] transition-all shadow-lg shadow-black/25 p-2">
            
            {/* File attachment previews */}
            {attachments.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1 border-b border-[#303134]/30 mb-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative group flex items-center gap-1.5 p-1.5 rounded-lg bg-[#2d2f31]/80 border border-[#303134] text-xs">
                      {att.type.startsWith('image/') ? (
                        <img src={att.previewUrl} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <FileText className="w-4 h-4 text-[#a8c7fa]" />
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
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-[#2d2f31] hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Code className="w-3 h-3 text-[#a8c7fa]" /> Convert to Code
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please perform a professional UX/UI audit on this layout image. Focus on visual hierarchy, alignment, accessibility guidelines, contrast, and action affordances. Suggest clear improvements.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-[#2d2f31] hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#a8c7fa]" /> UX/UI Audit
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Explain the design layout in this screenshot and suggest 3 different visual layout variations or structural improvements. Tell me how to implement them.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-[#2d2f31] hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#a8c7fa]" /> Suggest Variations
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please transcribe all readable text from this image exactly as it appears. Group the text by sections or layout areas.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-[#2d2f31] hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-[#a8c7fa]" /> Extract Text (OCR)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please summarize this document. Extract the main objectives, key findings, and a high-level summary paragraph.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-[#2d2f31]/60 text-slate-300 hover:bg-neutral-700 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-[#a8c7fa]" /> Summarize Takeaways
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please extract any key data points, figures, stats, tables, or charts from this document and present them in clear markdown tables.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-[#2d2f31]/60 text-slate-300 hover:bg-neutral-700 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Sliders className="w-3 h-3 text-[#a8c7fa]" /> Extract Key Figures
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerQuickAction("Please translate the contents of this document into clear, natural English. Maintain structural headings.")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 bg-[#2d2f31]/60 text-slate-300 hover:bg-neutral-700 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        <Languages className="w-3 h-3 text-[#a8c7fa]" /> Translate to English
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
            <div className="flex items-center justify-between border-t border-[#303134]/40 pt-2 px-2">
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
                        ? 'bg-neutral-800 text-[#a8c7fa]' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#2d2f31]'
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
                      <div className="absolute left-0 bottom-11 z-50 bg-[#1e1f20] border border-[#303134] rounded-xl shadow-2xl py-1.5 w-60 text-slate-200 select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {activeSubmenu === 'main' && (
                          <div className="flex flex-col">
                            {/* Attach Files */}
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowPlusMenu(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[#2d2f31] transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <Paperclip className="w-4 h-4 text-[#a8c7fa]" />
                              Add files or photos
                            </button>

                            {/* Take Screenshot */}
                            <button
                              type="button"
                              onClick={() => {
                                handleTakeScreenshot();
                                setShowPlusMenu(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[#2d2f31] transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
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
                                className="flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[#2d2f31] transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
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
                              className="flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[#2d2f31] transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
                            >
                              <div className="flex items-center gap-2.5">
                                <Globe className="w-4 h-4 text-sky-400" />
                                Web search
                              </div>
                              {webSearchEnabled && <Check className="w-3.5 h-3.5 text-[#a8c7fa]" />}
                            </button>

                            {/* Use Style Submenu trigger */}
                            <button
                              type="button"
                              onClick={() => setActiveSubmenu('styles')}
                              className="flex items-between justify-between px-3 py-2 text-left text-xs hover:bg-[#2d2f31] transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
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
                              className="flex items-between justify-between px-3 py-2 text-left text-xs hover:bg-[#2d2f31] transition-colors cursor-pointer w-full text-slate-300 hover:text-white"
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
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#303134]/40 mb-1">
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
                                className="flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#2d2f31] transition-colors cursor-pointer w-full"
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
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#303134]/40 mb-1">
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
                                className="flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#2d2f31] transition-colors cursor-pointer w-full"
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
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#2d2f31]'
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
                      ? 'bg-[#a8c7fa]/15 border-[#a8c7fa]/35 text-[#a8c7fa]' 
                      : 'bg-transparent border-[#303134] text-slate-500 hover:text-slate-300 hover:border-[#3c4043]'
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
                      ? 'bg-[#a8c7fa]/15 border-[#a8c7fa]/35 text-[#a8c7fa]' 
                      : 'bg-transparent border-[#303134] text-slate-500 hover:text-slate-300 hover:border-[#3c4043] disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  title={webSearchEnabled ? "Thinking Mode cannot be combined with Web Search" : "Enable Deep Reasoning (Gemma 4 high-thinking mode)"}
                >
                  <Brain className="w-3.5 h-3.5" />
                  Thinking
                </button>

                <div className="h-4 w-px bg-[#303134] mx-1" />

                {/* Model Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    disabled={webSearchEnabled}
                    onClick={() => {
                      setShowModelDropdown(!showModelDropdown);
                      refocusInput();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all select-none ${
                      webSearchEnabled
                        ? 'bg-transparent border-[#303134]/50 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-[#131314] border-[#303134] text-slate-300 hover:text-white hover:border-[#3c4043]'
                    }`}
                    title={webSearchEnabled ? "Model is locked to Gemini 2.5 Flash Grounded while Web Search is ON" : "Change active AI model"}
                  >
                    <span>{friendlyModelName}</span>
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {showModelDropdown && !webSearchEnabled && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1e1f20] border border-[#303134] rounded-xl shadow-2xl z-30 p-1.5 max-h-60 overflow-y-auto scrollbar-thin">
                      {AVAILABLE_MODELS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onModelChange(m.id);
                            setShowModelDropdown(false);
                            refocusInput();
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-xs font-sans transition-all ${
                            m.id === selectedModel
                              ? 'bg-[#2d2f31] text-[#a8c7fa]'
                              : 'text-slate-300 hover:bg-[#202124] hover:text-white'
                          }`}
                        >
                          <span className="truncate pr-2">{m.name}</span>
                          {m.id === selectedModel && <Check className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={`p-2 rounded-xl transition-all shadow-md ${
                  (input.trim() || attachments.length > 0) && !isLoading
                    ? 'bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#131314] shadow-md hover:scale-105'
                    : 'bg-[#2d2f31] text-slate-500 cursor-not-allowed border border-transparent'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>

            </div>

          </div>
          <div className="text-center text-[10px] text-slate-600 mt-2 font-medium tracking-normal font-sans">
            Gemma AI can make mistakes. Verify important information independently.
          </div>
        </form>
      </footer>

      {/* Slide-over Sandpack Drawer */}
      {isSandboxOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSandboxOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-4xl h-full bg-[#1e1f20] border-l border-[#303134] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#303134] bg-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#a8c7fa]" />
                <span className="font-semibold text-sm text-slate-200">Interactive Multi-File Sandbox</span>
              </div>
              <button
                onClick={() => setIsSandboxOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2d2f31] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Sandbox Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#131314]">
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
                    editorHeight: "calc(100vh - 200px)",
                    externalResources: [
                      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
                    ]
                  }}
                />
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
