"use client";

import { useEffect, useState } from "react";

type FontTheme = "inter" | "google-sans";
type ColorTheme = "warm" | "forest" | "ocean";

const FONT_STORAGE_KEY = "expense-theme-font";
const COLOR_STORAGE_KEY = "expense-theme-color";

function applyTheme(fontTheme: FontTheme, colorTheme: ColorTheme) {
  const root = document.documentElement;
  root.setAttribute("data-font-theme", fontTheme);
  root.setAttribute("data-color-theme", colorTheme);
}

export function ThemePreferences() {
  const [fontTheme, setFontTheme] = useState<FontTheme>("inter");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("warm");

  useEffect(() => {
    try {
      const rawFont = localStorage.getItem(FONT_STORAGE_KEY);
      const rawColor = localStorage.getItem(COLOR_STORAGE_KEY);
      const nextFont: FontTheme = rawFont === "google-sans" ? "google-sans" : "inter";
      const nextColor: ColorTheme =
        rawColor === "forest" || rawColor === "ocean" ? rawColor : "warm";
      setFontTheme(nextFont);
      setColorTheme(nextColor);
      applyTheme(nextFont, nextColor);
    } catch {
      applyTheme("inter", "warm");
    }
  }, []);

  const handleFontChange = (value: FontTheme) => {
    setFontTheme(value);
    try {
      localStorage.setItem(FONT_STORAGE_KEY, value);
    } catch {
      // Ignore storage issues in privacy-restricted browsers.
    }
    applyTheme(value, colorTheme);
  };

  const handleColorChange = (value: ColorTheme) => {
    setColorTheme(value);
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, value);
    } catch {
      // Ignore storage issues in privacy-restricted browsers.
    }
    applyTheme(fontTheme, value);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Appearance</h2>
      <p className="mt-1 text-sm text-muted-foreground">Adjust font and theme colors for your device.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Font family</legend>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <input
              type="radio"
              name="font-theme"
              checked={fontTheme === "inter"}
              onChange={() => handleFontChange("inter")}
            />
            <span className="text-sm text-foreground">Inter (Neutral)</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <input
              type="radio"
              name="font-theme"
              checked={fontTheme === "google-sans"}
              onChange={() => handleFontChange("google-sans")}
            />
            <span className="text-sm text-foreground">Google Sans-style (Nunito Sans)</span>
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Color theme</legend>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <input
              type="radio"
              name="color-theme"
              checked={colorTheme === "warm"}
              onChange={() => handleColorChange("warm")}
            />
            <span className="text-sm text-foreground">Warm</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <input
              type="radio"
              name="color-theme"
              checked={colorTheme === "forest"}
              onChange={() => handleColorChange("forest")}
            />
            <span className="text-sm text-foreground">Forest</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <input
              type="radio"
              name="color-theme"
              checked={colorTheme === "ocean"}
              onChange={() => handleColorChange("ocean")}
            />
            <span className="text-sm text-foreground">Ocean</span>
          </label>
        </fieldset>
      </div>
    </section>
  );
}
