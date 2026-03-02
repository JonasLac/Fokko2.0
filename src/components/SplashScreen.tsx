import { useEffect, useState } from "react";

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    const doneTimer = setTimeout(() => onDone(), 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "all" }}
    >
      <h1 className="text-5xl font-extrabold tracking-tight text-gradient select-none">
        Fokko
      </h1>
      <p className="mt-2 text-xs font-medium text-muted-foreground tracking-widest uppercase select-none">
        by JLDS
      </p>
    </div>
  );
};

export default SplashScreen;
