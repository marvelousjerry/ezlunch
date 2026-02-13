import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF8A3D", // Warm soft orange
                "primary-hover": "#E57A30",
                "background-light": "#FFFBF7", // Warm white
                "background-dark": "#1A1614",
            },
            fontFamily: {
                display: ["Pretendard", "sans-serif"],
                sans: ["Pretendard", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                "xl": "1.5rem",
                "2xl": "2rem", // Softer curves
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "hero-gradient": "linear-gradient(180deg, rgba(255, 138, 61, 0.08) 0%, rgba(255, 255, 255, 0) 100%)",
            },
            keyframes: {
                "explosion-particle": {
                    "0%": { transform: "rotate(var(--angle)) translateY(0px)", opacity: "1" },
                    "100%": { transform: "rotate(var(--angle)) translateY(60px)", opacity: "0" },
                },
                "heart-pump": {
                    "0%": { transform: "scale(1)", opacity: "1" },
                    "50%": { transform: "scale(1.5)", opacity: "0.8" },
                    "100%": { transform: "scale(2.5)", opacity: "0" },
                },
                "fadeIn": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "fadeInUp": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                }
            },
            animation: {
                "explosion-particle": "explosion-particle 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards",
                "heart-pump": "heart-pump 0.6s ease-out forwards",
                "fade-in": "fadeIn 0.5s ease-out forwards",
                "fade-in-up": "fadeInUp 0.5s ease-out forwards",
            },
        },
    },
    plugins: [],
};
export default config;
