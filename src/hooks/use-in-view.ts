"use client";

import * as React from "react";

/** Returns a ref + boolean that flips true the first time the node is visible. */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  margin = "-60px",
) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: margin },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [inView, margin]);

  return [ref, inView] as const;
}
