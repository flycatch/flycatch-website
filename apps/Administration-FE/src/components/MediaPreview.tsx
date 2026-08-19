import { useEffect, useState } from 'react';
import { fetchMediaBlob } from '../lib/admin-api';

interface Props {
  mediaKeys?: string[];
  files?: File[];
  alt: string;
}

export default function MediaPreview({ mediaKeys = [], files = [], alt }: Props) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const local = files.map((file) => URL.createObjectURL(file));
    let stored: string[] = [];
    let cancelled = false;

    async function load() {
      stored = await Promise.all(
        mediaKeys.map(async (key) => {
          const blob = await fetchMediaBlob(key);
          return URL.createObjectURL(blob);
        }),
      );
      if (!cancelled) setUrls([...stored, ...local]);
    }

    if (mediaKeys.length) {
      load().catch(() => {
        if (!cancelled) setUrls(local);
      });
    } else {
      setUrls(local);
    }

    return () => {
      cancelled = true;
      [...local, ...stored].forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaKeys.join('|'), files]);

  if (urls.length === 0) return null;

  return (
    <div className="media-preview-row">
      {urls.map((url) => (
        <img key={url} className="media-preview" src={url} alt={alt} />
      ))}
    </div>
  );
}
