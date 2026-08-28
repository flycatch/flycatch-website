import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createSolutionDetail,
  getSolutionDetail,
  slugify,
  updateSolutionDetail,
  uploadMedia,
  type SolutionDetailWrite,
} from '../lib/admin-api';
import { hydrateRichText, persistRichText } from '../lib/rich-text';
import FormPageHeader from './FormPageHeader';
import MediaField from './MediaField';
import RepeatableSection from './RepeatableSection';
import RichTextEditor from './RichTextEditor';
import SeoFields, { emptySeo, seoValue, type ContentSeoValue } from './SeoFields';
import { t } from '../lib/i18n';

interface Props {
  detailId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function nextKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type TypeDraft = {
  key: string;
  title: string;
  order: number;
  description: string;
  image_key: string | null;
  imageFile: File | null;
};

type HeadingDraft = { key: string; title: string; order: number; color: string };

type IconDraft = { key: string; icon_key: string | null; iconFile: File | null };

function emptyType(): TypeDraft {
  return { key: nextKey(), title: '', order: 0, description: '', image_key: null, imageFile: null };
}

function emptyHeading(): HeadingDraft {
  return { key: nextKey(), title: '', order: 0, color: '#000000' };
}

function emptyIcon(): IconDraft {
  return { key: nextKey(), icon_key: null, iconFile: null };
}

function hex(value: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000';
}

async function uploadKey(file: File | null, current: string | null): Promise<string | null> {
  if (file) return (await uploadMedia(file)).key;
  return current;
}

async function mapTypes(
  types:
    | { title?: string; order?: number; description?: string; image_key?: string | null }[]
    | undefined,
): Promise<TypeDraft[]> {
  const rows = types?.length ? types : [{ title: '', order: 0, description: '' }];
  return Promise.all(
    rows.map(async (type) => ({
      key: nextKey(),
      title: type.title || '',
      order: type.order ?? 0,
      description: await hydrateRichText(type.description || ''),
      image_key: type.image_key ?? null,
      imageFile: null,
    })),
  );
}

async function persistTypes(types: TypeDraft[]) {
  return Promise.all(
    types.map(async (type) => ({
      title: type.title.trim(),
      order: Math.max(0, Number(type.order) || 0),
      description: persistRichText(type.description),
      image_key: await uploadKey(type.imageFile, type.image_key),
    })),
  );
}

export default function SolutionDetailForm({ detailId, canPublish, onCancel, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubTitle, setBannerSubTitle] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [intros, setIntros] = useState<HeadingDraft[]>([emptyHeading()]);
  const [introDescription, setIntroDescription] = useState('');
  const [introIcons, setIntroIcons] = useState<IconDraft[]>([emptyIcon()]);
  const [introSubTitle, setIntroSubTitle] = useState('');
  const [introSubDescription, setIntroSubDescription] = useState('');
  const [introImageKey, setIntroImageKey] = useState<string | null>(null);
  const [introImageFile, setIntroImageFile] = useState<File | null>(null);
  const [challenges, setChallenges] = useState<HeadingDraft[]>([emptyHeading()]);
  const [challengesDescription, setChallengesDescription] = useState('');
  const [challengesImageKey, setChallengesImageKey] = useState<string | null>(null);
  const [challengesImageFile, setChallengesImageFile] = useState<File | null>(null);
  const [challengesName, setChallengesName] = useState('');
  const [challengesPosition, setChallengesPosition] = useState('');
  const [challengeTypes, setChallengeTypes] = useState<TypeDraft[]>([emptyType()]);
  const [benefitsDescription, setBenefitsDescription] = useState('');
  const [benefits, setBenefits] = useState<HeadingDraft[]>([emptyHeading()]);
  const [benefitTypes, setBenefitTypes] = useState<TypeDraft[]>([emptyType()]);
  const [solutionsTitle, setSolutionsTitle] = useState('');
  const [solutionsDescription, setSolutionsDescription] = useState('');
  const [solutionsImageKey, setSolutionsImageKey] = useState<string | null>(null);
  const [solutionsImageFile, setSolutionsImageFile] = useState<File | null>(null);
  const [ctaTitle, setCtaTitle] = useState('');
  const [ctaDescription, setCtaDescription] = useState('');
  const [ctaButtonName, setCtaButtonName] = useState('');
  const [seo, setSeo] = useState<ContentSeoValue>(emptySeo);
  const [seoImageFile, setSeoImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!detailId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detailId) return;
    getSolutionDetail(detailId)
      .then(async (item) => {
        setTitle(item.title);
        setSlug(item.slug);
        setSlugManual(true);
        setBannerTitle(item.banner?.title || '');
        setBannerSubTitle(item.banner?.sub_title || '');
        setIndustryType(item.banner?.industry_type || '');
        setBannerKey(item.banner?.image_key ?? null);
        const introItems = item.introduction?.items?.length
          ? item.introduction.items
          : [{ title: '', order: 0, color: '' }];
        setIntros(
          introItems.map((row) => ({
            key: nextKey(),
            title: row.title || '',
            order: row.order ?? 0,
            color: row.color || '#000000',
          })),
        );
        setIntroDescription(item.introduction?.description || '');
        const iconKeys = item.introduction?.icon_keys || [];
        setIntroIcons(
          iconKeys.length
            ? iconKeys.map((icon_key) => ({ key: nextKey(), icon_key, iconFile: null }))
            : [emptyIcon()],
        );
        setIntroSubTitle(item.introduction?.sub_title || '');
        setIntroSubDescription(await hydrateRichText(item.introduction?.sub_description || ''));
        setIntroImageKey(item.introduction?.image_key ?? null);
        const challengeItems = item.challenges?.items?.length
          ? item.challenges.items
          : [{ title: '', order: 0, color: '' }];
        setChallenges(
          challengeItems.map((row) => ({
            key: nextKey(),
            title: row.title || '',
            order: row.order ?? 0,
            color: row.color || '#000000',
          })),
        );
        setChallengesDescription(await hydrateRichText(item.challenges?.description || ''));
        setChallengesImageKey(item.challenges?.image_key ?? null);
        setChallengesName(item.challenges?.name || '');
        setChallengesPosition(item.challenges?.position || '');
        setChallengeTypes(await mapTypes(item.challenges?.types));
        setBenefitsDescription(item.benefits?.description || '');
        const benefitItems = item.benefits?.items?.length
          ? item.benefits.items
          : [{ title: '', order: 0, color: '' }];
        setBenefits(
          benefitItems.map((row) => ({
            key: nextKey(),
            title: row.title || '',
            order: row.order ?? 0,
            color: row.color || '#000000',
          })),
        );
        setBenefitTypes(await mapTypes(item.benefits?.types));
        setSolutionsTitle(item.solutions_section?.title || '');
        setSolutionsDescription(item.solutions_section?.description || '');
        setSolutionsImageKey(item.solutions_section?.image_key ?? null);
        setCtaTitle(item.cta?.title || '');
        setCtaDescription(item.cta?.description || '');
        setCtaButtonName(item.cta?.button_name || '');
        setSeo(seoValue(item.seo as ContentSeoValue | undefined));
        setStatus(item.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [detailId]);

  async function persist(nextStatus: 'draft' | 'publish') {
    setError(null);
    if (!title.trim()) {
      setError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      const payload: SolutionDetailWrite = {
        title: title.trim(),
        slug: slugify(slug) || slugify(title),
        banner: {
          image_key: await uploadKey(bannerFile, bannerKey),
          title: bannerTitle.trim(),
          sub_title: bannerSubTitle.trim(),
          industry_type: industryType.trim(),
        },
        introduction: {
          items: intros.map((item) => ({
            title: item.title.trim(),
            order: Math.max(0, Number(item.order) || 0),
            color: item.color.trim(),
          })),
          description: introDescription.trim(),
          icon_keys: (
            await Promise.all(introIcons.map((item) => uploadKey(item.iconFile, item.icon_key)))
          ).filter((key): key is string => Boolean(key)),
          sub_title: introSubTitle.trim(),
          sub_description: persistRichText(introSubDescription),
          image_key: await uploadKey(introImageFile, introImageKey),
        },
        challenges: {
          items: challenges.map((item) => ({
            title: item.title.trim(),
            order: Math.max(0, Number(item.order) || 0),
            color: item.color.trim(),
          })),
          description: persistRichText(challengesDescription),
          image_key: await uploadKey(challengesImageFile, challengesImageKey),
          name: challengesName.trim(),
          position: challengesPosition.trim(),
          types: await persistTypes(challengeTypes),
        },
        benefits: {
          description: benefitsDescription.trim(),
          items: benefits.map((item) => ({
            title: item.title.trim(),
            order: Math.max(0, Number(item.order) || 0),
            color: item.color.trim(),
          })),
          types: await persistTypes(benefitTypes),
        },
        solutions_section: {
          title: solutionsTitle.trim(),
          image_key: await uploadKey(solutionsImageFile, solutionsImageKey),
          description: solutionsDescription.trim(),
        },
        cta: {
          title: ctaTitle.trim(),
          description: ctaDescription.trim(),
          button_name: ctaButtonName.trim(),
        },
        seo: {
          ...seo,
          image_key: await uploadKey(seoImageFile, seo.image_key),
        },
        status: nextStatus,
      };
      if (detailId) await updateSolutionDetail(detailId, payload);
      else await createSolutionDetail(payload);
      onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  function colorField(value: string, onChange: (next: string) => void) {
    return (
      <label>
        {t('admin.solution_details.color')}
        <input type="color" value={hex(value)} onChange={(event) => onChange(event.target.value)} />
        <input value={value} onChange={(event) => onChange(event.target.value)} maxLength={20} autoComplete="off" />
      </label>
    );
  }

  function headingFields(
    item: HeadingDraft,
    onPatch: (next: Partial<HeadingDraft>) => void,
  ) {
    return (
      <>
        <label>
          {t('admin.solution_details.field.title')}
          <input value={item.title} onChange={(event) => onPatch({ title: event.target.value })} maxLength={200} />
        </label>
        <label>
          {t('admin.solution_details.order')}
          <input
            type="number"
            min={0}
            value={item.order}
            onChange={(event) => onPatch({ order: Math.max(0, Number(event.target.value) || 0) })}
          />
        </label>
        {colorField(item.color, (color) => onPatch({ color }))}
      </>
    );
  }

  function typeEditor(types: TypeDraft[], setTypes: (next: TypeDraft[]) => void) {
    return (
      <RepeatableSection
        title={t('admin.solution_details.types')}
        addLabel={t('admin.solution_details.add_type')}
        removeLabel={t('admin.solution_details.remove_type')}
        items={types}
        itemTitle={(item, index) => item.title.trim() || `${t('admin.solution_details.type_item')} ${index + 1}`}
        onAdd={() => setTypes([...types, emptyType()])}
        onRemove={(key) => setTypes(types.filter((item) => item.key !== key))}
      >
        {(item) => (
          <>
            <label>
              {t('admin.solution_details.field.title')}
              <input
                value={item.title}
                onChange={(event) =>
                  setTypes(types.map((row) => (row.key === item.key ? { ...row, title: event.target.value } : row)))
                }
                maxLength={200}
              />
            </label>
            <label>
              {t('admin.solution_details.order')}
              <input
                type="number"
                min={0}
                value={item.order}
                onChange={(event) =>
                  setTypes(
                    types.map((row) =>
                      row.key === item.key ? { ...row, order: Math.max(0, Number(event.target.value) || 0) } : row,
                    ),
                  )
                }
              />
            </label>
            <RichTextEditor
              id={`type-desc-${item.key}`}
              label={t('admin.solution_details.field.description')}
              value={item.description}
              onChange={(value) =>
                setTypes(types.map((row) => (row.key === item.key ? { ...row, description: value } : row)))
              }
            />
            <MediaField
              label={t('admin.solution_details.field.image')}
              alt={item.title}
              storedKey={item.image_key}
              file={item.imageFile}
              onFile={(file) =>
                setTypes(types.map((row) => (row.key === item.key ? { ...row, imageFile: file } : row)))
              }
              onClear={() =>
                setTypes(
                  types.map((row) =>
                    row.key === item.key ? { ...row, imageFile: null, image_key: null } : row,
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
      <FormPageHeader
        title={detailId ? t('admin.solution_details.edit') : t('admin.solution_details.add')}
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
          {t('admin.solution_details.field.title')}
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugManual) setSlug(slugify(event.target.value));
            }}
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.solution_details.slug')}
          <input
            value={slug}
            onChange={(event) => {
              setSlugManual(true);
              setSlug(event.target.value);
            }}
            maxLength={128}
            autoComplete="off"
          />
        </label>
        <fieldset>
          <legend>{t('admin.solution_details.banner')}</legend>
          <MediaField
            label={t('admin.solution_details.field.image')}
            alt={bannerTitle}
            storedKey={bannerKey}
            file={bannerFile}
            onFile={setBannerFile}
            onClear={() => {
              setBannerFile(null);
              setBannerKey(null);
            }}
          />
          <label>
            {t('admin.solution_details.field.title')}
            <input value={bannerTitle} onChange={(event) => setBannerTitle(event.target.value)} maxLength={200} />
          </label>
          <label>
            {t('admin.solution_details.sub_title')}
            <input value={bannerSubTitle} onChange={(event) => setBannerSubTitle(event.target.value)} maxLength={200} />
          </label>
          <label>
            {t('admin.solution_details.industry_type')}
            <input value={industryType} onChange={(event) => setIndustryType(event.target.value)} maxLength={120} />
          </label>
        </fieldset>
        <fieldset>
          <legend>{t('admin.solution_details.introduction')}</legend>
          <RepeatableSection
            addLabel={t('admin.solution_details.add_item')}
            removeLabel={t('admin.solution_details.remove_item')}
            items={intros}
            itemTitle={(item, index) =>
              item.title.trim() || `${t('admin.solution_details.item')} ${index + 1}`
            }
            onAdd={() => setIntros((current) => [...current, emptyHeading()])}
            onRemove={(key) => setIntros((current) => current.filter((item) => item.key !== key))}
          >
            {(item) =>
              headingFields(item, (next) =>
                setIntros((current) => current.map((row) => (row.key === item.key ? { ...row, ...next } : row))),
              )
            }
          </RepeatableSection>
          <label>
            {t('admin.solution_details.field.description')}
            <textarea
              value={introDescription}
              onChange={(event) => setIntroDescription(event.target.value)}
              rows={3}
            />
          </label>
          <div>
            <p>{t('admin.solution_details.icons')}</p>
            {introIcons.map((item, index) => (
              <div key={item.key}>
                <MediaField
                  label={`${t('admin.solution_details.icon')} ${index + 1}`}
                  alt={t('admin.solution_details.icon')}
                  storedKey={item.icon_key}
                  file={item.iconFile}
                  onFile={(file) =>
                    setIntroIcons((current) =>
                      current.map((row) => (row.key === item.key ? { ...row, iconFile: file } : row)),
                    )
                  }
                  onClear={() =>
                    setIntroIcons((current) =>
                      current.map((row) =>
                        row.key === item.key ? { ...row, iconFile: null, icon_key: null } : row,
                      ),
                    )
                  }
                />
                {introIcons.length > 1 ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setIntroIcons((current) => current.filter((row) => row.key !== item.key))}
                  >
                    {t('admin.solution_details.remove_item')}
                  </button>
                ) : null}
              </div>
            ))}
            <button type="button" onClick={() => setIntroIcons((current) => [...current, emptyIcon()])}>
              {t('admin.solution_details.add_icon')}
            </button>
          </div>
          <label>
            {t('admin.solution_details.sub_title')}
            <input value={introSubTitle} onChange={(event) => setIntroSubTitle(event.target.value)} maxLength={200} />
          </label>
          <RichTextEditor
            id="intro-sub-description"
            label={t('admin.solution_details.sub_description')}
            value={introSubDescription}
            onChange={setIntroSubDescription}
          />
          <MediaField
            label={t('admin.solution_details.field.image')}
            alt={introSubTitle}
            storedKey={introImageKey}
            file={introImageFile}
            onFile={setIntroImageFile}
            onClear={() => {
              setIntroImageFile(null);
              setIntroImageKey(null);
            }}
          />
        </fieldset>
        <fieldset>
          <legend>{t('admin.solution_details.challenges')}</legend>
          <RepeatableSection
            addLabel={t('admin.solution_details.add_item')}
            removeLabel={t('admin.solution_details.remove_item')}
            items={challenges}
            itemTitle={(item, index) =>
              item.title.trim() || `${t('admin.solution_details.item')} ${index + 1}`
            }
            onAdd={() => setChallenges((current) => [...current, emptyHeading()])}
            onRemove={(key) => setChallenges((current) => current.filter((item) => item.key !== key))}
          >
            {(item) =>
              headingFields(item, (next) =>
                setChallenges((current) => current.map((row) => (row.key === item.key ? { ...row, ...next } : row))),
              )
            }
          </RepeatableSection>
          {typeEditor(challengeTypes, setChallengeTypes)}
          <RichTextEditor
            id="challenges-description"
            label={t('admin.solution_details.field.description')}
            value={challengesDescription}
            onChange={setChallengesDescription}
          />
          <MediaField
            label={t('admin.solution_details.field.image')}
            alt={challengesName}
            storedKey={challengesImageKey}
            file={challengesImageFile}
            onFile={setChallengesImageFile}
            onClear={() => {
              setChallengesImageFile(null);
              setChallengesImageKey(null);
            }}
          />
          <label>
            {t('admin.solution_details.name')}
            <input value={challengesName} onChange={(event) => setChallengesName(event.target.value)} maxLength={200} />
          </label>
          <label>
            {t('admin.solution_details.position')}
            <input
              value={challengesPosition}
              onChange={(event) => setChallengesPosition(event.target.value)}
              maxLength={200}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>{t('admin.solution_details.benefits')}</legend>
          <RepeatableSection
            addLabel={t('admin.solution_details.add_item')}
            removeLabel={t('admin.solution_details.remove_item')}
            items={benefits}
            itemTitle={(item, index) =>
              item.title.trim() || `${t('admin.solution_details.item')} ${index + 1}`
            }
            onAdd={() => setBenefits((current) => [...current, emptyHeading()])}
            onRemove={(key) => setBenefits((current) => current.filter((item) => item.key !== key))}
          >
            {(item) =>
              headingFields(item, (next) =>
                setBenefits((current) => current.map((row) => (row.key === item.key ? { ...row, ...next } : row))),
              )
            }
          </RepeatableSection>
          {typeEditor(benefitTypes, setBenefitTypes)}
          <label>
            {t('admin.solution_details.field.description')}
            <textarea
              value={benefitsDescription}
              onChange={(event) => setBenefitsDescription(event.target.value)}
              rows={3}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>{t('admin.solution_details.solutions_section')}</legend>
          <label>
            {t('admin.solution_details.solution_title')}
            <input value={solutionsTitle} onChange={(event) => setSolutionsTitle(event.target.value)} maxLength={200} />
          </label>
          <MediaField
            label={t('admin.solution_details.solution_image')}
            alt={solutionsTitle}
            storedKey={solutionsImageKey}
            file={solutionsImageFile}
            onFile={setSolutionsImageFile}
            onClear={() => {
              setSolutionsImageFile(null);
              setSolutionsImageKey(null);
            }}
          />
          <label>
            {t('admin.solution_details.solution_description')}
            <textarea
              value={solutionsDescription}
              onChange={(event) => setSolutionsDescription(event.target.value)}
              rows={3}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>{t('admin.solution_details.cta')}</legend>
          <label>
            {t('admin.solution_details.field.title')}
            <input value={ctaTitle} onChange={(event) => setCtaTitle(event.target.value)} maxLength={200} />
          </label>
          <label>
            {t('admin.solution_details.field.description')}
            <textarea value={ctaDescription} onChange={(event) => setCtaDescription(event.target.value)} rows={3} />
          </label>
          <label>
            {t('admin.solution_details.button_name')}
            <input
              value={ctaButtonName}
              onChange={(event) => setCtaButtonName(event.target.value)}
              maxLength={200}
            />
          </label>
        </fieldset>
        <SeoFields value={seo} imageFile={seoImageFile} onChange={setSeo} onImageFile={setSeoImageFile} />
        {error && (
          <p className="alert alert-error error" role="alert">
            {error}
          </p>
        )}
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t('admin.solution_details.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.solution_details.save')}
          </button>
          {status === 'publish' ? (
            <button type="button" disabled={saving} onClick={() => persist('draft').catch(() => undefined)}>
              {t('admin.solution_details.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={saving || !canPublish}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.solution_details.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
