import fs from "fs";
import path from "path";

const PORT_KEY = "$PORT";

export const renderServerBanner = (port: number | string) => {
  const banner = fs
    .readFileSync(path.join(__dirname, "banner.txt"), "utf8")
    .replace(PORT_KEY, port.toString().padEnd(PORT_KEY.length, " "));
  return banner;
};
