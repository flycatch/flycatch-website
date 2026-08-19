import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createCaseStudy,
  getCaseStudy,
  listAllCaseStudyCategories,
  listAllIndustries,
  slugify,
  updateCaseStudy,
  uploadMedia,
  type CaseStudyCategory,
  type CaseStudyWrite,
  type Industry,
} from '../lib/admin-api';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import MultiSelect from './MultiSelect';
import MediaPreview from './MediaPreview';
import RichTextEditor from './RichTextEditor';
import { t } from '../lib/i18n';

interface Props {
  caseStudyId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function CaseStudyForm({ caseStudyId, onCancel, onSaved }: Props) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<CaseStudyCategory[]>([]);
  const [heading, setHeading] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [shortHeading, setShortHeading] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [date, setDate] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [industryIds, setIndustryIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [nextIndustries, nextCategories] = await Promise.all([
        listAllIndustries(),
        listAllCaseStudyCategories(),
      ]);
      setIndustries(nextIndustries);
      setCategories(nextCategories);
      if (caseStudyId) {
        const item = await getCaseStudy(caseStudyId);
        setHeading(item.heading);
        setSlug(item.slug);
        setSlugManual(true);
        setShortHeading(item.short_heading);
        setDescription(item.description);
        setOrder(item.order);
        setDate(item.date || '');
        setBody(await hydrateRichText(item.body));
        setStatus(item.status);
        setImageKey(item.image_key);
        setImageAlt(item.image_alt);
        setIndustryIds(item.industry_ids);
        setCategoryIds(item.category_ids);
      }
      setReady(true);
    }
    load().catch(() => {
      setError(t('admin.workspace.request_failed'));
      setReady(true);
    });
  }, [caseStudyId]);

  function onHeadingChange(value: string) {
    setHeading(value);
    if (!slugManual) setSlug(slugify(value));
  }

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!heading.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    const nextSlug = slugify(slug) || slugify(heading);
    if (!nextSlug) {
      setFieldError(t('admin.case_studies.slug.invalid'));
      return;
    }
    setSaving(true);
    try {
      let nextImageKey = imageKey;
      if (imageFile) {
        nextImageKey = (await uploadMedia(imageFile)).key;
      }
      const payload: CaseStudyWrite = {
        heading: heading.trim(),
        slug: nextSlug,
        short_heading: shortHeading.trim(),
        description: description.trim(),
        body: persistRichText(body),
        order: Number.isFinite(order) ? Math.trunc(order) : 0,
        date: date || null,
        status: nextStatus,
        image_key: nextImageKey,
        image_alt: imageAlt.trim(),
        industry_ids: industryIds,
        category_ids: categoryIds,
      };
      if (caseStudyId) await updateCaseStudy(caseStudyId, payload);
      else await createCaseStudy(payload);
      onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    await persist(status);
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
      <div className="panel-header">
        <h2>{caseStudyId ? t('admin.case_studies.edit') : t('admin.case_studies.add')}</h2>
      </div>
      <form onSubmit={save}>
        <label>
          {t('admin.case_studies.field.heading')}
          <input
            value={heading}
            onChange={(event) => onHeadingChange(event.target.value)}
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.case_studies.field.slug')}
          <input
            value={slug}
            onChange={(event) => {
              setSlugManual(true);
              setSlug(event.target.value);
            }}
            required
            maxLength={128}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.case_studies.field.short_heading')}
          <textarea
            value={shortHeading}
            onChange={(event) => setShortHeading(event.target.value)}
            rows={2}
          />
        </label>
        <label>
          {t('admin.case_studies.field.description')}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>
        <label>
          {t('admin.case_studies.field.order')}
          <input
            type="number"
            step={1}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value))}
          />
        </label>
        <MultiSelect
          id="case-study-industries"
          label={t('admin.case_studies.field.industry')}
          options={industries}
          selectedIds={industryIds}
          onChange={setIndustryIds}
        />
        <MultiSelect
          id="case-study-categories"
          label={t('admin.case_studies.field.category')}
          options={categories}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
        />
        <label>
          {t('admin.case_studies.field.image')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={imageFile ? [] : imageKey ? [imageKey] : []}
          files={imageFile ? [imageFile] : []}
          alt={imageAlt || t('admin.case_studies.field.image')}
        />
        <label>
          {t('admin.case_studies.field.image_alt')}
          <input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={200} />
        </label>
        <RichTextEditor
          id="case-study-body-label"
          label={t('admin.case_studies.field.body')}
          value={body}
          onChange={setBody}
        />
        <label>
          {t('admin.case_studies.field.date')}
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
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
            {t('admin.case_studies.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.case_studies.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.case_studies.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.case_studies.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
