'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Brain
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
  data: string;
  previewUrl?: string;
  textContent?: string;
}

interface VoiceModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  activeResponseText: string;
  isLoading: boolean;
  isFinished: boolean;
}

const LANGUAGES = [
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }
];

export default function VoiceModeOverlay({
  isOpen,
  onClose,
  onSendMessage,
  activeResponseText,
  isLoading,
  isFinished
}: VoiceModeOverlayProps) {
  // Voice System State
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // Voice Settings State (Loaded from localStorage or defaults)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [continuousMode, setContinuousMode] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  // Available Synthesis Voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs for Speech Recognition and Synthesis
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRecognitionActiveRef = useRef(false);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [spokenIndex, setSpokenIndex] = useState(0);

  // Synthesis Queue Handlers
  const enqueueSpeech = (text: string) => {
    // Strip markdown formatting like stars, hashtags, etc. for cleaner voice
    const cleanText = text.replace(/[*#`_\-]/g, '').trim();
    if (!cleanText) return;
    
    speechQueueRef.current.push(cleanText);
    processSpeechQueue();
  };

  const processSpeechQueue = () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0 || isSpeakerMuted || typeof window === 'undefined') return;

    const textToSpeak = speechQueueRef.current.shift();
    if (!textToSpeak) return;

    isSpeakingRef.current = true;
    setVoiceStatus('speaking');

    const SpeechSynthesisUtterance = (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance as typeof window.SpeechSynthesisUtterance;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    utterance.rate = voiceRate;
    utterance.lang = selectedLanguage;

    const matchedVoice = availableVoices.find(v => v.name === selectedVoiceName);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
      setVoiceStatus('idle');
      processSpeechQueue();
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // Ignore normal interruption and cancel events
      if (e.error === 'interrupted' || e.error === 'canceled') {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
        return;
      }

      console.error('Speech synthesis utterance error:', e);
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
      setTimeout(() => {
        setVoiceStatus('idle');
      }, 0);
      processSpeechQueue();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const cancelSpeech = () => {
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    currentUtteranceRef.current = null;
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    setTimeout(() => {
      setVoiceStatus('idle');
    }, 0);
  };

  // Listening controls
  const startListening = () => {
    if (isMicMuted || !recognitionRef.current) return;
    if (isRecognitionActiveRef.current) return; // Prevent InvalidStateError
    cancelSpeech();
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Recognition start error:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Recognition stop error:', e);
      }
    }
  };

  const handleInterrupt = () => {
    if (!isSpeechSupported) return;
    // Interrupt voice: stop speaking and listen
    cancelSpeech();
    if (!isMicMuted && !isLoading) {
      startListening();
    } else {
      setVoiceStatus('idle');
    }
  };

  const handleMicToggle = () => {
    const nextVal = !isMicMuted;
    setIsMicMuted(nextVal);
    if (nextVal) {
      stopListening();
      setVoiceStatus(prev => prev === 'listening' ? 'idle' : prev);
    } else {
      startListening();
    }
  };

  const handleSpeakerToggle = () => {
    const nextVal = !isSpeakerMuted;
    setIsSpeakerMuted(nextVal);
    if (nextVal) {
      cancelSpeech();
    } else {
      processSpeechQueue();
    }
  };

  // Save Settings Changes
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('gemma_voice_lang', lang);
    
    // Auto reset voice selector for new language filter
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
    if (langVoice) {
      setSelectedVoiceName(langVoice.name);
      localStorage.setItem('gemma_voice_name', langVoice.name);
    }
  };

  const handleVoiceChange = (name: string) => {
    setSelectedVoiceName(name);
    localStorage.setItem('gemma_voice_name', name);
  };

  const handleRateChange = (val: number) => {
    setVoiceRate(val);
    localStorage.setItem('gemma_voice_rate', String(val));
  };

  const handleContinuousChange = (val: boolean) => {
    setContinuousMode(val);
    localStorage.setItem('gemma_voice_continuous', String(val));
  };

  const handleAutoplayChange = (val: boolean) => {
    setAutoplayEnabled(val);
    localStorage.setItem('gemma_voice_autoplay', String(val));
  };

  // 1. Fetch available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Default voice selection logic
      if (voices.length > 0 && !selectedVoiceName) {
        // Try to find a high quality English voice by default
        const defaultVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                             voices.find(v => v.lang.startsWith('en')) || 
                             voices[0];
        setSelectedVoiceName(defaultVoice.name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceName]);

  // 2. Load settings from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedLang = localStorage.getItem('gemma_voice_lang');
      const savedVoice = localStorage.getItem('gemma_voice_name');
      const savedRate = localStorage.getItem('gemma_voice_rate');
      const savedCont = localStorage.getItem('gemma_voice_continuous');
      const savedAuto = localStorage.getItem('gemma_voice_autoplay');

      if (savedLang) setSelectedLanguage(savedLang);
      if (savedVoice) setSelectedVoiceName(savedVoice);
      if (savedRate) setVoiceRate(parseFloat(savedRate));
      if (savedCont) setContinuousMode(savedCont === 'true');
      if (savedAuto) setAutoplayEnabled(savedAuto === 'true');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 3. Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = ((window as unknown) as Record<string, new () => SpeechRecognitionInstance>).SpeechRecognition || ((window as unknown) as Record<string, new () => SpeechRecognitionInstance>).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false; // We want single utterances, then we auto-submit
      rec.interimResults = false;
      rec.lang = selectedLanguage;

      rec.onstart = () => {
        isRecognitionActiveRef.current = true;
        if (!isMicMuted) {
          setVoiceStatus('listening');
        }
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        const text = transcript.trim();
        if (text) {
          // Send transcript to page.tsx handler
          onSendMessage(text, []);
          setVoiceStatus('thinking');
        } else {
          setVoiceStatus('idle');
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        isRecognitionActiveRef.current = false;
        console.error('Speech recognition error in overlay:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access is blocked. Please enable permissions in your browser settings.');
          setIsMicMuted(true);
        }
        setVoiceStatus('idle');
      };

      rec.onend = () => {
        isRecognitionActiveRef.current = false;
        // If status is still listening (e.g. silence timeout), revert to idle
        setVoiceStatus(prev => prev === 'listening' ? 'idle' : prev);
      };

      recognitionRef.current = rec;
    }
  }, [selectedLanguage, isMicMuted, onSendMessage]);

  // 4. Start listening on open (if mic is active)
  useEffect(() => {
    if (isOpen) {
      // Cancel speech synthesis of whatever else is going on
      cancelSpeech();
      
      // Delay slightly to allow transition
      const timer = setTimeout(() => {
        if (!isMicMuted && !isLoading) {
          startListening();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // Stopped
      cancelSpeech();
      stopListening();
    }
  }, [isOpen]);

  // 5. Reset spoken tracker when model starts thinking
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setSpokenIndex(0);
        setVoiceStatus('thinking');
      }, 0);
      cancelSpeech();
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // 6. Sentence splitter / Speech generator
  useEffect(() => {
    if (!isOpen || isSpeakerMuted || !autoplayEnabled) return;

    let timer: NodeJS.Timeout;
    if (activeResponseText.length > spokenIndex) {
      const pendingText = activeResponseText.slice(spokenIndex);

      // Sentence separator: matches periods, question marks, exclamation marks, and newlines
      const sentenceBoundaryRegex = /[^.!?\n]+[.!?\n]+/g;
      let match;
      let lastMatchEnd = 0;
      const newSentences: string[] = [];

      while ((match = sentenceBoundaryRegex.exec(pendingText)) !== null) {
        newSentences.push(match[0].trim());
        lastMatchEnd = match.index + match[0].length;
      }

      if (newSentences.length > 0) {
        newSentences.forEach(sentence => {
          enqueueSpeech(sentence);
        });
        timer = setTimeout(() => {
          setSpokenIndex(prev => prev + lastMatchEnd);
        }, 0);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeResponseText, spokenIndex, isOpen, isSpeakerMuted, autoplayEnabled]);

  // 7. Stream finish: speak remaining text
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFinished && activeResponseText.length > spokenIndex && isOpen) {
      const finalSentence = activeResponseText.slice(spokenIndex).trim();
      if (finalSentence) {
        enqueueSpeech(finalSentence);
      }
      timer = setTimeout(() => {
        setSpokenIndex(activeResponseText.length);
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFinished, activeResponseText, spokenIndex, isOpen]);

  // 8. Auto-listen when AI completes speaking (Continuous Mode)
  useEffect(() => {
    if (isFinished && !isSpeakingRef.current && speechQueueRef.current.length === 0 && voiceStatus === 'idle' && isOpen) {
      if (continuousMode && !isMicMuted && !isLoading) {
        startListening();
      }
    }
  }, [isFinished, voiceStatus, continuousMode, isMicMuted, isLoading, isOpen]);

  if (!isOpen) return null;

  // Filter voices by selected language prefix (e.g. 'en')
  const filteredVoices = availableVoices.filter(v => 
    v.lang.toLowerCase().startsWith(selectedLanguage.slice(0, 2).toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass">
      
      {/* Background click interrupts AI speaking */}
      <div 
        onClick={handleInterrupt}
        className="absolute inset-0 bg-slate-950/90 transition-opacity"
      />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh] max-h-[600px] z-10">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 font-sans tracking-wide uppercase">
              Gemma Voice Mode
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all ${
                showSettings 
                  ? 'text-primary bg-slate-800' 
                  : 'text-slate-300 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Voice Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-slate-200 hover:bg-slate-800 transition-all"
              title="Close Voice Mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Visualization Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          {/* Animated Visualizer Panel */}
          <div 
            onClick={handleInterrupt}
            className={`w-48 h-48 rounded-full flex items-center justify-center relative select-none group ${
              isSpeechSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
            }`}
            title={isSpeechSupported ? "Click to interrupt / talk" : "Speech Recognition Unavailable"}
          >
            {/* Expanded glow ripples during Listening */}
            {isSpeechSupported && voiceStatus === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute -inset-4 rounded-full bg-blue-500/5 animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-8 rounded-full bg-indigo-500/5 animate-pulse" style={{ animationDuration: '1.5s' }} />
              </>
            )}

            {/* Pulsing rings during Speaking */}
            {isSpeechSupported && voiceStatus === 'speaking' && (
              <>
                <div className="absolute inset-0 rounded-full bg-purple-500/15 animate-pulse" style={{ animationDuration: '1s' }} />
                <div className="absolute -inset-6 rounded-full bg-purple-500/5 animate-pulse" style={{ animationDuration: '1.8s' }} />
              </>
            )}

            {/* Glowing gradient rotating border for Thinking */}
            {isSpeechSupported && voiceStatus === 'thinking' && (
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary animate-spin" style={{ animationDuration: '8s' }} />
            )}

            {/* Main Central Orb */}
            <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-xl border ${
              !isSpeechSupported
                ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-rose-950/40 shadow-black/45'
                : voiceStatus === 'listening'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-400 scale-105 shadow-blue-500/25'
                  : voiceStatus === 'thinking'
                    ? 'bg-gradient-to-br from-[#1e1f20] to-[#2d2f31] border-primary/40 animate-pulse'
                    : voiceStatus === 'speaking'
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-400 scale-105 shadow-purple-500/25'
                      : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-600 shadow-black/30'
            }`}>
              
              {/* Central icons representing state */}
              {!isSpeechSupported ? (
                <MicOff className="w-12 h-12 text-rose-500 animate-pulse" />
              ) : (
                <>
                  {voiceStatus === 'listening' && (
                    <Mic className="w-12 h-12 text-white animate-bounce" />
                  )}
                  {voiceStatus === 'thinking' && (
                    <Brain className="w-12 h-12 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                  )}
                  {voiceStatus === 'speaking' && (
                    /* Dynamic sound wave visualizer bars */
                    <div className="flex items-end justify-center gap-1.5 h-12">
                      <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                      <div className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                      <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.5s' }} />
                      <div className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms', animationDuration: '0.7s' }} />
                      <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.9s' }} />
                    </div>
                  )}
                  {voiceStatus === 'idle' && (
                    <Volume2 className="w-12 h-12 text-slate-300 group-hover:text-white transition-colors" />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Current Status and Text Bubble */}
          <div className="mt-8 text-center space-y-2 max-w-sm px-4">
            <h3 className={`text-sm font-semibold font-sans tracking-wide capitalize ${
              !isSpeechSupported ? 'text-rose-400' : 'text-slate-100'
            }`}>
              {!isSpeechSupported ? 'Speech Recognition Unavailable' : (
                <>
                  {voiceStatus === 'listening' && 'Listening...'}
                  {voiceStatus === 'thinking' && 'Thinking...'}
                  {voiceStatus === 'speaking' && 'Speaking...'}
                  {voiceStatus === 'idle' && 'Click Orb to Speak'}
                </>
              )}
            </h3>
            
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {!isSpeechSupported ? (
                <span>
                  Speech recognition is not supported or is disabled in your current browser. Please try <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, or enable the <code>media.webspeech.recognition.enable</code> flag in Firefox.
                </span>
              ) : (
                <>
                  {voiceStatus === 'speaking' && activeResponseText}
                  {voiceStatus === 'listening' && 'Speak clearly now...'}
                  {voiceStatus === 'thinking' && 'Formulating reply...'}
                  {voiceStatus === 'idle' && 'Gemma 4 is ready. Tap orb to begin hands-free conversation.'}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Settings Overlay Drawer */}
        {showSettings && (
          <div className="absolute inset-x-0 bottom-24 bg-slate-900 border-t border-slate-700 p-6 space-y-4 z-20 transition-all transform duration-300 translate-y-0 max-h-[60%] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voice Settings</h4>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-xs text-primary hover:text-[#c2e7ff] font-medium"
              >
                Done
              </button>
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* Voice Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Synthesizer Voice</label>
              <select
                value={selectedVoiceName}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
              >
                {filteredVoices.length === 0 ? (
                  <option value="">Default Language Voice</option>
                ) : (
                  filteredVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Speech Rate</label>
                <span className="text-[10px] font-mono text-primary bg-slate-950 px-1.5 py-0.5 rounded">{voiceRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Continuous Dialogue and Autoplay Switches */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <label className="flex flex-col gap-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950/40 cursor-pointer">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Continuous Mode</span>
                <span className="text-[9px] text-slate-500">Auto-starts mic after AI speaks</span>
                <input 
                  type="checkbox" 
                  checked={continuousMode}
                  onChange={(e) => handleContinuousChange(e.target.checked)}
                  className="mt-2 accent-primary w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex flex-col gap-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950/40 cursor-pointer">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Auto-Play Voice</span>
                <span className="text-[9px] text-slate-500">Auto-speak incoming replies</span>
                <input 
                  type="checkbox" 
                  checked={autoplayEnabled}
                  onChange={(e) => handleAutoplayChange(e.target.checked)}
                  className="mt-2 accent-primary w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="px-6 py-5 border-t border-slate-700 bg-slate-950 flex items-center justify-around shrink-0">
          {/* Mute Mic */}
          <button
            onClick={handleMicToggle}
            className={`p-3.5 rounded-full transition-all border ${
              isMicMuted
                ? 'bg-rose-950/20 border-rose-900/50 text-rose-400 hover:bg-rose-950/40'
                : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700/50'
            }`}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Tap to Talk / Stop Speech */}
          <button
            onClick={voiceStatus === 'listening' ? stopListening : handleInterrupt}
            className={`px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider border shadow-md transition-all ${
              voiceStatus === 'listening'
                ? 'bg-blue-600/10 border-blue-500 text-blue-400 hover:bg-blue-600/20'
                : voiceStatus === 'speaking'
                  ? 'bg-purple-600/10 border-purple-500 text-purple-400 hover:bg-purple-600/20'
                  : 'bg-primary border-primary text-[#131314] hover:bg-primary/80 hover:scale-105'
            }`}
          >
            {voiceStatus === 'listening' && 'Listening...'}
            {voiceStatus === 'thinking' && 'Thinking...'}
            {voiceStatus === 'speaking' && 'Interrupt AI'}
            {voiceStatus === 'idle' && 'Tap to Speak'}
          </button>

          {/* Mute Speaker */}
          <button
            onClick={handleSpeakerToggle}
            className={`p-3.5 rounded-full transition-all border ${
              isSpeakerMuted
                ? 'bg-rose-950/20 border-rose-900/50 text-rose-400 hover:bg-rose-950/40'
                : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700/50'
            }`}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
