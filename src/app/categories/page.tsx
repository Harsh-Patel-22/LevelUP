'use client';

import { useEffect, useState, useCallback } from 'react';
import { Layers, Plus, Sparkles, X, Check } from 'lucide-react';
import { calculateCategoryLevel } from '@/lib/xp';

interface CategoryData {
  id: number;
  name: string;
  icon: string;
  color: string;
  total_xp: number;
  active_tasks_count: number;
}

const PRESET_COLORS = [
  '#4f8ef7', // Electric Blue
  '#22d3ee', // Cyan
  '#7c3aed', // Violet
  '#f59e0b', // Gold / Amber
  '#ef4444', // Red
  '#10b981', // Emerald
  '#ec4899', // Pink
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('💻');
  const [formColor, setFormColor] = useState('#4f8ef7');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormName('');
        fetchCategories();
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to create category');
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="system-panel rounded-xl p-6 border-solo-blue/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-solo-cyan" />
            <h1 className="font-orbitron font-extrabold text-2xl text-text-primary">
              Skill Domains
            </h1>
          </div>
          <p className="font-rajdhani text-xs text-text-muted mt-1">
            Categories group your tasks and level up independently based on earned XP.
          </p>
        </div>

        <button
          onClick={() => {
            setFormName('');
            setFormIcon('⚡');
            setFormColor('#4f8ef7');
            setFormError('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-solo-blue to-solo-cyan text-black font-orbitron font-extrabold text-xs uppercase tracking-wider shadow-solo-blue hover:opacity-90 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Domain
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-36 bg-surface-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="system-panel rounded-xl p-12 text-center border-dashed border-surface-border">
          <Layers className="w-12 h-12 text-text-dim mx-auto mb-3" />
          <h3 className="font-orbitron text-base text-text-muted font-bold">No Categories Configured</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const xp = Number(cat.total_xp || 0);
            const levelInfo = calculateCategoryLevel(xp);
            return (
              <div
                key={cat.id}
                className="system-panel rounded-xl p-5 border-surface-border hover:border-solo-blue/40 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Glow bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: cat.color }}
                />

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}40`,
                      }}
                    >
                      {cat.icon || '⚡'}
                    </div>
                    <div>
                      <h3 className="font-orbitron font-bold text-lg text-text-primary">
                        {cat.name}
                      </h3>
                      <span className="text-xs font-rajdhani text-text-muted">
                        {cat.active_tasks_count} active task(s)
                      </span>
                    </div>
                  </div>

                  <span
                    className="font-orbitron font-extrabold text-xs px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      borderColor: `${cat.color}50`,
                      color: cat.color,
                    }}
                  >
                    LV. {levelInfo.level}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-rajdhani font-semibold">
                    <span className="text-text-muted">Total Domain XP:</span>
                    <span className="text-solo-cyan font-orbitron">{xp.toLocaleString()} XP</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-surface-border">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${levelInfo.progressPercent}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>

                  <div className="text-[11px] font-rajdhani text-text-muted text-right">
                    {levelInfo.currentLevelXP} / {levelInfo.xpForNextLevel} XP to Next Level
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="system-panel-glow w-full max-w-md rounded-2xl p-6 border-solo-blue relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-orbitron font-extrabold text-xl text-text-primary mb-4">
              New Skill Domain
            </h2>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-solo-danger/10 border border-solo-danger/30 text-solo-danger text-xs font-rajdhani font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4 font-rajdhani font-semibold">
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fitness, Reading, Strategy"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-solo-blue focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="e.g. 💻, ⚔️, 📚, 🧠"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-solo-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        formColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formColor === c && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-text-muted text-xs uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-solo-blue hover:bg-solo-blue/90 text-black font-orbitron font-extrabold text-xs uppercase tracking-wider shadow-solo-blue"
                >
                  {submitting ? 'Creating...' : 'Create Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
