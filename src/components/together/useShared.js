import { useCallback, useEffect, useRef, useState } from 'react';
import { realtime } from '../../services/realtime';

/**
 * State shared between the two phones on a call.
 * `dispatch(action)` applies the action here and sends it (encrypted) to the other phone,
 * which applies the same action. Reducers must be deterministic: any randomness
 * (dice rolls, card shuffles) is decided by the sender and carried inside the action.
 * With `shared = false` (playing on one phone) it behaves like a plain useReducer.
 */
export function useShared(activityId, reducer, initial, shared) {
  const [state, setState] = useState(initial);
  const reducerRef = useRef(reducer);
  reducerRef.current = reducer;

  useEffect(() => {
    if (!shared) return undefined;
    return realtime.on('activity', (body) => {
      if (body.id === activityId) setState(s => reducerRef.current(s, body.action));
    });
  }, [activityId, shared]);

  const dispatch = useCallback((action) => {
    setState(s => reducerRef.current(s, action));
    if (shared) realtime.sendActivity({ id: activityId, action });
  }, [activityId, shared]);

  return [state, dispatch];
}

// Listen to raw activity events (for things like drawing strokes that aren't reducer state)
export function useActivityEvents(activityId, onEvent, shared) {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    if (!shared) return undefined;
    return realtime.on('activity', (body) => {
      if (body.id === activityId) cb.current(body.action);
    });
  }, [activityId, shared]);
  return useCallback((action) => { if (shared) realtime.sendActivity({ id: activityId, action }); }, [activityId, shared]);
}

// Small seeded RNG so both phones shuffle cards identically
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
