"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";

export function ThemeToggle({ className = "icon-btn" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.getAttribute("data-theme") === "dark"), []);
  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("cm-theme", next ? "dark" : "light"); } catch {}
  }
  return (
    <button className={`${className} theme-btn`} onClick={toggle} aria-label={dark ? "Light mode" : "Dark mode"} title={dark ? "Light mode" : "Dark mode"}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
