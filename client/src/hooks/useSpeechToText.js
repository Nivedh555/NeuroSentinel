import { useCallback, useMemo, useRef, useState } from "react";

export const useSpeechToText = ({ lang = "en-IN", onResult, onError }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const Recognition = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  const isSupported = !!Recognition;

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Recognition) {
      onError?.("unsupported");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onResult?.(transcript);
      }
    };

    recognition.onerror = (event) => {
      onError?.(event.error || "unknown");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [Recognition, lang, onError, onResult]);

  return {
    isSupported,
    isListening,
    start,
    stop,
  };
};
