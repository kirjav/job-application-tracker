import { useState, useEffect } from "react";

/**
 * Returns true when the given media query matches (e.g. small viewport).
 * @param {string} query - CSS media query, e.g. "(max-width: 768px)"
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    m.addEventListener("change", handler);
    setMatches(m.matches);
    return () => m.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
