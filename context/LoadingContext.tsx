"use client";

import BouncingBallLoader from "@/components/BouncingBallLoader";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type LoadingContextValue = {
  pendingApiRequests: number;
};

const LoadingContext = createContext<LoadingContextValue>({
  pendingApiRequests: 0,
});

const isApiRequest = (input: RequestInfo | URL) => {
  if (typeof window === "undefined") {
    return false;
  }

  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    const url = new URL(rawUrl, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith("/api/");
  } catch {
    return false;
  }
};

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [pendingApiRequests, setPendingApiRequests] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const pendingRef = useRef(0);
  const delayTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const startLoading = () => {
      pendingRef.current += 1;
      setPendingApiRequests(pendingRef.current);

      if (delayTimerRef.current === null) {
        delayTimerRef.current = window.setTimeout(() => {
          setShowOverlay(pendingRef.current > 0);
          delayTimerRef.current = null;
        }, 180);
      }
    };

    const stopLoading = () => {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setPendingApiRequests(pendingRef.current);

      if (pendingRef.current === 0) {
        if (delayTimerRef.current !== null) {
          window.clearTimeout(delayTimerRef.current);
          delayTimerRef.current = null;
        }

        setShowOverlay(false);
      }
    };

    const originalFetch = window.fetch.bind(window);
    const patchedFetch: typeof window.fetch = async (input, init) => {
      const shouldTrack = isApiRequest(input);

      if (shouldTrack) {
        startLoading();
      }

      try {
        return await originalFetch(input, init);
      } finally {
        if (shouldTrack) {
          stopLoading();
        }
      }
    };

    window.fetch = patchedFetch;

    return () => {
      if (window.fetch === patchedFetch) {
        window.fetch = originalFetch;
      }

      if (delayTimerRef.current !== null) {
        window.clearTimeout(delayTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({ pendingApiRequests }),
    [pendingApiRequests],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-6 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-surface/90 px-8 py-7 shadow-2xl">
            <BouncingBallLoader label="Loading..." />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
