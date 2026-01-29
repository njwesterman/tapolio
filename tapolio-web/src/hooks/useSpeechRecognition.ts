// ---------------- Web Speech API typings (minimal) ----------------

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  item(index: number): {
    transcript: string;
    confidence: number;
  };
  length: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

// ------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionType =
  | (SpeechRecognition & { interimResults?: boolean; continuous?: boolean })
  | any;

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalChunk?: (text: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = "en-US",
    continuous = true,
    interimResults = true,
    onFinalChunk,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // keep mic alive unless user stops manually
  const keepListeningRef = useRef(false);
  
  // Store callback in ref to avoid re-creating recognition on callback change
  const onFinalChunkRef = useRef(onFinalChunk);
  onFinalChunkRef.current = onFinalChunk;
  
  // Track which result indices we've already processed as final
  const processedIndicesRef = useRef<Set<number>>(new Set());
  
  // Accumulated final transcript (from already-finalized results)
  const accumulatedFinalRef = useRef<string>("");
  
  // Baseline index - ignore all results before this index (used after reset)
  const baselineIndexRef = useRef<number>(0);
  
  // Track the highest result index we've seen (for setting baseline on reset)
  const highestSeenIndexRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    // ---------- handle results ----------
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build transcript from all results
      // - Final results that we haven't processed yet -> add to accumulated
      // - The current interim result -> show at the end
      
      let newFinalText = "";
      let currentInterim = "";
      
      // Track the highest index we've seen
      if (event.results.length > highestSeenIndexRef.current) {
        highestSeenIndexRef.current = event.results.length;
      }
      
      // Only process results at or after the baseline index
      for (let i = baselineIndexRef.current; i < event.results.length; i++) {
        const result = event.results.item(i);
        if (!result) continue;
        
        const text = result.item(0).transcript;
        
        if (result.isFinal) {
          // Check if we already processed this index
          if (!processedIndicesRef.current.has(i)) {
            processedIndicesRef.current.add(i);
            newFinalText += text + " ";
          }
        } else {
          // This is the current interim result (usually only one at a time)
          currentInterim = text;
        }
      }
      
      // Add any new final text to our accumulated transcript
      if (newFinalText) {
        accumulatedFinalRef.current += newFinalText;
      }
      
      // Display: accumulated finals + current interim
      const displayTranscript = (accumulatedFinalRef.current + currentInterim).trim();
      setTranscript(displayTranscript);
      
      // If we have new final text, trigger the callback
      if (newFinalText.trim()) {
        const fullFinal = accumulatedFinalRef.current.trim();
        console.log("New final chunk:", newFinalText.trim(), "| Full:", fullFinal);
        
        if (onFinalChunkRef.current) {
          // Send the full accumulated transcript for context
          onFinalChunkRef.current(fullFinal);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition event:", event.error);
      
      // Only show critical errors to user
      // Ignore: no-speech, audio-capture, aborted (these are normal)
      const criticalErrors = ['not-allowed', 'service-not-allowed', 'network'];
      
      if (criticalErrors.includes(event.error)) {
        setError(event.error === 'not-allowed' 
          ? "Microphone permission denied" 
          : `Speech recognition error: ${event.error}`);
        setIsListening(false);
        keepListeningRef.current = false;
      }
      // For non-critical errors, just let it auto-restart
    };

    // ---------- auto-restart if stopped unexpectedly ----------
    recognition.onend = () => {
      console.log("Speech recognition ended, keepListening:", keepListeningRef.current);
      
      if (keepListeningRef.current) {
        // Don't set isListening to false - we're going to restart immediately
        // This prevents the UI/browser mic indicator from flickering
        setTimeout(() => {
          if (keepListeningRef.current && recognitionRef.current) {
            try {
              console.log("Restarting speech recognition...");
              recognition.start();
              // isListening should already be true, no need to set again
            } catch (err) {
              console.warn("Restart failed:", err);
              // Only set to false if we truly can't restart
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        }, 500); // Longer delay to reduce restart frequency
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      keepListeningRef.current = false;
      recognition.stop();
      recognitionRef.current = null;
    };
  // Don't include onFinalChunk in deps - we use a ref instead
  }, [lang, continuous, interimResults]);

  // ---------- controls ----------
  const startListening = () => {
    if (!recognitionRef.current) return;

    setError(null);
    keepListeningRef.current = true;
    // Clear tracking for new session
    processedIndicesRef.current.clear();
    accumulatedFinalRef.current = "";

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setError("Could not start recognition");
    }
  };

  const stopListening = () => {
    keepListeningRef.current = false;

    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const resetTranscript = () => {
    setTranscript("");
    processedIndicesRef.current.clear();
    accumulatedFinalRef.current = "";
    // Set baseline to ignore all results seen so far
    baselineIndexRef.current = highestSeenIndexRef.current;
    console.log("🔄 Transcript reset, new baseline:", baselineIndexRef.current);
  };

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
