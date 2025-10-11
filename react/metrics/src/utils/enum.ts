export const enumKeys = <T extends object>(enumObj: T) =>
  Object.keys(enumObj) as Array<keyof T>;
