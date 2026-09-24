import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for browser-native Speech-to-Text in the user's selected language
 * @param {string} speechCode - e.g. 'hi-IN', 'ta-IN', 'te-IN', 'en-IN'
 * @param {Function} onTranscript - Callback when new text is transcribed
 */
export function useSpeechToText(speechCode = 'en-IN', onTranscript = null) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const isSupported = Boolean(SpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError('');
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please try Google Chrome or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechCode;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const finalChunk = res[0].transcript;
            if (onTranscript) {
              onTranscript(finalChunk);
            }
          } else {
            currentTranscript += res[0].transcript;
          }
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          // just idle
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Could not start microphone: ' + (err.message || 'Unknown error'));
      setIsListening(false);
    }
  }, [SpeechRecognition, isSupported, speechCode, onTranscript]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
}
