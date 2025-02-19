import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gray: {
          750: '#2d2d2d',
          800: '#1f1f1f',
          850: '#1a1a1a',
          900: '#121212',
        }
      },
      spacing: {
        '18': '4.5rem', // This adds a custom spacing for the 16:9 ratio thumbnails
      },
      height: {
        '128': '32rem', // Extra large height option for previews if needed
      },
    },
  },
  plugins: [],
} satisfies Config;