import { GAME_STRATEGY_GUIDE } from "../../src/api/gameStrategyGuide";

type SectionMap = Map<string, string>;

const DELIMITER_REGEX = /^---\s+(.+?)\s+---\s*$/;

const parseSections = (): SectionMap => {
  const map: SectionMap = new Map();
  const lines = GAME_STRATEGY_GUIDE.split("\n");

  let currentSection: string | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const match = DELIMITER_REGEX.exec(line);
    if (match) {
      if (currentSection !== null) {
        map.set(currentSection, buffer.join("\n").trim());
      }
      currentSection = match[1]!.trim();
      buffer = [];
    } else if (currentSection !== null) {
      buffer.push(line);
    }
  }

  if (currentSection !== null) {
    map.set(currentSection, buffer.join("\n").trim());
  }

  return map;
};

export const SECTION_MAP: SectionMap = parseSections();

export const getSectionContent = (sectionNames: string[]): string => {
  const parts: string[] = [];
  for (const name of sectionNames) {
    const content = SECTION_MAP.get(name);
    if (content && content.length > 0) {
      parts.push(`--- ${name} ---\n${content}`);
    }
  }
  return parts.join("\n\n");
};
