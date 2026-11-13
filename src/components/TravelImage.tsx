import React, { useState } from 'react';
import { Compass } from 'lucide-react';

interface TravelImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const TravelImage: React.FC<TravelImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950 text-slate-200 p-4 text-center ${className}`}
      >
        <Compass className="w-7 h-7 text-teal-300 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-slate-300 line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
