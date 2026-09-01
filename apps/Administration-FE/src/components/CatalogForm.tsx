import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createCatalog,
  getCatalog,
  listAllCatalog,
  listAuthors,
  slugify,
  updateCatalog,
  uploadMedia,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import { adminListHref, type AdminView } from '../lib/admin-routes';
import type { CatalogSection } from '../lib/catalog-sections';
import FormPageHeader from './FormPageHeader';
import MediaField, { IMAGE_ACCEPT } from './MediaField';
import MultiSelect from './MultiSelect';
import RepeatableSection from './RepeatableSection';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';

interface Props {
  section: CatalogSection;
  entryId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';
type Values = Record<string, unknown>;

function emptyValues(section: CatalogSection): Values {
  const values: Values = { status: 'draft' };
  for (const field of section.fields) {
    if (field.kind === 'checkbox') values[field.key] = false;
    else if (field.kind === 'number') values[field.key] = 0;
    else if (field.kind === 'multiselect') values[field.idsKey] = [];
    else if (field.kind === 'select') values[field.key] = field.options[0];
    else if (field.kind === 'seo') values.seo = emptySeo;
    else if (field.kind === 'images') values.images = [];
    else if (field.kind === 'media') values[field.key] = null;
    else if (field.kind === 'slug') values[field.key] = '';
    else values[field.key] = '';
  }
  return values;
}

export default function CatalogForm({ section, entryId, onCancel, onSaved }: Props) {
  const ns = section.ns;
  const [values, setValues] = useState<Values>(() => emptyValues(section));
  const [seo, setSeo] = useState<ContentSeoValue>(emptySeo);
  const [seoImageFile, setSeoImageFile] = useState<File | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [imageItems, setImageItems] = useState<{ key: string; image_key: string | null; alt: string; file: File | null }[]>(
    [],
  );
  const [status, setStatus] = useState<Status>('draft');
  const [slugManual, setSlugManual] = useState(false);
  const [options, setOptions] = useState<Record<string, { id: string; name: string }[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!entryId);
  const [saving, setSaving] = useState(false);

  function patch(key: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      const slugField = section.fields.find((field) => field.kind === 'slug');
      if (
        slugField &&
        slugField.kind === 'slug' &&
        slugField.fromKey === key &&
        !slugManual &&
        typeof value === 'string'
      ) {
        next[slugField.key] = slugify(value);
      }
      return next;
    });
  }

  useEffect(() => {
    const next = emptyValues(section);
    setValues(next);
    setSeo(emptySeo);
    setSeoImageFile(null);
    setFiles({});
    setImageItems([]);
    setStatus('draft');
    setSlugManual(Boolean(entryId));
    setReady(!entryId);
    if (!entryId) return;
    getCatalog(section.path, entryId)
      .then((item) => {
        setValues({ ...next, ...item });
        if (item.seo && typeof item.seo === 'object') setSeo(seoValue(item.seo as ContentSeoValue));
        if (Array.isArray(item.images)) {
          setImageItems(
            (item.images as { image_key?: string | null; alt?: string }[]).map((image, index) => ({
              key: `${index}-${image.image_key || 'img'}`,
              image_key: image.image_key ?? null,
              alt: image.alt || '',
              file: null,
            })),
          );
        }
        setStatus(item.status === 'publish' ? 'publish' : 'draft');
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [entryId, section.path, section.resource]);

  useEffect(() => {
    const needed = section.fields.filter((field) => field.kind === 'multiselect');
    if (!needed.length) return;
    Promise.all(
      needed.map(async (field) => {
        if (field.kind !== 'multiselect') return [field.idsKey, []] as const;
        if (field.optionsFrom === 'authors') {
          const result = await listAuthors();
          return [field.idsKey, result.items.map((item) => ({ id: item.id, name: item.name }))] as const;
        }
        const path =
          field.optionsFrom === 'applications'
            ? '/admin/applications'
            : field.optionsFrom === 'news_categories'
              ? '/admin/news-categories'
              : '/admin/resource-categories';
        const items = await listAllCatalog(path);
        return [
          field.idsKey,
          items.map((item) => ({ id: String(item.id), name: String(item.name || item.id) })),
        ] as const;
      }),
    )
      .then((entries) => setOptions(Object.fromEntries(entries)))
      .catch(() => undefined);
  }, [section.resource]);

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    for (const field of section.fields) {
      if (field.kind === 'text' || field.kind === 'email' || field.kind === 'textarea') {
        if (field.required && !String(values[field.key] || '').trim()) {
          setFieldError(t('admin.field.required'));
          return;
        }
      }
      if (field.kind === 'slug') {
        const nextSlug = slugify(String(values[field.key] || '')) || slugify(String(values[field.fromKey] || ''));
        if (!nextSlug) {
          setFieldError(t(`${ns}.slug.invalid`));
          return;
        }
      }
      if (field.kind === 'number') {
        const amount = Number(values[field.key] || 0);
        if (!Number.isFinite(amount) || amount < 0) {
          setFieldError(t('admin.catalog.number.invalid'));
          return;
        }
      }
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { status: nextStatus };
      for (const field of section.fields) {
        if (field.kind === 'seo') {
          const imageKey = seoImageFile ? (await uploadMedia(seoImageFile)).key : seo.image_key;
          payload.seo = { ...seo, image_key: imageKey };
        } else if (field.kind === 'media') {
          const file = files[field.key];
          payload[field.key] = file ? (await uploadMedia(file)).key : values[field.key] || null;
        } else if (field.kind === 'images') {
          const images = [];
          for (const item of imageItems) {
            const key = item.file ? (await uploadMedia(item.file)).key : item.image_key;
            images.push({ image_key: key, alt: item.alt });
          }
          payload.images = images;
        } else if (field.kind === 'multiselect') {
          payload[field.idsKey] = values[field.idsKey] || [];
        } else if (field.kind === 'number') {
          payload[field.key] = Number(values[field.key] || 0);
        } else if (field.kind === 'checkbox') {
          payload[field.key] = Boolean(values[field.key]);
        } else if (field.kind === 'date') {
          payload[field.key] = String(values[field.key] || '') || null;
        } else if (field.kind === 'slug') {
          payload[field.key] =
            slugify(String(values[field.key] || '')) || slugify(String(values[field.fromKey] || ''));
        } else {
          payload[field.key] = values[field.key];
        }
      }
      if (entryId) await updateCatalog(section.path, entryId, payload);
      else await createCatalog(section.path, payload);
      onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <section className="role-form-page">
        <p className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          {t('admin.workspace.loading')}
        </p>
      </section>
    );
  }

  return (
    <section className="role-form-page">
      <FormPageHeader
        title={entryId ? t(`${ns}.edit`) : t(`${ns}.add`)}
        onBack={onCancel}
        disabled={saving}
      />
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          persist(status).catch(() => undefined);
        }}
      >
        {section.fields.map((field) => {
          if (field.kind === 'seo') {
            return (
              <SeoFields
                key="seo"
                value={seo}
                imageFile={seoImageFile}
                onChange={setSeo}
                onImageFile={setSeoImageFile}
              />
            );
          }
          if (field.kind === 'images') {
            return (
              <RepeatableSection
                key="images"
                title={t(`${ns}.images`)}
                addLabel={t('admin.catalog.add_more')}
                removeLabel={t('admin.media.remove')}
                items={imageItems}
                itemTitle={(_item, index) => t('admin.catalog.image_item').replace('{n}', String(index + 1))}
                onAdd={() =>
                  setImageItems((current) => [
                    ...current,
                    { key: `${Date.now()}`, image_key: null, alt: '', file: null },
                  ])
                }
                onRemove={(key) => setImageItems((current) => current.filter((item) => item.key !== key))}
              >
                {(item, index) => (
                  <>
                    <MediaField
                      label={t(`${ns}.image`)}
                      alt={item.alt || t(`${ns}.image`)}
                      storedKey={item.image_key}
                      file={item.file}
                      onFile={(file) =>
                        setImageItems((current) =>
                          current.map((row, rowIndex) => (rowIndex === index ? { ...row, file } : row)),
                        )
                      }
                      onClear={() =>
                        setImageItems((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, file: null, image_key: null } : row,
                          ),
                        )
                      }
                    />
                    <label>
                      {t('admin.catalog.alt')}
                      <input
                        value={item.alt}
                        onChange={(event) =>
                          setImageItems((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, alt: event.target.value } : row,
                            ),
                          )
                        }
                      />
                    </label>
                  </>
                )}
              </RepeatableSection>
            );
          }
          if (field.kind === 'media') {
            return (
              <MediaField
                key={field.key}
                label={t(`${ns}.${field.labelKey}`)}
                accept={field.accept ?? IMAGE_ACCEPT}
                alt={String(values.name || values.title || field.labelKey)}
                storedKey={(values[field.key] as string | null) || null}
                file={files[field.key] || null}
                onFile={(file) => setFiles((current) => ({ ...current, [field.key]: file }))}
                onClear={() => {
                  setFiles((current) => ({ ...current, [field.key]: null }));
                  patch(field.key, null);
                }}
              />
            );
          }
          if (field.kind === 'multiselect') {
            return (
              <MultiSelect
                key={field.idsKey}
                id={`${section.resource}-${field.idsKey}`}
                label={t(`${ns}.${field.labelKey}`)}
                manageHref={adminListHref(field.manageView as AdminView)}
                options={options[field.idsKey] || []}
                selectedIds={(values[field.idsKey] as string[]) || []}
                onChange={(ids) => patch(field.idsKey, ids)}
              />
            );
          }
          if (field.kind === 'richtext') {
            return (
              <RichTextEditor
                key={field.key}
                id={`${section.resource}-${field.key}`}
                label={t(`${ns}.${field.labelKey}`)}
                value={String(values[field.key] || '')}
                onChange={(html) => patch(field.key, html)}
              />
            );
          }
          if (field.kind === 'checkbox') {
            return (
              <label key={field.key} className="checkbox-field">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.key])}
                  onChange={(event) => patch(field.key, event.target.checked)}
                />
                {t(`${ns}.${field.labelKey}`)}
              </label>
            );
          }
          if (field.kind === 'select') {
            return (
              <label key={field.key}>
                {t(`${ns}.${field.labelKey}`)}
                <select
                  value={String(values[field.key] || field.options[0])}
                  onChange={(event) => patch(field.key, event.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (field.kind === 'textarea') {
            return (
              <label key={field.key}>
                {t(`${ns}.${field.labelKey}`)}
                <textarea
                  value={String(values[field.key] ?? '')}
                  onChange={(event) => patch(field.key, event.target.value)}
                  required={field.required}
                  rows={5}
                  autoComplete="off"
                />
              </label>
            );
          }
          if (field.kind === 'slug') {
            return (
              <label key={field.key}>
                {t(`${ns}.${field.labelKey}`)}
                <input
                  type="text"
                  value={String(values[field.key] ?? '')}
                  onChange={(event) => {
                    setSlugManual(true);
                    patch(field.key, event.target.value);
                  }}
                  required={field.required}
                  maxLength={128}
                  autoComplete="off"
                />
              </label>
            );
          }
          const inputType =
            field.kind === 'email' ? 'email' : field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text';
          return (
            <label key={field.key}>
              {t(`${ns}.${field.labelKey}`)}
              <input
                type={inputType}
                min={field.kind === 'number' ? 0 : undefined}
                value={String(values[field.key] ?? '')}
                onChange={(event) =>
                  patch(field.key, field.kind === 'number' ? Number(event.target.value) : event.target.value)
                }
                required={field.required}
                autoComplete="off"
              />
            </label>
          );
        })}
        {fieldError && (
          <p className="alert alert-error error" role="alert">
            {fieldError}
          </p>
        )}
        {error && (
          <p className="alert alert-error error" role="alert">
            {error}
          </p>
        )}
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t(`${ns}.cancel`)}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t(`${ns}.save`)}
          </button>
          {status === 'publish' ? (
            <button type="button" disabled={saving} onClick={() => persist('draft').catch(() => undefined)}>
              {t(`${ns}.unpublish`)}
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={() => persist('publish').catch(() => undefined)}>
              {t(`${ns}.publish`)}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
