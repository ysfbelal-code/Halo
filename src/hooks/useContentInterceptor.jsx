import { useState, useCallback, useRef, useEffect } from "react";
import { scanContent, scanMultipleFields } from "@/lib/interceptor-config";

export function useContentInterceptor(protectionLevel) {
  const [blockedContent, setBlockedContent] = useState(null);
  const [blockCount, setBlockCount] = useState(0);
  const scanQueueRef = useRef([]);
  const isProcessingRef = useRef(false);

  const dismissBlock = useCallback(() => {
    setBlockedContent(null);
  }, []);

  const scanAndBlock = useCallback((text, metadata = {}) => {
    if (!text || protectionLevel === "none") return false;

    const result = scanContent(text, protectionLevel);
    if (result) {
      setBlockedContent({
        ...result,
        metadata,
        timestamp: Date.now(),
      });
      setBlockCount((prev) => prev + 1);
      return true;
    }

    return false;
  }, [protectionLevel]);

  const scanAndBlockFields = useCallback((fields) => {
    if (!fields || protectionLevel === "none") return false;

    const result = scanMultipleFields(fields, protectionLevel);
    if (result) {
      setBlockedContent({
        ...result,
        timestamp: Date.now(),
      });
      setBlockCount((prev) => prev + 1);
      return true;
    }

    return false;
  }, [protectionLevel]);

  const queueScan = useCallback((text, metadata = {}) => {
    if (!text || protectionLevel === "none") return false;

    scanQueueRef.current.push({ text, metadata });

    if (!isProcessingRef.current) {
      processQueue();
    }

    return true;
  }, [protectionLevel]);

  const processQueue = useCallback(() => {
    if (scanQueueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const item = scanQueueRef.current.shift();
    const blocked = scanAndBlock(item.text, item.metadata);

    if (!blocked) {
      requestAnimationFrame(() => processQueue());
    } else {
      scanQueueRef.current = [];
      isProcessingRef.current = false;
    }
  }, [scanAndBlock]);

  useEffect(() => {
    return () => {
      scanQueueRef.current = [];
      isProcessingRef.current = false;
    };
  }, []);

  return {
    blockedContent,
    blockCount,
    scanAndBlock,
    scanAndBlockFields,
    queueScan,
    dismissBlock,
    isActive: protectionLevel !== "none",
  };
}
