"use client";

import { Suspense } from "react";

const LazyLoader = ({ children, fallback = null }) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

export default LazyLoader;
