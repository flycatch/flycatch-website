import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createSolutionProduct,
  getSolutionProduct,
  slugify,
  updateSolutionProduct,
  uploadMedia,
  type SolutionProductWrite,
} from '../lib/admin-api';
import MediaPreview from './MediaPreview';
import { t } from '../lib/i18n';

interface Props {
  productId: string | null;
  canPublish: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

async function uploadKey(file: File | null, current: string | null): Promise<string | null> {
  if (file) return (await uploadMedia(file)).key;
  return current;
}

export default function SolutionProductForm({ productId, canPublish, onCancel, onSaved }: Props) {
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productTag, setProductTag] = useState('');
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [cardKey, setCardKey] = useState<string | null>(null);
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [cardOnRight, setCardOnRight] = useState(false);
  const [bannerOnRight, setBannerOnRight] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!productId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    getSolutionProduct(productId)
      .then((item) => {
        setProductTitle(item.product_title);
        setProductDescription(item.product_description);
        setProductTag(item.product_tag);
        setLogoKey(item.product_logo_key);
        setCardKey(item.product_card_image_key);
        setBannerKey(item.product_banner_image_key);
        setCardOnRight(item.card_image_on_right);
        setBannerOnRight(item.banner_image_on_right);
        setSlug(item.slug);
        setSlugManual(true);
        setOrder(item.order);
        setStatus(item.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [productId]);

  async function persist(nextStatus: 'draft' | 'publish') {
    setError(null);
    if (!productTitle.trim()) {
      setError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      const payload: SolutionProductWrite = {
        product_title: productTitle.trim(),
        product_description: productDescription.trim(),
        product_tag: productTag.trim(),
        product_logo_key: await uploadKey(logoFile, logoKey),
        product_card_image_key: await uploadKey(cardFile, cardKey),
        product_banner_image_key: await uploadKey(bannerFile, bannerKey),
        card_image_on_right: cardOnRight,
        banner_image_on_right: bannerOnRight,
        slug: slugify(slug) || slugify(productTitle),
        order: Math.max(0, Number(order) || 0),
        status: nextStatus,
      };
      if (productId) await updateSolutionProduct(productId, payload);
      else await createSolutionProduct(payload);
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
        <h2>{productId ? t('admin.solution_products.edit') : t('admin.solution_products.add')}</h2>
      </div>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          persist(status).catch(() => undefined);
        }}
      >
        <label>
          {t('admin.solution_products.product_title')}
          <input
            value={productTitle}
            onChange={(event) => {
              setProductTitle(event.target.value);
              if (!slugManual) setSlug(slugify(event.target.value));
            }}
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.solution_products.product_description')}
          <textarea
            value={productDescription}
            onChange={(event) => setProductDescription(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          {t('admin.solution_products.product_tag')}
          <input value={productTag} onChange={(event) => setProductTag(event.target.value)} maxLength={120} />
        </label>
        <label>
          {t('admin.solution_products.product_logo')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={logoFile ? [] : logoKey ? [logoKey] : []}
          files={logoFile ? [logoFile] : []}
          alt={t('admin.solution_products.product_logo')}
        />
        <label>
          {t('admin.solution_products.product_card_image')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setCardFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={cardFile ? [] : cardKey ? [cardKey] : []}
          files={cardFile ? [cardFile] : []}
          alt={t('admin.solution_products.product_card_image')}
        />
        <label>
          {t('admin.solution_products.product_banner_image')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
          />
        </label>
        <MediaPreview
          mediaKeys={bannerFile ? [] : bannerKey ? [bannerKey] : []}
          files={bannerFile ? [bannerFile] : []}
          alt={t('admin.solution_products.product_banner_image')}
        />
        <label className="checkbox-field">
          <input type="checkbox" checked={cardOnRight} onChange={(event) => setCardOnRight(event.target.checked)} />
          {t('admin.solution_products.card_image_on_right')}
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={bannerOnRight}
            onChange={(event) => setBannerOnRight(event.target.checked)}
          />
          {t('admin.solution_products.banner_image_on_right')}
        </label>
        <label>
          {t('admin.solution_products.slug')}
          <input
            value={slug}
            onChange={(event) => {
              setSlugManual(true);
              setSlug(event.target.value);
            }}
            maxLength={128}
          />
        </label>
        <label>
          {t('admin.solution_products.order')}
          <input
            type="number"
            min={0}
            value={order}
            onChange={(event) => setOrder(Math.max(0, Number(event.target.value) || 0))}
          />
        </label>
        {error && (
          <p className="alert alert-error error" role="alert">
            {error}
          </p>
        )}
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t('admin.solution_products.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.solution_products.save')}
          </button>
          {status === 'publish' ? (
            <button type="button" disabled={saving} onClick={() => persist('draft').catch(() => undefined)}>
              {t('admin.solution_products.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={saving || !canPublish}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.solution_products.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
