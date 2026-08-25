'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Category = {
  id: string;
  name: string;
};

export default function SupabaseTestPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setCategories(data ?? []);
      setLoading(false);
    }

    loadCategories();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Supabase Connection Test
      </h1>

      {loading && (
        <p className="mt-4">
          Loading categories...
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <strong>Supabase Error:</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6">
          <p className="mb-4 text-green-600">
            ✅ Supabase connected successfully!
          </p>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border p-3"
              >
                {category.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}