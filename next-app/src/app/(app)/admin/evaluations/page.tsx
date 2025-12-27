'use client';

import { useState, useEffect } from 'react';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Eye, Trash2, ClipboardCheck } from 'lucide-react';

interface Evaluation {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at?: string;
  completed_at?: string;
}

export default function EvaluationsPage() {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadEvaluations = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${WEBUI_API_BASE_URL}/evaluations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setEvaluations(data);
        }
      } catch (error) {
        console.error('Failed to load evaluations:', error);
        setEvaluations([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, []);

  const filteredEvaluations = evaluations.filter(
    (evaluation) =>
      evaluation.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Evaluations</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition">
          <Plus className="size-4" />
          New Evaluation
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search evaluations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filteredEvaluations.map((evaluation) => (
          <div
            key={evaluation.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <ClipboardCheck className="size-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{evaluation.name}</div>
                {evaluation.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {evaluation.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(evaluation.status)}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <Eye className="size-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-red-500">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredEvaluations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No evaluations found
          </div>
        )}
      </div>
    </div>
  );
}
