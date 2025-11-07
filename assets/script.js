// ===== Mobile Navigation =====
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");
const navLinks = document.querySelectorAll(".nav-links li");

if (burger && nav) {
  burger.addEventListener("click", () => {
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
  });

  // Close mobile menu when clicking on a link
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      burger.classList.remove("toggle");
      burger.setAttribute("aria-expanded", "false");
    });
  });
}

// ===== Scroll to Top Button =====
const scrollToTopBtn = document.getElementById("scrollToTop");

if (scrollToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===== Smooth Scrolling for Navigation Links =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const offsetTop = target.offsetTop - 70;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  });
});

// ===== Navbar Background on Scroll =====
const navbar = document.querySelector(".navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.style.background = "rgba(15, 23, 42, 0.95)";
      navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.3)";
    } else {
      navbar.style.background = "rgba(15, 23, 42, 0.8)";
      navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.1)";
    }
  });
}

// ===== Intersection Observer for Animations =====
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -100px 0px" };

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe elements
const elementsToObserve = document.querySelectorAll(
  ".project-card, .skill-category, .stat-card"
);
elementsToObserve.forEach((el, index) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = `all 0.6s ease ${index * 0.1}s`;
  observer.observe(el);
});

// ===== Number Counter Animation =====
const animateNumbers = (element, target) => {
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
const statNumbers = document.querySelectorAll(".stat-number");
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
          }
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((stat) => {
    statsObserver.observe(stat);
  });
}

// ===== Typing Effect =====
const subtitle = document.querySelector(".hero-subtitle");
if (subtitle) {
  const originalText = subtitle.textContent;
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

  typeWriter();
}

// ===== Console Messages =====
try {
  console.log(
    "%c Welcome to my portfolio! ",
    "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 20px; padding: 10px;"
  );
  console.log("%c Made with ❤️ by Diorhc", "color: #6366f1; font-size: 14px;");
} catch (error) {
  // Silently fail if console methods are not available
}
