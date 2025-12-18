// ===== Utility Functions =====
// Debounce function for performance
const debounce = (func, wait = 20) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
const throttle = (func, limit = 100) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Safe element selector with error handling
const safeQuerySelector = (selector) => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return null;
  }
};

const safeQuerySelectorAll = (selector) => {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return [];
  }
};

// Determine the primary scroll container. The layout uses <main id="main-content"> as
// the scrolling container (scroll-snap). Fall back to window when not present.
const scrollContainer = safeQuerySelector("#main-content") || window;

// Helper to scroll the chosen container to a vertical position smoothly.
const scrollToContainer = (top) => {
  if (scrollContainer === window) {
    window.scrollTo({ top, behavior: "smooth" });
  } else {
    scrollContainer.scrollTo({ top, behavior: "smooth" });
  }
};

// ===== Mobile Navigation =====
const burger = safeQuerySelector(".burger");
const nav = safeQuerySelector(".nav-links");
const navLinks = safeQuerySelectorAll(".nav-links li");

if (burger && nav) {
  const toggleMenu = () => {
    // Toggle Navigation
    nav.classList.toggle("active");

    // Update ARIA attribute
    const isExpanded = nav.classList.contains("active");
    burger.setAttribute("aria-expanded", isExpanded);

    // Burger Animation
    burger.classList.toggle("toggle");

    // Animate Links
    navLinks.forEach((link, index) => {
      if (link.style.animation) {
        link.style.animation = "";
      } else {
        link.style.animation = `navLinkFade 0.5s ease forwards ${
          index / 7 + 0.3
        }s`;
      }
    });
  };

  burger.addEventListener("click", toggleMenu);

  // Close mobile menu when clicking on a link
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      burger.classList.remove("toggle");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("active")) {
      nav.classList.remove("active");
      burger.classList.remove("toggle");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      nav.classList.contains("active") &&
      !nav.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      nav.classList.remove("active");
      burger.classList.remove("toggle");
      burger.setAttribute("aria-expanded", "false");
    }
  });
}

// ===== Scroll to Top Button =====
const scrollToTopBtn = safeQuerySelector("#scrollToTop");

if (scrollToTopBtn) {
  const handleScroll = throttle(() => {
    const scrollPos =
      scrollContainer === window
        ? window.pageYOffset
        : scrollContainer.scrollTop;
    if (scrollPos > 300) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  }, 100);

  // Listen to the correct scroll container
  (scrollContainer === window ? window : scrollContainer).addEventListener(
    "scroll",
    handleScroll,
    { passive: true }
  );

  scrollToTopBtn.addEventListener("click", () => {
    scrollToContainer(0);
  });
}

// ===== Smooth Scrolling for Navigation Links =====
safeQuerySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (!href || href === "#") return;

    e.preventDefault();
    const target = safeQuerySelector(href);
    if (target) {
      const offsetTop = target.offsetTop - -70;
      scrollToContainer(offsetTop);
    }
  });
});

// ===== Navbar Background on Scroll =====
const navbar = safeQuerySelector(".navbar");

if (navbar) {
  const handleNavbarScroll = throttle(() => {
    const pos =
      scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
    if (pos > 50) {
      navbar.style.background = "rgba(15, 23, 42, 0.95)";
      navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.3)";
    } else {
      navbar.style.background = "rgba(15, 23, 42, 0.8)";
      navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.1)";
    }
  }, 100);

  (scrollContainer === window ? window : scrollContainer).addEventListener(
    "scroll",
    handleNavbarScroll,
    { passive: true }
  );
}

// ===== Intersection Observer for Animations =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // If this is a stats card, it should slide in from the right; otherwise slide up
      if (
        entry.target.classList &&
        entry.target.classList.contains("stat-card")
      ) {
        // stat-cards now appear by sliding up from below (translateY)
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      } else {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
      // Unobserve after animation to improve performance
      animationObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements. Treat stat-cards specially so they slide in from the right
const projectAndSkillNodes = safeQuerySelectorAll(
  ".project-card, .skill-category"
);
const statCards = safeQuerySelectorAll(".stat-card");

if (projectAndSkillNodes.length > 0) {
  projectAndSkillNodes.forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = `all 0.6s ease ${index * 0.1}s`;
    animationObserver.observe(el);
  });
}

// Trigger on side-nav clicks for the About node
const sideNavNodes = safeQuerySelectorAll(".side-nav .nav-node");
if (sideNavNodes && sideNavNodes.length > 0) {
  sideNavNodes.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = btn.getAttribute("data-section");
      if (!target) return;
      if (target === "about") {
        // small delay to allow scroll to initiate; animation function guards overlapping calls
        setTimeout(() => animateStatCardsSequence({ fromNav: true }), 150);
      }
      if (target === "home") {
        // trigger hero-image animation on nav click (small delay to allow smooth scroll)
        setTimeout(() => animateHeroImageSequence({ fromNav: true }), 150);
      }
      if (target === "home") {
        // also animate hero content (text/buttons) when Home nav clicked
        setTimeout(() => animateHeroContentSequence({ fromNav: true }), 180);
      }
      if (target === "contact") {
        // trigger contact animations when nav node clicked
        setTimeout(() => animateContactSequence({ fromNav: true }), 150);
      }
    });
  });
}

// Hero animation: trigger on nav click and when the section becomes visible
let isAnimatingHero = false;
function animateHeroImageSequence(opts = {}) {
  const hero = safeQuerySelector(".hero-image");
  if (!hero) return;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    hero.classList.add("enter");
    return;
  }
  if (isAnimatingHero) return;
  isAnimatingHero = true;

  // reset class to allow retrigger
  hero.classList.remove("enter");
  // force reflow
  // eslint-disable-next-line no-unused-expressions
  hero.offsetHeight;
  // add enter class to start transition
  setTimeout(() => hero.classList.add("enter"), 18);

  const duration = 1000; // ms (match CSS)
  setTimeout(() => {
    isAnimatingHero = false;
  }, duration + 100);
}

// Hero content (text/buttons) animation: triggered by nav click and section visibility
let isAnimatingHeroContent = false;
function animateHeroContentSequence(opts = {}) {
  const content = safeQuerySelector(".hero-content");
  if (!content) return;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    content.classList.add("enter");
    return;
  }
  if (isAnimatingHeroContent) return;
  isAnimatingHeroContent = true;

  // retrigger by removing/adding the class
  content.classList.remove("enter");
  // force reflow
  // eslint-disable-next-line no-unused-expressions
  content.offsetHeight;
  setTimeout(() => content.classList.add("enter"), 18);

  // duration roughly matches CSS transition (900ms) + small buffer
  const duration = 900;
  setTimeout(() => {
    isAnimatingHeroContent = false;
  }, duration + 100);
}

// Also observe the home section for visibility-triggered runs
const homeSection = safeQuerySelector("section#home");
if (homeSection) {
  const homeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateHeroImageSequence();
          // animate hero content together when home becomes visible
          animateHeroContentSequence();

          // Animate decorative background title (Portfolio) by toggling .show on .glass-wrap
          try {
            const glassWrap = safeQuerySelector(".glass-wrap");
            const prefersReduced = window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches;
            if (glassWrap) {
              // Only play glass-wrap entrance animation once per session
              const alreadyPlayed =
                sessionStorage.getItem("glassWrapPlayed") === "true";
              if (prefersReduced) {
                glassWrap.classList.add("show");
                // ensure letters are visible for reduced-motion users
                try {
                  const keys = glassWrap.querySelectorAll(".glass-title .key");
                  keys &&
                    keys.forEach((k) => k.style.removeProperty("transform"));
                  keys &&
                    keys.forEach((k) => k.style.removeProperty("opacity"));
                } catch (e) {
                  /* ignore */
                }
                // Reveal nav/hero immediately for reduced-motion
                try {
                  const navTrack = safeQuerySelector(".nav-track");
                  const emblem = safeQuerySelector(".side-nav .emblem");
                  const heroContent = safeQuerySelector(".hero-content");
                  const heroImage = safeQuerySelector(".hero-image");
                  [navTrack, emblem, heroContent, heroImage].forEach(
                    (el) => el && el.classList.add("enter")
                  );
                } catch (e) {}
              } else if (alreadyPlayed) {
                // If already played earlier in this session, show immediately without entrance animation
                glassWrap.classList.add("show");
                try {
                  const keys = glassWrap.querySelectorAll(".glass-title .key");
                  if (window.gsap && typeof window.gsap.set === "function") {
                    gsap.set(keys, { yPercent: 0, opacity: 1, force3D: true });
                  } else {
                    keys &&
                      keys.forEach((k) => {
                        k.style.removeProperty("transform");
                        k.style.removeProperty("opacity");
                      });
                  }
                } catch (e) {
                  /* ignore */
                }
                // Also run the post-glass reveal sequence immediately
                try {
                  const navTrack = safeQuerySelector(".nav-track");
                  const emblem = safeQuerySelector(".side-nav .emblem");
                  const heroContent = safeQuerySelector(".hero-content");
                  const heroImage = safeQuerySelector(".hero-image");
                  const safeAdd = (el) => {
                    if (!el) return;
                    if (!el.classList.contains("enter"))
                      el.classList.add("enter");
                  };
                  safeAdd(navTrack);
                  safeAdd(emblem);
                  safeAdd(heroContent);
                  safeAdd(heroImage);
                } catch (e) {}
              } else {
                // Prepare and retrigger letter + container animation
                const keys = glassWrap.querySelectorAll(".glass-title .key");

                if (keys && keys.length) {
                  if (window.gsap && typeof window.gsap.set === "function") {
                    gsap.set(keys, {
                      // start letters above their final position so they drop down
                      yPercent: -100,
                      opacity: 0,
                      force3D: true,
                    });
                  } else {
                    keys.forEach((k) => {
                      // start letters above their final position so they will move down
                      k.style.transform = "translateY(-100%)";
                      k.style.opacity = "0";
                      // no built-in delay here; we'll trigger after container transitionend
                      k.style.transition =
                        "transform 0.7s var(--ease-out-expo), opacity 0.7s ease";
                    });
                  }
                }

                glassWrap.classList.remove("show");
                // force reflow
                // eslint-disable-next-line no-unused-expressions
                glassWrap.offsetHeight;

                // Show container and then run letter animation after the container's transform transition ends
                glassWrap.classList.add("show");

                // Helper to run letters animation (GSAP or CSS fallback)
                const runLetters = () => {
                  try {
                    if (keys && keys.length) {
                      if (window.gsap && typeof window.gsap.to === "function") {
                        gsap.to(keys, {
                          yPercent: 0,
                          opacity: 1,
                          duration: 0.7,
                          ease: "power3.out",
                          stagger: 0.06,
                        });
                      } else {
                        // CSS fallback: remove inline transform/opacity to trigger CSS transition
                        keys.forEach((k) => {
                          k.style.transform = "";
                          k.style.opacity = "";
                        });
                        // cleanup transition property after animation completes
                        setTimeout(
                          () =>
                            keys.forEach((k) =>
                              k.style.removeProperty("transition")
                            ),
                          1000
                        );
                      }
                    }
                  } catch (err) {
                    console.warn("letter sync animation failed", err);
                  }
                };

                // Listen for transitionend on the container (prefer transform property). Run only once.
                let ran = false;
                const onTransitionEnd = (ev) => {
                  // ensure we respond to transitions coming from the glassWrap itself
                  if (ev.target !== glassWrap) return;
                  // if propertyName is available, prefer 'transform'
                  if (
                    ev.propertyName &&
                    ev.propertyName !== "transform" &&
                    ev.propertyName !== "-webkit-transform"
                  )
                    return;
                  if (ran) return;
                  ran = true;
                  runLetters();

                  // mark that glass-wrap animation has played for this session
                  try {
                    sessionStorage.setItem("glassWrapPlayed", "true");
                  } catch (e) {
                    /* ignore storage errors */
                  }

                  // After letters run, orchestrate side-nav -> hero-content -> hero-image
                  try {
                    const prefersReduced = window.matchMedia(
                      "(prefers-reduced-motion: reduce)"
                    ).matches;
                    const navTrack = safeQuerySelector(".nav-track");
                    const emblem = safeQuerySelector(".side-nav .emblem");
                    const heroContent = safeQuerySelector(".hero-content");
                    const heroImage = safeQuerySelector(".hero-image");

                    const safeAdd = (el) => {
                      if (!el) return;
                      if (!el.classList.contains("enter"))
                        el.classList.add("enter");
                    };

                    if (prefersReduced) {
                      safeAdd(navTrack);
                      safeAdd(emblem);
                      safeAdd(heroContent);
                      safeAdd(heroImage);
                    } else {
                      if (navTrack) safeAdd(navTrack);
                      if (emblem) setTimeout(() => safeAdd(emblem), 80);
                      if (heroContent)
                        setTimeout(() => safeAdd(heroContent), 140);
                      if (heroImage) setTimeout(() => safeAdd(heroImage), 260);
                    }
                  } catch (seqErr) {
                    console.warn("post-glass reveal sequence failed", seqErr);
                  }

                  glassWrap.removeEventListener(
                    "transitionend",
                    onTransitionEnd
                  );
                  if (fallbackTimer) clearTimeout(fallbackTimer);
                };

                // Fallback: in case transitionend doesn't fire, run after max timeout
                const fallbackTimer = setTimeout(() => {
                  if (!ran) {
                    ran = true;
                    runLetters();
                    try {
                      sessionStorage.setItem("glassWrapPlayed", "true");
                    } catch (e) {}
                    glassWrap.removeEventListener(
                      "transitionend",
                      onTransitionEnd
                    );
                  }
                }, 1200);

                glassWrap.addEventListener("transitionend", onTransitionEnd);
              }
            }
          } catch (e) {
            // fail silently if anything goes wrong
            console.warn("glass-wrap animation failed to initialize", e);
          }
        }
      });
    },
    { threshold: 0.36 }
  );
  homeObserver.observe(homeSection);
}

// ===== Contact animations: title (top), board (right), form (left), info (bottom) =====
let isAnimatingContact = false;
function animateContactSequence(opts = {}) {
  const section = safeQuerySelector("section#contact");
  if (!section) return;
  const title = safeQuerySelector("section#contact .section-title");
  const board = safeQuerySelector("#contact-board");
  const form = safeQuerySelector("#contact-form");
  const info = safeQuerySelector(".contact-info");

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    [title, board, form, info].forEach((el) => {
      if (el) el.classList.add("enter");
    });
    return;
  }

  if (isAnimatingContact) return;
  isAnimatingContact = true;

  // remove enter to allow retrigger
  [title, board, form, info].forEach((el) => {
    if (el) el.classList.remove("enter");
  });

  // force reflow
  // eslint-disable-next-line no-unused-expressions
  section && section.offsetHeight;

  // sequence: title -> board & form -> info
  setTimeout(() => {
    if (title) title.classList.add("enter");
  }, 20);

  setTimeout(() => {
    if (board) board.classList.add("enter");
    if (form) form.classList.add("enter");
  }, 250);

  setTimeout(() => {
    if (info) info.classList.add("enter");
  }, 450);

  const total = 450 + 900 + 150;
  setTimeout(() => {
    isAnimatingContact = false;
  }, total);
}

// Trigger contact animation on section visibility
const contactSection = safeQuerySelector("section#contact");
if (contactSection) {
  const contactObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateContactSequence();
        }
      });
    },
    { threshold: 0.32 }
  );
  contactObserver.observe(contactSection);
}

// Also run when the About section becomes visible via an observer
const aboutSection = safeQuerySelector("section#about");
if (aboutSection) {
  let aboutStatsAnimated = false;
  const aboutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !aboutStatsAnimated) {
          aboutStatsAnimated = true;
          animateStatCardsSequence();
          // Stop observing after first animation
          aboutObserver.unobserve(aboutSection);
        }
      });
    },
    { threshold: 0.36 }
  );
  aboutObserver.observe(aboutSection);
}

// ===== About stats reveal sequence (used by nav click and intersection observer) =====
let isAnimatingStats = false;
function animateStatCardsSequence(opts = {}) {
  try {
    console.debug("animateStatCardsSequence: start", opts);
  } catch (e) {}
  const container = safeQuerySelector(".about-stats");
  if (!container) return;
  if (isAnimatingStats) return;
  isAnimatingStats = true;

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const cards = Array.from(container.querySelectorAll(".stat-card"));
  if (!cards || cards.length === 0) {
    isAnimatingStats = false;
    return;
  }

  if (prefersReduced) {
    cards.forEach((c) => c.classList.add("enter"));
    // attempt to animate numbers immediately if available
    try {
      cards.forEach((c) => {
        const num = c.querySelector(".stat-number");
        if (num && typeof animateNumbers === "function") {
          const target = parseInt((num.textContent || "").replace("+", ""));
          if (!isNaN(target)) animateNumbers(num, target);
        }
      });
    } catch (e) {}
    isAnimatingStats = false;
    return;
  }

  // set initial hidden state for smooth entrance
  cards.forEach((c) => {
    c.style.opacity = "0";
    c.style.transform = "translateY(22px)";
    c.style.pointerEvents = "none";
    c.style.transition =
      c.style.transition || "all 0.55s cubic-bezier(0.22,1,0.36,1)";
  });

  // reveal with stagger
  const baseDelay = opts.delay || 120;
  cards.forEach((c, i) => {
    setTimeout(() => {
      c.style.removeProperty("transform");
      c.style.removeProperty("opacity");
      c.style.removeProperty("pointer-events");

      // start number animation when its card becomes visible
      try {
        const num = c.querySelector(".stat-number");
        if (num && typeof animateNumbers === "function") {
          const raw = (num.textContent || "").replace("+", "");
          const target = parseInt(raw);
          if (!isNaN(target)) animateNumbers(num, target);
        }
      } catch (e) {
        /* ignore */
      }
    }, baseDelay + i * 110);
  });

  // cleanup and unlock after animations
  const total = baseDelay + cards.length * 110 + 420;
  setTimeout(() => {
    cards.forEach((c) => c.style.removeProperty("transition"));
    try {
      console.debug("animateStatCardsSequence: end");
    } catch (e) {}
    isAnimatingStats = false;
  }, total);
}

// ===== Section assemble / leave animations =====
(() => {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const secNodes = safeQuerySelectorAll("section[id]");
  if (!secNodes || secNodes.length === 0) return;

  // initialize: mark children with section-item and set stagger delays
  secNodes.forEach((section) => {
    const children = Array.from(section.children || []);
    children.forEach((child, idx) => {
      // don't overwrite existing class if present
      if (!child.classList.contains("section-item"))
        child.classList.add("section-item");
      // set CSS variable for stagger delay (safer than writing to multiple transition properties)
      try {
        if (!prefersReduced)
          child.style.setProperty("--stagger", `${idx * 65}ms`);
        else child.style.setProperty("--stagger", "0ms");
      } catch (e) {
        /* ignore */
      }
    });
  });

  // Observer toggles in-view / out-of-view classes on sections
  const sectionViewObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sec = entry.target;
        if (entry.isIntersecting) {
          sec.classList.add("in-view");
          sec.classList.remove("out-of-view");

          // If this is the contact section, set stagger vars for contact-method items
          if (sec.id === "contact") {
            const methods = Array.from(sec.querySelectorAll(".contact-method"));
            methods.forEach((m, idx) => {
              try {
                if (!prefersReduced)
                  m.style.setProperty("--stagger", `${idx * 90}ms`);
                else m.style.setProperty("--stagger", `0ms`);
              } catch (e) {
                /* ignore */
              }
            });
          }
        } else {
          // Only mark out-of-view if it was previously in-view to avoid initial flicker
          if (sec.classList.contains("in-view")) {
            sec.classList.remove("in-view");
            sec.classList.add("out-of-view");
            // clear stagger when leaving (optional)
            if (sec.id === "contact") {
              sec
                .querySelectorAll(".contact-method")
                .forEach((m) => m.style.removeProperty("--stagger"));
            }
          }
        }
      });
    },
    { threshold: 0.48 }
  );

  secNodes.forEach((s) => sectionViewObserver.observe(s));
})();

// Helper: format number with thousands separators (RU-friendly)
function formatNumber(n) {
  try {
    return new Intl.NumberFormat("ru-RU").format(Math.round(n));
  } catch (e) {
    return String(Math.round(n));
  }
}

// Simple localStorage cache with TTL (seconds)
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.ts) return null;
    const age = Date.now() - obj.ts;
    if (typeof obj.ttl === "number" && age > obj.ttl * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return obj.value;
  } catch (e) {
    return null;
  }
}

function cacheSet(key, value, ttlSeconds = 86400) {
  try {
    const obj = { ts: Date.now(), ttl: ttlSeconds, value };
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    // ignore storage errors (private mode etc.)
  }
}

// Helper: try to get installs for a single Greasy Fork script id.
// Tries JSON endpoint first, then falls back to scraping the HTML page.
async function getGreasyForkInstalls(id) {
  const tryJson = async () => {
    const url = `https://greasyfork.org/scripts/${id}.json`;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`JSON fetch failed: ${res.status}`);
    const j = await res.json();
    // Heuristic checks for common fields
    if (j && typeof j === "object") {
      // common possibilities
      const candidates = [
        j.statistics && j.statistics.installs,
        j.statistics && j.statistics.install_count,
        j.install_count,
        j.installs,
        j.total_installs,
      ];
      for (const c of candidates) {
        if (typeof c === "number" && !isNaN(c)) return c;
      }
      // fallback: try to find any numeric property in the JSON (last resort)
      const s = JSON.stringify(j);
      const m = s.match(/([0-9]{2,})/);
      if (m) return parseInt(m[1], 10);
    }
    throw new Error("No installs in JSON");
  };

  const tryHtml = async () => {
    // try localized RU page first
    const urls = [
      `https://greasyfork.org/ru/scripts/${id}`,
      `https://greasyfork.org/scripts/${id}`,
    ];
    for (const url of urls) {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) continue;
      const text = await res.text();
      // look for patterns like "Установок 1 234" or "1,234 installs"
      const reList = [
        /Установк[а-яА-ЯёЁ]*[\s:\u00A0]*([0-9\s,\.]+)/i,
        /([0-9][0-9\s,\.]+)\s*(?:установ|установок)/i,
        /([0-9][0-9,\.\s]+)\s*installs?/i,
        /data-installations\s*=\s*"([0-9,\.\s]+)"/i,
        /install-count["'\s:>]*([0-9,\.\s]+)/i,
      ];
      for (const re of reList) {
        const m = text.match(re);
        if (m && m[1]) {
          const digits = m[1].replace(/[^0-9]/g, "");
          const val = parseInt(digits || "0", 10);
          if (!isNaN(val) && val > 0) return val;
        }
      }
    }
    throw new Error("No installs found in HTML");
  };

  // try JSON then HTML
  try {
    return await tryJson();
  } catch (e) {
    try {
      return await tryHtml();
    } catch (e2) {
      throw new Error(
        `Failed to get installs for ${id}: ${e.message}; ${e2.message}`
      );
    }
  }
}

// Fetch sum of installs for array of Greasy Fork script ids. Returns number or throws.
async function fetchSumGreasyForkInstalls(ids) {
  const cacheKey = `greasy_installs_${ids.join(",")}`;
  const cached = cacheGet(cacheKey);
  if (typeof cached === "number") return cached;

  const results = await Promise.all(
    ids.map((id) =>
      getGreasyForkInstalls(id).catch((err) => {
        console.warn(`install fetch failed for ${id}`, err);
        return 0;
      })
    )
  );
  const sum = results.reduce((a, b) => a + (Number(b) || 0), 0);
  try {
    if (sum > 0) cacheSet(cacheKey, sum, 24 * 3600);
    else cacheSet(cacheKey, 0, 3600);
  } catch (e) {}
  return sum;
}

// Helper: fetch number of non-empty source code lines for a single Greasy Fork script
async function getGreasyForkLOC(id) {
  // Try JSON endpoints first (may or may not contain source)
  const tryJson = async () => {
    // Try a couple of likely JSON endpoints
    const urls = [
      `https://greasyfork.org/scripts/${id}.json`,
      `https://greasyfork.org/scripts/${id}/versions/latest.json`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) continue;
        const j = await res.json();
        // Look for source-like fields
        const candidates = [
          j.source,
          j.code,
          j.content,
          j.files &&
            Array.isArray(j.files) &&
            j.files.map((f) => f.content).join("\n"),
        ];
        for (const c of candidates) {
          if (typeof c === "string" && c.trim().length > 0) {
            const lines = c
              .split(/\r?\n/)
              .filter((l) => l.trim().length > 0).length;
            if (lines > 0) return lines;
          }
        }
      } catch (e) {
        /* ignore and try next */
      }
    }
    throw new Error("No source in JSON");
  };

  const tryHtml = async () => {
    const urls = [
      `https://greasyfork.org/ru/scripts/${id}`,
      `https://greasyfork.org/scripts/${id}`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) continue;
        const text = await res.text();
        // Find all <pre> blocks and choose the longest one as likely source code
        const preMatches = [...text.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)];
        if (preMatches.length) {
          let longest = "";
          for (const m of preMatches) {
            if (m[1] && m[1].length > longest.length) longest = m[1];
          }
          if (longest) {
            // Strip HTML entities and tags inside pre if any
            const stripped = longest
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;|&lt;|&gt;|&amp;/g, " ");
            const lines = stripped
              .split(/\r?\n/)
              .filter((l) => l.trim().length > 0).length;
            if (lines > 0) return lines;
          }
        }
        // Fallback: look for code blocks inside <code> tags
        const codeMatches = [
          ...text.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/gi),
        ];
        if (codeMatches.length) {
          let longest = "";
          for (const m of codeMatches) {
            if (m[1] && m[1].length > longest.length) longest = m[1];
          }
          if (longest) {
            const stripped = longest
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;|&lt;|&gt;|&amp;/g, " ");
            const lines = stripped
              .split(/\r?\n/)
              .filter((l) => l.trim().length > 0).length;
            if (lines > 0) return lines;
          }
        }
      } catch (e) {
        /* ignore and try next */
      }
    }
    throw new Error("No source found in HTML");
  };

  try {
    return await tryJson();
  } catch (e) {
    try {
      return await tryHtml();
    } catch (e2) {
      throw new Error(
        `Failed to get LOC for ${id}: ${e.message}; ${e2.message}`
      );
    }
  }
}

async function fetchSumGreasyForkLOC(ids) {
  const cacheKey = `greasy_loc_${ids.join(",")}`;
  const cached = cacheGet(cacheKey);
  if (typeof cached === "number") return cached;

  const results = await Promise.all(
    ids.map((id) =>
      getGreasyForkLOC(id).catch((err) => {
        console.warn(`LOC fetch failed for ${id}`, err);
        return 0;
      })
    )
  );
  const sum = results.reduce((a, b) => a + (Number(b) || 0), 0);
  try {
    if (sum > 0) cacheSet(cacheKey, sum, 24 * 3600);
    else cacheSet(cacheKey, 0, 3600);
  } catch (e) {}
  return sum;
}

// ===== About-stats 3D Vertical Slider =====
(function () {
  const aboutStats = safeQuerySelector(".about-stats");
  if (!aboutStats) return;

  const cards = Array.from(aboutStats.querySelectorAll(".stat-card"));
  if (cards.length <= 1) return; // nothing to slide

  // add class to enable 3D styles
  aboutStats.classList.add("stats-3d");

  // set data-index attributes
  cards.forEach((c, i) => {
    c.dataset.sidx = i;

    // If this is the second stat card (sidx == 1), replace its static number
    // with the sum of source lines (LOC) from two Greasy Fork scripts.
    // Script IDs to sum: 537017 (YouTube) and 537433 (Telegram)
    if (i === 1) {
      try {
        const numEl = c.querySelector(".stat-number");
        if (numEl) {
          numEl.textContent = "...";
          fetchSumGreasyForkLOC([537017, 537433])
            .then((sum) => {
              if (typeof sum === "number" && !isNaN(sum) && sum > 0) {
                numEl.textContent = formatNumber(sum) + "+";
                numEl.dataset.animated = "true";
              }
            })
            .catch((err) => {
              console.warn("Failed to fetch Greasy Fork LOC:", err);
              if (!numEl.textContent || numEl.textContent === "...")
                numEl.textContent = "1000+";
            });
        }
      } catch (e) {
        /* ignore */
      }
    }

    // If this is the third stat card (sidx == 2), replace its static number
    // with the sum of installs from two Greasy Fork scripts.
    // Script IDs to sum: 537017 (YouTube) and 537433 (Telegram)
    if (i === 2) {
      try {
        const numEl = c.querySelector(".stat-number");
        if (numEl) {
          // show loading placeholder
          numEl.textContent = "...";
          // fetch and update installs (does not block UI)
          fetchSumGreasyForkInstalls([537017, 537433])
            .then((sum) => {
              if (typeof sum === "number" && !isNaN(sum)) {
                numEl.textContent = formatNumber(sum) + "+";
                // mark as already animated so the built-in counter won't override it
                numEl.dataset.animated = "true";
              }
            })
            .catch((err) => {
              // on failure, leave existing text or fallback to original static
              console.warn("Failed to fetch Greasy Fork installs:", err);
              // restore a sensible fallback if empty
              if (!numEl.textContent || numEl.textContent === "...")
                numEl.textContent = "100+";
            });
        }
      } catch (e) {
        /* ignore */
      }
    }
  });

  let current = 0;
  let autoplayTimer = null;
  const autoplayInterval = 3500;

  function normalizeOffset(offset, len) {
    // wrap offset to range [-len/2, len/2]
    if (offset > len / 2) return offset - len;
    if (offset < -len / 2) return offset + len;
    return offset;
  }

  function updatePositions() {
    const len = cards.length;
    cards.forEach((card, i) => {
      let offset = i - current;
      offset = normalizeOffset(offset, len);
      const abs = Math.abs(offset);

      // Tuned spacing/depth values for a more pronounced 3D stack
      const translateY = offset * 110; // vertical spacing between stacked cards
      const translateZ = -abs * 220; // deeper Z-depth for stronger perspective
      const scale = Math.max(0.7, 1 - abs * 0.14); // allow slightly smaller deep cards
      const rotateX = offset * 8; // increased tilt for depth feeling
      // keep cards visible a bit further into the stack before fully fading
      const opacity = abs > 4 ? 0 : Math.max(0, 1 - abs * 0.2);

      card.style.zIndex = String(100 - Math.round(abs));
      card.style.transform = `translate(-50%, calc(-50% + ${translateY}px)) translateZ(${translateZ}px) scale(${scale}) rotateX(${rotateX}deg)`;
      card.style.opacity = opacity;
      card.classList.toggle("is-front", offset === 0);
    });
  }

  function next() {
    current = (current + 1) % cards.length;
    updatePositions();
  }

  function prev() {
    current = (current - 1 + cards.length) % cards.length;
    updatePositions();
  }

  // autoplay
  function startAutoplay() {
    if (autoplayTimer) return;
    autoplayTimer = setInterval(next, autoplayInterval);
  }
  function stopAutoplay() {
    if (!autoplayTimer) return;
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  // pause on hover/focus
  aboutStats.addEventListener("mouseenter", stopAutoplay);
  aboutStats.addEventListener("mouseleave", startAutoplay);
  aboutStats.addEventListener("focusin", stopAutoplay);
  aboutStats.addEventListener("focusout", startAutoplay);

  // pointer interactions: swipe for touch
  let touchStartY = 0;
  aboutStats.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0].clientY;
      stopAutoplay();
    },
    { passive: true }
  );
  aboutStats.addEventListener(
    "touchend",
    (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchEndY - touchStartY;
      if (Math.abs(diff) > 30) {
        if (diff > 0) prev();
        else next();
      }
      setTimeout(startAutoplay, 1200);
    },
    { passive: true }
  );

  // keyboard
  aboutStats.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    }
  });

  // initialize
  updatePositions();
  startAutoplay();

  // respect reduced motion preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stopAutoplay();
  }
})();

// ===== Side navigation active state (observe sections) =====
const navNodes = safeQuerySelectorAll(".side-nav .nav-node");
const navConnectors = safeQuerySelectorAll(".side-nav .nav-connector");
const sections = safeQuerySelectorAll("section[id]");

/*
  Connector fill is driven by scroll progress. We expose two helpers:
  - highlightConnectors(activeIndex): keeps the active node state and sets full fills as a fallback
  - updateConnectorFill(): computes per-connector progress (0..1) based on scroll position and writes --fill
*/

const highlightConnectors = (activeIndex) => {
  // toggle active class on nodes only (visual label/ring)
  navNodes.forEach((btn) => btn.classList.remove("active"));
  if (navNodes[activeIndex]) navNodes[activeIndex].classList.add("active");

  // as a fallback (or before scroll handler runs) mark connectors before activeIndex as fully filled
  navConnectors.forEach((connector, index) => {
    if (index < activeIndex) {
      connector.style.setProperty("--fill", "100%");
    } else {
      connector.style.setProperty("--fill", "0%");
      connector.classList.remove("active");
    }
  });
};

// Compute continuous per-connector progress based on scroll position between consecutive sections
const updateConnectorFill = throttle(() => {
  const headerOffset = 70; // same offset used for smooth scroll
  const currentScroll =
    scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
  const scrollY = currentScroll + headerOffset;

  // map section tops once per call
  const tops = [...sections].map((s) => s.offsetTop);

  navConnectors.forEach((connector, i) => {
    const start = tops[i] ?? 0;
    const end =
      tops[i + 1] ??
      (scrollContainer === window
        ? document.body.scrollHeight
        : scrollContainer.scrollHeight);
    const range = Math.max(1, end - start);
    let progress = 0;
    if (scrollY <= start) progress = 0;
    else if (scrollY >= end) progress = 1;
    else progress = (scrollY - start) / range;
    progress = Math.max(0, Math.min(1, progress));
    connector.style.setProperty("--fill", `${progress * 100}%`);
  });
}, 50);

if (navNodes.length > 0 && sections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = safeQuerySelector(
          `.side-nav .nav-node[data-section="${entry.target.id}"]`
        );
        if (!node) return;
        navNodes.forEach((btn) => btn.classList.remove("active"));
        node.classList.add("active");
        highlightConnectors([...navNodes].indexOf(node));
      });
    },
    { threshold: 0.6 }
  );

  sections.forEach((sec) => {
    if (sec) sectionObserver.observe(sec);
  });

  navNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const sectionId = node.dataset.section;
      if (!sectionId) return;

      const target = document.getElementById(sectionId);
      if (!target) return;

      // Scroll to the exact top of the section (no extra top offset)
      const offset = target.offsetTop;
      scrollToContainer(offset);

      if (nav && nav.classList.contains("active")) {
        nav.classList.remove("active");
        if (burger) burger.classList.remove("toggle");
      }
    });
  });

  window.addEventListener("load", () => {
    let activeNode = safeQuerySelector(".side-nav .nav-node.active");
    if (!activeNode && navNodes[0]) {
      navNodes[0].classList.add("active");
      activeNode = navNodes[0];
    }
    if (activeNode) {
      highlightConnectors([...navNodes].indexOf(activeNode));
    }
    // initialize connector fills once on load
    updateConnectorFill();

    // Orchestrate entrance sequence: nav-track -> emblem -> hero-image -> first section
    try {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const navTrack = safeQuerySelector(".nav-track");
      const emblem = safeQuerySelector(".side-nav .emblem");
      const hero = safeQuerySelector(".hero-image");
      const firstSection = safeQuerySelector("section[id]");

      // Timing values (ms) chosen to match CSS transitions roughly.
      const timings = {
        paintDelay: 60,
        navStart: 80,
        navDuration: 620, // should match CSS nav-track transition
        emblemDuration: 420, // should match CSS emblem transition
        heroDuration: 620, // should match CSS hero-image transition
        sectionDelayAfterHero: 160,
      };

      if (prefersReduced) {
        // show everything immediately for reduced-motion users
        if (navTrack) navTrack.classList.add("enter");
        if (emblem) emblem.classList.add("enter");
        if (hero) hero.classList.add("enter");
        if (firstSection) firstSection.classList.add("in-view");
      } else {
        // nav-track appears first
        if (navTrack)
          setTimeout(
            () => navTrack.classList.add("enter"),
            timings.navStart + timings.paintDelay
          );

        // emblem after nav finishes
        if (emblem)
          setTimeout(
            () => emblem.classList.add("enter"),
            timings.navStart + timings.paintDelay + timings.navDuration
          );

        // hero-image shortly after emblem (allow slight overlap)
        if (hero)
          setTimeout(
            () => hero.classList.add("enter"),
            timings.navStart +
              timings.paintDelay +
              timings.navDuration +
              Math.round(timings.emblemDuration / 2)
          );

        // make first visible section assemble after hero has started
        if (firstSection)
          setTimeout(
            () => firstSection.classList.add("in-view"),
            timings.navStart +
              timings.paintDelay +
              timings.navDuration +
              Math.round(timings.emblemDuration / 2) +
              Math.round(timings.heroDuration / 2) +
              timings.sectionDelayAfterHero
          );
      }
    } catch (err) {
      console.warn("entrance sequence failed to initialize", err);
    }
    // Hero image: appear from right on load
    try {
      const hero = safeQuerySelector(".hero-image");
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (hero && !prefersReducedMotion) {
        // small timeout to allow paint and avoid jank; slightly after nav-track
        setTimeout(() => hero.classList.add("enter"), 140);
      } else if (hero) {
        // immediately show without transitions for reduced-motion
        hero.classList.add("enter");
      }
    } catch (err) {
      console.warn("hero-image animation failed to initialize", err);
    }
  });

  // update connector fills while scrolling/resizing
  (scrollContainer === window ? window : scrollContainer).addEventListener(
    "scroll",
    updateConnectorFill,
    { passive: true }
  );
  window.addEventListener("resize", debounce(updateConnectorFill, 150));
}

// ===== Number Counter Animation =====
const animateNumbers = (element, target) => {
  if (!element || isNaN(target)) return;

  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + "+";
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + "+";
    }
  }, 30);
};

// Observe stat numbers for animation
const statNumbers = safeQuerySelectorAll(".stat-number");
if (statNumbers.length > 0) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          const text = entry.target.textContent;
          const target = parseInt(text.replace("+", ""));
          if (!isNaN(target)) {
            entry.target.dataset.animated = "true";
            animateNumbers(entry.target, target);
            // Unobserve after animation
            statsObserver.unobserve(entry.target);
          }
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((stat) => {
    if (stat) statsObserver.observe(stat);
  });
}

// ===== Typing Effect (hero-subtitle) =====
// Wait for translations to be applied (i18n:applied) so we type the final localized text
// instead of typing before i18n overwrites content and causing duplication.
(() => {
  const subtitle = safeQuerySelector(".hero-subtitle");
  if (!subtitle) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const typingSpeed = 50;
  let started = false;

  const startTyping = (text) => {
    if (started) return;
    started = true;
    if (prefersReducedMotion || !text) {
      // just ensure the subtitle shows the text without typing
      subtitle.textContent = text || subtitle.textContent || "";
      return;
    }

    // do typewriter effect
    subtitle.textContent = "";
    let charIndex = 0;
    const typeWriter = () => {
      if (charIndex < text.length) {
        subtitle.textContent += text.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, typingSpeed);
      }
    };

    // small delay to let other UI settle
    setTimeout(() => typeWriter(), 320);
  };

  // If i18n applies translations later, it will dispatch 'i18n:applied'. Prefer that value.
  const onI18n = () => {
    try {
      const final = subtitle.textContent || "";
      startTyping(final);
    } catch (e) {
      startTyping(subtitle.textContent || "");
    }
  };

  document.addEventListener("i18n:applied", onI18n, { once: true });

  // Fallback: if i18n doesn't fire within 800ms, start typing whatever is currently present
  setTimeout(() => {
    startTyping(subtitle.textContent || "");
  }, 800);
})();

// ===== 3D Skills Carousel =====
(() => {
  const track = safeQuerySelector(".carousel-track");
  if (!track) return;

  const cards = Array.from(track.querySelectorAll(".card") || []);
  if (cards.length === 0) return;

  // Navigation controls (optional in markup) are not required; keep carousel functional without them
  let active = 0;
  let isAnimating = false;
  let autoplayInterval = null;

  // No indicators by default; if you add markup later, we can wire them up.

  const update = (index) => {
    if (isAnimating) return;
    isAnimating = true;

    const count = cards.length;
    active = ((index % count) + count) % count; // normalize

    cards.forEach((c, i) => {
      // Remove all position classes
      c.className = "card";

      // Calculate relative position
      let relativeIndex = i - active;

      // Handle wrapping for circular behavior
      if (relativeIndex > count / 2) {
        relativeIndex -= count;
      } else if (relativeIndex < -count / 2) {
        relativeIndex += count;
      }

      const distance = Math.abs(relativeIndex);

      // Assign classes based on position
      if (i === active) {
        c.classList.add("active");
      } else if (relativeIndex === -1) {
        c.classList.add("prev");
        // Store transform values for hover effect
        c.style.setProperty("--tx", "-140");
        c.style.setProperty("--tz", "-120");
        c.style.setProperty("--ty", "15");
        c.style.setProperty("--ry", "12");
      } else if (relativeIndex === 1) {
        c.classList.add("next");
        c.style.setProperty("--tx", "140");
        c.style.setProperty("--tz", "-120");
        c.style.setProperty("--ty", "15");
        c.style.setProperty("--ry", "-12");
      } else if (relativeIndex < -1) {
        c.classList.add("far-left");
      } else if (relativeIndex > 1) {
        c.classList.add("far-right");
      }
    });

    // (no indicators to update by default)

    setTimeout(() => {
      isAnimating = false;
    }, 600);
  };

  // Auto-play functionality
  const startAutoplay = () => {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      update(active + 1);
    }, 4000);
  };

  const stopAutoplay = () => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  };

  // Initial state
  update(0);
  startAutoplay();

  // Optional prev/next controls not present in markup — navigation is still possible via keyboard, touch, or clicking cards

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      stopAutoplay();
      update(active - 1);
      setTimeout(startAutoplay, 5000);
    }
    if (e.key === "ArrowRight") {
      stopAutoplay();
      update(active + 1);
      setTimeout(startAutoplay, 5000);
    }
  });

  // Click on card to activate it
  cards.forEach((c, i) => {
    c.addEventListener("click", () => {
      if (i !== active) {
        stopAutoplay();
        update(i);
        setTimeout(startAutoplay, 5000);
      }
    });
  });

  // Touch/swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      setTimeout(startAutoplay, 5000);
    },
    { passive: true }
  );

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next
        update(active + 1);
      } else {
        // Swipe right - previous
        update(active - 1);
      }
    }
  };

  // Pause autoplay when section is not visible
  const skillsSection = safeQuerySelector("#skills");
  if (skillsSection) {
    let isRevealing = false;

    const revealSkillsSequence = () => {
      // prevent overlapping reveals
      if (isRevealing) return;
      isRevealing = true;
      // pause autoplay while animating
      stopAutoplay();

      // set initial hidden state for smooth entrance
      cards.forEach((c) => {
        // keep the same transition timing as CSS but ensure opacity/transform are animated
        c.style.transition =
          "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s ease";
        c.style.opacity = "0";
        c.style.transform = "translateY(30px) scale(0.95)";
        c.style.pointerEvents = "none";
      });

      const activeCard = cards[active];
      const baseDelay = 120; // ms before showing active card

      // reveal active card first
      if (activeCard) {
        setTimeout(() => {
          // remove the inline styles so CSS class (e.g. .card.active) takes over and animates to its final transform/opacity
          activeCard.style.removeProperty("transform");
          activeCard.style.removeProperty("opacity");
          activeCard.style.removeProperty("pointer-events");
        }, baseDelay);
      }

      // then reveal remaining cards with a small stagger
      const othersStart = baseDelay + 180;
      let k = 0;
      cards.forEach((c, i) => {
        if (i === active) return;
        const delay = othersStart + k * 90;
        setTimeout(() => {
          c.style.removeProperty("transform");
          c.style.removeProperty("opacity");
          c.style.removeProperty("pointer-events");
        }, delay);
        k++;
      });

      // resume autoplay after animation completes
      const totalDuration =
        othersStart + Math.max(0, cards.length - 1) * 90 + 300;
      setTimeout(() => {
        // clean up any inline transition we set (optional)
        cards.forEach((c) => c.style.removeProperty("transition"));
        isRevealing = false;
        startAutoplay();
      }, totalDuration);
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // run reveal each time section becomes visible
            revealSkillsSequence();
          } else {
            stopAutoplay();
          }
        });
      },
      { threshold: 0.28 }
    );

    // Trigger reveal when user clicks a link to #skills (e.g. nav)
    const skillsLinks = safeQuerySelectorAll('a[href="#skills"]');
    if (skillsLinks && skillsLinks.length) {
      skillsLinks.forEach((lnk) => {
        lnk.addEventListener("click", (e) => {
          // allow navigation/scroll to proceed, but trigger reveal
          // small timeout so reveal happens after possible scroll jump
          setTimeout(() => revealSkillsSequence(), 50);
        });
      });
    }

    visibilityObserver.observe(skillsSection);
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    stopAutoplay();
  });
})();

// ===== Expanding Project Cards (with Carousel Autoplay) =====
(function () {
  const projectOptions = safeQuerySelectorAll(".project-option");
  const container = safeQuerySelector(".expanding-cards");

  if (projectOptions.length === 0) return;

  let isAnimating = false;
  let autoplayTimer = null;
  const autoplayInterval = 3500; // ms
  let currentIndex = Array.from(projectOptions).findIndex((o) =>
    o.classList.contains("active")
  );
  if (currentIndex === -1) currentIndex = 0;

  // Function to activate a card element
  const activateCard = (card, setFocus = false) => {
    if (isAnimating || card.classList.contains("active")) return;

    isAnimating = true;

    // Find the currently active card (if any)
    const prevActive = Array.from(projectOptions).find((o) =>
      o.classList.contains("active")
    );

    const collapseDuration = 520; // match CSS collapse timing (ms)
    const expandDelay = 80; // slight delay before expanding new card

    const doExpand = () => {
      // Ensure no other card is marked active
      projectOptions.forEach((opt) => {
        if (opt !== card) opt.classList.remove("active");
        opt.setAttribute("aria-expanded", "false");
      });

      // Add active class to selected option
      card.classList.add("active");
      card.setAttribute("aria-expanded", "true");

      // Update currentIndex
      currentIndex = Array.from(projectOptions).indexOf(card);

      // Optional focus
      if (setFocus) card.focus();

      // Reset animation lock after transition
      setTimeout(() => {
        isAnimating = false;
      }, 800);
    };

    if (prevActive && prevActive !== card) {
      // Trigger a graceful collapse on the previously active card
      prevActive.classList.add("closing");
      prevActive.setAttribute("aria-expanded", "false");

      // After collapse animation completes, remove classes and expand new card
      setTimeout(() => {
        prevActive.classList.remove("closing", "active");
        // give a tiny gap then expand the requested card so the transition feels natural
        setTimeout(doExpand, expandDelay);
      }, collapseDuration);
    } else {
      // No previous different active card, just expand immediately
      doExpand();
    }
  };

  const activateByIndex = (idx) => {
    const wrap = (n) =>
      ((n % projectOptions.length) + projectOptions.length) %
      projectOptions.length;
    const i = wrap(idx);
    activateCard(projectOptions[i]);
  };

  // Autoplay controls
  const startAutoplay = () => {
    if (autoplayTimer) return;
    autoplayTimer = setInterval(() => {
      activateByIndex(currentIndex + 1);
    }, autoplayInterval);
  };

  const stopAutoplay = () => {
    if (!autoplayTimer) return;
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  // Pause on pointer hover / touch / focus
  if (container) {
    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);
    container.addEventListener(
      "touchstart",
      () => {
        stopAutoplay();
      },
      { passive: true }
    );
    container.addEventListener(
      "touchend",
      () => {
        // resume after short delay so user can interact
        setTimeout(startAutoplay, 1200);
      },
      { passive: true }
    );
  }

  // Reset autoplay timer when user interacts
  const resetAutoplay = () => {
    stopAutoplay();
    setTimeout(startAutoplay, 2500);
  };

  projectOptions.forEach((option, index) => {
    // Click handler
    option.addEventListener("click", function (e) {
      // Don't toggle if clicking on a link
      if (e.target.closest("a")) return;
      activateCard(this, true);
      resetAutoplay();
    });

    // Keyboard support
    option.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateCard(this, true);
        resetAutoplay();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (index + 1) % projectOptions.length;
        projectOptions[nextIndex].focus();
        activateCard(projectOptions[nextIndex], true);
        resetAutoplay();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          (index - 1 + projectOptions.length) % projectOptions.length;
        projectOptions[prevIndex].focus();
        activateCard(projectOptions[prevIndex], true);
        resetAutoplay();
      }
    });

    // Touch support: detect simple taps
    let touchStartX = 0;
    let touchStartY = 0;

    option.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    option.addEventListener(
      "touchend",
      function (e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = Math.abs(touchEndX - touchStartX);
        const diffY = Math.abs(touchEndY - touchStartY);

        // If it's a tap (not a swipe), activate the card
        if (diffX < 12 && diffY < 12) {
          activateCard(this, true);
          resetAutoplay();
        }
      },
      { passive: true }
    );

    // Set initial aria attributes
    if (option.classList.contains("active")) {
      option.setAttribute("aria-expanded", "true");
    } else {
      option.setAttribute("aria-expanded", "false");
    }
  });

  // Prepare project options for reveal sequence (we'll trigger sequence on section intersection or nav click)
  projectOptions.forEach((option) => {
    // Ensure options have a smooth transition defined
    option.style.transition =
      option.style.transition ||
      "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  });

  // Reveal sequence: show active card first, then stagger others into place
  let isProjectRevealing = false;
  const revealProjectsSequence = () => {
    if (isProjectRevealing) return;
    isProjectRevealing = true;
    // pause autoplay while animating
    stopAutoplay();

    // set initial hidden state
    projectOptions.forEach((opt) => {
      opt.style.opacity = "0";
      opt.style.transform = "translateY(20px) scale(0.98)";
      opt.style.pointerEvents = "none";
    });

    const activeOption = projectOptions[currentIndex];
    const baseDelay = 120;

    // reveal active first
    if (activeOption) {
      setTimeout(() => {
        activeOption.style.removeProperty("transform");
        activeOption.style.removeProperty("opacity");
        activeOption.style.removeProperty("pointer-events");
      }, baseDelay);
    }

    // reveal others with stagger
    const othersStart = baseDelay + 160;
    let k = 0;
    projectOptions.forEach((opt, i) => {
      if (i === currentIndex) return;
      const delay = othersStart + k * 110;
      setTimeout(() => {
        opt.style.removeProperty("transform");
        opt.style.removeProperty("opacity");
        opt.style.removeProperty("pointer-events");
      }, delay);
      k++;
    });

    const totalDuration =
      othersStart + Math.max(0, projectOptions.length - 1) * 110 + 350;
    setTimeout(() => {
      // cleanup
      projectOptions.forEach((opt) => opt.style.removeProperty("transition"));
      isProjectRevealing = false;
      startAutoplay();
    }, totalDuration);
  };

  // Start autoplay when the section is visible
  const projectsSection = safeQuerySelector("#projects");
  if (projectsSection && "IntersectionObserver" in window) {
    const vis = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // reveal sequence each time section becomes visible
            revealProjectsSequence();
          } else {
            stopAutoplay();
          }
        });
      },
      { threshold: 0.35 }
    );

    // Trigger reveal when clicking nav links to #projects
    const projectLinks = safeQuerySelectorAll('a[href="#projects"]');
    if (projectLinks && projectLinks.length) {
      projectLinks.forEach((lnk) => {
        lnk.addEventListener("click", () => {
          // allow scroll to start then reveal
          setTimeout(() => revealProjectsSequence(), 60);
        });
      });
    }

    vis.observe(projectsSection);
  } else {
    // Fallback: start immediately
    startAutoplay();
  }
})();

// ===== Error Handling =====
// Global error handler
window.addEventListener(
  "error",
  (event) => {
    console.error("Global error caught:", event.error);
    // You can add error reporting service here
  },
  true
);

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // You can add error reporting service here
});

// ===== Performance Monitoring =====
// Register longtask observer only when the browser explicitly supports it.
// Some browsers will log warnings if you try to observe unsupported entryTypes
// (e.g. "Ignoring unsupported entryTypes: longtask"). To avoid that, check
// PerformanceObserver.supportedEntryTypes before calling observe.
if ("performance" in window && "PerformanceObserver" in window) {
  try {
    // Monitor long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn("Long task detected:", entry);
        }
      }
    });

    // feature-detect supported entry types to avoid console warnings/errors
    const supported = Array.isArray(PerformanceObserver.supportedEntryTypes)
      ? PerformanceObserver.supportedEntryTypes
      : [];

    if (supported.includes("longtask")) {
      observer.observe({ entryTypes: ["longtask"] });
    } else {
      // longtask not supported by this browser — skip registration silently
      // Optionally you could observe other types here if desired.
    }
  } catch (e) {
    // PerformanceObserver.observe may throw on certain platforms/configs
    // when attempting to register unsupported types — nothing to do here.
  }
}

// ===== Page Visibility API =====
// Pause animations when page is not visible
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, pause expensive operations
    console.log("Page hidden - pausing animations");
  } else {
    // Page is visible again
    console.log("Page visible - resuming animations");
  }
});

// ===== Console Messages =====
try {
  console.log(
    "%c Welcome to my portfolio! ",
    "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 20px; padding: 10px;"
  );
  console.log("%c Made with ❤️ by Dior E", "color: #6366f1; font-size: 14px;");
} catch (error) {
  // Silently fail if console methods are not available
}

// ===== Resource Hints and Preloading =====
// Preload critical resources
const preloadResource = (href, as, type = null) => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Preconnect to external domains
const preconnectDomains = [
  "https://cdnjs.cloudflare.com",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://unpkg.com",
];

preconnectDomains.forEach((domain) => {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = domain;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
});

// ===== Service Worker Registration =====
if ("serviceWorker" in navigator) {
  // Allow service worker on localhost for development
  const isLocalhost = Boolean(
    window.location.hostname === "localhost" ||
      window.location.hostname === "[::1]" ||
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
  );

  if (window.location.protocol === "https:" || isLocalhost) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) =>
          console.warn("Service Worker registration failed:", err)
        );
    });
  }
}

// ===== PWA Install Prompt =====
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // You can show an install button here if desired
  console.log("PWA install prompt available");
});

// ===== Loading Screen =====
window.addEventListener("load", () => {
  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 500);
  }
});

// ===== Theme Toggle =====
const themeToggle = document.getElementById("themeToggle");
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

// Get saved theme or use system preference
const currentTheme =
  localStorage.getItem("theme") ||
  (prefersDarkScheme.matches ? "dark" : "light");

// Apply theme on load
document.documentElement.setAttribute("data-theme", currentTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", async (event) => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    // Get button position for ripple effect
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate position as percentage of viewport
    const rippleX = (x / window.innerWidth) * 100;
    const rippleY = (y / window.innerHeight) * 100;

    // Set CSS variables for ripple position
    document.documentElement.style.setProperty("--ripple-x", `${rippleX}%`);
    document.documentElement.style.setProperty("--ripple-y", `${rippleY}%`);

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      // Add class for ripple effect
      document.documentElement.classList.add("theme-ripple");

      const transition = document.startViewTransition(() => {
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
      });

      // Remove ripple class after transition
      try {
        await transition.finished;
      } finally {
        document.documentElement.classList.remove("theme-ripple");
      }
    } else {
      // Fallback for browsers without View Transitions API
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    }

    // toast removed: theme change notification disabled
  });
}

// Listen for system theme changes
prefersDarkScheme.addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    const newTheme = e.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
  }
});

// ===== Custom Circular Cursor =====
(function () {
  // Do not enable on touch / coarse pointers or when user prefers reduced motion
  const isCoarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isCoarse || reduceMotion) return;

  // Use existing cursor element if present in markup, otherwise create one
  let cursor = document.querySelector(".custom-cursor");
  if (!cursor) {
    cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    // create inner dot/outline so styles apply
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const outline = document.createElement("div");
    outline.className = "cursor-outline";
    cursor.appendChild(dot);
    cursor.appendChild(outline);
    document.body.appendChild(cursor);
  } else {
    // Ensure necessary children exist (in case markup was trimmed)
    if (!cursor.querySelector(".cursor-dot")) {
      const dot = document.createElement("div");
      dot.className = "cursor-dot";
      cursor.appendChild(dot);
    }
    if (!cursor.querySelector(".cursor-outline")) {
      const outline = document.createElement("div");
      outline.className = "cursor-outline";
      cursor.appendChild(outline);
    }
  }

  // Track positions
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  const speed = 0.16; // easing speed

  // Pointer move updates target coords
  const onPointerMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.opacity = "1";
  };

  document.addEventListener("pointermove", onPointerMove);

  // Animation loop
  const loop = () => {
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Press/click feedback
  // use `active` class for pressed state so it matches CSS
  document.addEventListener("pointerdown", () =>
    cursor.classList.add("active")
  );
  document.addEventListener("pointerup", () =>
    cursor.classList.remove("active")
  );

  // Hover states for interactive elements
  const interactiveSelector =
    "a, button, input, textarea, select, label, [role=button], .btn, .nav-links li";
  // use `hover` class (matches .custom-cursor.hover in CSS)
  const setHover = () => cursor.classList.add("hover");
  const removeHover = () => cursor.classList.remove("hover");

  const setInteractiveListeners = () => {
    document.querySelectorAll(interactiveSelector).forEach((el) => {
      el.addEventListener("pointerenter", setHover);
      el.addEventListener("pointerleave", removeHover);
    });
  };

  // Initial attach and observe for dynamic content
  setInteractiveListeners();
  const mo = new MutationObserver(() => setInteractiveListeners());
  mo.observe(document.body, { childList: true, subtree: true });

  // Hide cursor when leaving window
  document.addEventListener("pointerleave", () => (cursor.style.opacity = "0"));
  document.addEventListener("pointerenter", () => (cursor.style.opacity = "1"));
})();

// Toast notification system removed (toasts fully disabled)

// ===== Contact Form Validation and Submission =====
const contactForm = safeQuerySelector("#contactForm");

if (contactForm) {
  const nameInput = contactForm.querySelector("#name");
  const emailInput = contactForm.querySelector("#email");
  const messageInput = contactForm.querySelector("#message");

  // Real-time validation
  const validateField = (input, validator, errorMessage) => {
    const formGroup = input.closest(".form-group");
    const errorElement = formGroup.querySelector(".error-message");

    if (!validator(input.value.trim())) {
      formGroup.classList.add("error");
      errorElement.textContent = errorMessage;
      errorElement.classList.add("visible");
      return false;
    } else {
      formGroup.classList.remove("error");
      errorElement.classList.remove("visible");
      return true;
    }
  };

  const validators = {
    name: (value) => value.length >= 2,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: (value) => value.length >= 10,
  };

  const errorMessages = {
    name: "Name must be at least 2 characters",
    email: "Please enter a valid email address",
    message: "Message must be at least 10 characters",
  };

  // Add blur validation
  nameInput?.addEventListener("blur", () => {
    validateField(nameInput, validators.name, errorMessages.name);
  });

  emailInput?.addEventListener("blur", () => {
    validateField(emailInput, validators.email, errorMessages.email);
  });

  messageInput?.addEventListener("blur", () => {
    validateField(messageInput, validators.message, errorMessages.message);
  });

  // Form submission
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateField(
      nameInput,
      validators.name,
      errorMessages.name
    );
    const isEmailValid = validateField(
      emailInput,
      validators.email,
      errorMessages.email
    );
    const isMessageValid = validateField(
      messageInput,
      validators.message,
      errorMessages.message
    );

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      // toast removed: validation feedback
      console.warn("Validation Error: Please fix the errors in the form");
      return;
    }

    // Get form data
    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      subject:
        contactForm.querySelector("#subject")?.value.trim() || "No subject",
      message: messageInput.value.trim(),
    };

    // Show loading state
    const submitBtn = contactForm.querySelector(".btn-submit");
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    // Simulate form submission (replace with actual API call)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Success (toast removed)
      console.info(
        "Message Sent: Thank you for your message. I'll get back to you soon!"
      );
      contactForm.reset();

      // Remove all error states
      contactForm.querySelectorAll(".form-group").forEach((group) => {
        group.classList.remove("error");
        group.querySelector(".error-message")?.classList.remove("visible");
      });

      // Log form data (in production, send to your backend)
      console.log("Form submitted:", formData);
    } catch (error) {
      // Submission failure (toast removed)
      console.error(
        "Submission Failed: Something went wrong. Please try again later.",
        error
      );
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });
}

// ===== Typewriter Effect with Keyboard Sync =====
(() => {
  // Get all keyboard keys for animation
  const keys = safeQuerySelectorAll(".keyboard .key");

  // Typewriter function with keyboard sync
  function typewriterEffect(element, text, speed = 50, onComplete = null) {
    if (!element) return;

    const contentElement = element.querySelector(".typewriter-content");
    const cursorElement = element.querySelector(".typewriter-cursor");

    if (!contentElement) return;

    let charIndex = 0;
    let currentKeyIndex = 0;

    function type() {
      if (charIndex < text.length) {
        const char = text.charAt(charIndex);
        contentElement.textContent += char;
        charIndex++;

        // Animate random key press when typing
        if (keys.length > 0 && char.trim() !== "") {
          const randomKey = keys[Math.floor(Math.random() * keys.length)];
          randomKey.style.animation = "none";
          setTimeout(() => {
            randomKey.style.animation = "";
            randomKey.classList.add("key-press");
            setTimeout(() => {
              randomKey.classList.remove("key-press");
            }, 150);
          }, 10);
        }

        // Variable speed for more natural typing
        const variance = Math.random() * 50;
        setTimeout(type, speed + variance);
      } else {
        // Typing complete
        if (cursorElement) {
          element.classList.add("typing-complete");
        }
        if (onComplete) onComplete();
      }
    }

    // Start typing after small delay
    setTimeout(type, 500);
  }

  // Initialize typewriter for contact section
  const contactTypewriter = safeQuerySelector(".contact .typewriter-text");
  if (contactTypewriter) {
    const text = contactTypewriter.getAttribute("data-text") || "";
    const contentElement = contactTypewriter.querySelector(
      ".typewriter-content"
    );
    if (contentElement) {
      contentElement.textContent = "";
    }

    // Use Intersection Observer to start typing when element is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !contactTypewriter.classList.contains("typed")
          ) {
            contactTypewriter.classList.add("typed");
            typewriterEffect(contactTypewriter, text, 40);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(contactTypewriter);
  }
})();

// ===== Enhanced Keyboard Navigation =====
document.addEventListener("keydown", (e) => {
  // Escape key closes modals, menus, etc.
  if (e.key === "Escape") {
    // Already handled by mobile menu
  }

  // Ctrl/Cmd + K for quick search (if you add search later)
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    // showSearch(); // Implement if needed
  }
});

// ===== Lazy Loading Images =====
if ("IntersectionObserver" in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll("img[data-src]").forEach((img) => {
    imageObserver.observe(img);
  });
}

// ===== Copy to Clipboard Functionality =====
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.info("Copied: text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      console.info("Copied: text copied to clipboard");
    } catch (err) {
      console.error("Copy Failed: Could not copy to clipboard", err);
    }
    document.body.removeChild(textArea);
  }
}

// ===== Online/Offline Detection =====
window.addEventListener("online", () => {
  console.info("Back Online: connection restored");
});

// ===== Code-view: random loader (HTML/CSS/JS) and copy button =====
(() => {
  const codeElem = safeQuerySelector(".code-view code");
  const langLabel = safeQuerySelector(".code-toolbar .code-lang");
  const copyBtn = safeQuerySelector(".code-toolbar .code-copy");
  if (!codeElem) return;

  const candidates = [
    { lang: "html", label: "HTML", path: "index.html" },
    { lang: "css", label: "CSS", path: "assets/styles.css" },
    { lang: "js", label: "JS", path: "assets/script.js" },
  ];

  // choose random candidate on each load
  const choice = candidates[Math.floor(Math.random() * candidates.length)];

  const setLanguageClass = (lang) => {
    const pre = codeElem.closest("pre") || codeElem.parentElement;
    if (!pre) return;
    // Prism expects `markup` for HTML and `javascript` for JS
    const prismLang =
      lang === "html" ? "markup" : lang === "js" ? "javascript" : lang;
    pre.classList.remove(
      "language-markup",
      "language-css",
      "language-javascript"
    );
    pre.classList.add(`language-${prismLang}`);
    return prismLang;
  };

  const fetchAndRender = async () => {
    try {
      const res = await fetch(choice.path, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const text = await res.text();

      // update toolbar label
      if (langLabel) langLabel.textContent = choice.label.toUpperCase();

      // set language class on container
      setLanguageClass(choice.lang);

      const pre = codeElem.closest("pre") || codeElem.parentElement;

      // Typewriter effect for code (character-by-character) with Prism highlighting
      if (pre) {
        pre.classList.add("typing");
        codeElem.textContent = "";

        let charIndex = 0;
        const speed = 10; // base speed for code
        const visualKeys = safeQuerySelectorAll(".keyboard .key, .key");
        let visualKeyIndex = 0;

        // determine prism language to use for highlighting
        const prismLang = setLanguageClass(choice.lang) || choice.lang;

        function pressVisualKey(keyElem, hold = 110) {
          return new Promise((resolve) => {
            if (!keyElem) return resolve();
            const prevAnim = keyElem.style.animation || "";
            keyElem.style.animation = "none";
            keyElem.classList.remove("key-press");
            setTimeout(() => {
              keyElem.classList.add("key-press");
              setTimeout(() => {
                keyElem.classList.remove("key-press");
                keyElem.style.animation = prevAnim;
                resolve();
              }, hold);
            }, 10);
          });
        }

        async function typeCode() {
          if (charIndex < text.length) {
            const ch = text.charAt(charIndex);

            // visual key press
            const keyElem =
              visualKeys.length > 0
                ? visualKeys[visualKeyIndex % visualKeys.length]
                : null;
            visualKeyIndex++;
            await pressVisualKey(keyElem, ch.trim() === "" ? 60 : 110);

            charIndex++;

            // Use Prism to highlight the substring up to current char
            try {
              if (
                window.Prism &&
                Prism.languages &&
                Prism.languages[prismLang]
              ) {
                const highlighted = Prism.highlight(
                  text.slice(0, charIndex),
                  Prism.languages[prismLang],
                  prismLang
                );
                codeElem.innerHTML = highlighted;
              } else {
                // fallback to plain text
                codeElem.textContent = text.slice(0, charIndex);
              }
            } catch (e) {
              codeElem.textContent = text.slice(0, charIndex);
            }

            // Auto-scroll to bottom as code appears
            pre.scrollTop = pre.scrollHeight;

            const variance = Math.random() * 8;
            setTimeout(typeCode, speed + variance);
          } else {
            pre.classList.remove("typing");
            pre.classList.add("code-loaded");
            setTimeout(() => pre.classList.remove("code-loaded"), 1200);
            // Ensure final highlight is full
            try {
              if (
                window.Prism &&
                Prism.languages &&
                Prism.languages[prismLang]
              ) {
                codeElem.innerHTML = Prism.highlight(
                  text,
                  Prism.languages[prismLang],
                  prismLang
                );
              }
            } catch (e) {
              /* ignore */
            }
          }
        }

        setTimeout(typeCode, 300);
      } else {
        // Fallback without animation
        codeElem.textContent = text;
      }
    } catch (err) {
      codeElem.textContent = `/* Could not load ${choice.label} — ${err.message} */`;
      console.warn("code-view load failed:", err);
    }
  };

  fetchAndRender();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      copyToClipboard(codeElem.textContent || "");
    });
  }
})();

// ===== Initial Welcome Toast =====
// Show welcome message after page loads
setTimeout(() => {
  const hasVisited = sessionStorage.getItem("hasVisited");
  if (!hasVisited) {
    // welcome toast removed
    sessionStorage.setItem("hasVisited", "true");
  }
}, 1500);

// ===== Enhanced Hover Effects for Cards =====
// Add smooth hover blur effects for project cards and stat cards
(function () {
  // Enhanced hover for stat cards
  const statCards = safeQuerySelectorAll(".stat-card");
  const aboutStats = safeQuerySelector(".about-stats");

  if (statCards.length > 0 && aboutStats) {
    statCards.forEach((card) => {
      card.addEventListener("mouseenter", function () {
        // Add hover class to parent for better control
        aboutStats.classList.add("has-hover");
        this.classList.add("is-hovered");
      });

      card.addEventListener("mouseleave", function () {
        aboutStats.classList.remove("has-hover");
        this.classList.remove("is-hovered");
      });
    });
  }

  // Enhanced hover for project options
  const projectOptions = safeQuerySelectorAll(".project-option");
  const expandingCards = safeQuerySelector(".expanding-cards");

  if (projectOptions.length > 0 && expandingCards) {
    projectOptions.forEach((option) => {
      option.addEventListener("mouseenter", function () {
        // Only apply blur effect if card is not active
        if (!this.classList.contains("active")) {
          expandingCards.classList.add("has-hover");
          this.classList.add("is-hovered");
        }
      });

      option.addEventListener("mouseleave", function () {
        expandingCards.classList.remove("has-hover");
        this.classList.remove("is-hovered");
      });
    });
  }

  // Add smooth performance optimization
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Disable hover effects for users who prefer reduced motion
    document.body.classList.add("reduce-motion");
  }
})();
