/* Simple JSON-based i18n loader
   - Loads translations from GitHub raw URL (preferred) and falls back to local /assets/lang/*.json
   - Applies translations to elements with `data-i18n="key"` (text) or `data-i18n-html="true"` (innerHTML)
   - Has small built-in selector map for common site strings (hero subtitle, buttons, nav nodes, about paragraphs)
*/
(function () {
  const i18n = {
    githubBase:
      "https://raw.githubusercontent.com/diorhc/diorhc/main/assets/lang",
    localBase: "assets/lang",
    // When true, prefer the browser language (navigator.language) over the
    // HTML lang attribute when auto-detecting. LocalStorage and URL param
    // still take precedence so user choice is respected.
    preferBrowserLanguage: true,

    // apply translations to elements using data-i18n attribute
    apply(translations) {
      if (!translations || typeof translations !== "object") return;

      // Elements annotated with data-i18n
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (!key) return;
        const val = translations[key];
        if (val === undefined) return;
        if (el.dataset.i18nHtml === "true") el.innerHTML = val;
        else el.textContent = val;

        // If element has an aria-label (or is a link/button), translate that too
        try {
          if (
            el.hasAttribute("aria-label") ||
            /^(A|BUTTON|INPUT|TEXTAREA)$/i.test(el.tagName)
          ) {
            el.setAttribute("aria-label", val);
          }
        } catch (e) {
          /* ignore attribute errors */
        }
      });

      // Translate elements that rely on data-title (used by CSS ::before content)
      // Strategy: prefer an explicit data-i18n-title, otherwise try to infer
      // from a descendant with a data-i18n key (common in project/skill cards).
      try {
        document.querySelectorAll("[data-title]").forEach((el) => {
          let key = el.dataset.i18nTitle || null; // data-i18n-title explicit mapping
          if (!key) {
            const child = el.querySelector("[data-i18n]");
            if (child) key = child.dataset.i18n;
          }

          if (key && translations[key]) {
            el.setAttribute("data-title", translations[key]);
            return;
          }

          // If key ended with .title, try fallback without .title
          if (key && key.endsWith(".title")) {
            const alt = key.replace(/\.title$/, "");
            if (translations[alt])
              el.setAttribute("data-title", translations[alt]);
          }
        });
      } catch (err) {
        /* ignore */
      }

      // Small selector map for common UI pieces (convenience for legacy markup)
      try {
        const heroSub = document.querySelector(".hero-subtitle");
        if (heroSub && translations["hero.subtitle"]) {
          heroSub.textContent = translations["hero.subtitle"];
        }

        const btnProjects = document.querySelector(
          ".hero-buttons .btn-primary"
        );
        if (btnProjects && translations["btn.projects"]) {
          btnProjects.textContent = translations["btn.projects"];
        }

        const btnContact = document.querySelector(
          ".hero-buttons .btn-secondary"
        );
        if (btnContact && translations["btn.contact"]) {
          btnContact.textContent = translations["btn.contact"];
        }

        // Nav node labels (buttons have data-section)
        document.querySelectorAll(".nav-node").forEach((btn) => {
          const sec = btn.dataset.section;
          if (!sec) return;
          const key = `nav.${sec}`;
          if (translations[key]) {
            // update title/aria-label/data-label where appropriate
            btn.setAttribute("title", translations[key]);
            btn.setAttribute("aria-label", translations[key]);
            btn.dataset.label = translations[key];
          }
        });

        // About paragraphs (match existing .about-description elements)
        document.querySelectorAll(".about-description").forEach((p, i) => {
          const key = `about.p${i + 1}`;
          if (translations[key]) p.textContent = translations[key];
        });

        // Stat labels
        document.querySelectorAll(".stat-card .stat-label").forEach((el, i) => {
          // allow custom keys like stat.0, stat.1 or fallback to stat.projects
          const byIndex = translations[`stat.${i}`];
          const byName = translations[`stat.${el.dataset.statKey}`];
          if (byIndex) el.textContent = byIndex;
          else if (byName) el.textContent = byName;
          else if (translations["stat.projects"] && i === 0) {
            // sample fallback for first stat
            el.textContent = translations["stat.projects"];
          }
        });

        // Meta and document title
        if (translations["meta.title"])
          document.title = translations["meta.title"];
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && translations["meta.description"])
          metaDesc.setAttribute("content", translations["meta.description"]);
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && translations["og.title"])
          ogTitle.setAttribute("content", translations["og.title"]);
        const ogDesc = document.querySelector(
          'meta[property="og:description"]'
        );
        if (ogDesc && translations["og.description"])
          ogDesc.setAttribute("content", translations["og.description"]);
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle && translations["twitter.title"])
          twTitle.setAttribute("content", translations["twitter.title"]);
        const twDesc = document.querySelector(
          'meta[name="twitter:description"]'
        );
        if (twDesc && translations["twitter.description"])
          twDesc.setAttribute("content", translations["twitter.description"]);
      } catch (err) {
        console.warn("i18n.apply error:", err);
      }
      // Signal that translations have been applied so other scripts (typing, layout)
      // can react. This is helpful for sequencing client-side UI work.
      try {
        document.dispatchEvent(new CustomEvent("i18n:applied"));
      } catch (e) {
        /* ignore */
      }
    },

    async fetchJson(url) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error("fetch failed: " + res.status);
        return await res.json();
      } catch (err) {
        return null;
      }
    },

    // Try GitHub raw first, then local fallback. When running on localhost,
    // prefer the local file first to avoid noisy 404s to GitHub during dev.
    async load(lang) {
      if (!lang) lang = "en";
      // normalize (e.g., en-US -> en)
      lang = (lang + "").split("-")[0];

      const ghUrl = `${this.githubBase}/${lang}.json`;
      const localUrl = `${this.localBase}/${lang}.json`;

      // determine if running on localhost/dev
      const isLocalhost = Boolean(
        window.location.hostname === "localhost" ||
          window.location.hostname === "[::1]" ||
          window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
          )
      );

      let data = null;

      if (isLocalhost) {
        // prefer local file when developing locally
        data = await this.fetchJson(localUrl);
        if (data) {
          this.apply(data);
          return;
        }

        // fallback to GitHub raw if local not available
        data = await this.fetchJson(ghUrl);
        if (data) {
          this.apply(data);
          return;
        }
      } else {
        // production/default: try GitHub raw first, then local fallback
        data = await this.fetchJson(ghUrl);
        if (data) {
          this.apply(data);
          return;
        }

        data = await this.fetchJson(localUrl);
        if (data) {
          this.apply(data);
          return;
        }
      }

      console.warn(`i18n: language '${lang}' not found on GitHub or locally`);
    },
  };

  // expose
  window.i18n = i18n;

  document.addEventListener("DOMContentLoaded", () => {
    // language detection order (configurable via preferBrowserLanguage):
    // 1) ?lang= URL parameter (explicit override)
    // 2) localStorage.lang (user saved preference)
    // 3) navigator.language (browser language) -- if preferBrowserLanguage === true
    // 4) <html lang="..."> attribute
    // 5) fallback 'en'
    const params = new URLSearchParams(location.search);
    const paramLang = params.get("lang");
    const stored = localStorage.getItem("lang");
    const htmlLang = document.documentElement.lang;
    const navLang = navigator.language || navigator.userLanguage;

    let lang;
    if (paramLang) {
      lang = paramLang;
    } else if (stored) {
      // keep user's saved preference first
      lang = stored;
    } else if (i18n.preferBrowserLanguage && navLang) {
      // prefer the browser language when enabled
      lang = navLang;
    } else if (htmlLang) {
      lang = htmlLang;
    } else if (navLang) {
      // final attempt using navigator
      lang = navLang;
    } else {
      lang = "en";
    }

    i18n.load(lang);
  });
})();
