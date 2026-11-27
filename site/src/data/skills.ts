export type SkillCategory = "frontend" | "backend" | "tooling";

export interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
  icon: "js" | "ts" | "python" | "rust" | "react" | "htmlcss" | "git" | "api";
  level: "expert" | "advanced" | "intermediate";
  tags: string[];
  desc: {
    ru: string;
    en: string;
  };
}

export const SKILLS: SkillItem[] = [
  {
    id: "javascript",
    name: "JavaScript",
    category: "frontend",
    icon: "js",
    level: "advanced",
    tags: ["ES6+", "DOM API", "UserScripts"],
    desc: {
      ru: "Глубокое знание ES6+, DOM и Browser API, асинхронности (Promise, async/await), создания user-скриптов и быстрых интерактивных интерфейсов.",
      en: "Deep experience with modern ES6+, DOM and Browser APIs, async workflows, user scripts, and fast interactive UI.",
    },
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "frontend",
    icon: "ts",
    level: "advanced",
    tags: ["Strict Types", "React", "Workers"],
    desc: {
      ru: "Строгая типизация для масштабируемых фронтенд- и Node/Worker-проектов, предсказуемые контракты и безопасный рефакторинг.",
      en: "Strongly typed JavaScript for scalable frontend and Worker codebases with predictable contracts and safer refactoring.",
    },
  },
  {
    id: "react",
    name: "React & Astro",
    category: "frontend",
    icon: "react",
    level: "advanced",
    tags: ["Islands", "Tailwind v4", "Motion"],
    desc: {
      ru: "Островная архитектура Astro + React 19, компонентная композиция, Tailwind CSS v4, shadcn/ui и плавные анимации на Motion.",
      en: "Astro + React 19 islands architecture, component composition, Tailwind CSS v4, shadcn/ui, and Motion animations.",
    },
  },
  {
    id: "htmlcss",
    name: "HTML & CSS",
    category: "frontend",
    icon: "htmlcss",
    level: "expert",
    tags: ["Grid", "View Transitions", "A11y"],
    desc: {
      ru: "Семантическая вёрстка, Grid/Flexbox, дизайн-системы, View Transitions API и доступные анимации с поддержкой reduced-motion.",
      en: "Semantic markup, Grid/Flexbox, design systems, View Transitions API, and reduced-motion accessible animations.",
    },
  },
  {
    id: "python",
    name: "Python",
    category: "backend",
    icon: "python",
    level: "advanced",
    tags: ["asyncio", "Telegram Bots", "Automation"],
    desc: {
      ru: "Асинхронные Telegram-боты на asyncio, серверная автоматизация, обработка данных и интеграция API.",
      en: "Asynchronous Telegram bots with asyncio, backend automation, data processing, and API integrations.",
    },
  },
  {
    id: "rust",
    name: "Rust",
    category: "backend",
    icon: "rust",
    level: "intermediate",
    tags: ["CLI", "YTDL", "Performance"],
    desc: {
      ru: "Разработка быстрых CLI-утилит и инструментов обработки медиа (YTDL) с акцентом на надёжность и производительность.",
      en: "Building fast CLI utilities and media tooling (YTDL) focused on memory safety and native performance.",
    },
  },
  {
    id: "api",
    name: "APIs & Edge",
    category: "backend",
    icon: "api",
    level: "advanced",
    tags: ["REST", "Cloudflare KV", "Bot API"],
    desc: {
      ru: "Проектирование REST API, Cloudflare Workers + KV, Telegram Bot API и безопасная интеграция внешних сервисов.",
      en: "Designing REST APIs, Cloudflare Workers + KV, Telegram Bot API, and resilient third-party integrations.",
    },
  },
  {
    id: "git",
    name: "Git & CI/CD",
    category: "tooling",
    icon: "git",
    level: "advanced",
    tags: ["GitHub Actions", "Wrangler", "Vite"],
    desc: {
      ru: "Ветвление, code review, автоматизация релизов, GitHub Actions и деплой статических приложений и Workers.",
      en: "Version control, code reviews, release automation, GitHub Actions pipelines, and static/edge deployments.",
    },
  },
];
