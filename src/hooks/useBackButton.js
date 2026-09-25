import { useEffect, useRef } from 'react';

/**
 * Lets the Android back button (and browser back) close the top-most screen or sheet.
 * Each layer pushes its own history entry; on back, only the top layer closes.
 * When a layer is closed by a button instead, we step history back ourselves and
 * that pop is ignored, so it can't accidentally close the layer underneath.
 */
let programmaticBacks = 0;
let ignoringPop = false;
const layers = [];

if (typeof window !== 'undefined') {
  // Registered once, before any layer listener, so it sees each popstate first
  window.addEventListener('popstate', () => {
    if (programmaticBacks > 0) {
      programmaticBacks--;
      ignoringPop = true;
      setTimeout(() => { ignoringPop = false; }, 0);
    }
  });
}

export function useBackButton(onBack) {
  const token = useRef(Math.random().toString(36).slice(2));
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const closedByBack = useRef(false);

  useEffect(() => {
    const myToken = token.current;
    window.history.pushState({ kinnectLayer: myToken }, '');
    layers.push(myToken);

    const onPop = () => {
      if (ignoringPop) return;
      if (layers[layers.length - 1] !== myToken) return; // only the top layer closes
      closedByBack.current = true;
      onBackRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      const i = layers.lastIndexOf(myToken);
      if (i !== -1) layers.splice(i, 1);
      // Closed by a button rather than back → drop our history entry quietly
      if (!closedByBack.current) {
        programmaticBacks++;
        window.history.back();
      }
    };
  }, []);

  // Close via the button: same path as pressing back
  return () => {
    closedByBack.current = true;
    onBackRef.current();
    programmaticBacks++;
    window.history.back();
  };
}
