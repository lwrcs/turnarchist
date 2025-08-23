import { logger } from "../../logger";

export const extractFirst = <T>(
  data: Array<T> | (T | undefined),
): NonNullable<T> | null => {
  // If data is an array, return the first element or error
  if (Array.isArray(data)) {
    const datum = data[0];
    if (datum === undefined) {
      return null;
    }
    return datum;
  }

  // If data is a single element that is possibly undefined, type-narrow and throw if undefined
  if (data === undefined) {
    return null;
  }

  return data;
};

export const extractFirstOrThrow = <T>(
  data: Array<T> | (T | undefined),
): NonNullable<T> => {
  const value = extractFirst(data);
  if (value === null) {
    const error = new Error(`Unable to extract value from empty data-set`);
    logger.error("Error extractFirstOrThrow", error);
    throw error;
  }
  return value;
};

export type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type Ensure<T, K extends keyof T> = T & RequiredNotNull<Pick<T, K>>;
