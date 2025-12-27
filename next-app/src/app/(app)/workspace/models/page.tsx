'use client';

import { useState, useEffect } from 'react';
import { useAppStore, useDataStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Model } from '@/types';

export default function ModelsPage() {
  const config = useAppStore((s) => s.config);
  const settings = useAppStore((s) => s.settings);
  const models = useDataStore((s) => s.models);
  const setModels = useDataStore((s) => s.setModels);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const directConnections =
          config?.features?.enable_direct_connections && (settings?.directConnections ?? null);
        const url = directConnections
          ? `${WEBUI_API_BASE_URL}/models?direct_connections=${encodeURIComponent(JSON.stringify(directConnections))}`
          : `${WEBUI_API_BASE_URL}/models`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setModels(data);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [config, settings, setModels]);

  const filteredModels = models.filter(
    (model) =>
      model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-2xl font-semibold">Models</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition">
          <Plus className="size-4" />
          Create Model
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filteredModels.map((model: Model) => (
          <div
            key={model.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-1">
              <div className="font-medium">{model.name || model.id}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{model.id}</div>
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
        {filteredModels.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No models found</div>
        )}
      </div>
    </div>
  );
}
