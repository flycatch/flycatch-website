import { useEffect, useState } from 'react';
import { fetchMediaBlob } from '../lib/admin-api';

interface Props {
  mediaKeys?: string[];
  files?: File[];
  alt: string;
}

function isVideoSource(file?: File, key?: string): boolean {
  if (file) return file.type.startsWith('video/');
  if (key) return /\.(mp4|webm|mov)$/i.test(key);
  return false;
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

  const sources = [
    ...mediaKeys.map((key) => ({ key, file: undefined as File | undefined })),
    ...files.map((file) => ({ key: undefined as string | undefined, file })),
  ];

  return (
    <div className="media-preview-row">
      {urls.map((url, index) => {
        const source = sources[index];
        const video = isVideoSource(source?.file, source?.key);
        if (video) {
          return (
            <video key={url} className="media-preview media-preview-video" src={url} controls>
              <track kind="captions" />
            </video>
          );
        }
        return <img key={url} className="media-preview" src={url} alt={alt} />;
      })}
    </div>
  );
}
