'use client';

import { useEffect, useState, useCallback } from 'react';
import TaskCard, { TaskItem } from '@/components/TaskCard';
import { Plus, Filter, ListTodo, CheckCircle, Trash2, Edit3, X } from 'lucide-react';

interface CategoryItem {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // New / Edit Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<number>(0);
  const [formType, setFormType] = useState<'habit' | 'priority'>('habit');
  const [formWeight, setFormWeight] = useState<number>(2);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/categories')]);
      const tData = await tRes.json();
      const cData = await cRes.json();

      setTasks(tData.tasks || []);
      const cats: CategoryItem[] = cData.categories || [];
      setCategories(cats);
      if (cats.length > 0 && formCategory === 0) {
        setFormCategory(cats[0].id);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [formCategory]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    if (categories.length > 0) setFormCategory(categories[0].id);
    setFormType('habit');
    setFormWeight(2);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category_id);
    setFormType(task.type);
    setFormWeight(task.weight);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!formCategory) {
      setFormError('Category is required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingTask) {
        // Update
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            category_id: formCategory,
            weight: formWeight,
          }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchTasks();
        } else {
          const err = await res.json();
          setFormError(err.error || 'Failed to update task');
        }
      } else {
        // Create
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            category_id: formCategory,
            type: formType,
            weight: formWeight,
          }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchTasks();
        } else {
          const err = await res.json();
          setFormError(err.error || 'Failed to create task');
        }
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveTask = async (task: TaskItem) => {
    if (!confirm(`Are you sure you want to archive "${task.title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to archive task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && Number(t.category_id) !== Number(filterCategory)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="system-panel rounded-xl p-6 border-solo-blue/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-solo-cyan" />
            <h1 className="font-orbitron font-extrabold text-2xl text-text-primary">
              Quest Management
            </h1>
          </div>
          <p className="font-rajdhani text-xs text-text-muted mt-1">
            Configure habits and priority tasks across your skill domains.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-solo-blue to-solo-cyan text-black font-orbitron font-extrabold text-xs uppercase tracking-wider shadow-solo-blue hover:opacity-90 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add New Quest
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-surface/60 p-4 rounded-xl border border-surface-border">
        <div className="flex items-center gap-2 text-xs font-rajdhani font-bold text-text-muted">
          <Filter className="w-4 h-4 text-solo-cyan" /> Filter By:
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-surface border border-surface-border text-text-primary text-xs font-rajdhani font-semibold rounded-lg px-3 py-1.5 focus:border-solo-blue focus:outline-none"
        >
          <option value="all">All Types (Habits & Priorities)</option>
          <option value="habit">Daily Habits Only</option>
          <option value="priority">Priority Tasks Only</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-surface border border-surface-border text-text-primary text-xs font-rajdhani font-semibold rounded-lg px-3 py-1.5 focus:border-solo-blue focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="system-panel rounded-xl p-12 text-center border-dashed border-surface-border">
          <ListTodo className="w-12 h-12 text-text-dim mx-auto mb-3" />
          <h3 className="font-orbitron text-base text-text-muted font-bold">No Quests Found</h3>
          <p className="font-rajdhani text-xs text-text-muted mt-1">
            Create a task or change your filter selection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div key={t.id} className="relative group">
              <TaskCard
                task={t}
                onToggleComplete={async () => {}}
                onEdit={openEditModal}
                onArchive={handleArchiveTask}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="system-panel-glow w-full max-w-lg rounded-2xl p-6 border-solo-blue relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-orbitron font-extrabold text-xl text-text-primary mb-4">
              {editingTask ? 'Edit Quest Parameters' : 'Create New Quest'}
            </h2>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-solo-danger/10 border border-solo-danger/30 text-solo-danger text-xs font-rajdhani font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitTask} className="space-y-4 font-rajdhani font-semibold">
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
                  Quest Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Solve 2 LeetCode problems or Workout 30 mins"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-solo-blue focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
                    Skill Domain (Category)
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(Number(e.target.value))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-solo-blue focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!editingTask && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
                      Quest Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as 'habit' | 'priority')}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-solo-blue focus:outline-none"
                    >
                      <option value="habit">Daily Habit (Recurring)</option>
                      <option value="priority">Priority Task (One-off)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
                  Difficulty / XP Weight
                </label>
                <select
                  value={formWeight}
                  onChange={(e) => setFormWeight(Number(e.target.value))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-solo-blue focus:outline-none"
                >
                  <option value={1}>Routine (10 Base XP)</option>
                  <option value={2}>Normal (25 Base XP)</option>
                  <option value={3}>Important (50 Base XP)</option>
                  <option value={4}>Critical (100 Base XP)</option>
                </select>
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
                  {submitting ? 'Saving...' : editingTask ? 'Update Quest' : 'Register Quest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
