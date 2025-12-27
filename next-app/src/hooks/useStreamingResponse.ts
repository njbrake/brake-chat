'use client';

import { useState, useCallback, useRef } from 'react';

interface StreamingState {
  content: string;
  isStreaming: boolean;
  error: Error | null;
  done: boolean;
}

interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

interface OpenAIStreamDelta {
  choices?: Array<{
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
}

export function useStreamingResponse(options: StreamingOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    content: '',
    isStreaming: false,
    error: null,
    done: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      content: '',
      isStreaming: false,
      error: null,
      done: false,
    });
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState((prev) => ({ ...prev, isStreaming: false }));
    }
  }, []);

  const streamResponse = useCallback(
    async (response: Response) => {
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      setState({
        content: '',
        isStreaming: true,
        error: null,
        done: false,
      });

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed: OpenAIStreamDelta = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;

                if (delta) {
                  fullContent += delta;
                  setState((prev) => ({
                    ...prev,
                    content: fullContent,
                  }));
                  options.onChunk?.(delta);
                }
              } catch {
                // Ignore parse errors for incomplete JSON chunks
              }
            }
          }
        }

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          done: true,
        }));

        options.onComplete?.(fullContent);
        return fullContent;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (err.name !== 'AbortError') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: err,
          }));
          options.onError?.(err);
        }

        throw err;
      }
    },
    [options]
  );

  const streamFromUrl = useCallback(
    async (
      url: string,
      requestOptions: RequestInit = {}
    ): Promise<string> => {
      abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...requestOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return streamResponse(response);
    },
    [abort, streamResponse]
  );

  return {
    ...state,
    streamResponse,
    streamFromUrl,
    reset,
    abort,
  };
}
