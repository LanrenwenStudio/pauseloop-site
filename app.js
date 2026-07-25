(() => {
  const translations = window.PAUSELOOP_TRANSLATIONS;
  const languageSelect = document.querySelector("#languageSelect");
  const heroShot = document.querySelector("#heroShot");
  const productShot = document.querySelector("#productShot");
  const shotCaption = document.querySelector("#shotCaption");
  const shotTabs = [...document.querySelectorAll("[data-shot]")];
  const header = document.querySelector("[data-header]");
  const rhythm = document.querySelector("[data-rhythm]");
  const rhythmTrack = document.querySelector(".rhythm-track");
  const supportedLocales = Object.keys(translations);
  let activeShot = "focus";
  let activeLocale = "en-US";

  const browserLocale = navigator.language || "en-US";
  const localeAliases = {
    "zh-CN": "zh-Hans", "zh-SG": "zh-Hans", "zh-TW": "zh-Hant", "zh-HK": "zh-Hant", "zh-MO": "zh-Hant"
  };

  function resolveLocale(candidate) {
    if (supportedLocales.includes(candidate)) return candidate;
    if (localeAliases[candidate]) return localeAliases[candidate];
    const base = candidate.split("-")[0];
    return supportedLocales.find((locale) => locale.split("-")[0] === base) || "en-US";
  }

  function shotSource(kind, locale = activeLocale) {
    return `assets/${kind}-${locale}.webp`;
  }

  function translatePage(locale) {
    activeLocale = resolveLocale(locale);
    const dictionary = translations[activeLocale];
    document.documentElement.lang = activeLocale;
    document.title = dictionary["meta.title"];
    document.querySelector('meta[name="description"]').content = dictionary["meta.description"];

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = dictionary[node.dataset.i18n];
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const value = dictionary[node.dataset.i18nHtml];
      if (value) node.innerHTML = value;
    });

    heroShot.src = shotSource("focus");
    heroShot.alt = dictionary["alt.focus"];
    productShot.src = shotSource(activeShot);
    productShot.alt = dictionary[`alt.${activeShot}`];
    shotCaption.textContent = dictionary[`caption.${activeShot}`];
    languageSelect.value = activeLocale;
    localStorage.setItem("pauseloop-locale", activeLocale);
  }

  function selectShot(kind) {
    if (kind === activeShot) return;
    activeShot = kind;
    productShot.classList.add("changing");
    shotTabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.shot === kind)));
    window.setTimeout(() => {
      productShot.src = shotSource(kind);
      productShot.alt = translations[activeLocale][`alt.${kind}`];
      shotCaption.textContent = translations[activeLocale][`caption.${kind}`];
      productShot.onload = () => productShot.classList.remove("changing");
    }, 140);
  }

  shotTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectShot(tab.dataset.shot));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = shotTabs[(index + offset + shotTabs.length) % shotTabs.length];
      next.focus();
      selectShot(next.dataset.shot);
    });
  });

  languageSelect.addEventListener("change", (event) => translatePage(event.target.value));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

  function updateScrollEffects() {
    header.classList.toggle("scrolled", window.scrollY > 24);
    if (rhythm && rhythmTrack && window.innerWidth > 620) {
      const bounds = rhythmTrack.getBoundingClientRect();
      const startLine = window.innerHeight * 0.76;
      const travelDistance = bounds.height + window.innerHeight * 0.45;
      const progress = Math.min(1, Math.max(0, (startLine - bounds.top) / travelDistance));
      rhythm.style.setProperty("--rhythm-progress", progress.toFixed(3));
    }
  }

  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  window.addEventListener("resize", updateScrollEffects);
  updateScrollEffects();

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const textToCopy = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(textToCopy);
        const textSpan = button.querySelector('[data-i18n="install.copy"]') || button.querySelector("span");
        if (textSpan) {
          const originalText = textSpan.textContent;
          const dictionary = translations[activeLocale] || translations["en-US"];
          const copiedText = dictionary["install.copied"] || "Copied!";
          textSpan.textContent = copiedText;
          button.classList.add("copied");
          setTimeout(() => {
            textSpan.textContent = originalText;
            button.classList.remove("copied");
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to copy command:", err);
      }
    });
  });

  const savedLocale = localStorage.getItem("pauseloop-locale");
  translatePage(savedLocale || browserLocale);
})();
