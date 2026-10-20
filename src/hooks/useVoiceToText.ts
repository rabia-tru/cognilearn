import { useState, useRef, useEffect, useCallback } from 'react';

interface UseVoiceToTextOptions {
  lang?: string;
  continuous?: boolean;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}) {
  const { lang = 'en-US', continuous = true, onTranscript, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onTextUpdate?: (text: string) => void) => {
      if (!isSupported) {
        const msg = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
        setError(msg);
        onError?.(msg);
        return;
      }

      // Stop any existing session
      stopListening();
      setError(null);

      try {
        const SpeechRecognitionClass =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();

        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentSessionText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentSessionText += event.results[i][0].transcript;
          }

          setTranscript(currentSessionText);
          if (onTextUpdate) {
            onTextUpdate(currentSessionText);
          } else if (onTranscript) {
            onTranscript(currentSessionText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          let userMsg = 'Microphone error occurred.';
          if (event.error === 'not-allowed') {
            userMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
          } else if (event.error === 'no-speech') {
            userMsg = 'No speech detected. Please speak into your microphone.';
          }
          setError(userMsg);
          onError?.(userMsg);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        const msg = err?.message || 'Could not access speech recognition.';
        setError(msg);
        onError?.(msg);
        setIsListening(false);
      }
    },
    [isSupported, lang, continuous, onTranscript, onError, stopListening]
  );

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}
