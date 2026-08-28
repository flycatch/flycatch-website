import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createLanding,
  getLanding,
  updateLanding,
  uploadMedia,
  type LandingWritePayload,
} from '../lib/admin-api';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import { t } from '../lib/i18n';
import type { LandingSection } from '../lib/landing-sections';
import MediaPreview from './MediaPreview';
import RepeatableSection from './RepeatableSection';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';

interface Props {
  section: LandingSection;
  entryId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

type AccordionDraft = { key: string; title: string; contents: string; order: number };

function nextKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyAccordion(): AccordionDraft {
  return { key: nextKey(), title: '', contents: '', order: 0 };
}

async function hydrateAccordion(rows: { title: string; contents: string; order: number }[]) {
  if (!rows.length) return [emptyAccordion()];
  return Promise.all(
    rows.map(async (row) => ({
      key: nextKey(),
      title: row.title,
      contents: await hydrateRichText(row.contents),
      order: row.order,
    })),
  );
}

export default function LandingForm({ section, entryId, canPublish, onCancel, onSaved }: Props) {
  const ns = section.ns;
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [introductionTitle, setIntroductionTitle] = useState('');
  const [introductionFirst, setIntroductionFirst] = useState('');
  const [introductionSecond, setIntroductionSecond] = useState('');
  const [introductionThird, setIntroductionThird] = useState('');
  const [accordion, setAccordion] = useState<AccordionDraft[]>([emptyAccordion()]);
  const [experienceTitle, setExperienceTitle] = useState('');
  const [experienceAccordion, setExperienceAccordion] = useState<AccordionDraft[]>([emptyAccordion()]);
  const [experienceKey, setExperienceKey] = useState<string | null>(null);
  const [experienceFile, setExperienceFile] = useState<File | null>(null);
  const [experienceDescription, setExperienceDescription] = useState('');
  const [offeringKey, setOfferingKey] = useState<string | null>(null);
  const [offeringFile, setOfferingFile] = useState<File | null>(null);
  const [offeringTitle, setOfferingTitle] = useState('');
  const [offeringDescription, setOfferingDescription] = useState('');
  const [faqTitle, setFaqTitle] = useState('');
  const [faqDescription, setFaqDescription] = useState('');
  const [faqAccordion, setFaqAccordion] = useState<AccordionDraft[]>([emptyAccordion()]);
  const [seo, setSeo] = useState<ContentSeoValue>(emptySeo);
  const [seoImageFile, setSeoImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!entryId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entryId) return;
    getLanding(section.path, entryId)
      .then(async (item) => {
        setBannerTitle(item.banner_title);
        setBannerKey(item.banner_image_key);
        setIntroductionTitle(item.introduction_title);
        setIntroductionFirst(item.introduction_first_paragraph);
        setIntroductionSecond(item.introduction_second_paragraph);
        setIntroductionThird(item.introduction_third_paragraph || '');
        setAccordion(await hydrateAccordion(item.accordion || []));
        setExperienceTitle(item.experience_title || '');
        setExperienceAccordion(await hydrateAccordion(item.experience_accordion || []));
        setExperienceKey(item.experience_image_key || null);
        setExperienceDescription(await hydrateRichText(item.experience_description || ''));
        setOfferingKey(item.offering_image_key || null);
        setOfferingTitle(item.offering_title || '');
        setOfferingDescription(await hydrateRichText(item.offering_description || ''));
        setFaqTitle(item.faq_title || '');
        setFaqDescription(item.faq_description || '');
        setFaqAccordion(await hydrateAccordion(item.faq_accordion || []));
        setSeo(seoValue(item.seo));
        setStatus(item.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [entryId, section.path]);

  async function persist(nextStatus: 'draft' | 'publish') {
    setError(null);
    setSaving(true);
    try {
      const nextBanner = bannerFile ? (await uploadMedia(bannerFile)).key : bannerKey;
      const nextExperience = experienceFile ? (await uploadMedia(experienceFile)).key : experienceKey;
      const nextOffering = offeringFile ? (await uploadMedia(offeringFile)).key : offeringKey;
      const nextSeoImage = seoImageFile ? (await uploadMedia(seoImageFile)).key : seo.image_key;
      const payload: LandingWritePayload = {
        banner_title: bannerTitle.trim(),
        banner_image_key: nextBanner,
        introduction_title: introductionTitle.trim(),
        introduction_first_paragraph: introductionFirst.trim(),
        introduction_second_paragraph: introductionSecond.trim(),
        seo: { ...seo, image_key: nextSeoImage },
        status: nextStatus,
      };
      if (section.hasThirdIntro) {
        payload.introduction_third_paragraph = introductionThird.trim();
      }
      if (section.hasAccordion) {
        payload.accordion = accordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        }));
      }
      if (section.hasExperience) {
        payload.experience_title = experienceTitle.trim();
        payload.experience_accordion = experienceAccordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        }));
        payload.experience_image_key = nextExperience;
        payload.experience_description = persistRichText(experienceDescription);
      }
      if (section.hasOffering) {
        payload.offering_image_key = nextOffering;
        payload.offering_title = offeringTitle.trim();
        payload.offering_description = persistRichText(offeringDescription);
      }
      if (section.hasFaq) {
        payload.faq_title = faqTitle.trim();
        payload.faq_description = faqDescription.trim();
        payload.faq_accordion = faqAccordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        }));
      }
      if (entryId) await updateLanding(section.path, entryId, payload);
      else await createLanding(section.path, payload);
      onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  function accordionEditor(
    items: AccordionDraft[],
    setItems: (updater: (rows: AccordionDraft[]) => AccordionDraft[]) => void,
    titleKey: string,
    idPrefix: string,
  ) {
    return (
      <RepeatableSection
        title={t(`${ns}.${titleKey}`)}
        addLabel={t(`${ns}.add_item`)}
        removeLabel={t(`${ns}.remove_item`)}
        items={items}
        itemTitle={(item, index) => item.title.trim() || `${t(`${ns}.item`)} ${index + 1}`}
        onAdd={() => setItems((rows) => [...rows, emptyAccordion()])}
        onRemove={(key) => setItems((rows) => rows.filter((row) => row.key !== key))}
      >
        {(item, index) => (
          <>
            <label>
              {t(`${ns}.accordion_title`)}
              <input
                value={item.title}
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, title: event.target.value } : row,
                    ),
                  )
                }
                maxLength={200}
              />
            </label>
            <RichTextEditor
              id={`${idPrefix}-${item.key}`}
              label={t(`${ns}.accordion_contents`)}
              value={item.contents}
              onChange={(value) =>
                setItems((rows) =>
                  rows.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, contents: value } : row,
                  ),
                )
              }
            />
          </>
        )}
      </RepeatableSection>
    );
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
        <h2>{entryId ? t(`${ns}.edit`) : t(`${ns}.add`)}</h2>
      </div>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          persist(status).catch(() => undefined);
        }}
      >
        <label>
          {t(`${ns}.banner_title`)}
          <input
            value={bannerTitle}
            onChange={(event) => setBannerTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t(`${ns}.banner_image`)}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={bannerFile ? [] : bannerKey ? [bannerKey] : []}
          files={bannerFile ? [bannerFile] : []}
          alt={bannerTitle || t(`${ns}.banner_image`)}
        />
        <label>
          {t(`${ns}.introduction_title`)}
          <input
            value={introductionTitle}
            onChange={(event) => setIntroductionTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t(`${ns}.introduction_first`)}
          <textarea
            value={introductionFirst}
            onChange={(event) => setIntroductionFirst(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          {t(`${ns}.introduction_second`)}
          <textarea
            value={introductionSecond}
            onChange={(event) => setIntroductionSecond(event.target.value)}
            rows={4}
          />
        </label>
        {section.hasThirdIntro && (
          <label>
            {t(`${ns}.introduction_third`)}
            <textarea
              value={introductionThird}
              onChange={(event) => setIntroductionThird(event.target.value)}
              rows={4}
            />
          </label>
        )}
        {section.hasAccordion && accordionEditor(accordion, setAccordion, 'accordion', `${ns}-accordion`)}
        {section.hasExperience && (
          <>
            <label>
              {t(`${ns}.experience_title`)}
              <input
                value={experienceTitle}
                onChange={(event) => setExperienceTitle(event.target.value)}
                maxLength={200}
                autoComplete="off"
              />
            </label>
            {accordionEditor(
              experienceAccordion,
              setExperienceAccordion,
              'experience_accordion',
              `${ns}-experience`,
            )}
            <label>
              {t(`${ns}.experience_image`)}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(event) => setExperienceFile(event.target.files?.[0] || null)}
              />
            </label>
            <MediaPreview
              mediaKeys={experienceFile ? [] : experienceKey ? [experienceKey] : []}
              files={experienceFile ? [experienceFile] : []}
              alt={experienceTitle || t(`${ns}.experience_image`)}
            />
            <RichTextEditor
              id={`${ns}-experience-description`}
              label={t(`${ns}.experience_description`)}
              value={experienceDescription}
              onChange={setExperienceDescription}
            />
          </>
        )}
        {section.hasOffering && (
          <>
            <label>
              {t(`${ns}.offering_image`)}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(event) => setOfferingFile(event.target.files?.[0] || null)}
              />
            </label>
            <MediaPreview
              mediaKeys={offeringFile ? [] : offeringKey ? [offeringKey] : []}
              files={offeringFile ? [offeringFile] : []}
              alt={offeringTitle || t(`${ns}.offering_image`)}
            />
            <label>
              {t(`${ns}.offering_title`)}
              <input
                value={offeringTitle}
                onChange={(event) => setOfferingTitle(event.target.value)}
                maxLength={200}
                autoComplete="off"
              />
            </label>
            <RichTextEditor
              id={`${ns}-offering-description`}
              label={t(`${ns}.offering_description`)}
              value={offeringDescription}
              onChange={setOfferingDescription}
            />
          </>
        )}
        {section.hasFaq && (
          <>
            <label>
              {t(`${ns}.faq_title`)}
              <input
                value={faqTitle}
                onChange={(event) => setFaqTitle(event.target.value)}
                maxLength={200}
                autoComplete="off"
              />
            </label>
            <label>
              {t(`${ns}.faq_description`)}
              <textarea
                value={faqDescription}
                onChange={(event) => setFaqDescription(event.target.value)}
                rows={4}
              />
            </label>
            {accordionEditor(faqAccordion, setFaqAccordion, 'faq_accordion', `${ns}-faq`)}
          </>
        )}
        <SeoFields value={seo} imageFile={seoImageFile} onChange={setSeo} onImageFile={setSeoImageFile} />
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
            <button
              type="button"
              className="primary"
              disabled={saving || !canPublish}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t(`${ns}.publish`)}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
