export const getEnvironmentVariableOrThrow = (name: string): string => {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(
      `No value found for required environment variable: ${name}`,
    );
  }
  return value;
};
