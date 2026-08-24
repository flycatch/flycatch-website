import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createHome,
  getHome,
  listCaseStudies,
  updateHome,
  uploadMedia,
  type CaseStudySummary,
  type HomeFaqItem,
  type HomeServiceItem,
  type HomeWrite,
} from '../lib/admin-api';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import MultiSelect from './MultiSelect';
import MediaPreview from './MediaPreview';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';
import { adminListHref } from '../lib/admin-routes';
import { t } from '../lib/i18n';

interface Props {
  homeId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

type ServiceDraft = HomeServiceItem & { key: string; imageFile: File | null };
type FaqDraft = HomeFaqItem & { key: string };

function nextKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyService(): ServiceDraft {
  return {
    key: nextKey(),
    services_types_title: '',
    services_image_key: null,
    services_contents: '',
    our_services_links: '',
    imageFile: null,
  };
}

function emptyFaq(): FaqDraft {
  return { key: nextKey(), title: '', contents: '' };
}

export default function HomeForm({ homeId, canPublish, onCancel, onSaved }: Props) {
  const [caseStudies, setCaseStudies] = useState<CaseStudySummary[]>([]);
  const [title, setTitle] = useState('');
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [seo, setSeo] = useState<ContentSeoValue>(emptySeo);
  const [seoImageFile, setSeoImageFile] = useState<File | null>(null);
  const [caseStudyIds, setCaseStudyIds] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceDraft[]>([emptyService()]);
  const [bannerExploreText, setBannerExploreText] = useState('');
  const [faqTitle, setFaqTitle] = useState('');
  const [faqDescription, setFaqDescription] = useState('');
  const [faqs, setFaqs] = useState<FaqDraft[]>([emptyFaq()]);
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const items: CaseStudySummary[] = [];
      let page = 1;
      while (true) {
        const result = await listCaseStudies('', page);
        items.push(...result.items);
        if (page * result.per_page >= result.total) break;
        page += 1;
      }
      setCaseStudies(items);
      if (homeId) {
        const item = await getHome(homeId);
        setTitle(item.title);
        setVideoKey(item.video_key);
        setVideoType(item.video_content_type);
        setBannerTitle(item.banner_title);
        setSeo(seoValue(item.seo));
        setCaseStudyIds(item.case_study_ids);
        setServices(
          (item.services || []).length
            ? (item.services || []).map((service) => ({
                key: nextKey(),
                services_types_title: service.services_types_title || '',
                services_image_key: service.services_image_key ?? null,
                services_contents: service.services_contents || '',
                our_services_links: service.our_services_links || '',
                imageFile: null,
              }))
            : [emptyService()],
        );
        setBannerExploreText(item.banner_explore_text);
        setFaqTitle(item.faq_title);
        setFaqDescription(await hydrateRichText(item.faq_description));
        setFaqs(
          (item.faqs || []).length
            ? (item.faqs || []).map((faq) => ({
                key: nextKey(),
                title: faq.title || '',
                contents: faq.contents || '',
              }))
            : [emptyFaq()],
        );
        setStatus(item.status);
      }
      setReady(true);
    }
    load().catch(() => {
      setError(t('admin.workspace.request_failed'));
      setReady(true);
    });
  }, [homeId]);

  function patchService(key: string, patch: Partial<ServiceDraft>) {
    setServices((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function patchFaq(key: string, patch: Partial<FaqDraft>) {
    setFaqs((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!title.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    if (nextStatus === 'publish' && !canPublish) {
      setError(t('admin.action.forbidden'));
      return;
    }
    setSaving(true);
    try {
      let nextVideoKey = videoKey;
      let nextVideoType = videoType;
      if (videoFile) {
        nextVideoKey = (await uploadMedia(videoFile)).key;
        nextVideoType = videoFile.type || null;
      }
      let nextSeoImage = seo.image_key;
      if (seoImageFile) {
        nextSeoImage = (await uploadMedia(seoImageFile)).key;
      }
      const nextServices: HomeServiceItem[] = [];
      for (const service of services) {
        let imageKey = service.services_image_key ?? null;
        if (service.imageFile) {
          imageKey = (await uploadMedia(service.imageFile)).key;
        }
        nextServices.push({
          services_types_title: service.services_types_title.trim(),
          services_image_key: imageKey,
          services_contents: service.services_contents.trim(),
          our_services_links: service.our_services_links.trim(),
        });
      }
      const payload: HomeWrite = {
        title: title.trim(),
        video_key: nextVideoKey,
        video_content_type: nextVideoKey ? nextVideoType : null,
        banner_title: bannerTitle.trim(),
        seo: {
          title: seo.title.trim(),
          description: seo.description.trim(),
          canonical_url: seo.canonical_url.trim(),
          meta_title: seo.meta_title.trim(),
          image_key: nextSeoImage,
        },
        case_study_ids: caseStudyIds,
        services: nextServices,
        banner_explore_text: bannerExploreText.trim(),
        faq_title: faqTitle.trim(),
        faq_description: persistRichText(faqDescription),
        faqs: faqs.map((faq) => ({
          title: faq.title.trim(),
          contents: faq.contents.trim(),
        })),
        status: nextStatus,
      };
      if (homeId) await updateHome(homeId, payload);
      else await createHome(payload);
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

  const publishDisabled = saving || !canPublish;

  return (
    <section className="role-form-page">
      <div className="panel-header">
        <h2>{homeId ? t('admin.homes.edit') : t('admin.homes.add')}</h2>
      </div>
      <form onSubmit={save}>
        <label>
          {t('admin.homes.field.title')}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.homes.field.video')}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={videoFile ? [] : videoKey ? [videoKey] : []}
          files={videoFile ? [videoFile] : []}
          alt={t('admin.homes.field.video')}
        />
        <label>
          {t('admin.homes.field.banner_title')}
          <input
            value={bannerTitle}
            onChange={(event) => setBannerTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <MultiSelect
          id="home-case-studies"
          label={t('admin.homes.field.case_studies')}
          manageHref={adminListHref('case_studies')}
          options={caseStudies.map((item) => ({ id: item.id, name: item.heading }))}
          selectedIds={caseStudyIds}
          onChange={setCaseStudyIds}
        />
        <SeoFields value={seo} imageFile={seoImageFile} onChange={setSeo} onImageFile={setSeoImageFile} />
        <div className="repeatable-section">
          <div className="repeatable-section-header">
            <h3>{t('admin.homes.service_section')}</h3>
            <button type="button" onClick={() => setServices((current) => [...current, emptyService()])}>
              {t('admin.homes.add_service')}
            </button>
          </div>
          {services.map((service, index) => (
            <details key={service.key} className="admin-accordion" open>
              <summary>
                {service.services_types_title.trim() || `${t('admin.homes.service_item')} ${index + 1}`}
              </summary>
              <label>
                {t('admin.homes.field.services_types_title')}
                <input
                  value={service.services_types_title}
                  onChange={(event) =>
                    patchService(service.key, { services_types_title: event.target.value })
                  }
                  maxLength={200}
                  autoComplete="off"
                />
              </label>
              <label>
                {t('admin.homes.field.services_image')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(event) =>
                    patchService(service.key, { imageFile: event.target.files?.[0] || null })
                  }
                />
              </label>
              <MediaPreview
                mediaKeys={
                  service.imageFile ? [] : service.services_image_key ? [service.services_image_key] : []
                }
                files={service.imageFile ? [service.imageFile] : []}
                alt={t('admin.homes.field.services_image')}
              />
              <label>
                {t('admin.homes.field.services_contents')}
                <textarea
                  value={service.services_contents}
                  onChange={(event) =>
                    patchService(service.key, { services_contents: event.target.value })
                  }
                  rows={4}
                />
              </label>
              <label>
                {t('admin.homes.field.our_services_links')}
                <input
                  value={service.our_services_links}
                  onChange={(event) =>
                    patchService(service.key, { our_services_links: event.target.value })
                  }
                  autoComplete="off"
                />
              </label>
              {services.length > 1 && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => setServices((current) => current.filter((item) => item.key !== service.key))}
                >
                  {t('admin.homes.remove_service')}
                </button>
              )}
            </details>
          ))}
        </div>
        <label>
          {t('admin.homes.field.banner_explore_text')}
          <input
            value={bannerExploreText}
            onChange={(event) => setBannerExploreText(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <div className="home-faq-section">
        <label>
          {t('admin.homes.field.faq_title')}
          <input
            value={faqTitle}
            onChange={(event) => setFaqTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <RichTextEditor
          id="home-faq-description"
          label={t('admin.homes.field.faq_description')}
          value={faqDescription}
          onChange={setFaqDescription}
        />
        <div className="repeatable-section">
          <div className="repeatable-section-header">
            <h3>{t('admin.homes.faq_accordion')}</h3>
            <button type="button" onClick={() => setFaqs((current) => [...current, emptyFaq()])}>
              {t('admin.homes.add_faq')}
            </button>
          </div>
          {faqs.map((faq, index) => (
            <details key={faq.key} className="admin-accordion" open>
              <summary>
                {faq.title.trim() || `${t('admin.homes.faq_item')} ${index + 1}`}
              </summary>
              <label>
                {t('admin.homes.field.faq_ai_expertise_title')}
                <input
                  value={faq.title}
                  onChange={(event) => patchFaq(faq.key, { title: event.target.value })}
                  maxLength={200}
                  autoComplete="off"
                />
              </label>
              <label>
                {t('admin.homes.field.faq_ai_expertise_contents')}
                <textarea
                  value={faq.contents}
                  onChange={(event) => patchFaq(faq.key, { contents: event.target.value })}
                  rows={4}
                />
              </label>
              {faqs.length > 1 && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => setFaqs((current) => current.filter((item) => item.key !== faq.key))}
                >
                  {t('admin.homes.remove_faq')}
                </button>
              )}
            </details>
          ))}
        </div>
        </div>
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
        {!canPublish && (
          <p className="alert alert-warning error" role="status">
            {t('admin.action.forbidden')}
          </p>
        )}
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t('admin.homes.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.homes.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.homes.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={publishDisabled}
              aria-disabled={!canPublish}
              title={!canPublish ? t('admin.action.forbidden') : undefined}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.homes.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
