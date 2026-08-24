import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createSolution,
  getSolution,
  updateSolution,
  uploadMedia,
  type SolutionWrite,
} from '../lib/admin-api';
import MediaPreview from './MediaPreview';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';
import { t } from '../lib/i18n';

interface Props {
  solutionId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

export default function SolutionForm({ solutionId, canPublish, onCancel, onSaved }: Props) {
  const [bannerTitle, setBannerTitle] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [seo, setSeo] = useState<ContentSeoValue>(emptySeo);
  const [seoImageFile, setSeoImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!solutionId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!solutionId) return;
    getSolution(solutionId)
      .then((item) => {
        setBannerTitle(item.banner_title);
        setSectionTitle(item.section_title);
        setBannerKey(item.banner_image_key);
        setSeo(seoValue(item.seo));
        setStatus(item.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [solutionId]);

  async function persist(nextStatus: 'draft' | 'publish') {
    setError(null);
    setSaving(true);
    try {
      let nextBanner = bannerKey;
      let nextSeoImage = seo.image_key;
      if (bannerFile) nextBanner = (await uploadMedia(bannerFile)).key;
      if (seoImageFile) nextSeoImage = (await uploadMedia(seoImageFile)).key;
      const payload: SolutionWrite = {
        banner_image_key: nextBanner,
        banner_title: bannerTitle.trim(),
        section_title: sectionTitle.trim(),
        seo: { ...seo, image_key: nextSeoImage },
        status: nextStatus,
      };
      if (solutionId) await updateSolution(solutionId, payload);
      else await createSolution(payload);
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
      <div className="panel-header">
        <h2>{solutionId ? t('admin.solutions.edit') : t('admin.solutions.add')}</h2>
      </div>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          persist(status).catch(() => undefined);
        }}
      >
        <label>
          {t('admin.solutions.banner_image')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={bannerFile ? [] : bannerKey ? [bannerKey] : []}
          files={bannerFile ? [bannerFile] : []}
          alt={bannerTitle || t('admin.solutions.banner_image')}
        />
        <label>
          {t('admin.solutions.banner_title')}
          <input
            value={bannerTitle}
            onChange={(event) => setBannerTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.solutions.section_title')}
          <input
            value={sectionTitle}
            onChange={(event) => setSectionTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <SeoFields value={seo} imageFile={seoImageFile} onChange={setSeo} onImageFile={setSeoImageFile} />
        {error && (
          <p className="alert alert-error error" role="alert">
            {error}
          </p>
        )}
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t('admin.solutions.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.solutions.save')}
          </button>
          {status === 'publish' ? (
            <button type="button" disabled={saving} onClick={() => persist('draft').catch(() => undefined)}>
              {t('admin.solutions.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={saving || !canPublish}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.solutions.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
