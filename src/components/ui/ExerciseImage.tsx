import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ExerciseImageProps {
  src: string | null;
  alt: string;
  fallbackLabel?: string;
  className?: string;
  imgClassName?: string;
}

export function ExerciseImage({
  src,
  alt,
  fallbackLabel,
  className = '',
  imgClassName = 'object-contain',
}: ExerciseImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center text-zinc-500 gap-1.5 bg-zinc-950 ${className}`}>
        <div className="h-10 w-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-zinc-600" />
        </div>
        {fallbackLabel && (
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 px-2 text-center">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`w-full h-full ${imgClassName} ${className}`}
    />
  );
}
