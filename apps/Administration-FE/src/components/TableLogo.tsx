import { useEffect, useState } from 'react';
import { fetchMediaBlob } from '../lib/admin-api';

interface Props {
  mediaKey: string | null;
  alt: string;
}

export default function TableLogo({ mediaKey, alt }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaKey) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    fetchMediaBlob(mediaKey)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaKey]);

  if (!mediaKey) {
    return <span className="table-logo-empty">—</span>;
  }
  if (!url) return null;
  return <img className="table-logo" src={url} alt={alt} />;
}
