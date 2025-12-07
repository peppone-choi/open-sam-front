'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  CommandLineIcon,
  MapIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  allHelpArticles,
  searchArticles,
  getArticlesByCategory,
  getFaqArticles,
} from '@/data/gin7/tutorials/help-articles';
import type { HelpArticle, TutorialCategory } from '@/types/gin7/tutorial';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig: Record<TutorialCategory, { icon: typeof BookOpenIcon; label: string; color: string }> = {
  basics: { icon: BookOpenIcon, label: '기본 조작', color: 'text-blue-400' },
  map: { icon: MapIcon, label: '은하 지도', color: 'text-emerald-400' },
  fleet: { icon: UserGroupIcon, label: '함대 관리', color: 'text-amber-400' },
  combat: { icon: ShieldCheckIcon, label: '전투', color: 'text-red-400' },
  economy: { icon: CurrencyDollarIcon, label: '경제', color: 'text-yellow-400' },
  politics: { icon: BookOpenIcon, label: '정치', color: 'text-purple-400' },
  advanced: { icon: CommandLineIcon, label: '고급', color: 'text-cyan-400' },
};

export default function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | 'faq' | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchArticles(searchQuery);
  }, [searchQuery]);

  // 현재 표시할 문서 목록
  const displayedArticles = useMemo(() => {
    if (searchQuery.trim()) return searchResults;
    if (selectedCategory === 'faq') return getFaqArticles();
    if (selectedCategory) return getArticlesByCategory(selectedCategory);
    return [];
  }, [searchQuery, searchResults, selectedCategory]);

  // 카테고리 선택
  const handleCategorySelect = useCallback((category: TutorialCategory | 'faq') => {
    setSelectedCategory(category);
    setSelectedArticle(null);
    setSearchQuery('');
  }, []);

  // 문서 선택
  const handleArticleSelect = useCallback((article: HelpArticle) => {
    setSelectedArticle(article);
  }, []);

  // 뒤로가기
  const handleBack = useCallback(() => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else {
      setSelectedCategory(null);
    }
  }, [selectedArticle]);

  // ESC로 닫기
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedArticle) {
        setSelectedArticle(null);
      } else if (selectedCategory) {
        setSelectedCategory(null);
      } else {
        onClose();
      }
    }
  }, [selectedArticle, selectedCategory, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center"
        onKeyDown={handleKeyDown}
      >
        {/* 배경 */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* 모달 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl h-[80vh] mx-4 rounded-2xl border border-white/10 bg-space-panel/95 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {(selectedCategory || selectedArticle) && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 rotate-180 text-foreground-muted" />
                </button>
              )}
              <QuestionMarkCircleIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">도움말 센터</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>

          {/* 검색 */}
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="도움말 검색..."
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-foreground placeholder:text-foreground-muted',
                  'focus:outline-none focus:border-primary/50'
                )}
              />
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-hidden">
            {selectedArticle ? (
              <ArticleView article={selectedArticle} />
            ) : selectedCategory || searchQuery.trim() ? (
              <ArticleList
                articles={displayedArticles}
                onSelect={handleArticleSelect}
                searchQuery={searchQuery}
              />
            ) : (
              <CategoryGrid onSelect={handleCategorySelect} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** 카테고리 그리드 */
function CategoryGrid({ onSelect }: { onSelect: (category: TutorialCategory | 'faq') => void }) {
  const categories: (TutorialCategory | 'faq')[] = [
    'basics', 'map', 'fleet', 'combat', 'economy', 'faq'
  ];

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((cat) => {
        const isFaq = cat === 'faq';
        const config = isFaq
          ? { icon: QuestionMarkCircleIcon, label: 'FAQ', color: 'text-pink-400' }
          : categoryConfig[cat];
        const Icon = config.icon;
        const articleCount = isFaq
          ? getFaqArticles().length
          : getArticlesByCategory(cat as TutorialCategory).length;

        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'p-6 rounded-xl border border-white/10 bg-white/5',
              'hover:bg-white/10 hover:border-white/20 transition-all',
              'flex flex-col items-center gap-3 text-center'
            )}
          >
            <div className={cn('p-3 rounded-xl bg-white/5', config.color)}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{config.label}</h3>
              <p className="text-sm text-foreground-muted">{articleCount}개 문서</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** 문서 목록 */
function ArticleList({
  articles,
  onSelect,
  searchQuery,
}: {
  articles: HelpArticle[];
  onSelect: (article: HelpArticle) => void;
  searchQuery: string;
}) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MagnifyingGlassIcon className="w-16 h-16 text-foreground-muted mb-4" />
        <p className="text-foreground-muted">
          {searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : '문서가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 overflow-y-auto h-full">
      {articles.map((article) => {
        const config = categoryConfig[article.category];
        const Icon = config?.icon || BookOpenIcon;

        return (
          <button
            key={article.id}
            onClick={() => onSelect(article)}
            className={cn(
              'w-full p-4 rounded-xl border border-white/5 bg-white/5',
              'hover:bg-white/10 hover:border-white/10 transition-all',
              'flex items-center gap-4 text-left'
            )}
          >
            <div className={cn('p-2 rounded-lg bg-white/5', config?.color || 'text-foreground-muted')}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{article.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-foreground-muted">{config?.label}</span>
                <span className="text-xs text-foreground-muted">·</span>
                <div className="flex gap-1 flex-wrap">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-foreground-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-foreground-muted" />
          </button>
        );
      })}
    </div>
  );
}

/** 문서 뷰어 */
function ArticleView({ article }: { article: HelpArticle }) {
  const config = categoryConfig[article.category];

  return (
    <div className="h-full overflow-y-auto">
      {/* 문서 헤더 */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-sm font-medium', config?.color)}>
            {config?.label}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
        <div className="flex gap-2 mt-3">
          {article.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/10 text-foreground-muted">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 문서 내용 */}
      <div className="p-6 prose prose-invert prose-sm max-w-none">
        <MarkdownContent content={article.content} />
      </div>
    </div>
  );
}

/** 간단한 마크다운 렌더러 */
function MarkdownContent({ content }: { content: string }) {
  // 기본적인 마크다운 파싱
  const html = useMemo(() => {
    let result = content
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-foreground mt-4 mb-4">$1</h1>')
      // Bold & Italic
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-primary font-mono text-sm">$1</code>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-foreground-muted">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-foreground-muted list-decimal">$1</li>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => c.trim().match(/^-+$/))) {
          return ''; // 구분선 제거
        }
        const isHeader = !content.slice(0, content.indexOf(match)).includes('|---|');
        const tag = isHeader ? 'th' : 'td';
        const cellClass = isHeader 
          ? 'px-3 py-2 text-left font-semibold text-foreground bg-white/5' 
          : 'px-3 py-2 text-foreground-muted border-t border-white/5';
        return `<tr>${cells.map(c => `<${tag} class="${cellClass}">${c.trim()}</${tag}>`).join('')}</tr>`;
      })
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-foreground-muted leading-relaxed mb-4">')
      // Line breaks
      .replace(/\n/g, '<br/>');

    // Wrap tables
    result = result.replace(/<tr>/g, '<table class="w-full border border-white/10 rounded-lg overflow-hidden mb-4"><tbody><tr>');
    result = result.replace(/<\/tr>(?![\s\S]*<tr>)/g, '</tr></tbody></table>');

    return `<p class="text-foreground-muted leading-relaxed mb-4">${result}</p>`;
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}








