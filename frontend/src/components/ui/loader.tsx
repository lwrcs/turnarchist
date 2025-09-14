export const Loader = () => {
  return <div>Loader</div>;
};

export const LoadingScreen = () => {
  return (
    <div className="flex h-dvh w-screen items-center justify-center">
      <Loader />
    </div>
  );
};
