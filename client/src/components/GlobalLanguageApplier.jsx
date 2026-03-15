import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT"]);

const applyTranslation = (root, translatePhrase, language) => {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName) || parent.isContentEditable) {
      node = walker.nextNode();
      continue;
    }

    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed) {
      node = walker.nextNode();
      continue;
    }

    if (!node.__i18nOriginal) {
      node.__i18nOriginal = trimmed;
    }

    const sourceText = language === "en" ? node.__i18nOriginal : node.__i18nOriginal;
    const translated = language === "en" ? sourceText : translatePhrase(sourceText);

    if (translated && translated !== trimmed) {
      node.nodeValue = raw.replace(trimmed, translated);
    }

    if (language === "en" && sourceText !== trimmed) {
      node.nodeValue = raw.replace(trimmed, sourceText);
    }

    node = walker.nextNode();
  }

  const placeholders = root.querySelectorAll("input[placeholder], textarea[placeholder]");
  placeholders.forEach((el) => {
    if (!el.dataset.i18nPlaceholderOriginal) {
      el.dataset.i18nPlaceholderOriginal = el.getAttribute("placeholder") || "";
    }
    const base = el.dataset.i18nPlaceholderOriginal;
    const nextValue = language === "en" ? base : translatePhrase(base);
    if (nextValue) {
      el.setAttribute("placeholder", nextValue);
    }
  });
};

const GlobalLanguageApplier = () => {
  const { language, translatePhrase } = useLanguage();

  useEffect(() => {
    const root = document.body;
    applyTranslation(root, translatePhrase, language);

    const observer = new MutationObserver(() => {
      applyTranslation(root, translatePhrase, language);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language, translatePhrase]);

  return null;
};

export default GlobalLanguageApplier;
