'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SammoAPI, type GetFrontInfoResponse } from '@/lib/api/sammo';
import GameAppShell from '@/components/layout/GameAppShell';
import MainControlBar from '@/components/game/MainControlBar';
import GameBottomBar from '@/components/game/GameBottomBar';
import GlobalMenu from '@/components/game/GlobalMenu';
import { makeAccentColors } from '@/types/colorSystem';
import { cn } from '@/lib/utils';

// ColorSystem helpers (copied from game/page.tsx for consistency, ideally should be in a hook/util)
const DEFAULT_ACCENT = '#2563EB';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
}

function calculateLuminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0.5;

    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function normalizeHexColor(hex?: string): string {
    if (!hex) return DEFAULT_ACCENT;
    let value = hex.trim();
    if (!value.startsWith('#')) {
        value = `#${value}`;
    }
    if (value.length === 4) {
        const r = value[1];
        const g = value[2];
        const b = value[3];
        value = `#${r}${r}${g}${g}${b}${b}`;
    }
    if (value.length === 9) {
        value = `#${value.slice(1, 7)}`;
    }
    if (value.length !== 7) {
        return DEFAULT_ACCENT;
    }
    return value.toUpperCase();
}

function withAlpha(hex: string, alpha: number): string {
    const normalized = normalizeHexColor(hex).slice(1);
    const clampedAlpha = Math.min(1, Math.max(0, alpha));
    const alphaHex = Math.round(clampedAlpha * 255).toString(16).padStart(2, '0').toUpperCase();
    return `#${normalized}${alphaHex}`;
}

function mixColor(baseHex: string, accentHex: string, ratio: number): string {
    const base = hexToRgb(normalizeHexColor(baseHex));
    const accent = hexToRgb(normalizeHexColor(accentHex));
    if (!base || !accent) {
        return normalizeHexColor(accentHex);
    }
    const t = Math.min(1, Math.max(0, ratio));
    const r = Math.round(base.r * (1 - t) + accent.r * t);
    const g = Math.round(base.g * (1 - t) + accent.g * t);
    const b = Math.round(base.b * (1 - t) + accent.b * t);
    return rgbToHex(r, g, b);
}

function getButtonTextColor(hex: string): string {
    const luminance = calculateLuminance(hex);
    return luminance > 0.55 ? '#111827' : '#f8fafc';
}

function applyAlpha(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
}

interface GamePageLayoutProps {
    children: React.ReactNode;
}

export default function GamePageLayout({ children }: GamePageLayoutProps) {
    const params = useParams();
    const router = useRouter();
    const serverID = params?.server as string;

    const [frontInfo, setFrontInfo] = useState<GetFrontInfoResponse | null>(null);
    const [globalMenu, setGlobalMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverID) return;
        loadData();
    }, [serverID]);

    async function loadData() {
        try {
            setLoading(true);
            const [frontInfoData, menuData] = await Promise.all([
                SammoAPI.GeneralGetFrontInfo({
                    serverID,
                    lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    lastGeneralRecordID: 0,
                    lastPersonalHistoryID: 0,
                    lastGlobalHistoryID: 0,
                }),
                SammoAPI.GlobalGetMenu({ serverID }).catch(() => ({ success: true, menu: [] })),
            ]);

            if (!frontInfoData.success || !frontInfoData.general || !frontInfoData.general.no) {
                // Handle error or redirect
                return;
            }

            setFrontInfo(frontInfoData);
            if (menuData && menuData.success) {
                setGlobalMenu(menuData.menu || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const nationColor = frontInfo?.nation?.color;
    const colorSystem = useMemo(() => {
        if (!nationColor) {
            return {
                pageBg: '#050814',
                border: '#4b5563',
                borderLight: '#374151',
                buttonBg: '#2563eb',
                buttonHover: '#1d4ed8',
                buttonActive: '#1e40af',
                buttonText: '#f9fafb',
                activeBg: '#1e40af',
                text: '#e5e7eb',
                textMuted: '#9ca3af',
                textDim: '#6b7280',
                accent: '#38bdf8',
                accentBright: '#0ea5e9',
                success: '#22c55e',
                warning: '#facc15',
                error: '#ef4444',
                info: '#38bdf8',
                special: '#a855f7',
            };
        }

        const normalizedColor = normalizeHexColor(nationColor);
        const accentColors = makeAccentColors(normalizedColor);
        const buttonTextColor = getButtonTextColor(normalizedColor);
        const halo = applyAlpha(normalizedColor, 0.32);
        const subtleHalo = applyAlpha(normalizedColor, 0.18);
        const pageBase = mixColor('#05060c', normalizedColor, 0.35);
        const pageBg = `linear-gradient(135deg, ${pageBase} 0%, #03040b 55%), radial-gradient(circle at 18% 20%, ${halo} 0%, transparent 45%), radial-gradient(circle at 80% 10%, ${subtleHalo} 0%, transparent 40%)`;

        return {
            pageBg,
            border: withAlpha(normalizedColor, 0.65),
            borderLight: withAlpha(normalizedColor, 0.35),
            buttonBg: withAlpha(normalizedColor, 0.88),
            buttonHover: withAlpha(normalizedColor, 0.95),
            buttonActive: withAlpha(normalizedColor, 1),
            buttonText: buttonTextColor,
            activeBg: withAlpha(normalizedColor, 1),
            text: '#f8fafc',
            textMuted: '#bac4dc',
            textDim: '#7c869c',
            accent: normalizedColor,
            accentBright: accentColors.accentBright,
            success: accentColors.success,
            warning: accentColors.warning,
            error: accentColors.error,
            info: accentColors.info,
            special: accentColors.special,
        };
    }, [nationColor]);

    // Apply background
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.style.background = colorSystem.pageBg;
            return () => {
                document.body.style.background = '';
            };
        }
    }, [colorSystem.pageBg]);

    const showSecret = useMemo(() => {
        if (!frontInfo?.general) return false;
        return frontInfo.general.permission >= 1 || frontInfo.general.officerLevel >= 2;
    }, [frontInfo?.general?.permission, frontInfo?.general?.officerLevel]);

    const mainControlBarProps = useMemo(() => {
        if (!frontInfo?.general || !frontInfo?.nation) return null;
        return {
            permission: frontInfo.general.permission,
            showSecret,
            myLevel: frontInfo.general.officerLevel,
            nationLevel: frontInfo.nation.level,
            nationId: frontInfo.nation.id,
            nationColor: frontInfo.nation.color,
            isTournamentApplicationOpen: frontInfo.global.isTournamentApplicationOpen,
            isBettingActive: frontInfo.global.isBettingActive,
            colorSystem,
            hasCity: !!frontInfo.general.city, // city 필드가 존재하고 0이 아닌 경우 true
        };
    }, [
        frontInfo?.general?.permission,
        showSecret,
        frontInfo?.general?.officerLevel,
        frontInfo?.nation?.level,
        frontInfo?.nation?.id,
        frontInfo?.nation?.color,
        frontInfo?.global?.isTournamentApplicationOpen,
        frontInfo?.global?.isBettingActive,
        colorSystem
    ]);

    const handleMenuClick = (funcCall: string) => {
        // Handle menu clicks if needed
    };

    const topControls = (
        <div className="flex justify-between items-center p-2 px-4">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => router.push(`/${serverID}/game`)}
                    className="px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-transform active:scale-95"
                    style={{ backgroundColor: colorSystem.buttonBg, color: colorSystem.buttonText }}
                >
                    메인으로
                </button>
            </div>

            <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-black/30 text-foreground-muted text-xs border border-white/5">
                    {frontInfo?.global?.year}년 {frontInfo?.global?.month}월
                </span>
            </div>
        </div>
    );

    const headerSurface = (
        <div className="flex flex-col gap-2 p-2">
            <div className="w-full">
                {globalMenu.length > 0 && frontInfo && (
                    <GlobalMenu
                        menu={globalMenu}
                        globalInfo={frontInfo.global}
                        onMenuClick={handleMenuClick}
                        nationColor={nationColor}
                        colorSystem={colorSystem}
                    />
                )}
            </div>
        </div>
    );

    const leftPanel = (
        <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
            {frontInfo?.general && frontInfo?.nation && mainControlBarProps && (
                <div className="rounded-xl border border-white/10 bg-background-secondary/50 backdrop-blur-sm shadow-lg overflow-hidden">
                    <MainControlBar {...mainControlBarProps} />
                </div>
            )}
        </div>
    );

    if (loading || !frontInfo) {
        return <div className="min-h-screen flex items-center justify-center text-white">로딩 중...</div>;
    }

    return (
        <GameAppShell
            header={topControls}
            subHeader={headerSurface}
            leftColumn={leftPanel}
            mainColumn={children}
            bottomNav={
                <GameBottomBar
                    onRefresh={loadData}
                    isLoading={loading}
                    nationColor={nationColor}
                    colorSystem={colorSystem}
                    globalMenu={globalMenu}
                    globalInfo={frontInfo.global}
                    onMenuClick={handleMenuClick}
                    mainControlProps={mainControlBarProps || undefined}
                />
            }
        />
    );
}
