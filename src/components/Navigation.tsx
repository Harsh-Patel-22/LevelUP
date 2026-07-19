'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ShieldAlert, CheckCircle2, LayoutDashboard, BarChart3, ListTodo, Layers, History, RefreshCw } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMsg, setAuditMsg] = useState<string | null>(null);

  const navItems = [
    { href: '/', label: 'Daily Quests', icon: LayoutDashboard },
    { href: '/stats', label: 'System Stats', icon: BarChart3 },
    { href: '/tasks', label: 'Quest Management', icon: ListTodo },
    { href: '/categories', label: 'Skill Domains', icon: Layers },
    { href: '/log', label: 'XP Audit Log', icon: History },
  ];

  const triggerAudit = async () => {
    setIsAuditing(true);
    setAuditMsg(null);
    try {
      const res = await fetch('/api/cron/penalty', { method: 'POST' });
      const data = await res.json();
      if (data.penalizedCount > 0) {
        setAuditMsg(`⚠️ Audit: Penalized ${data.penalizedCount} missed habit(s).`);
      } else {
        setAuditMsg('✅ Audit: All daily habits up to date!');
      }
    } catch (err) {
      setAuditMsg('❌ Audit check failed.');
    } finally {
      setIsAuditing(false);
      setTimeout(() => setAuditMsg(null), 5000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-solo-blue/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-solo-blue/10 border border-solo-blue/40 flex items-center justify-center text-solo-blue group-hover:shadow-solo-blue transition-all duration-300">
              <span className="font-orbitron font-extrabold text-xl tracking-wider">LV</span>
            </div>
            <div>
              <span className="font-orbitron font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-solo-blue via-solo-cyan to-solo-violet">
                SOLO LEVELING
              </span>
              <span className="block text-[10px] font-rajdhani uppercase tracking-widest text-text-muted">
                System Interface v1.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md font-rajdhani text-sm uppercase tracking-wider font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-solo-blue/15 text-solo-blue border border-solo-blue/40 shadow-sm'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-solo-cyan' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {auditMsg && (
              <span className="hidden sm:inline-block text-xs font-rajdhani font-semibold text-solo-cyan bg-surface px-2.5 py-1 rounded border border-solo-cyan/30 animate-fade-in">
                {auditMsg}
              </span>
            )}
            <button
              onClick={triggerAudit}
              disabled={isAuditing}
              title="Run Daily Streak Penalty Audit"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-rajdhani font-bold uppercase tracking-wider bg-solo-danger/10 text-solo-danger border border-solo-danger/30 hover:bg-solo-danger/20 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Run Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Submenu Nav */}
      <div className="md:hidden flex overflow-x-auto border-t border-surface-border px-2 py-1 space-x-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-rajdhani font-semibold whitespace-nowrap ${
                isActive ? 'bg-solo-blue/20 text-solo-cyan border border-solo-blue/40' : 'text-text-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
