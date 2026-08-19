import { useEffect, useRef, useState } from 'react';
import type Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { uploadMedia } from '../lib/admin-api';
import { rememberMediaSrc } from '../lib/rich-text';
import { t } from '../lib/i18n';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (html: string) => void;
}

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  [{ font: [] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
];

function allowBlobImages(QuillCtor: typeof import('quill').default) {
  const Image = QuillCtor.import('formats/image') as {
    sanitize: (url: string) => string;
    __blobAllowed?: boolean;
  };
  if (Image.__blobAllowed) return;
  const original = Image.sanitize.bind(Image);
  Image.sanitize = (url: string) => {
    if (typeof url === 'string' && url.startsWith('blob:')) return url;
    return original(url);
  };
  Image.__blobAllowed = true;
}

function insertIndex(quill: Quill): number {
  const selection = quill.getSelection();
  if (selection) return selection.index;
  return Math.max(0, quill.getLength() - 1);
}

function destroyEditor(host: HTMLDivElement, quill: Quill, onTextChange: () => void) {
  quill.off('text-change', onTextChange);
  host.parentElement?.querySelector(':scope > .ql-toolbar')?.remove();
  host.replaceChildren();
  host.removeAttribute('class');
}

export default function RichTextEditor({ id, label, value, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [error, setError] = useState<string | null>(null);
  onChangeRef.current = onChange;
  valueRef.current = value;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let editor: Quill | null = null;
    let onTextChange: (() => void) | undefined;

    void import('quill').then(({ default: QuillCtor }) => {
      if (cancelled || hostRef.current !== host) return;
      allowBlobImages(QuillCtor);

      const quill = new QuillCtor(host, {
        theme: 'snow',
        modules: { toolbar: TOOLBAR },
      });
      editor = quill;
      quill.root.setAttribute('aria-labelledby', id);

      if (valueRef.current) {
        quill.clipboard.dangerouslyPasteHTML(valueRef.current, 'silent');
      }

      if (cancelled) {
        destroyEditor(host, quill, () => undefined);
        editor = null;
        return;
      }

      const toolbar = quill.getModule('toolbar') as { addHandler: (name: string, handler: () => void) => void };
      toolbar.addHandler('image', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/gif,image/webp';
        input.addEventListener(
          'change',
          async () => {
            const file = input.files?.[0];
            if (!file) return;
            setError(null);
            const previewUrl = URL.createObjectURL(file);
            const index = insertIndex(quill);
            quill.insertEmbed(index, 'image', previewUrl, 'user');
            quill.setSelection(index + 1, 0, 'silent');
            try {
              const { key } = await uploadMedia(file);
              rememberMediaSrc(previewUrl, key);
            } catch {
              quill.deleteText(index, 1, 'user');
              URL.revokeObjectURL(previewUrl);
              setError(t('admin.blogs.rte.image_failed'));
            }
          },
          { once: true },
        );
        input.click();
      });

      onTextChange = () => {
        onChangeRef.current(quill.root.innerHTML);
      };
      quill.on('text-change', onTextChange);
    });

    return () => {
      cancelled = true;
      if (editor && onTextChange) {
        destroyEditor(host, editor, onTextChange);
      } else if (editor) {
        destroyEditor(host, editor, () => undefined);
      }
    };
  }, [id]);

  return (
    <div className="rte-field">
      <p className="rte-label" id={id}>
        {label}
      </p>
      <div className="rte-quill">
        <div ref={hostRef} />
      </div>
      {error ? (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
