export type ReviewScript = "youtube-plus" | "telegram-plus";

export interface ReviewItem {
  id: string;
  author: string;
  script: ReviewScript;
  scriptLabel: string;
  date: string;
  rating: "good";
  original: string;
  originalLang: "en" | "zh";
  quote: {
    ru: string;
    en: string;
  };
  url: string;
}

export interface GreasyForkAggregate {
  good: number;
  ok: number;
  bad: number;
  installs: number;
}

export const DEFAULT_GF_RATINGS: GreasyForkAggregate = {
  good: 42,
  ok: 10,
  bad: 2,
  installs: 10632,
};

export const GREASYFORK_REVIEWS: ReviewItem[] = [
  {
    id: "gf-342550",
    author: "q2p",
    script: "youtube-plus",
    scriptLabel: "YouTube +",
    date: "2026-10-25",
    rating: "good",
    original: "Works great! A lot of power user features",
    originalLang: "en",
    quote: {
      ru: "Работает отлично! Много продвинутых функций для опытных пользователей.",
      en: "Works great! A lot of power user features.",
    },
    url: "https://greasyfork.org/en/scripts/537017-youtube/discussions/342550",
  },
  {
    id: "gf-332340",
    author: "XIAO_.XING",
    script: "telegram-plus",
    scriptLabel: "Telegram +",
    date: "2026-06-19",
    rating: "good",
    original: "用了一下，非常棒，开源精神",
    originalLang: "zh",
    quote: {
      ru: "Попробовал — потрясающе, настоящий дух open source.",
      en: "Tried it out — awesome work, true open-source spirit.",
    },
    url: "https://greasyfork.org/en/scripts/537433-telegram/discussions/332340",
  },
  {
    id: "gf-341605",
    author: "Imn Ra",
    script: "youtube-plus",
    scriptLabel: "YouTube +",
    date: "2026-10-11",
    rating: "good",
    original: "Thanks a lot for adopting and adding the screenshot feature.",
    originalLang: "en",
    quote: {
      ru: "Большое спасибо за отклик и добавление функции скриншотов.",
      en: "Thanks a lot for adopting and adding the screenshot feature.",
    },
    url: "https://greasyfork.org/en/scripts/537017-youtube/discussions/341605",
  },
  {
    id: "gf-335408",
    author: "定位失效fdmi",
    script: "youtube-plus",
    scriptLabel: "YouTube +",
    date: "2026-07-21",
    rating: "good",
    original: "挺好，功能简洁哈哈",
    originalLang: "zh",
    quote: {
      ru: "Очень хорошо, аккуратный и понятный набор функций.",
      en: "Really nice — clean and well-focused feature set.",
    },
    url: "https://greasyfork.org/en/scripts/537017-youtube/discussions/335408",
  },
  {
    id: "gf-340563",
    author: "raingg",
    script: "youtube-plus",
    scriptLabel: "YouTube +",
    date: "2026-09-27",
    rating: "good",
    original: "好用。如果再增加一个固定画质的功能就完美了",
    originalLang: "zh",
    quote: {
      ru: "Удобно пользоваться. С фиксацией качества видео будет вообще идеально.",
      en: "Very handy to use. Adding a fixed quality option would make it perfect.",
    },
    url: "https://greasyfork.org/en/scripts/537017-youtube/discussions/340563",
  },
  {
    id: "gf-335959",
    author: "Ta Fed",
    script: "youtube-plus",
    scriptLabel: "YouTube +",
    date: "2026-07-26",
    rating: "good",
    original: "best yet",
    originalLang: "en",
    quote: {
      ru: "Лучший скрипт на данный момент.",
      en: "Best yet.",
    },
    url: "https://greasyfork.org/en/scripts/537017-youtube/discussions/335959",
  },
];
