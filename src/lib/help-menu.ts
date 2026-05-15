export const OPEN_HELP_EVENT = "open-help";

export type HelpMenuItem = {
  label: string;
  href: string;
  description: string;
};

export const HELP_MENU_ITEMS: HelpMenuItem[] = [
  {
    label: "Help center / Docs",
    href: "/help#help-center",
    description: "Clone-owned product help and documentation entry point.",
  },
  {
    label: "Contact support",
    href: "/help#contact-support",
    description: "Support options for workspace and product questions.",
  },
  {
    label: "System status",
    href: "/help#system-status",
    description: "Current service health and incident communication.",
  },
  {
    label: "Changelog / What's new",
    href: "/help#changelog",
    description: "Recent product changes and release notes.",
  },
  {
    label: "Download apps",
    href: "/help#download-apps",
    description: "Desktop and mobile app availability for this clone.",
  },
  {
    label: "Community",
    href: "/help#community",
    description: "Community and learning resources.",
  },
];
