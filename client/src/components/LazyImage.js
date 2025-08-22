"use client";

import { useState, useRef, useEffect } from "react";
import { useIntersectionObserver } from "../hooks/useLazyLoad";

const LazyImage = ({ 
  src, 
  alt, 
  className = "", 
  placeholder = null,
  fallback = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [imageRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px",
  });

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
      };
      img.onerror = () => {
        if (fallback) {
          setImageSrc(fallback);
        }
      };
    }
  }, [isIntersecting, src, fallback]);

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;
