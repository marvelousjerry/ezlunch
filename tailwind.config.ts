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
        },
    },
    plugins: [],
};
export default config;
