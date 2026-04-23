import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070A12",
        bg2: "#0B0F1A",
        surface: "#11151F",
        surface2: "#161B27",
        border: "rgba(255,255,255,0.08)",
        hairline: "rgba(255,255,255,0.06)",
        muted: "#8A93A6",
        fg: "#EDEDEF",

        accent: "#10B981",
        live: "#10B981",
        loading: "#F59E0B",
        danger: "#F43F5E",

        // per-class brand colors (used as accents only)
        projector: "#10B981",
        whiteboard: "#3B82F6",
        fire_extinguisher: "#F43F5E",
        door_sign: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
} satisfies Config;
