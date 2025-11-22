'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlobalMenu, { type MenuItem } from './GlobalMenu';
import MainControlBar, { type MainControlBarProps } from './MainControlBar';
import type { ColorSystem } from '@/types/colorSystem';
import { cn } from '@/lib/utils';

type DrawerType = 'global' | 'nation' | 'quick' | null;

interface GameBottomBarProps {
  onRefresh: () => void;
  isLoading?: boolean;
  nationColor?: string;
  colorSystem?: ColorSystem;
  globalMenu?: MenuItem[];
  globalInfo?: Record<string, any>;
  onMenuClick?: (funcCall: string) => void;
  mainControlProps?: MainControlBarProps | null;
}

export default function GameBottomBar({
  onRefresh,
  isLoading = false,
  nationColor,
  colorSystem,
  globalMenu = [],
  globalInfo,
  onMenuClick,
  mainControlProps,
}: GameBottomBarProps) {
  const router = useRouter();
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  const barBgColor = nationColor ? `${nationColor}E6` : '#111827E6'; // 90% Opacity
  const barBorderColor = nationColor ? `${nationColor}60` : '#ffffff20';
  const drawerBgColor = colorSystem?.pageBg ?? '#111827';
  const drawerBorderColor = colorSystem?.border ?? '#333';

  const scrollToSelector = (selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveDrawer(null);
    }
  };

  const moveLobby = () => {
    router.push('/entrance');
  };

  const toggleDrawer = (type: DrawerType) => {
    setActiveDrawer((prev) => (prev === type ? null : type));
  };

  const closeDrawer = () => setActiveDrawer(null);

  const QuickMenuButton = ({ onClick, label, icon }: { onClick: () => void, label: string, icon?: React.ReactNode }) => (
    <button 
      onClick={onClick} 
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-background-tertiary/50 hover:bg-primary hover:text-white transition-colors border border-white/5 text-left group"
    >
      {icon && <span className="text-primary group-hover:text-white transition-colors">{icon}</span>}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2 mt-4 first:mt-0 px-1">
      {title}
    </div>
  );

  const renderQuickMenu = () => (
    <div className="flex flex-col gap-2 p-1">
      <SectionTitle title="국가 정보" />
      <div className="grid grid-cols-2 gap-2">
        <QuickMenuButton onClick={() => scrollToSelector('.nationNotice')} label="방침" />
        <QuickMenuButton onClick={() => scrollToSelector('#reservedCommandPanel')} label="명령" />
        <QuickMenuButton onClick={() => scrollToSelector('.nationInfo')} label="국가" />
        <QuickMenuButton onClick={() => scrollToSelector('.generalInfo')} label="장수" />
        <QuickMenuButton onClick={() => scrollToSelector('.cityInfo')} label="도시" />
      </div>
      
      <SectionTitle title="동향 정보" />
      <div className="grid grid-cols-2 gap-2">
        <QuickMenuButton onClick={() => scrollToSelector('.mapView')} label="지도" />
        <QuickMenuButton onClick={() => scrollToSelector('.PublicRecord')} label="동향" />
        <QuickMenuButton onClick={() => scrollToSelector('.GeneralLog')} label="개인" />
        <QuickMenuButton onClick={() => scrollToSelector('.WorldHistory')} label="정세" />
      </div>
      
      <SectionTitle title="메시지" />
      <div className="grid grid-cols-2 gap-2">
        <QuickMenuButton onClick={() => scrollToSelector('.PublicTalk')} label="전체" />
        <QuickMenuButton onClick={() => scrollToSelector('.NationalTalk')} label="국가" />
        <QuickMenuButton onClick={() => scrollToSelector('.PrivateTalk')} label="개인" />
        <QuickMenuButton onClick={() => scrollToSelector('.DiplomacyTalk')} label="외교" />
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10">
        <button 
          onClick={moveLobby} 
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          로비로 나가기
        </button>
      </div>
    </div>
  );

  const drawerTitleMap: Record<Exclude<DrawerType, null>, string> = {
    global: '외부 메뉴',
    nation: '국가 메뉴',
    quick: '빠른 이동',
  };

  const renderDrawerBody = () => {
    if (activeDrawer === 'global') {
      return globalMenu.length > 0 ? (
        <GlobalMenu
          menu={globalMenu}
          globalInfo={globalInfo}
          onMenuClick={onMenuClick}
          nationColor={nationColor}
          colorSystem={colorSystem}
        />
      ) : (
        <div className="text-center py-8 text-foreground-muted">표시할 메뉴가 없습니다.</div>
      );
    }

    if (activeDrawer === 'nation') {
      if (!mainControlProps) {
        return <div className="text-center py-8 text-foreground-muted">국가 메뉴를 불러올 수 없습니다.</div>;
      }
      return (
         <div className="bg-transparent">
            <MainControlBar {...mainControlProps} />
         </div>
      );
    }

    if (activeDrawer === 'quick') {
      return renderQuickMenu();
    }

    return null;
  };

  return (
    <>
      {/* Drawer Backdrop */}
      {activeDrawer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200" 
          onClick={closeDrawer}
        />
      )}
      
      {/* Drawer Content */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-in-out max-h-[85vh] overflow-hidden flex flex-col",
          activeDrawer ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          backgroundColor: drawerBgColor,
          borderColor: drawerBorderColor,
          borderTopWidth: '1px',
        }}
      >
        {activeDrawer && (
          <>
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full"></span>
                {drawerTitleMap[activeDrawer]}
              </h3>
              <button 
                type="button" 
                className="p-2 rounded-full hover:bg-white/10 transition-colors" 
                onClick={closeDrawer}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 overscroll-contain safe-area-bottom">
              {renderDrawerBody()}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
           "h-16 border-t backdrop-blur-xl flex items-center justify-around px-2 safe-area-bottom transition-all duration-300",
           "bg-background-main/90 border-white/10"
        )}
        style={{
           // If nationColor is provided, override the background with a tint
           backgroundColor: nationColor ? undefined : 'rgba(17, 24, 39, 0.9)', 
           ...(nationColor ? { background: `linear-gradient(to top, ${barBgColor}, rgba(17, 24, 39, 0.9))` } : {})
        }}
      >
        <NavButton 
           icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>}
           label="외부" 
           onClick={() => toggleDrawer('global')}
           active={activeDrawer === 'global'} 
        />
        
        <NavButton 
           icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a2.5 2.5 0 0 0-5 0V21"/></svg>}
           label="국가" 
           onClick={() => toggleDrawer('nation')}
           active={activeDrawer === 'nation'}
        />
        
        <div className="relative -top-5">
           <button 
             type="button" 
             className={cn(
               "w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-background-main transition-transform active:scale-95",
               isLoading ? "bg-background-tertiary animate-pulse" : "bg-primary hover:bg-primary-hover text-white"
             )}
             onClick={onRefresh}
             disabled={isLoading}
           >
             {isLoading ? (
               <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
             )}
           </button>
        </div>
        
        <NavButton 
           icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
           label="빠른" 
           onClick={() => toggleDrawer('quick')}
           active={activeDrawer === 'quick'}
        />
        
        <NavButton 
           icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
           label="로비" 
           onClick={moveLobby}
        />
      </nav>
    </>
  );
}

function NavButton({ icon, label, onClick, active = false }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
   return (
     <button 
       type="button" 
       onClick={onClick}
       className={cn(
         "flex flex-col items-center justify-center gap-1 w-16 h-full relative",
         active ? "text-primary" : "text-foreground-muted hover:text-white"
       )}
     >
       <div className={cn("p-1 rounded-lg transition-all", active && "bg-primary/10 scale-110")}>
         {icon}
       </div>
       <span className="text-[10px] font-medium">{label}</span>
       {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>}
     </button>
   );
}
