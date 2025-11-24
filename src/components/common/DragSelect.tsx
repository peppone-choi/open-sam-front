'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface DragSelectProps {
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onDragStart?: () => void;
  onDragEnd?: (selectedIds: number[]) => void; // Using number IDs based on usage
  children: (props: { selected: Set<number>; isDragging: boolean }) => React.ReactNode;
}

export default function DragSelect({
  disabled = false,
  className,
  style,
  onDragStart,
  onDragEnd,
  children,
}: DragSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Handle mouse down to start drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    // Only left click
    if (e.button !== 0) return;
    
    e.preventDefault(); // Prevent text selection
    
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    setSelectedIds(new Set());
    onDragStart?.();
    
    // Initial check for the item under cursor
    checkSelection(e.clientX, e.clientY, e.clientX, e.clientY);
  };

  // Handle global mouse move and up
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPos.current) return;
      checkSelection(
        Math.min(startPos.current.x, e.clientX),
        Math.min(startPos.current.y, e.clientY),
        Math.max(startPos.current.x, e.clientX),
        Math.max(startPos.current.y, e.clientY)
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      startPos.current = null;
      onDragEnd?.(Array.from(selectedIds));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedIds, onDragEnd]);

  const checkSelection = (x1: number, y1: number, x2: number, y2: number) => {
    if (!containerRef.current) return;

    const newSelected = new Set<number>();
    const elements = containerRef.current.querySelectorAll('[data-drag-id]');

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Check intersection
      if (
        rect.left < x2 &&
        rect.right > x1 &&
        rect.top < y2 &&
        rect.bottom > y1
      ) {
        const id = parseInt(el.getAttribute('data-drag-id') || '', 10);
        if (!isNaN(id)) {
          newSelected.add(id);
        }
      }
    });

    // Only update if changed to avoid render thrashing
    // But Set comparison is O(N). For small N (50 turns) it's fine.
    let changed = false;
    if (newSelected.size !== selectedIds.size) {
        changed = true;
    } else {
        for (const id of newSelected) {
            if (!selectedIds.has(id)) {
                changed = true;
                break;
            }
        }
    }

    if (changed) {
        setSelectedIds(newSelected);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ userSelect: 'none', ...style }}
      onMouseDown={handleMouseDown}
    >
      {children({ selected: selectedIds, isDragging })}
    </div>
  );
}


