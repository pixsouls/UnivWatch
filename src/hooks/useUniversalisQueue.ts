import { useCallback } from 'react';

// Define what a request looks like
interface ApiRequest {
  id: string;
  url: string;
  resolve: (data: any) => void;
  reject: (err: any) => void;
}

const DELAY_MS = 200; // Stagger time for reducing API call spam
let queue: ApiRequest[] = [];
let isProcessing = false;

export const useUniversalisQueue = () => {
  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const request = queue.shift();

    if (request) {
      try {
        const response = await fetch(request.url);
        const data = await response.json();
        request.resolve(data);
      } catch (err) {
        request.reject(err);
      }
    }

    // Wait before allowing the next request
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, DELAY_MS);
  };

  const fetchQueued = useCallback((url: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      queue.push({ id: Math.random().toString(), url, resolve, reject });
      processQueue();
    });
  }, []);

  return { fetchQueued };
};