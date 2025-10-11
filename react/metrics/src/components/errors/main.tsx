export const MainErrorFallback = () => {
  return (
    <div
      className="flex h-dvh w-screen flex-col items-center justify-center"
      role="alert"
    >
      <h2 className="text-lg font-semibold -mt-16">Something went wrong.</h2>
      <p className="text-sm text-muted-foreground">Please try again later.</p>
    </div>
  );
};
