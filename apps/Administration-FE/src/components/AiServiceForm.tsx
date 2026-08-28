import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createAiService,
  getAiService,
  listSolutionDetails,
  updateAiService,
  uploadMedia,
  type AiServiceWrite,
} from '../lib/admin-api';
import { adminListHref } from '../lib/admin-routes';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';
import MediaField from './MediaField';
import MultiSelect from './MultiSelect';
import RepeatableSection from './RepeatableSection';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';

interface Props {
  entryId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

type IndustryDraft = {
  key: string;
  title: string;
  image_key: string | null;
  imageFile: File | null;
  order: number;
};

type AccordionDraft = { key: string; title: string; contents: string; order: number };

function nextKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyIndustry(): IndustryDraft {
  return { key: nextKey(), title: '', image_key: null, imageFile: null, order: 0 };
}

function emptyAccordion(): AccordionDraft {
  return { key: nextKey(), title: '', contents: '', order: 0 };
}

export default function AiServiceForm({ entryId, canPublish, onCancel, onSaved }: Props) {
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [introductionTitle, setIntroductionTitle] = useState('');
  const [introductionDescription, setIntroductionDescription] = useState('');
  const [solutionsTitle, setSolutionsTitle] = useState('');
  const [solutionsDescription, setSolutionsDescription] = useState('');
  const [industryTitle, setIndustryTitle] = useState('');
  const [industryDescription, setIndustryDescription] = useState('');
  const [industryItems, setIndustryItems] = useState<IndustryDraft[]>([emptyIndustry()]);
  const [expertiseTitle, setExpertiseTitle] = useState('');
  const [expertiseKey, setExpertiseKey] = useState<string | null>(null);
  const [expertiseFile, setExpertiseFile] = useState<File | null>(null);
  const [expertiseAccordion, setExpertiseAccordion] = useState<AccordionDraft[]>([emptyAccordion()]);
  const [expertiseAccordionDescription, setExpertiseAccordionDescription] = useState('');
  const [solutionIds, setSolutionIds] = useState<string[]>([]);
  const [solutionOptions, setSolutionOptions] = useState<{ id: string; name: string }[]>([]);
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
    async function loadSolutionDetails() {
      const options: { id: string; name: string }[] = [];
      let page = 1;
      while (true) {
        const result = await listSolutionDetails('', page);
        options.push(
          ...result.items.map((item) => ({ id: item.id, name: item.title || item.id })),
        );
        if (page * result.per_page >= result.total) break;
        page += 1;
      }
      setSolutionOptions(options);
    }
    loadSolutionDetails().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!entryId) return;
    getAiService(entryId)
      .then(async (item) => {
        setBannerTitle(item.banner_title);
        setBannerKey(item.banner_image_key);
        setIntroductionTitle(item.introduction_title);
        setIntroductionDescription(item.introduction_description);
        setSolutionsTitle(item.solutions_title);
        setSolutionsDescription(item.solutions_description);
        setIndustryTitle(item.industry_title);
        setIndustryDescription(item.industry_description);
        setIndustryItems(
          item.industry_items.length
            ? item.industry_items.map((row) => ({
                key: nextKey(),
                title: row.title,
                image_key: row.image_key ?? null,
                imageFile: null,
                order: row.order,
              }))
            : [emptyIndustry()],
        );
        setExpertiseTitle(item.ai_expertise_title);
        setExpertiseKey(item.ai_expertise_image_key);
        setExpertiseAccordion(
          item.ai_expertise_accordion.length
            ? await Promise.all(
                item.ai_expertise_accordion.map(async (row) => ({
                  key: nextKey(),
                  title: row.title,
                  contents: await hydrateRichText(row.contents),
                  order: row.order,
                })),
              )
            : [emptyAccordion()],
        );
        setExpertiseAccordionDescription(
          await hydrateRichText(item.ai_expertise_accordion_description),
        );
        setSolutionIds(item.solution_ids);
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
      const nextExpertise = expertiseFile ? (await uploadMedia(expertiseFile)).key : expertiseKey;
      const nextSeoImage = seoImageFile ? (await uploadMedia(seoImageFile)).key : seo.image_key;
      const industries = [];
      for (const [index, item] of industryItems.entries()) {
        const image_key = item.imageFile ? (await uploadMedia(item.imageFile)).key : item.image_key;
        industries.push({ title: item.title.trim(), image_key, order: index });
      }
      const payload: AiServiceWrite = {
        banner_title: bannerTitle.trim(),
        banner_image_key: nextBanner,
        introduction_title: introductionTitle.trim(),
        introduction_description: introductionDescription.trim(),
        solutions_title: solutionsTitle.trim(),
        solutions_description: solutionsDescription.trim(),
        industry_title: industryTitle.trim(),
        industry_description: industryDescription.trim(),
        industry_items: industries,
        ai_expertise_title: expertiseTitle.trim(),
        ai_expertise_image_key: nextExpertise,
        ai_expertise_accordion: expertiseAccordion.map((item, index) => ({
          title: item.title.trim(),
          contents: persistRichText(item.contents),
          order: index,
        })),
        ai_expertise_accordion_description: persistRichText(expertiseAccordionDescription),
        solution_ids: solutionIds,
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
      if (entryId) await updateAiService(entryId, payload);
      else await createAiService(payload);
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
        title={entryId ? t('admin.ai_services.edit') : t('admin.ai_services.add')}
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
          {t('admin.ai_services.banner_title')}
          <input
            value={bannerTitle}
            onChange={(event) => setBannerTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <MediaField
          label={t('admin.ai_services.banner_image')}
          alt={bannerTitle || t('admin.ai_services.banner_image')}
          storedKey={bannerKey}
          file={bannerFile}
          onFile={setBannerFile}
          onClear={() => {
            setBannerFile(null);
            setBannerKey(null);
          }}
        />
        <label>
          {t('admin.ai_services.introduction_title')}
          <input
            value={introductionTitle}
            onChange={(event) => setIntroductionTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.ai_services.introduction_description')}
          <textarea
            value={introductionDescription}
            onChange={(event) => setIntroductionDescription(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          {t('admin.ai_services.solutions_title')}
          <input
            value={solutionsTitle}
            onChange={(event) => setSolutionsTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.ai_services.solutions_description')}
          <textarea
            value={solutionsDescription}
            onChange={(event) => setSolutionsDescription(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          {t('admin.ai_services.industry_title')}
          <input
            value={industryTitle}
            onChange={(event) => setIndustryTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.ai_services.industry_description')}
          <textarea
            value={industryDescription}
            onChange={(event) => setIndustryDescription(event.target.value)}
            rows={4}
          />
        </label>
        <RepeatableSection
          title={t('admin.ai_services.industry_section')}
          addLabel={t('admin.ai_services.add_item')}
          removeLabel={t('admin.ai_services.remove_item')}
          items={industryItems}
          itemTitle={(item, index) =>
            item.title.trim() || `${t('admin.ai_services.item')} ${index + 1}`
          }
          onAdd={() => setIndustryItems((rows) => [...rows, emptyIndustry()])}
          onRemove={(key) => setIndustryItems((rows) => rows.filter((row) => row.key !== key))}
        >
          {(item, index) => (
            <>
              <label>
                {t('admin.ai_services.industry_item_title')}
                <input
                  value={item.title}
                  onChange={(event) =>
                    setIndustryItems((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, title: event.target.value } : row,
                      ),
                    )
                  }
                  maxLength={200}
                />
              </label>
              <MediaField
                label={t('admin.ai_services.industry_image')}
                alt={item.title || t('admin.ai_services.industry_image')}
                storedKey={item.image_key}
                file={item.imageFile}
                onFile={(file) =>
                  setIndustryItems((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, imageFile: file } : row,
                    ),
                  )
                }
                onClear={() =>
                  setIndustryItems((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, imageFile: null, image_key: null } : row,
                    ),
                  )
                }
              />
            </>
          )}
        </RepeatableSection>
        <label>
          {t('admin.ai_services.ai_expertise_title')}
          <input
            value={expertiseTitle}
            onChange={(event) => setExpertiseTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <MediaField
          label={t('admin.ai_services.ai_expertise_image')}
          alt={expertiseTitle || t('admin.ai_services.ai_expertise_image')}
          storedKey={expertiseKey}
          file={expertiseFile}
          onFile={setExpertiseFile}
          onClear={() => {
            setExpertiseFile(null);
            setExpertiseKey(null);
          }}
        />
        <RepeatableSection
          title={t('admin.ai_services.ai_expertise_accordion')}
          addLabel={t('admin.ai_services.add_item')}
          removeLabel={t('admin.ai_services.remove_item')}
          items={expertiseAccordion}
          itemTitle={(item, index) =>
            item.title.trim() || `${t('admin.ai_services.item')} ${index + 1}`
          }
          onAdd={() => setExpertiseAccordion((rows) => [...rows, emptyAccordion()])}
          onRemove={(key) =>
            setExpertiseAccordion((rows) => rows.filter((row) => row.key !== key))
          }
        >
          {(item, index) => (
            <>
              <label>
                {t('admin.ai_services.accordion_title')}
                <input
                  value={item.title}
                  onChange={(event) =>
                    setExpertiseAccordion((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, title: event.target.value } : row,
                      ),
                    )
                  }
                  maxLength={200}
                />
              </label>
              <RichTextEditor
                id={`ai-expertise-${item.key}`}
                label={t('admin.ai_services.accordion_contents')}
                value={item.contents}
                onChange={(value) =>
                  setExpertiseAccordion((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, contents: value } : row,
                    ),
                  )
                }
              />
            </>
          )}
        </RepeatableSection>
        <RichTextEditor
          id="ai-expertise-accordion-description"
          label={t('admin.ai_services.ai_expertise_accordion_description')}
          value={expertiseAccordionDescription}
          onChange={setExpertiseAccordionDescription}
        />
        <MultiSelect
          id="ai-solutions"
          label={t('admin.ai_services.solutions_sections')}
          manageHref={adminListHref('solution_details')}
          options={solutionOptions}
          selectedIds={solutionIds}
          onChange={setSolutionIds}
        />
        <label>
          {t('admin.ai_services.faq_title')}
          <input
            value={faqTitle}
            onChange={(event) => setFaqTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <RichTextEditor
          id="ai-faq-description"
          label={t('admin.ai_services.faq_description')}
          value={faqDescription}
          onChange={setFaqDescription}
        />
        <RepeatableSection
          title={t('admin.ai_services.faq_accordion')}
          addLabel={t('admin.ai_services.add_item')}
          removeLabel={t('admin.ai_services.remove_item')}
          items={faqAccordion}
          itemTitle={(item, index) =>
            item.title.trim() || `${t('admin.ai_services.item')} ${index + 1}`
          }
          onAdd={() => setFaqAccordion((rows) => [...rows, emptyAccordion()])}
          onRemove={(key) => setFaqAccordion((rows) => rows.filter((row) => row.key !== key))}
        >
          {(item, index) => (
            <>
              <label>
                {t('admin.ai_services.accordion_title')}
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
                id={`ai-faq-${item.key}`}
                label={t('admin.ai_services.accordion_contents')}
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
            {t('admin.ai_services.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.ai_services.save')}
          </button>
          {status === 'publish' ? (
            <button type="button" disabled={saving} onClick={() => persist('draft').catch(() => undefined)}>
              {t('admin.ai_services.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={saving || !canPublish}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.ai_services.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
