import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 60;

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4']
    .find(t => MediaRecorder.isTypeSupported?.(t)) || '';
}

/**
 * Record a short voice message. `onDone({ audio: dataUrl, duration })` is called when the
 * recording is sent (not when it's cancelled). Low bitrate keeps a minute under ~250 KB.
 */
export function useVoiceRecorder(onDone) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const recorder = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);
  const keep = useRef(false);
  const startedAt = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const cleanup = () => {
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
  };

  const start = useCallback(async () => {
    setError('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream.current, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 24000 });
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = () => {
        const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
        cleanup();
        if (!keep.current || !blob.size) return;
        const reader = new FileReader();
        reader.onload = () => onDoneRef.current({ audio: reader.result, duration });
        reader.readAsDataURL(blob);
      };
      recorder.current = rec;
      keep.current = false;
      startedAt.current = Date.now();
      setSeconds(0);
      rec.start(250);
      setRecording(true);
    } catch (e) {
      cleanup();
      setError('Microphone access is needed to record. Allow it for Kinnect in your phone settings.');
    }
  }, []);

  const finish = useCallback((send) => {
    keep.current = send;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    else cleanup();
  }, []);

  // Timer + automatic stop at the limit
  useEffect(() => {
    if (!recording) return undefined;
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS) finish(true);
    }, 250);
    return () => clearInterval(t);
  }, [recording, finish]);

  useEffect(() => () => { keep.current = false; recorder.current?.state === 'recording' && recorder.current.stop(); }, []);

  return { supported, recording, seconds, error, start, send: () => finish(true), cancel: () => finish(false), maxSeconds: MAX_SECONDS };
}
