import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  uploadMedia,
  type ContentSeo,
} from '../lib/admin-api';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import { SERVICE_PAGE_NAMES, type NamedPageName } from '../lib/service-page-names';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';
import MediaField from './MediaField';
import RepeatableSection from './RepeatableSection';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';

export type NamedPageWrite = {
  page_name: NamedPageName;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  accordion: { title: string; contents: string; order: number }[];
  offering_image_key: string | null;
  offering_title: string;
  offering_description: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: { title: string; contents: string; order: number }[];
  seo: ContentSeo;
  status: 'draft' | 'publish';
};

export type NamedPageDetail = NamedPageWrite & { id: string };

type AccordionDraft = {
  key: string;
  title: string;
  contents: string;
  order: number;
};

function nextKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyAccordion(): AccordionDraft {
  return { key: nextKey(), title: '', contents: '', order: 0 };
}

interface Props {
  ns: string;
  pageNames?: readonly NamedPageName[];
  entryId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
  getEntry: (id: string) => Promise<NamedPageDetail>;
  createEntry: (payload: NamedPageWrite) => Promise<unknown>;
  updateEntry: (id: string, payload: NamedPageWrite) => Promise<unknown>;
  listEntries: (q: string, page: number) => Promise<{ items: { id: string; page_name: string }[] }>;
}

export default function NamedPageForm({
  ns,
  pageNames = SERVICE_PAGE_NAMES,
  entryId,
  canPublish,
  onCancel,
  onSaved,
  getEntry,
  createEntry,
  updateEntry,
  listEntries,
}: Props) {
  const [pageName, setPageName] = useState<NamedPageName>(pageNames[0]);
  const [usedNames, setUsedNames] = useState<string[]>([]);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [introductionTitle, setIntroductionTitle] = useState('');
  const [introductionFirst, setIntroductionFirst] = useState('');
  const [introductionSecond, setIntroductionSecond] = useState('');
  const [accordion, setAccordion] = useState<AccordionDraft[]>([emptyAccordion()]);
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
    listEntries('', 1)
      .then((result) => {
        setUsedNames(
          result.items
            .filter((item) => item.id !== entryId)
            .map((item) => item.page_name),
        );
      })
      .catch(() => undefined);
  }, [entryId, listEntries]);

  useEffect(() => {
    if (!entryId) return;
    getEntry(entryId)
      .then(async (item) => {
        setPageName(item.page_name);
        setBannerTitle(item.banner_title);
        setBannerKey(item.banner_image_key);
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
        setOfferingKey(item.offering_image_key);
        setOfferingTitle(item.offering_title);
        setOfferingDescription(await hydrateRichText(item.offering_description));
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
  }, [entryId, getEntry]);

  const catalog = pageNames.includes(pageName) ? pageNames : [pageName, ...pageNames];
  const availableNames = catalog.filter(
    (name) => name === pageName || !usedNames.includes(name),
  );

  async function persist(nextStatus: 'draft' | 'publish') {
    setError(null);
    setSaving(true);
    try {
      const nextBanner = bannerFile ? (await uploadMedia(bannerFile)).key : bannerKey;
      const nextOffering = offeringFile ? (await uploadMedia(offeringFile)).key : offeringKey;
      const nextSeoImage = seoImageFile ? (await uploadMedia(seoImageFile)).key : seo.image_key;
      const payload: NamedPageWrite = {
        page_name: pageName,
        banner_title: bannerTitle.trim(),
        banner_image_key: nextBanner,
        introduction_title: introductionTitle.trim(),
        introduction_first_paragraph: introductionFirst.trim(),
        introduction_second_paragraph: introductionSecond.trim(),
        accordion: accordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        })),
        offering_image_key: nextOffering,
        offering_title: offeringTitle.trim(),
        offering_description: persistRichText(offeringDescription),
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
      if (entryId) await updateEntry(entryId, payload);
      else await createEntry(payload);
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
        <label>
          {t(`${ns}.page_name`)}
          <select
            value={pageName}
            onChange={(event) => setPageName(event.target.value as NamedPageName)}
          >
            {availableNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t(`${ns}.banner_title`)}
          <input
            value={bannerTitle}
            onChange={(event) => setBannerTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <MediaField
          label={t(`${ns}.banner_image`)}
          alt={bannerTitle || t(`${ns}.banner_image`)}
          storedKey={bannerKey}
          file={bannerFile}
          onFile={setBannerFile}
          onClear={() => {
            setBannerFile(null);
            setBannerKey(null);
          }}
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
        <MediaField
          label={t(`${ns}.offering_image`)}
          alt={offeringTitle || t(`${ns}.offering_image`)}
          storedKey={offeringKey}
          file={offeringFile}
          onFile={setOfferingFile}
          onClear={() => {
            setOfferingFile(null);
            setOfferingKey(null);
          }}
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
