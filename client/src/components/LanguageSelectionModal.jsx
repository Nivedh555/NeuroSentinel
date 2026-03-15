import React from "react";
import { useLanguage } from "../context/LanguageContext";

const LanguageSelectionModal = () => {
  const { hasLanguageSelection, language, changeLanguage, languages } = useLanguage();

  if (hasLanguageSelection) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose your language</h2>
        <p className="text-sm text-slate-600 mb-5">Select your preferred interface language to continue.</p>

        <div className="space-y-2">
          {Object.entries(languages).map(([code, config]) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                language === code
                  ? "border-bloom-primary bg-bloom-primary/10 text-bloom-primary font-semibold"
                  : "border-gray-200 hover:border-bloom-primary/50 hover:bg-gray-50 text-slate-700"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionModal;
