"use client";

import { useState, useEffect, lazy } from "react";
import { usePathname } from "next/navigation";
import LazyLoader from "./LazyLoader";
import LoadingSkeleton from "./LoadingSkeleton";

// Lazy load the main components
const Dashboard = lazy(() => import("../app/lazy/dashboard.lazy"));
const Admin = lazy(() => import("../app/lazy/admin.lazy"));
const Profile = lazy(() => import("../app/lazy/profile.lazy"));

const LazyRouter = () => {
  const pathname = usePathname();
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Determine which component to load based on pathname
    let componentToLoad = null;
    
    switch (pathname) {
      case "/dashboard":
        componentToLoad = Dashboard;
        break;
      case "/admin":
        componentToLoad = Admin;
        break;
      case "/profile":
        componentToLoad = Profile;
        break;
      default:
        componentToLoad = null;
    }

    if (componentToLoad) {
      setComponent(componentToLoad);
    }
    
    setLoading(false);
  }, [pathname]);

  if (loading) {
    return <LoadingSkeleton type="default" size="large" />;
  }

  if (!Component) {
    return null;
  }

  return (
    <LazyLoader fallback={<LoadingSkeleton type="default" size="large" />}>
      <Component />
    </LazyLoader>
  );
};

export default LazyRouter;
