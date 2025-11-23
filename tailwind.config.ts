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
          main: "#0f172a",
          secondary: "#1e293b",
          tertiary: "#334155",
        },
        foreground: {
          DEFAULT: "#f8fafc",
          muted: "#94a3b8",
          dim: "#64748b",
        },
        border: "rgba(148, 163, 184, 0.1)",
        // Gin7 Palette
        empire: {
          DEFAULT: "#C0C0C0", // Silver
          dark: "#1a1a1a",
          gold: "#FFD700",
        },
        alliance: {
          DEFAULT: "#4A5D23", // Olive Drab
          light: "#F5F5DC",   // Beige
          blue: "#1E90FF",
        },
        space: {
          bg: "#050510",
          panel: "#101520",
          text: "#E0E0E0",
        },
        hud: {
          alert: "#EF4444",
          success: "#10B981",
          muted: "#9CA3AF",
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        serif: ['Times New Roman', 'serif'], // For Empire
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


