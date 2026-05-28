'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInWithMagicLink, signInWithOAuth } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await signInWithMagicLink(email.trim());
      if (error) {
        setErrorMsg(error.message || 'Failed to send magic link. Please check your email.');
      } else {
        setSuccessMsg('Verification link sent! Please check your email inbox.');
        setEmail('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setErrorMsg('');
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setErrorMsg(error.message || `Failed to sign in with ${provider}.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#131314] text-[#a8c7fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider uppercase opacity-80">Authenticating Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#131314] p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#1e1f20] border border-[#303134] rounded-3xl p-8 shadow-2xl shadow-black/45 space-y-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-[#2d2f31] border border-[#303134] text-[#a8c7fa] shadow-xl">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            Gemma AI <span className="text-xs px-2 py-0.5 bg-[#a8c7fa]/10 border border-[#a8c7fa]/20 rounded-full text-[#a8c7fa] font-mono">SaaS</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Sign in to access your persistent workspaces, custom assistants, and memories.
          </p>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-red-400 text-xs flex gap-2 items-start font-medium leading-relaxed font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-400 text-xs flex gap-2 items-start font-medium leading-relaxed font-sans">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#131314] border border-[#303134] focus:border-[#a8c7fa] rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-all font-sans"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3 rounded-2xl bg-[#a8c7fa] text-[#131314] font-semibold text-xs hover:bg-[#c2e7ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:scale-[1.01] flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin"></span>
            ) : (
              <>
                Continue with Email
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-[#303134] flex-1" />
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">or continue with</span>
          <div className="h-px bg-[#303134] flex-1" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="py-3 px-4 bg-[#131314] border border-[#303134] hover:bg-[#2d2f31] hover:border-[#3c4043] rounded-2xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-[#f28b82] font-extrabold text-[13px] leading-none">G</span>oogle
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            className="py-3 px-4 bg-[#131314] border border-[#303134] hover:bg-[#2d2f31] hover:border-[#3c4043] rounded-2xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-[#a8c7fa] font-extrabold text-[13px] leading-none">Git</span>Hub
          </button>
        </div>

      </div>
    </div>
  );
}
