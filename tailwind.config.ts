import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#ec4899",
          hover: "#db2777",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          foreground: "#ffffff",
        },
        background: {
          main: "#050510", // Deep Space
          secondary: "#101520", // Panel Bg
          tertiary: "#1a1a1a",
        },
        foreground: {
          DEFAULT: "#E0E0E0", // Primary Text
          muted: "#9CA3AF", // Muted Text
          dim: "#64748b",
        },
        border: "rgba(148, 163, 184, 0.1)",
        // Gin7 Palette
        empire: {
          DEFAULT: "#C0C0C0", // Silver
          blue: "#1e3a8a",    // Blue (Imperial Navy / Prussian Blue)
          gold: "#FFD700",    // Gold
        },
        alliance: {
          DEFAULT: "#4A5D23", // Olive Drab
          light: "#F5F5DC",   // Beige
          red: "#DC2626",     // Red (Revolution/Accent)
        },
        alliance: {
          DEFAULT: "#4A5D23", // Olive Drab/Military Green
          light: "#F5F5DC",   // Beige/Cream
          blue: "#1E90FF",    // Blue - Democracy/Navy
        },
        space: {
          bg: "#050510",
          panel: "#101520",
          text: "#E0E0E0",
        },
        hud: {
          alert: "#EF4444", // Red - Enemy/Critical
          success: "#10B981", // Green - System Normal
          muted: "#9CA3AF",
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'], // Default (Alliance)
        serif: ['Times New Roman', 'serif'], // Empire
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'], // HUD/Data
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.08), transparent 25%)",
      },
    },
  },
  plugins: [],
};
export default config;


