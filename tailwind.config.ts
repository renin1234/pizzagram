import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pizzagram brandbook
        cream: "#F3E7E0",       // светлый
        creamdeep: "#E7D5CB",   // тон темнее для разделителей
        ink: "#1E1E1E",         // тёмный
        crimson: "#FF4D39",     // основной (бренд)
        crimsondeep: "#E63522",
        smoke: "#7A6E66",
      },
      fontFamily: {
        display: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        wide: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        body: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        serif: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        wobble: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stamp: {
          "0%": { transform: "scale(2) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(0.92) rotate(-12deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-12deg)" },
        },
        spin360: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        wobble: "wobble 5s ease-in-out infinite",
        rise: "rise 0.7s cubic-bezier(.2,.8,.2,1) both",
        stamp: "stamp 0.6s cubic-bezier(.2,.8,.2,1) both",
        spin360: "spin360 24s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
