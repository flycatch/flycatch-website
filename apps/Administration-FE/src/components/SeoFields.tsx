import MediaPreview from './MediaPreview';
import { t } from '../lib/i18n';

export type ContentSeoValue = {
  title: string;
  description: string;
  canonical_url: string;
  meta_title: string;
  h1_tag: string;
  image_alt: string;
  image_key: string | null;
};

interface Props {
  value: ContentSeoValue;
  imageFile: File | null;
  onChange: (value: ContentSeoValue) => void;
  onImageFile: (file: File | null) => void;
}

export const emptySeo: ContentSeoValue = {
  title: '',
  description: '',
  canonical_url: '',
  meta_title: '',
  h1_tag: '',
  image_alt: '',
  image_key: null,
};

export function seoValue(seo: Partial<ContentSeoValue> | undefined | null): ContentSeoValue {
  return {
    title: seo?.title || '',
    description: seo?.description || '',
    canonical_url: seo?.canonical_url || '',
    meta_title: seo?.meta_title || '',
    h1_tag: seo?.h1_tag || '',
    image_alt: seo?.image_alt || '',
    image_key: seo?.image_key ?? null,
  };
}

export default function SeoFields({ value, imageFile, onChange, onImageFile }: Props) {
  function patch(next: Partial<ContentSeoValue>) {
    onChange({ ...value, ...next });
  }

  return (
    <fieldset className="seo-fields">
      <legend>{t('admin.seo.title')}</legend>
      <label>
        {t('admin.seo.field.title')}
        <input
          value={value.title}
          onChange={(event) => patch({ title: event.target.value })}
          maxLength={200}
          autoComplete="off"
        />
      </label>
      <label>
        {t('admin.seo.field.description')}
        <textarea
          value={value.description}
          onChange={(event) => patch({ description: event.target.value })}
          rows={3}
          maxLength={500}
        />
      </label>
      <label>
        {t('admin.seo.field.canonical_url')}
        <input
          value={value.canonical_url}
          onChange={(event) => patch({ canonical_url: event.target.value })}
          maxLength={500}
          autoComplete="off"
        />
      </label>
      <label>
        {t('admin.seo.field.meta_title')}
        <input
          value={value.meta_title}
          onChange={(event) => patch({ meta_title: event.target.value })}
          maxLength={200}
          autoComplete="off"
        />
      </label>
      <label>
        {t('admin.seo.field.h1_tag')}
        <input
          value={value.h1_tag}
          onChange={(event) => patch({ h1_tag: event.target.value })}
          maxLength={200}
          autoComplete="off"
        />
      </label>
      <label>
        {t('admin.seo.field.image')}
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(event) => onImageFile(event.target.files?.[0] || null)}
        />
      </label>
      <label>
        {t('admin.seo.field.image_alt')}
        <input
          value={value.image_alt}
          onChange={(event) => patch({ image_alt: event.target.value })}
          maxLength={200}
          autoComplete="off"
        />
      </label>
      <MediaPreview
        mediaKeys={imageFile ? [] : value.image_key ? [value.image_key] : []}
        files={imageFile ? [imageFile] : []}
        alt={value.image_alt || value.title || t('admin.seo.field.image')}
      />
    </fieldset>
  );
}
