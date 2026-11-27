// Lightweight stop-list for the public guestbook. It is not a full profanity
// filter: it catches the common roots, including spaced-out or look-alike
// spellings ("х у й", "xуй", "f.u.c.k", "sh1t"), which covers most drive-by abuse.

// Latin and digit look-alikes mapped to Cyrillic, for the Russian check.
const TO_CYRILLIC: Record<string, string> = {
  a: "а", b: "в", c: "с", e: "е", h: "н", k: "к", m: "м", o: "о", p: "р",
  t: "т", x: "х", y: "у", "0": "о", "3": "з", "6": "б", "@": "а",
  ё: "е",
};

// Digit and symbol look-alikes mapped to Latin, for the English check.
const TO_LATIN: Record<string, string> = {
  "0": "o", "1": "i", "!": "i", "3": "e", "4": "a", "@": "a", "5": "s",
  $: "s", "7": "t",
};

const RU_ROOTS = [
  "хуй", "хуе", "хуя", "хуи", "пизд", "ебан", "ебат", "ебал", "ебуч", "ебло",
  "выеб", "заеб", "уеба", "уебо", "бляд", "блят", "пидор", "пидар", "мудак",
  "мудил", "гандон", "шлюх", "залуп", "дроч", "сучк",
];

const EN_ROOTS = [
  "fuck", "shit", "cunt", "bitch", "nigger", "nigga", "faggot", "whore",
  "asshole", "retard",
];

function compact(value: string, map: Record<string, string>): string {
  let out = "";
  for (const ch of value.toLowerCase()) {
    const mapped = map[ch] ?? ch;
    // Keep letters only, so separators between letters do not hide a word.
    if (/\p{L}/u.test(mapped)) out += mapped;
  }
  return out;
}

// Words are checked one by one so that innocent neighbours ("this hit") do not
// merge into a match. Runs of single characters ("х у й") are joined first.
function chunks(message: string): string[] {
  const out: string[] = [];
  let run = "";
  for (const token of message.split(/\s+/).filter(Boolean)) {
    if ([...token].length === 1) {
      run += token;
      continue;
    }
    if (run) out.push(run);
    run = "";
    out.push(token);
  }
  if (run) out.push(run);
  return out;
}

export function isBlockedMessage(message: string): boolean {
  return chunks(message).some((chunk) => {
    const ru = compact(chunk, TO_CYRILLIC);
    if (RU_ROOTS.some((root) => ru.includes(root))) return true;
    const en = compact(chunk, TO_LATIN);
    return EN_ROOTS.some((root) => en.includes(root));
  });
}
