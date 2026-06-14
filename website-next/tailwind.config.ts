import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Mawared brand kit — Sky #6599FE, Royal #2D5BE4, Navy #0F234C
        brand: {
          50: "#EFF4FE",
          100: "#D9E6FE",
          200: "#B6CCFB",
          300: "#6599FE",
          400: "#477CF2",
          500: "#2D5BE4",
          600: "#2349C0",
          700: "#1B3A9C",
          800: "#152C77",
          900: "#0F234C",
          950: "#0A1836",
        },
        accent: {
          50: "#FEF7E7",
          100: "#FBE9BF",
          200: "#F8D88A",
          300: "#F3C257",
          400: "#ECA423",
          500: "#D08D16",
          600: "#A8700F",
          700: "#855809",
          800: "#6B470B",
          900: "#573A0D",
        },
        green: {
          300: "#A6F8BD",
          400: "#7DF59D",
          500: "#5DF285",
          600: "#2FD862",
          700: "#1FAE4D",
        },
        surface: {
          50: "#FAFAF9",
          100: "#F7F6F2",
          200: "#EEEEE8",
          300: "#E0DFD8",
          400: "#C8C7BF",
        },
      },
      fontFamily: {
        sans: ["var(--font-alexandria)", "Alexandria", "sans-serif"],
        alexandria: ["var(--font-alexandria)", "Alexandria", "sans-serif"],
        manrope: ["var(--font-manrope)", "sans-serif"],
        glancyr: ["var(--font-glancyr)", "sans-serif"],
        cairo: ["var(--font-alexandria)", "Alexandria", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "slide-up": "slideUp 0.6s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.6s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "gradient": "gradient 8s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #6599FE 0%, #2D5BE4 55%, #0F234C 100%)",
        "hero-gradient-light":
          "linear-gradient(135deg, rgba(101,153,254,0.08) 0%, rgba(45,91,228,0.12) 100%)",
        "brand-gradient": "linear-gradient(90deg, #6599FE 0%, #2D5BE4 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
