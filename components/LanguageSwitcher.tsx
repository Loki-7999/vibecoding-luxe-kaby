"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/I18nProvider";

const languages = [
  { code: "es", name: "Español", flag: "https://flagcdn.com/w40/es.png" },
  { code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
  { code: "fr", name: "Français", flag: "https://flagcdn.com/w40/fr.png" },
  { code: "it", name: "Italiano", flag: "https://flagcdn.com/w40/it.png" },
];

export default function LanguageSwitcher() {
  const { locale } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  const handleLanguageChange = (code: string) => {
    document.cookie = `luxe_locale=${code}; path=/; max-age=31536000`; // 1 year
    setIsOpen(false);
    router.refresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
        title="Change Language"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentLang.flag} alt={currentLang.code} className="w-5 h-3.5 object-cover rounded-[2px]" />
        <span className="material-icons text-sm">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#1a1c23] border border-nordic-dark/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                  locale === lang.code
                    ? "font-medium text-mosque dark:text-mosque"
                    : "text-nordic-dark dark:text-gray-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lang.flag} alt={lang.code} className="w-5 h-3.5 object-cover rounded-[2px]" />
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
