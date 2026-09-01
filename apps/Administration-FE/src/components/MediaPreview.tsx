import { useEffect, useState } from 'react';
import { fetchMediaBlob } from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  mediaKeys?: string[];
  files?: File[];
  alt: string;
  onRemoveAt?: (index: number) => void;
}

function isVideoSource(file?: File, key?: string): boolean {
  if (file) return file.type.startsWith('video/');
  if (key) return /\.(mp4|webm|mov)$/i.test(key);
  return false;
}

function isDocumentSource(file?: File, key?: string): boolean {
  if (file) {
    return (
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type.includes('officedocument') ||
      /\.(pdf|doc|docx)$/i.test(file.name)
    );
  }
  if (key) return /\.(pdf|doc|docx)$/i.test(key);
  return false;
}

export default function MediaPreview({ mediaKeys = [], files = [], alt, onRemoveAt }: Props) {
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
        return (
          <div key={url} className="media-preview-item">
            {video ? (
              <video className="media-preview media-preview-video" src={url} controls>
                <track kind="captions" />
              </video>
            ) : isDocumentSource(source?.file, source?.key) ? (
              <p className="media-preview-file">
                {source?.file?.name || source?.key || t('admin.media.remove')}
              </p>
            ) : (
              <img className="media-preview" src={url} alt={alt} />
            )}
            {onRemoveAt ? (
              <button
                type="button"
                className="danger media-preview-remove"
                onClick={() => onRemoveAt(index)}
              >
                {t('admin.media.remove')}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
