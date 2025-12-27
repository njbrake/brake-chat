'use client';

import { useState, useEffect } from 'react';
import { useDataStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';
import type { Prompt } from '@/types';

export default function PromptsPage() {
  const prompts = useDataStore((s) => s.prompts);
  const setPrompts = useDataStore((s) => s.setPrompts);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPrompts = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${WEBUI_API_BASE_URL}/prompts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setPrompts(data);
        }
      } catch (error) {
        console.error('Failed to load prompts:', error);
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [setPrompts]);

  const filteredPrompts = (prompts || []).filter(
    (prompt: Prompt) =>
      prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.command?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Prompts</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition">
          <Plus className="size-4" />
          Create Prompt
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filteredPrompts.map((prompt: Prompt) => (
          <div
            key={prompt.command}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <MessageSquare className="size-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{prompt.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">/{prompt.command}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <Pencil className="size-4" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-red-500">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredPrompts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No prompts found</div>
        )}
      </div>
    </div>
  );
}
