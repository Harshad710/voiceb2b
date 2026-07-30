'use client';

/**
 * VoiceSearchButton — Phase 5 voice search overlay for /shop
 *
 * State machine: idle → listening → searching → (results handled by parent)
 *
 * Key design decisions:
 * - Feature-detected at mount; renders null if Web Speech API is unsupported.
 * - Three independent timers (noInput, silence, hardCap) stored in useRef so they
 *   survive re-renders without stale closures or duplicate registrations.
 * - All timers cleared on: manual ✕ close, recognition.onend, component unmount,
 *   and when any timer fires and transitions state.
 * - AbortController forwarded from parent to cancel stale in-flight searches.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, X } from 'lucide-react';

// ─── Web Speech API type declarations ────────────────────────────────────────
// The standard types are not in lib.dom.d.ts by default in all TS configs.
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'searching';

interface VoiceSearchButtonProps {
  /** Called when voice input resolves to a transcript the parent should search for. */
  onSearch: (transcript: string, signal: AbortSignal) => void;
  /** Called to tell the parent a new search is beginning (show spinner, clear errors). */
  onSearchStart: () => void;
  /** Signal whether a search is currently in-flight (disables triggering a new one mid-flight). */
  isSearching: boolean;
}

// ── Timer durations ───────────────────────────────────────────────────────────
const NO_INPUT_TIMEOUT_MS = 5000;  // silence before any speech → back to idle, no search
const SILENCE_TIMEOUT_MS = 3000;   // silence after last word → stop + search
const HARD_CAP_TIMEOUT_MS = 15000; // absolute ceiling → stop + search

export default function VoiceSearchButton({
  onSearch,
  onSearchStart,
  isSearching,
}: VoiceSearchButtonProps) {
  // ── Feature detection ─────────────────────────────────────────────────────
  const [isSupported, setIsSupported] = useState<boolean | null>(null); // null = not yet detected
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

  // ── State machine ─────────────────────────────────────────────────────────
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState(''); // display only

  // ── Refs (survive re-renders, no stale closures) ──────────────────────────
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const noInputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardCapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const speechDetectedRef = useRef(false); // guards noInputTimer clearing
  const voiceStateRef = useRef<VoiceState>('idle'); // shadow for use inside callbacks

  // Keep voiceStateRef in sync with voiceState
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Stable refs for callbacks passed from parent (avoid stale closure from re-renders)
  const onSearchRef = useRef(onSearch);
  const onSearchStartRef = useRef(onSearchStart);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);
  useEffect(() => { onSearchStartRef.current = onSearchStart; }, [onSearchStart]);

  // ── Timer utilities ───────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (noInputTimerRef.current !== null) {
      clearTimeout(noInputTimerRef.current);
      noInputTimerRef.current = null;
    }
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (hardCapTimerRef.current !== null) {
      clearTimeout(hardCapTimerRef.current);
      hardCapTimerRef.current = null;
    }
  }, []);

  // ── Core: stop recognition and optionally search ──────────────────────────
  const stopListeningAndSearch = useCallback(
    (reason: 'noInput' | 'silence' | 'hardCap' | 'manualClose') => {
      // Guard: only act if we are still in listening state
      if (voiceStateRef.current !== 'listening') return;

      clearAllTimers();

      const rec = recognitionRef.current;
      if (rec) {
        // Detach all handlers before stop() so onend doesn't re-trigger this function
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        rec.onspeechstart = null;
        try { rec.stop(); } catch { /* already stopped — ignore */ }
        recognitionRef.current = null;
      }

      const transcript = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();

      // noInput OR manual close with nothing captured → return to idle, no search
      if (reason === 'noInput' || (reason === 'manualClose' && !transcript)) {
        finalTranscriptRef.current = '';
        interimTranscriptRef.current = '';
        speechDetectedRef.current = false;
        setLiveTranscript('');
        setVoiceState('idle');
        return;
      }

      // All other cases: silence timer, hard cap, manual close with transcript → search
      if (!transcript) {
        setLiveTranscript('');
        setVoiceState('idle');
        return;
      }

      // ── Transition to searching ───────────────────────────────────────────
      setVoiceState('searching');

      // Build a new AbortController for this request
      const controller = new AbortController();

      onSearchStartRef.current();
      onSearchRef.current(transcript, controller.signal);

      // Brief "Searching…" flash then return to idle
      // The parent owns the results state; we just hand off the transcript.
      setTimeout(() => {
        if (voiceStateRef.current === 'searching') {
          setVoiceState('idle');
          setLiveTranscript('');
          finalTranscriptRef.current = '';
          interimTranscriptRef.current = '';
          speechDetectedRef.current = false;
        }
      }, 400);
    },
    [clearAllTimers]
  );

  // ── resetSilenceTimer — created after stopListeningAndSearch is stable ────
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      stopListeningAndSearch('silence');
    }, SILENCE_TIMEOUT_MS);
  }, [stopListeningAndSearch]);

  // ── Start listening ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (voiceState !== 'idle' || isSearching) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Reset transcript state
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    speechDetectedRef.current = false;
    setLiveTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    // ── onresult: update live transcript + manage timers ──────────────────
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      if (voiceStateRef.current !== 'listening') return;

      let newFinal = '';
      let newInterim = '';

      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          newFinal += e.results[i][0].transcript;
        } else {
          newInterim += e.results[i][0].transcript;
        }
      }

      finalTranscriptRef.current = newFinal;
      interimTranscriptRef.current = newInterim;
      setLiveTranscript((newFinal + ' ' + newInterim).trim());

      // First speech detected → clear noInputTimer permanently
      if (!speechDetectedRef.current) {
        speechDetectedRef.current = true;
        if (noInputTimerRef.current !== null) {
          clearTimeout(noInputTimerRef.current);
          noInputTimerRef.current = null;
        }
      }

      // Reset silence timer on every result (interim or final)
      resetSilenceTimer();
    };

    // ── onerror ───────────────────────────────────────────────────────────
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted') return; // we triggered this ourselves — ignore
      clearAllTimers();
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      speechDetectedRef.current = false;
      setLiveTranscript('');
      recognitionRef.current = null;
      setVoiceState('idle');
    };

    // ── onend: fired by Chrome when continuous recognition stops naturally ─
    // If our own handlers already moved voiceState past 'listening', this is a no-op.
    recognition.onend = () => {
      if (voiceStateRef.current === 'listening') {
        stopListeningAndSearch('silence');
      }
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceState('idle');
      return;
    }

    setVoiceState('listening');

    // ── Start three independent timers ────────────────────────────────────

    // 1. noInputTimer — cancelled permanently on first speech
    noInputTimerRef.current = setTimeout(() => {
      noInputTimerRef.current = null;
      if (!speechDetectedRef.current) {
        stopListeningAndSearch('noInput');
      }
    }, NO_INPUT_TIMEOUT_MS);

    // 2. silenceTimer — initial start; resets on every onresult
    resetSilenceTimer();

    // 3. hardCapTimer — absolute ceiling, never reset
    hardCapTimerRef.current = setTimeout(() => {
      hardCapTimerRef.current = null;
      stopListeningAndSearch('hardCap');
    }, HARD_CAP_TIMEOUT_MS);
  }, [voiceState, isSearching, resetSilenceTimer, stopListeningAndSearch, clearAllTimers]);

  // ── Manual close (✕ button) ───────────────────────────────────────────────
  const handleClose = useCallback(() => {
    stopListeningAndSearch('manualClose');
  }, [stopListeningAndSearch]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearAllTimers();
      const rec = recognitionRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        rec.onspeechstart = null;
        try { rec.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, [clearAllTimers]);

  // ── Render ────────────────────────────────────────────────────────────────
  // null until feature detection resolves; null permanently if unsupported
  if (isSupported === null || !isSupported) return null;

  const isListening = voiceState === 'listening';
  const isSearchingVoice = voiceState === 'searching';

  return (
    <>
      {/* ── Listening overlay: pulsing mic + live transcript + ✕ close ─────── */}
      {isListening && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{ background: 'rgba(10, 22, 45, 0.92)', backdropFilter: 'blur(8px)' }}
        >
          {/* Pulsing ring behind mic */}
          <div className="relative mb-8">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(24, 95, 165, 0.4)', animationDuration: '1.4s' }}
            />
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #1e72c8 0%, #0e3f73 100%)',
                boxShadow: '0 0 36px rgba(24, 95, 165, 0.6)',
              }}
            >
              <Mic className="w-9 h-9 text-white" strokeWidth={1.8} />
            </div>
          </div>

          {/* Live transcript */}
          <div className="px-8 w-full max-w-sm text-center mb-10 min-h-[80px] flex items-center justify-center">
            {liveTranscript ? (
              <p
                className="text-white text-2xl font-bold leading-snug"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
              >
                {liveTranscript}
              </p>
            ) : (
              <p className="text-blue-200 text-lg font-medium opacity-70">
                Listening…
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Brief "Searching…" flash (searching state) ──────────────────────── */}
      {isSearchingVoice && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(10, 22, 45, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="flex items-center gap-3 px-7 py-4 rounded-2xl"
            style={{
              background: 'rgba(24, 95, 165, 0.92)',
              boxShadow: '0 8px 32px rgba(24, 95, 165, 0.45)',
            }}
          >
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-base font-semibold tracking-wide">
              Searching…
            </span>
          </div>
        </div>
      )}

      {/* ── Mic trigger button / Close button (inline in search bar) ────────────── */}
      <button
        id={isListening ? "voice-search-close" : "voice-search-mic"}
        onClick={isListening ? handleClose : startListening}
        disabled={isSearchingVoice || isSearching}
        aria-label={isListening ? "Stop voice search" : "Search by voice"}
        className="absolute right-1 top-1/2 -translate-y-1/2 z-[70] flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          width: '44px',
          height: '44px',
          background: isListening ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: isListening ? '2px solid rgba(255,255,255,0.22)' : 'none',
        }}
      >
        {isListening ? (
          <X className="w-6 h-6 text-white" strokeWidth={2.5} />
        ) : (
          <Mic className="w-5 h-5 text-[#185FA5]" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
