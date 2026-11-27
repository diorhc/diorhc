import { siBoosty, siDiscord, siGithub, siGreasyfork, type SimpleIcon } from "simple-icons";

/**
 * The one list of contact links, shared by the hero and the contact section.
 * Same set as the GitHub profile README (GitHub itself is where it lives).
 */
export interface ContactLink {
  name: string;
  handle: string;
  href: string;
  icon: SimpleIcon;
}

export const CONTACTS: ContactLink[] = [
  {
    name: "GitHub",
    handle: "@diorhc",
    href: "https://github.com/diorhc",
    icon: siGithub,
  },
  {
    name: "Discord",
    handle: "discord.gg/nf7fXSMr2",
    href: "https://discord.gg/nf7fXSMr2",
    icon: siDiscord,
  },
  {
    name: "Greasy Fork",
    handle: "1473734-diorhc",
    href: "https://greasyfork.org/ru/users/1473734-diorhc",
    icon: siGreasyfork,
  },
  {
    name: "Boosty",
    handle: "boosty.to/diore",
    href: "https://boosty.to/diore",
    icon: siBoosty,
  },
];
