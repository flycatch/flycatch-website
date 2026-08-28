import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createClientTestimonial,
  getClientTestimonial,
  updateClientTestimonial,
  uploadMedia,
  type ClientTestimonialWrite,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';
import MediaField from './MediaField';

interface Props {
  testimonialId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function ClientTestimonialForm({ testimonialId, onCancel, onSaved }: Props) {
  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [designation, setDesignation] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isClutch, setIsClutch] = useState(false);
  const [order, setOrder] = useState(0);
  const [reviewLink, setReviewLink] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!testimonialId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!testimonialId) {
      setClientName('');
      setTitle('');
      setReview('');
      setDesignation('');
      setCompany('');
      setCountry('');
      setImageKey(null);
      setImageFile(null);
      setAltText('');
      setIsClutch(false);
      setOrder(0);
      setReviewLink('');
      setStatus('draft');
      setReady(true);
      return;
    }
    getClientTestimonial(testimonialId)
      .then((item) => {
        setClientName(item.client_name);
        setTitle(item.title);
        setReview(item.review);
        setDesignation(item.client_designation);
        setCompany(item.client_company);
        setCountry(item.country);
        setImageKey(item.image_key);
        setAltText(item.alt_text);
        setIsClutch(item.is_clutch_review);
        setOrder(item.order);
        setReviewLink(item.review_link);
        setStatus(item.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [testimonialId]);

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!clientName.trim() || !title.trim() || !review.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    if (!Number.isFinite(order) || order < 0) {
      setFieldError(t('admin.client_testimonials.order.invalid'));
      return;
    }
    setSaving(true);
    try {
      let nextImage = imageKey;
      if (imageFile) {
        nextImage = (await uploadMedia(imageFile)).key;
      }
      const payload: ClientTestimonialWrite = {
        client_name: clientName.trim(),
        title: title.trim(),
        review: review.trim(),
        client_designation: designation.trim(),
        client_company: company.trim(),
        country: country.trim(),
        image_key: nextImage,
        alt_text: altText.trim(),
        is_clutch_review: isClutch,
        order: Math.trunc(order),
        review_link: reviewLink.trim(),
        status: nextStatus,
      };
      if (testimonialId) await updateClientTestimonial(testimonialId, payload);
      else await createClientTestimonial(payload);
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
      <FormPageHeader
        title={
          testimonialId
            ? t('admin.client_testimonials.edit')
            : t('admin.client_testimonials.add')
        }
        onBack={onCancel}
        disabled={saving}
      />
      <form onSubmit={save}>
        <label>
          {t('admin.client_testimonials.client_name')}
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            required
            maxLength={120}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.client_testimonials.field.title')}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.client_testimonials.review')}
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            required
            rows={5}
          />
        </label>
        <label>
          {t('admin.client_testimonials.client_designation')}
          <input
            value={designation}
            onChange={(event) => setDesignation(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.client_testimonials.client_company')}
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.client_testimonials.country')}
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            maxLength={120}
            autoComplete="off"
          />
        </label>
        <MediaField
          label={t('admin.client_testimonials.image')}
          alt={altText || clientName || t('admin.client_testimonials.image')}
          storedKey={imageKey}
          file={imageFile}
          onFile={setImageFile}
          onClear={() => {
            setImageFile(null);
            setImageKey(null);
          }}
        />
        <label>
          {t('admin.client_testimonials.alt_text')}
          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isClutch}
            onChange={(event) => setIsClutch(event.target.checked)}
          />
          {t('admin.client_testimonials.is_clutch_review')}
        </label>
        <label>
          {t('admin.client_testimonials.order')}
          <input
            type="number"
            min={0}
            step={1}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value))}
          />
        </label>
        <label>
          {t('admin.client_testimonials.review_link')}
          <input
            value={reviewLink}
            onChange={(event) => setReviewLink(event.target.value)}
            maxLength={500}
            autoComplete="off"
          />
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
            {t('admin.client_testimonials.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.client_testimonials.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.client_testimonials.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.client_testimonials.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
