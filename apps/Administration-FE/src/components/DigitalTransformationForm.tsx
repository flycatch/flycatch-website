import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createDigitalTransformation,
  getDigitalTransformation,
  updateDigitalTransformation,
  uploadMedia,
  type DigitalTransformationWrite,
} from '../lib/admin-api';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import { t } from '../lib/i18n';
import MediaPreview from './MediaPreview';
import RepeatableSection from './RepeatableSection';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';

interface Props {
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

export default function DigitalTransformationForm({
  entryId,
  canPublish,
  onCancel,
  onSaved,
}: Props) {
  const ns = 'admin.digital_transformation';
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerTagLine, setBannerTagLine] = useState('');
  const [introductionTitle, setIntroductionTitle] = useState('');
  const [introductionFirst, setIntroductionFirst] = useState('');
  const [introductionSecond, setIntroductionSecond] = useState('');
  const [accordion, setAccordion] = useState<AccordionDraft[]>([emptyAccordion()]);
  const [outcomesKey, setOutcomesKey] = useState<string | null>(null);
  const [outcomesFile, setOutcomesFile] = useState<File | null>(null);
  const [outcomesTitle, setOutcomesTitle] = useState('');
  const [outcomesDescription, setOutcomesDescription] = useState('');
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
    getDigitalTransformation(entryId)
      .then(async (item) => {
        setBannerTitle(item.banner_title);
        setBannerKey(item.banner_image_key);
        setBannerTagLine(item.banner_tag_line);
        setIntroductionTitle(item.introduction_title);
        setIntroductionFirst(item.introduction_first_paragraph);
        setIntroductionSecond(item.introduction_second_paragraph);
        setAccordion(
          item.accordion.length
            ? await Promise.all(
                item.accordion.map(async (row) => ({
                  key: nextKey(),
                  title: row.title,
                  contents: await hydrateRichText(row.contents),
                  order: row.order,
                })),
              )
            : [emptyAccordion()],
        );
        setOutcomesKey(item.outcomes_image_key);
        setOutcomesTitle(item.outcomes_title);
        setOutcomesDescription(await hydrateRichText(item.outcomes_description));
        setFaqTitle(item.faq_title);
        setFaqDescription(await hydrateRichText(item.faq_description));
        setFaqAccordion(
          item.faq_accordion.length
            ? await Promise.all(
                item.faq_accordion.map(async (row) => ({
                  key: nextKey(),
                  title: row.title,
                  contents: await hydrateRichText(row.contents),
                  order: row.order,
                })),
              )
            : [emptyAccordion()],
        );
        setSeo(seoValue(item.seo));
        setStatus(item.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [entryId]);

  async function persist(nextStatus: 'draft' | 'publish') {
    setError(null);
    setSaving(true);
    try {
      const nextBanner = bannerFile ? (await uploadMedia(bannerFile)).key : bannerKey;
      const nextOutcomes = outcomesFile ? (await uploadMedia(outcomesFile)).key : outcomesKey;
      const nextSeoImage = seoImageFile ? (await uploadMedia(seoImageFile)).key : seo.image_key;
      const payload: DigitalTransformationWrite = {
        banner_title: bannerTitle.trim(),
        banner_image_key: nextBanner,
        banner_tag_line: bannerTagLine.trim(),
        introduction_title: introductionTitle.trim(),
        introduction_first_paragraph: introductionFirst.trim(),
        introduction_second_paragraph: introductionSecond.trim(),
        accordion: accordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        })),
        outcomes_image_key: nextOutcomes,
        outcomes_title: outcomesTitle.trim(),
        outcomes_description: persistRichText(outcomesDescription),
        faq_title: faqTitle.trim(),
        faq_description: persistRichText(faqDescription),
        faq_accordion: faqAccordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        })),
        seo: { ...seo, image_key: nextSeoImage },
        status: nextStatus,
      };
      if (entryId) await updateDigitalTransformation(entryId, payload);
      else await createDigitalTransformation(payload);
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
          {t(`${ns}.banner_tag_line`)}
          <input
            value={bannerTagLine}
            onChange={(event) => setBannerTagLine(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
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
        <RepeatableSection
          title={t(`${ns}.accordion`)}
          addLabel={t(`${ns}.add_item`)}
          removeLabel={t(`${ns}.remove_item`)}
          items={accordion}
          itemTitle={(item, index) => item.title.trim() || `${t(`${ns}.item`)} ${index + 1}`}
          onAdd={() => setAccordion((rows) => [...rows, emptyAccordion()])}
          onRemove={(key) => setAccordion((rows) => rows.filter((row) => row.key !== key))}
        >
          {(item, index) => (
            <>
              <label>
                {t(`${ns}.accordion_title`)}
                <input
                  value={item.title}
                  onChange={(event) =>
                    setAccordion((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, title: event.target.value } : row,
                      ),
                    )
                  }
                  maxLength={200}
                />
              </label>
              <RichTextEditor
                id={`${ns}-accordion-${item.key}`}
                label={t(`${ns}.accordion_contents`)}
                value={item.contents}
                onChange={(value) =>
                  setAccordion((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, contents: value } : row,
                    ),
                  )
                }
              />
            </>
          )}
        </RepeatableSection>
        <label>
          {t(`${ns}.outcomes_image`)}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setOutcomesFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={outcomesFile ? [] : outcomesKey ? [outcomesKey] : []}
          files={outcomesFile ? [outcomesFile] : []}
          alt={outcomesTitle || t(`${ns}.outcomes_image`)}
        />
        <label>
          {t(`${ns}.outcomes_title`)}
          <input
            value={outcomesTitle}
            onChange={(event) => setOutcomesTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <RichTextEditor
          id={`${ns}-outcomes-description`}
          label={t(`${ns}.outcomes_description`)}
          value={outcomesDescription}
          onChange={setOutcomesDescription}
        />
        <label>
          {t(`${ns}.faq_title`)}
          <input
            value={faqTitle}
            onChange={(event) => setFaqTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <RichTextEditor
          id={`${ns}-faq-description`}
          label={t(`${ns}.faq_description`)}
          value={faqDescription}
          onChange={setFaqDescription}
        />
        <RepeatableSection
          title={t(`${ns}.faq_accordion`)}
          addLabel={t(`${ns}.add_item`)}
          removeLabel={t(`${ns}.remove_item`)}
          items={faqAccordion}
          itemTitle={(item, index) => item.title.trim() || `${t(`${ns}.item`)} ${index + 1}`}
          onAdd={() => setFaqAccordion((rows) => [...rows, emptyAccordion()])}
          onRemove={(key) => setFaqAccordion((rows) => rows.filter((row) => row.key !== key))}
        >
          {(item, index) => (
            <>
              <label>
                {t(`${ns}.accordion_title`)}
                <input
                  value={item.title}
                  onChange={(event) =>
                    setFaqAccordion((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, title: event.target.value } : row,
                      ),
                    )
                  }
                  maxLength={200}
                />
              </label>
              <RichTextEditor
                id={`${ns}-faq-${item.key}`}
                label={t(`${ns}.accordion_contents`)}
                value={item.contents}
                onChange={(value) =>
                  setFaqAccordion((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, contents: value } : row,
                    ),
                  )
                }
              />
            </>
          )}
        </RepeatableSection>
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
