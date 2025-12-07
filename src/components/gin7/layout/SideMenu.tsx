'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  MapIcon,
  UserCircleIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';

interface SideMenuProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  isActive: boolean;
  badge?: number;
}

function MenuItem({ href, icon, label, collapsed, isActive, badge }: MenuItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-primary/20 text-primary border-l-2 border-primary' 
          : 'text-foreground-muted hover:bg-white/5 hover:text-foreground border-l-2 border-transparent'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!collapsed && (
        <>
          <span className="text-sm font-medium flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-hud-alert rounded-full text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-hud-alert rounded-full" />
      )}
    </Link>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
}

function MenuSection({ title, children, collapsed }: MenuSectionProps) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-foreground-dim font-semibold">
          {title}
        </p>
      )}
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );
}

export default function SideMenu({ collapsed, onToggle }: SideMenuProps) {
  const pathname = usePathname();
  const [mailCount] = useState(3); // TODO: 실제 메일 카운트 연동

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <aside
      className={`
        fixed left-0 top-14 h-[calc(100vh-56px)] bg-space-panel/80 backdrop-blur-sm
        border-r border-white/5 transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* 메뉴 영역 */}
        <div className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <MenuSection title="전략" collapsed={collapsed}>
            <MenuItem
              href="/gin7"
              icon={<GlobeAltIcon />}
              label="전략 맵"
              collapsed={collapsed}
              isActive={isActive('/gin7') && pathname === '/gin7'}
            />
            <MenuItem
              href="/gin7/map"
              icon={<MapIcon />}
              label="은하 지도"
              collapsed={collapsed}
              isActive={isActive('/gin7/map')}
            />
            <MenuItem
              href="/gin7/operations"
              icon={<CommandLineIcon />}
              label="작전"
              collapsed={collapsed}
              isActive={isActive('/gin7/operations')}
            />
          </MenuSection>

          <MenuSection title="캐릭터" collapsed={collapsed}>
            <MenuItem
              href="/gin7/character"
              icon={<UserCircleIcon />}
              label="내 캐릭터"
              collapsed={collapsed}
              isActive={isActive('/gin7/character')}
            />
            <MenuItem
              href="/gin7/fleet"
              icon={<RocketLaunchIcon />}
              label="함대"
              collapsed={collapsed}
              isActive={isActive('/gin7/fleet')}
            />
            <MenuItem
              href="/gin7/authority"
              icon={<ShieldCheckIcon />}
              label="권한 카드"
              collapsed={collapsed}
              isActive={isActive('/gin7/authority')}
            />
          </MenuSection>

          <MenuSection title="조직" collapsed={collapsed}>
            <MenuItem
              href="/gin7/personnel"
              icon={<UserGroupIcon />}
              label="인사"
              collapsed={collapsed}
              isActive={isActive('/gin7/personnel')}
            />
            <MenuItem
              href="/gin7/politics"
              icon={<BuildingLibraryIcon />}
              label="정치"
              collapsed={collapsed}
              isActive={isActive('/gin7/politics')}
            />
          </MenuSection>

          <MenuSection title="커뮤니케이션" collapsed={collapsed}>
            <MenuItem
              href="/gin7/mail"
              icon={<EnvelopeIcon />}
              label="메일"
              collapsed={collapsed}
              isActive={isActive('/gin7/mail')}
              badge={mailCount}
            />
          </MenuSection>
        </div>

        {/* 하단 영역: 설정 & 접기 버튼 */}
        <div className="border-t border-white/5 p-2">
          <MenuItem
            href="/gin7/settings"
            icon={<Cog6ToothIcon />}
            label="설정"
            collapsed={collapsed}
            isActive={isActive('/gin7/settings')}
          />
          
          <button
            onClick={onToggle}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg
              text-foreground-muted hover:bg-white/5 hover:text-foreground transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="w-5 h-5" />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium">접기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

