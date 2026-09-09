import { useRef } from 'react';
import MediaPreview from './MediaPreview';

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.svg';
export const LOGO_IMAGE_ACCEPT = IMAGE_ACCEPT;

export function fileMatchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

type SingleProps = {
  label: string;
  accept?: string;
  alt: string;
  storedKey: string | null;
  file: File | null;
  onFile: (file: File | null) => void;
  onClear: () => void;
  multiple?: false;
};

type MultiProps = {
  label: string;
  accept?: string;
  alt: string;
  storedKeys: string[];
  files: File[];
  onFiles: (files: File[]) => void;
  onStoredKeys: (keys: string[]) => void;
  multiple: true;
};

export default function MediaField(props: SingleProps | MultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = props.accept ?? IMAGE_ACCEPT;
  const multiple = props.multiple === true;
  const mediaKeys = multiple ? props.storedKeys : props.file ? [] : props.storedKey ? [props.storedKey] : [];
  const files = multiple ? props.files : props.file ? [props.file] : [];

  function resetInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  function onRemoveAt(index: number) {
    if (multiple) {
      if (index < props.storedKeys.length) {
        props.onStoredKeys(props.storedKeys.filter((_, itemIndex) => itemIndex !== index));
        return;
      }
      const fileIndex = index - props.storedKeys.length;
      const nextFiles = props.files.filter((_, itemIndex) => itemIndex !== fileIndex);
      props.onFiles(nextFiles);
      if (nextFiles.length === 0) resetInput();
      return;
    }
    resetInput();
    props.onClear();
  }

  return (
    <div className="media-field">
      <label>
        {props.label}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            const selected = Array.from(event.target.files || []).filter((file) =>
              fileMatchesAccept(file, accept),
            );
            if (multiple) {
              props.onFiles(selected);
              if (selected.length === 0) resetInput();
              return;
            }
            props.onFile(selected[0] || null);
            if (selected.length === 0) resetInput();
          }}
        />
      </label>
      <MediaPreview mediaKeys={mediaKeys} files={files} alt={props.alt} onRemoveAt={onRemoveAt} />
    </div>
  );
}
