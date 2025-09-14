export const GAME_VERSION = "1.2.0"; // todo: Use import.meta.env.VITE_GAME_VERSION from game package.json

export const SOCIAL_LINKS = [
  {
    name: "Discord",
    url: "https://discord.gg/Fa4SBzraU3",
    className: "bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4]",
    label: "discord",
    text: "Join our Discord",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/turnarchist/",
    className:
      "bg-gradient-to-br from-yellow-400 via-red-500 via-pink-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:via-pink-500 hover:via-red-500 hover:to-yellow-400",
    label: "instagram",
    text: "Follow us on Instagram",
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@turnarchist",
    className:
      "bg-black text-white rounded-lg shadow-[6px_6px_0_0_#ff0050,-6px_-6px_0_0_#25f4ee] hover:shadow-[-6px_-6px_0_0_#ff0050,6px_6px_0_0_#25f4ee]",
    label: "tiktok",
    text: "Follow us on TikTok",
  },
  {
    name: "Patreon",
    url: "https://www.patreon.com/turnarchist",
    className: "bg-[#f96855] text-white rounded-lg hover:bg-[#e55a47]",
    label: "patreon",
    text: "Support us on Patreon",
  },
] as const;
