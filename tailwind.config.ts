import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PKJ Color Scheme
        'background-primary': '#0f172a',
        'background-secondary': '#1e293b',
        'primary': '#6366f1',
        'primary-light': '#818cf8',
        'secondary': '#06b6d4',
        'accent': '#f59e0b',
        'text-primary': '#ffffff',
        'text-secondary': '#cbd5e1',
        'glass-bg': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        
        // Shadcn overrides
        background: "var(--background-primary)",
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--glass-bg)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--glass-bg)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          foreground: "var(--text-secondary)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "var(--glass-border)",
        input: "var(--glass-bg)",
        ring: "var(--primary)",
        chart: {
          "1": "var(--primary)",
          "2": "var(--secondary)",
          "3": "var(--accent)",
          "4": "var(--primary-light)",
          "5": "#10b981",
        },
        sidebar: {
          DEFAULT: "rgba(15, 23, 42, 0.95)",
          foreground: "var(--text-primary)",
          primary: "var(--primary)",
          "primary-foreground": "#ffffff",
          accent: "var(--glass-bg)",
          "accent-foreground": "var(--text-primary)",
          border: "var(--glass-border)",
          ring: "var(--primary)",
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(1deg)' },
          '66%': { transform: 'translateY(10px) rotate(-1deg)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 20s ease-in-out infinite",
        fadeIn: "fadeIn 0.5s ease-in",
        slideInLeft: "slideInLeft 0.5s ease-out",
        slideInRight: "slideInRight 0.5s ease-out",
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-primary': '0 0 30px rgba(99, 102, 241, 0.3)',
        'glow-secondary': '0 0 20px rgba(6, 182, 212, 0.2)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;