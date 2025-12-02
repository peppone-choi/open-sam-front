'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterPanelProps {
  children?: React.ReactNode;
  className?: string;
}

export function FilterPanel({ children, className }: FilterPanelProps) {
  return (
    <div
      className={cn(
        'bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg',
        'flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface FilterSelectProps {
  label: string;
  value: string | number;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white min-w-[120px]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface FilterInputProps {
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
}

export function FilterInput({
  label,
  value,
  placeholder,
  onChange,
  onSubmit,
  className,
}: FilterInputProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-1 min-w-[200px]', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-500"
      />
    </div>
  );
}

export interface FilterTabsProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterTabs({ value, options, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(String(opt.value))}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-bold transition-all duration-200',
            String(value) === String(opt.value)
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export interface FilterButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function FilterButton({
  children,
  onClick,
  variant = 'primary',
  className,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-6 py-2 rounded-lg text-sm font-semibold transition-colors',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-500'
          : 'border border-white/10 text-gray-100 hover:border-blue-500/40 hover:text-white',
        className
      )}
    >
      {children}
    </button>
  );
}


