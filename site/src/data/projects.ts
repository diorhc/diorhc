export interface ProjectLink {
  label: { ru: string; en: string };
  href: string;
  variant?: "primary" | "secondary";
}

/**
 * What the card shows above its text: a still of the project (one file per
 * theme in public/projects/), or a small live HTML mock of its interface.
 */
export type ProjectMedia =
  | { kind: "image"; dark: string; light: string }
  | { kind: "ytdl-ui" }
  | { kind: "bot-chat" };

export interface ProjectItem {
  id: "youtube-plus" | "telegram-plus" | "ytdl" | "myport-bot";
  title: string;
  media: ProjectMedia;
  repoName?: string;
  bentoClass: string;
  badge: { ru: string; en: string };
  summary: { ru: string; en: string };
  features: { ru: string[]; en: string[] };
  tech: string[];
  links: ProjectLink[];
}

export const PROJECTS: ProjectItem[] = [
  {
    id: "youtube-plus",
    title: "YouTube +",
    media: { kind: "image", dark: "projects/youtube-dark.webp", light: "projects/youtube-light.webp" },
    repoName: "YTP",
    bentoClass: "md:col-span-7",
    badge: { ru: "UserScript", en: "UserScript" },
    summary: {
      ru: "Продвинутый пользовательский скрипт для YouTube и YouTube Music: кастомные горячие клавиши, инструменты плеера и чистый интерфейс.",
      en: "Feature-rich user script for YouTube and YouTube Music: custom hotkeys, player enhancements, and cleaner UI controls.",
    },
    features: {
      ru: [
        "Быстрые горячие клавиши для скорости, громкости и навигации",
        "Гибкие настройки плеера для YouTube и YouTube Music",
        "Лёгкий чистый JavaScript без тяжёлых зависимостей",
      ],
      en: [
        "Fast keyboard shortcuts for speed, volume, and navigation",
        "Flexible player controls for both YouTube and YouTube Music",
        "Lightweight vanilla JavaScript with zero heavy runtime overhead",
      ],
    },
    tech: ["JavaScript", "UserScript", "DOM API"],
    links: [
      {
        label: { ru: "Greasy Fork", en: "Greasy Fork" },
        href: "https://greasyfork.org/ru/scripts/537017-youtube",
        variant: "primary",
      },
      {
        label: { ru: "GitHub (YTP)", en: "GitHub (YTP)" },
        href: "https://github.com/diorhc/YTP",
        variant: "secondary",
      },
    ],
  },
  {
    id: "telegram-plus",
    title: "Telegram +",
    media: { kind: "image", dark: "projects/telegram-dark.webp", light: "projects/telegram-light.webp" },
    repoName: "TGP",
    bentoClass: "md:col-span-5",
    badge: { ru: "Web Script", en: "Web Script" },
    summary: {
      ru: "Скрипт для Telegram Web: дополнительные утилиты, улучшенная приватность и кастомизация рабочего пространства.",
      en: "User script extending Telegram Web with extra utilities, privacy refinements, and workspace customization.",
    },
    features: {
      ru: [
        "Расширенные опции приватности в веб-клиенте",
        "Удобная кастомизация панелей и интерфейса",
        "Регулярные обновления под свежий Telegram Web",
      ],
      en: [
        "Enhanced privacy toggles inside Telegram Web",
        "Clean layout and UI customization options",
        "Maintained compatibility with modern Telegram Web releases",
      ],
    },
    tech: ["JavaScript", "UserScript", "Telegram Web"],
    links: [
      {
        label: { ru: "Greasy Fork", en: "Greasy Fork" },
        href: "https://greasyfork.org/ru/scripts/537433-telegram",
        variant: "primary",
      },
      {
        label: { ru: "GitHub (TGP)", en: "GitHub (TGP)" },
        href: "https://github.com/diorhc/TGP",
        variant: "secondary",
      },
    ],
  },
  {
    id: "ytdl",
    title: "YTDL",
    media: { kind: "ytdl-ui" },
    repoName: "YTDL",
    bentoClass: "md:col-span-5",
    badge: { ru: "Rust Tooling", en: "Rust Tooling" },
    summary: {
      ru: "Быстрый инструмент для загрузки видео с YouTube с выбором качества, поддержкой плейлистов и обработкой форматов.",
      en: "Fast video downloading utility for YouTube built with Rust, featuring quality selection and playlist support.",
    },
    features: {
      ru: [
        "Высокая производительность и надёжность благодаря Rust",
        "Выбор потоков видео/аудио и работа с плейлистами",
        "Удобный сценарий для локальной автоматизации",
      ],
      en: [
        "Fast native execution powered by Rust",
        "Quality & stream selection with playlist handling",
        "Built for clean, repeatable local media workflows",
      ],
    },
    tech: ["Rust", "CLI", "Media Pipeline"],
    links: [
      {
        label: { ru: "GitHub", en: "GitHub" },
        href: "https://github.com/diorhc/YTDL",
        variant: "primary",
      },
    ],
  },
  {
    id: "myport-bot",
    title: "MyPort Bot",
    media: { kind: "bot-chat" },
    bentoClass: "md:col-span-7",
    badge: { ru: "Telegram Bot", en: "Telegram Bot" },
    summary: {
      ru: "Асинхронный Telegram-бот для автоматизации повседневных задач, обратной связи и интерактивного взаимодействия.",
      en: "Asynchronous Telegram bot engineered for task automation, direct feedback, and responsive user workflows.",
    },
    features: {
      ru: [
        "Асинхронная архитектура на Python + asyncio",
        "Мгновенный отклик на команды и inline-сценарии",
        "Прямой канал связи с автором в Telegram",
      ],
      en: [
        "Asynchronous architecture built with Python + asyncio",
        "Responsive command handling and interactive flows",
        "Direct feedback bridge via Telegram",
      ],
    },
    tech: ["Python", "asyncio", "Telegram Bot API"],
    links: [
      {
        label: { ru: "Открыть бота", en: "Try Bot" },
        href: "https://t.me/bydiore_bot",
        variant: "primary",
      },
    ],
  },
];
