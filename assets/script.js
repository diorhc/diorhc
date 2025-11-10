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
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  }, 100);

  window.addEventListener("scroll", handleScroll, { passive: true });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  });
});

// ===== Navbar Background on Scroll =====
const navbar = safeQuerySelector(".navbar");

if (navbar) {
  const handleNavbarScroll = throttle(() => {
    if (window.scrollY > 50) {
      navbar.style.background = "rgba(15, 23, 42, 0.95)";
      navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.3)";
    } else {
      navbar.style.background = "rgba(15, 23, 42, 0.8)";
      navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.1)";
    }
  }, 100);

  window.addEventListener("scroll", handleNavbarScroll, { passive: true });
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
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateX(0)";
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

// For stat-cards we want last -> first sequencing: set translateX and reverse the delay order
if (statCards.length > 0) {
  const arr = Array.from(statCards);
  arr.forEach((el, i) => {
    // compute reverse index so the last card gets the smallest delay (appears first)
    const rev = arr.length - 1 - i;
    el.style.opacity = "0";
    el.style.transform = "translateX(28px)"; // start slightly to the right
    // slightly tighter stagger for stat cards
    el.style.transition = `all 0.56s cubic-bezier(0.2,0.9,0.2,1) ${
      rev * 0.09
    }s`;
    animationObserver.observe(el);
  });
}

// ===== Stat-card animation trigger (nav click + section activation) =====
let isAnimatingStats = false;

const animateStatCardsSequence = (opts = {}) => {
  if (!statCards || statCards.length === 0) return;
  if (isAnimatingStats) return;
  isAnimatingStats = true;

  const arr = Array.from(statCards);
  // prepare: set start state and compute per-card delay so last card animates first
  arr.forEach((el, idx) => {
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = "translateX(40px) scale(0.9)";
  });

  // force a reflow so the browser acknowledges the initial state
  // eslint-disable-next-line no-unused-expressions
  arr[0] && arr[0].offsetHeight;

  const baseDelay = 120; // ms per step - increased for smoother stagger
  const duration = 800; // ms transition duration - increased for elegance

  arr.forEach((el, i) => {
    const revIndex = arr.length - 1 - i;
    const delayMs = revIndex * baseDelay;
    el.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`;
    // start the animation frame after a small tick so transition applies
    setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(0) scale(1)";
    }, 10);
  });

  // mark finished after the last transition ends
  const totalMs = (arr.length - 1) * baseDelay + duration + 100;
  setTimeout(() => {
    isAnimatingStats = false;
  }, totalMs);
};

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
const animateHeroImageSequence = (opts = {}) => {
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
};

// Hero content (text/buttons) animation: triggered by nav click and section visibility
let isAnimatingHeroContent = false;
const animateHeroContentSequence = (opts = {}) => {
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
};

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
        }
      });
    },
    { threshold: 0.36 }
  );
  homeObserver.observe(homeSection);
}

// ===== Contact animations: title (top), board (right), form (left), info (bottom) =====
let isAnimatingContact = false;
const animateContactSequence = (opts = {}) => {
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
};

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
  const aboutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStatCardsSequence();
        }
      });
    },
    { threshold: 0.36 }
  );
  aboutObserver.observe(aboutSection);
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
      // set transition delay for staggered appearance (unless reduced motion)
      try {
        if (!prefersReduced) child.style.transitionDelay = `${idx * 65}ms`;
        else child.style.transitionDelay = "0ms";
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
        } else {
          // Only mark out-of-view if it was previously in-view to avoid initial flicker
          if (sec.classList.contains("in-view")) {
            sec.classList.remove("in-view");
            sec.classList.add("out-of-view");
          }
        }
      });
    },
    { threshold: 0.48 }
  );

  secNodes.forEach((s) => sectionViewObserver.observe(s));
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
  const scrollY = window.scrollY + headerOffset;

  // map section tops once per call
  const tops = [...sections].map((s) => s.offsetTop);

  navConnectors.forEach((connector, i) => {
    const start = tops[i] ?? 0;
    const end = tops[i + 1] ?? document.body.scrollHeight;
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
      window.scrollTo({ top: offset, behavior: "smooth" });

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
  window.addEventListener("scroll", updateConnectorFill, { passive: true });
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

// ===== Typing Effect =====
const subtitle = safeQuerySelector(".hero-subtitle");
if (subtitle) {
  const originalText = subtitle.textContent || "";

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion && originalText) {
    subtitle.textContent = "";
    let charIndex = 0;
    const typingSpeed = 50;

    const typeWriter = () => {
      if (charIndex < originalText.length) {
        subtitle.textContent += originalText.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, typingSpeed);
      }
    };

    // Start typing after a small delay
    setTimeout(typeWriter, 500);
  }
}

// ===== 3D Skills Carousel =====
(() => {
  const track = safeQuerySelector(".carousel-track");
  if (!track) return;

  const cards = Array.from(track.querySelectorAll(".card") || []);
  if (cards.length === 0) return;

  const prevBtn = safeQuerySelector(".carousel-nav.prev");
  const nextBtn = safeQuerySelector(".carousel-nav.next");
  const indicatorsContainer = safeQuerySelector(".carousel-indicators");
  let active = 0;
  let isAnimating = false;
  let autoplayInterval = null;

  // Create indicators
  if (indicatorsContainer) {
    cards.forEach((_, i) => {
      const indicator = document.createElement("button");
      indicator.className = "carousel-indicator";
      indicator.setAttribute("aria-label", `Go to skill ${i + 1}`);
      indicator.addEventListener("click", () => {
        stopAutoplay();
        update(i);
        setTimeout(startAutoplay, 5000);
      });
      indicatorsContainer.appendChild(indicator);
    });
  }

  const indicators = Array.from(
    indicatorsContainer?.querySelectorAll(".carousel-indicator") || []
  );

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

    // Update indicators
    indicators.forEach((ind, i) => {
      ind.classList.toggle("active", i === active);
    });

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

  // Navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      stopAutoplay();
      update(active - 1);
      setTimeout(startAutoplay, 5000); // Resume after 5 seconds
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      stopAutoplay();
      update(active + 1);
      setTimeout(startAutoplay, 5000); // Resume after 5 seconds
    });
  }

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

// ===== Service Worker Registration =====
if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => console.log("Service Worker registered:", reg.scope))
      .catch((err) => console.warn("Service Worker registration failed:", err));
  });
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
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    // Show toast notification
    showToast("success", "Theme Changed", `Switched to ${newTheme} mode`);
  });
}

// Listen for system theme changes
prefersDarkScheme.addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    const newTheme = e.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
  }
});

// ===== Toast Notification System =====
const toastContainer = document.getElementById("toastContainer");
let toastId = 0;

/**
 * Show a toast notification
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in milliseconds (0 = permanent)
 */
function showToast(type = "info", title = "", message = "", duration = 4000) {
  if (!toastContainer) return;

  const id = ++toastId;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("data-toast-id", id);

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };

  toast.innerHTML = `
    <i class="${icons[type]} toast-icon" aria-hidden="true"></i>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ""}
      ${message ? `<div class="toast-message">${message}</div>` : ""}
    </div>
    <button class="toast-close" aria-label="Close notification">
      <i class="fas fa-times" aria-hidden="true"></i>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Close button
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => removeToast(toast));

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return id;
}

function removeToast(toast) {
  if (!toast) return;

  toast.classList.add("removing");
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// ===== Contact Form Validation and Submission =====
const contactForm = document.getElementById("contactForm");

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
      showToast(
        "error",
        "Validation Error",
        "Please fix the errors in the form"
      );
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

      // Success
      showToast(
        "success",
        "Message Sent!",
        "Thank you for your message. I'll get back to you soon!"
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
      showToast(
        "error",
        "Submission Failed",
        "Something went wrong. Please try again later."
      );
      console.error("Form submission error:", error);
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
        showToast("success", "Copied!", "Text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showToast("error", "Copy Failed", "Could not copy to clipboard");
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
      showToast("success", "Copied!", "Text copied to clipboard");
    } catch (err) {
      showToast("error", "Copy Failed", "Could not copy to clipboard");
    }
    document.body.removeChild(textArea);
  }
}

// ===== Online/Offline Detection =====
window.addEventListener("online", () => {
  showToast("success", "Back Online", "Your connection has been restored");
});

// ===== Footer reveal on scroll + auto-hide =====
(() => {
  const footerEl = safeQuerySelector("footer.footer");
  if (!footerEl) return;

  const isAtBottom = (tolerance = 1) => {
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;
    const viewport =
      window.innerHeight || document.documentElement.clientHeight;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    return scrollY + viewport >= docHeight - tolerance;
  };

  let hideTimeout = null;
  const clearHide = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  };

  const hideFooter = (immediate = false) => {
    clearHide();
    if (immediate) {
      footerEl.classList.remove("visible");
      return;
    }
    footerEl.classList.remove("visible");
  };

  const scheduleHide = (delay = 5000) => {
    clearHide();
    hideTimeout = setTimeout(() => {
      // only hide if user is not interacting
      footerEl.classList.remove("visible");
      hideTimeout = null;
    }, delay);
  };

  const showFooter = () => {
    if (!footerEl.classList.contains("visible")) {
      footerEl.classList.add("visible");
    }
    // schedule auto-hide after 5s
    scheduleHide(5000);
  };

  // Pause hide timer while user interacts
  footerEl.addEventListener("mouseenter", clearHide, { passive: true });
  footerEl.addEventListener("focusin", clearHide);
  footerEl.addEventListener("mouseleave", () => scheduleHide(3000), {
    passive: true,
  });
  footerEl.addEventListener("focusout", () => scheduleHide(3000));

  if ("IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isAtBottom(1)) {
            showFooter();
          }
        });
      },
      { threshold: 0.08 }
    );
    footerObserver.observe(footerEl);
  }

  const checkFooterByScroll = throttle(() => {
    try {
      if (isAtBottom(1)) showFooter();
    } catch (e) {
      /* ignore */
    }
  }, 120);

  window.addEventListener("scroll", checkFooterByScroll, { passive: true });
  window.addEventListener(
    "resize",
    debounce(() => {
      if (isAtBottom(1)) showFooter();
    }, 150)
  );
  window.addEventListener("load", () => {
    if (isAtBottom(1)) showFooter();
  });
})();

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
    showToast("info", "Welcome! 👋", "Thanks for visiting my portfolio");
    sessionStorage.setItem("hasVisited", "true");
  }
}, 1500);

// ===== Contact form handler (persist to localStorage + render board; draft shown inside board) =====
(function () {
  const form = safeQuerySelector("#contact-form");
  const emailInput = safeQuerySelector("#contact-input");
  const messageInput = safeQuerySelector("#contact-message");
  const submitBtn = safeQuerySelector("#contact-submit");
  const board = safeQuerySelector("#contact-board .board-list");
  if (!form || !messageInput || !board) return;

  const STORAGE_KEY = "contactMessages";
  const DRAFT_KEY = "contactDraft";

  const loadMessages = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Failed to load messages:", err);
      return [];
    }
  };

  const saveMessages = (arr) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (err) {
      console.warn("Failed to save messages:", err);
    }
  };

  const loadDraft = () => {
    try {
      return localStorage.getItem(DRAFT_KEY) || "";
    } catch (err) {
      return "";
    }
  };

  const saveDraft = (text) => {
    try {
      if (!text) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, text);
    } catch (err) {
      console.warn("Failed to save draft:", err);
    }
  };
  // Update or create the draft element as the first child in the board
  // Draft will be a simple text block without meta/timestamp
  const updateDraftInDOM = (text) => {
    const existing = board.querySelector("#contact-draft-item");
    const t = text || "";
    if (!t) {
      if (existing) existing.remove();
      return;
    }

    if (existing) {
      const textNode = existing.querySelector(".board-text");
      if (textNode) textNode.textContent = t;
      existing.classList.remove("empty");
      return;
    }

    const item = document.createElement("div");
    item.id = "contact-draft-item";
    item.className = "board-item draft";

    const textEl = document.createElement("div");
    textEl.className = "board-text";
    textEl.textContent = t;

    item.appendChild(textEl);

    // insert as first child
    if (board.firstChild) board.insertBefore(item, board.firstChild);
    else board.appendChild(item);
  };

  const renderBoard = () => {
    const messages = loadMessages();
    // clear all existing nodes; we'll re-create draft + combined messages
    board.innerHTML = "";

    // render draft first if present
    const draft = loadDraft();
    if (draft) updateDraftInDOM(draft);

    if (messages.length === 0) {
      if (!draft) {
        board.innerHTML = `<p class="board-empty">Пока нет сообщений. Будьте первым!</p>`;
      }
      return;
    }

    // Combine all submitted messages into a single block (no timestamps)
    const combined = messages
      .map((m) => (m.message || "").trim())
      .filter(Boolean)
      .reverse() // show oldest first inside the combined block
      .join("\n\n");

    const item = document.createElement("div");
    item.className = "board-item";

    const text = document.createElement("div");
    text.className = "board-text";
    text.textContent = combined;

    item.appendChild(text);
    board.appendChild(item);
  };

  // Initialize board + draft (restore draft into textarea)
  renderBoard();
  const initialDraft = loadDraft();
  if (initialDraft) messageInput.value = initialDraft;

  // Save draft as user types (debounced)
  const debouncedSaveDraft = debounce((text) => saveDraft(text), 250);

  messageInput.addEventListener("input", (e) => {
    const txt = e.target.value || "";
    updateDraftInDOM(txt);
    debouncedSaveDraft(txt);
  });

  // Listen for storage changes to sync across tabs/windows
  window.addEventListener("storage", (ev) => {
    if (!ev.key) return;
    if (ev.key === STORAGE_KEY) {
      // messages updated in another tab
      renderBoard();
    }
    if (ev.key === DRAFT_KEY) {
      // draft changed in other tab
      const newDraft = ev.newValue || "";
      // update textarea only if it differs to avoid disrupting typing
      if (messageInput.value !== newDraft) {
        messageInput.value = newDraft;
      }
      updateDraftInDOM(newDraft);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    const email =
      (emailInput && emailInput.value && emailInput.value.trim()) || "";
    if (!message) {
      messageInput.focus();
      return;
    }

    const messages = loadMessages();
    const entry = {
      id: Date.now(),
      message,
      email,
      ts: new Date().toISOString(),
    };
    // Add to front so newest appear first
    messages.unshift(entry);
    saveMessages(messages);
    renderBoard();

    // clear message, draft and give brief feedback on button
    messageInput.value = "";
    saveDraft("");
    updateDraftInDOM("");

    // show a tiny toast if available
    try {
      if (typeof showToast === "function") {
        showToast(
          "success",
          "Отправлено",
          "Спасибо! Ваше сообщение сохранено."
        );
      }
    } catch (err) {
      /* ignore */
    }

    if (submitBtn) {
      const oldHTML = submitBtn.innerHTML;
      // show temporary confirmation (check icon)
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      submitBtn.disabled = true;
      setTimeout(() => {
        submitBtn.innerHTML = oldHTML;
        submitBtn.disabled = false;
      }, 1500);
    }
  });
})();
