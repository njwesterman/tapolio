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
      const result = event.results.item(event.resultIndex);
      if (!result) return;

      const text = result.item(0).transcript;

      if (result.isFinal) {
        setTranscript((prev) => {
          const updated = (prev + " " + text).trim();
          if (onFinalChunk) onFinalChunk(updated);
          return updated;
        });
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
      setIsListening(false);

      if (keepListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (err) {
          console.warn("Restart failed, will retry next time", err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [lang, continuous, interimResults, onFinalChunk]);

  // ---------- controls ----------
  const startListening = () => {
    if (!recognitionRef.current) return;

    setError(null);
    keepListeningRef.current = true;

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

  const resetTranscript = () => setTranscript("");

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
