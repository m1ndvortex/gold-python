/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Gold Shop Design System Colors
      colors: {
        // Keep existing ShadCN colors for compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Gold Shop Primary Colors (Gold Palette)
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          DEFAULT: '#f59e0b',
          foreground: '#78350f',
        },
        
        // Professional Neutral Colors
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        
        // Semantic Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
          DEFAULT: '#f59e0b',
          foreground: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        
        // Keep ShadCN semantic colors for compatibility
        secondary: {
          DEFAULT: '#f5f5f4',
          foreground: '#57534e',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f5f5f4',
          foreground: '#78716c',
        },
        accent: {
          DEFAULT: '#fffbeb',
          foreground: '#78350f',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1c1917',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1c1917',
        },
      },
      
      // Professional Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      
      // Enhanced Border Radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        none: '0',
        xs: '0.125rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      
      // Professional Box Shadows
      boxShadow: {
        'gold-sm': '0 1px 2px 0 rgb(245 158 11 / 0.05)',
        'gold': '0 1px 3px 0 rgb(245 158 11 / 0.1), 0 1px 2px -1px rgb(245 158 11 / 0.1)',
        'gold-md': '0 4px 6px -1px rgb(245 158 11 / 0.1), 0 2px 4px -2px rgb(245 158 11 / 0.1)',
        'gold-lg': '0 10px 15px -3px rgb(245 158 11 / 0.1), 0 4px 6px -4px rgb(245 158 11 / 0.1)',
        'gold-xl': '0 20px 25px -5px rgb(245 158 11 / 0.1), 0 8px 10px -6px rgb(245 158 11 / 0.1)',
        'professional': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elegant': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      
      // Animation Enhancements
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "shimmer": "shimmer 2s infinite",
      },
      
      // Professional Spacing Scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Enhanced Breakpoints
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      
      // Gradient Background Utilities
      backgroundImage: {
        // Primary Gradients
        'gradient-green': 'linear-gradient(to right, rgb(34, 197, 94), rgb(20, 184, 166))',
        'gradient-green-hover': 'linear-gradient(to right, rgb(22, 163, 74), rgb(17, 94, 89))',
        'gradient-teal': 'linear-gradient(to right, rgb(20, 184, 166), rgb(59, 130, 246))',
        'gradient-teal-hover': 'linear-gradient(to right, rgb(17, 94, 89), rgb(37, 99, 235))',
        'gradient-blue': 'linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241))',
        'gradient-blue-hover': 'linear-gradient(to right, rgb(37, 99, 235), rgb(79, 70, 229))',
        'gradient-indigo': 'linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))',
        'gradient-indigo-hover': 'linear-gradient(to right, rgb(79, 70, 229), rgb(124, 58, 237))',
        'gradient-purple': 'linear-gradient(to right, rgb(139, 92, 246), rgb(168, 85, 247))',
        'gradient-purple-hover': 'linear-gradient(to right, rgb(124, 58, 237), rgb(147, 51, 234))',
        'gradient-violet': 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
        'gradient-violet-hover': 'linear-gradient(to right, rgb(147, 51, 234), rgb(219, 39, 119))',
        'gradient-pink': 'linear-gradient(to right, rgb(236, 72, 153), rgb(244, 63, 94))',
        'gradient-pink-hover': 'linear-gradient(to right, rgb(219, 39, 119), rgb(225, 29, 72))',
        'gradient-rose': 'linear-gradient(to right, rgb(244, 63, 94), rgb(239, 68, 68))',
        'gradient-rose-hover': 'linear-gradient(to right, rgb(225, 29, 72), rgb(220, 38, 38))',
        'gradient-orange': 'linear-gradient(to right, rgb(249, 115, 22), rgb(239, 68, 68))',
        'gradient-orange-hover': 'linear-gradient(to right, rgb(234, 88, 12), rgb(220, 38, 38))',
        'gradient-cyan': 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))',
        'gradient-cyan-hover': 'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235))',
        
        // Card Background Gradients
        'gradient-card-green': 'linear-gradient(to bottom right, rgb(240, 253, 244), rgb(220, 252, 231))',
        'gradient-card-teal': 'linear-gradient(to bottom right, rgb(240, 253, 250), rgb(204, 251, 241))',
        'gradient-card-blue': 'linear-gradient(to bottom right, rgb(239, 246, 255), rgb(219, 234, 254))',
        'gradient-card-indigo': 'linear-gradient(to bottom right, rgb(238, 242, 255), rgb(224, 231, 255))',
        'gradient-card-purple': 'linear-gradient(to bottom right, rgb(250, 245, 255), rgb(243, 232, 255))',
        'gradient-card-violet': 'linear-gradient(to bottom right, rgb(245, 243, 255), rgb(237, 233, 254))',
        'gradient-card-pink': 'linear-gradient(to bottom right, rgb(253, 242, 248), rgb(252, 231, 243))',
        'gradient-card-rose': 'linear-gradient(to bottom right, rgb(255, 241, 242), rgb(254, 226, 226))',
        'gradient-card-orange': 'linear-gradient(to bottom right, rgb(255, 247, 237), rgb(254, 215, 170))',
        'gradient-card-cyan': 'linear-gradient(to bottom right, rgb(236, 254, 255), rgb(207, 250, 254))',
        
        // Tab Navigation Gradients
        'gradient-tab-green': 'linear-gradient(to right, rgb(240, 253, 244), rgb(220, 252, 231), rgb(219, 234, 254))',
        'gradient-tab-blue': 'linear-gradient(to right, rgb(239, 246, 255), rgb(219, 234, 254), rgb(224, 231, 255))',
        'gradient-tab-purple': 'linear-gradient(to right, rgb(250, 245, 255), rgb(243, 232, 255), rgb(237, 233, 254))',
        'gradient-tab-pink': 'linear-gradient(to right, rgb(253, 242, 248), rgb(252, 231, 243), rgb(254, 226, 226))',
        
        // Light Background Gradients
        'gradient-light-green': 'linear-gradient(to right, rgb(240, 253, 244), rgb(255, 255, 255))',
        'gradient-light-teal': 'linear-gradient(to right, rgb(240, 253, 250), rgb(255, 255, 255))',
        'gradient-light-blue': 'linear-gradient(to right, rgb(239, 246, 255), rgb(255, 255, 255))',
        'gradient-light-purple': 'linear-gradient(to right, rgb(250, 245, 255), rgb(255, 255, 255))',
        'gradient-light-pink': 'linear-gradient(to right, rgb(253, 242, 248), rgb(255, 255, 255))',
      },
      
      // Enhanced Box Shadow with Gradient Colors
      boxShadow: {
        'gold-sm': '0 1px 2px 0 rgb(245 158 11 / 0.05)',
        'gold': '0 1px 3px 0 rgb(245 158 11 / 0.1), 0 1px 2px -1px rgb(245 158 11 / 0.1)',
        'gold-md': '0 4px 6px -1px rgb(245 158 11 / 0.1), 0 2px 4px -2px rgb(245 158 11 / 0.1)',
        'gold-lg': '0 10px 15px -3px rgb(245 158 11 / 0.1), 0 4px 6px -4px rgb(245 158 11 / 0.1)',
        'gold-xl': '0 20px 25px -5px rgb(245 158 11 / 0.1), 0 8px 10px -6px rgb(245 158 11 / 0.1)',
        'professional': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elegant': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'gradient-green': '0 10px 25px -5px rgb(34 197 94 / 0.1), 0 8px 10px -6px rgb(34 197 94 / 0.1)',
        'gradient-blue': '0 10px 25px -5px rgb(59 130 246 / 0.1), 0 8px 10px -6px rgb(59 130 246 / 0.1)',
        'gradient-purple': '0 10px 25px -5px rgb(139 92 246 / 0.1), 0 8px 10px -6px rgb(139 92 246 / 0.1)',
        'gradient-pink': '0 10px 25px -5px rgb(236 72 153 / 0.1), 0 8px 10px -6px rgb(236 72 153 / 0.1)',
        'gradient-lg': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("tailwindcss-rtl"),
    // Custom plugin for additional gradient utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.hover-lift': {
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        '.transition-all-smooth': {
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-colors-smooth': {
          transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-shadow-smooth': {
          transition: 'box-shadow 300ms cubic-bezier(0.23, 1, 0.32, 1)',
        },
        '.backdrop-blur-professional': {
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-green\\/20': {
          'scrollbar-color': 'rgb(34 197 94 / 0.2) transparent',
        },
        '.scrollbar-track-transparent': {
          'scrollbar-track-color': 'transparent',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}