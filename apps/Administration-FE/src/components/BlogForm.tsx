import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  createBlog,
  getBlog,
  listAuthors,
  listCategories,
  slugify,
  updateBlog,
  uploadMedia,
  apiErrorMessage,
  type Author,
  type BlogWrite,
  type Category,
} from '../lib/admin-api';
import MultiSelect from './MultiSelect';
import { t } from '../lib/i18n';

interface Props {
  blogId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

function applyFormat(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export default function BlogForm({ blogId, onCancel, onSaved }: Props) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [readingTime, setReadingTime] = useState(0);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [designation, setDesignation] = useState('');
  const [writerImageKeys, setWriterImageKeys] = useState<string[]>([]);
  const [writerFiles, setWriterFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [nextAuthors, nextCategories] = await Promise.all([listAuthors(), listCategories()]);
      setAuthors(nextAuthors.items);
      setCategories(nextCategories.items);
      if (blogId) {
        const blog = await getBlog(blogId);
        setTitle(blog.title);
        setSlug(blog.slug);
        setSlugManual(true);
        setDescription(blog.description);
        setBody(blog.body);
        setStatus(blog.status);
        setReadingTime(blog.reading_time);
        setImageKey(blog.image_key);
        setImageAlt(blog.image_alt);
        setAuthorIds(blog.author_ids);
        setCategoryIds(blog.category_ids);
        setCanonicalUrl(blog.canonical_url);
        setFacebook(blog.facebook);
        setLinkedin(blog.linkedin);
        setTwitter(blog.twitter);
        setInstagram(blog.instagram);
        setFullName(blog.full_name);
        setBio(blog.bio);
        setDesignation(blog.designation);
        setWriterImageKeys(blog.writer_image_keys);
      }
      setReady(true);
    }
    load().catch(() => {
      setError(t('admin.workspace.request_failed'));
      setReady(true);
    });
  }, [blogId]);

  useEffect(() => {
    if (ready && bodyRef.current) {
      bodyRef.current.innerHTML = body;
    }
  }, [ready, blogId]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugManual) setSlug(slugify(value));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    if (!title.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    const nextSlug = slugify(slug) || slugify(title);
    if (!nextSlug) {
      setFieldError(t('admin.blogs.slug.invalid'));
      return;
    }
    setSaving(true);
    try {
      let nextImageKey = imageKey;
      if (imageFile) {
        nextImageKey = (await uploadMedia(imageFile)).key;
      }
      const extraWriterKeys = [];
      for (const file of writerFiles) {
        extraWriterKeys.push((await uploadMedia(file)).key);
      }
      const payload: BlogWrite = {
        title: title.trim(),
        slug: nextSlug,
        description: description.trim(),
        body: bodyRef.current?.innerHTML || body,
        status,
        reading_time: Number.isFinite(readingTime) ? Math.max(0, Math.trunc(readingTime)) : 0,
        image_key: nextImageKey,
        image_alt: imageAlt.trim(),
        canonical_url: canonicalUrl.trim(),
        facebook: facebook.trim(),
        linkedin: linkedin.trim(),
        twitter: twitter.trim(),
        instagram: instagram.trim(),
        full_name: fullName.trim(),
        bio: bio.trim(),
        designation: designation.trim(),
        writer_image_keys: [...writerImageKeys, ...extraWriterKeys],
        author_ids: authorIds,
        category_ids: categoryIds,
      };
      if (blogId) await updateBlog(blogId, payload);
      else await createBlog(payload);
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
        <h2>{blogId ? t('admin.blogs.edit') : t('admin.blogs.add')}</h2>
      </div>
      <form onSubmit={save}>
        <label>
          {t('admin.blogs.field.title')}
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.blogs.field.slug')}
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
          {t('admin.blogs.field.description')}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>
        <div className="rte-field">
          <p className="rte-label" id="blog-body-label">
            {t('admin.blogs.field.body')}
          </p>
          <div className="rte-toolbar" role="toolbar" aria-label={t('admin.blogs.field.body')}>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('bold')}>
              {t('admin.blogs.rte.bold')}
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat('italic')}
            >
              {t('admin.blogs.rte.italic')}
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const href = window.prompt(t('admin.blogs.rte.link_prompt'));
                if (href) applyFormat('createLink', href);
              }}
            >
              {t('admin.blogs.rte.link')}
            </button>
          </div>
          <div
            ref={bodyRef}
            className="rte-editor"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-labelledby="blog-body-label"
            onInput={() => setBody(bodyRef.current?.innerHTML || '')}
          />
        </div>
        <label>
          {t('admin.blogs.field.status')}
          <select value={status} onChange={(event) => setStatus(event.target.value as 'draft' | 'publish')}>
            <option value="draft">{t('admin.blogs.status.draft')}</option>
            <option value="publish">{t('admin.blogs.status.publish')}</option>
          </select>
        </label>
        <label>
          {t('admin.blogs.field.reading_time')}
          <input
            type="number"
            min={0}
            step={1}
            value={readingTime}
            onChange={(event) => setReadingTime(Number(event.target.value))}
          />
        </label>
        <label>
          {t('admin.blogs.field.image')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          />
        </label>
        {imageKey && !imageFile ? <p className="hint">{imageKey}</p> : null}
        <label>
          {t('admin.blogs.field.image_alt')}
          <input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={200} />
        </label>
        <MultiSelect
          id="blog-authors"
          label={t('admin.blogs.field.authors')}
          options={authors}
          selectedIds={authorIds}
          onChange={setAuthorIds}
        />
        <MultiSelect
          id="blog-categories"
          label={t('admin.blogs.field.categories')}
          options={categories}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
        />
        <label>
          {t('admin.blogs.field.canonical_url')}
          <input value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} />
        </label>
        <label>
          {t('admin.blogs.field.facebook')}
          <input value={facebook} onChange={(event) => setFacebook(event.target.value)} />
        </label>
        <label>
          {t('admin.blogs.field.linkedin')}
          <input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} />
        </label>
        <label>
          {t('admin.blogs.field.twitter')}
          <input value={twitter} onChange={(event) => setTwitter(event.target.value)} />
        </label>
        <label>
          {t('admin.blogs.field.instagram')}
          <input value={instagram} onChange={(event) => setInstagram(event.target.value)} />
        </label>
        <label>
          {t('admin.blogs.field.full_name')}
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={200} />
        </label>
        <label>
          {t('admin.blogs.field.bio')}
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} />
        </label>
        <label>
          {t('admin.blogs.field.writer_images')}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setWriterFiles(Array.from(event.target.files || []))}
          />
        </label>
        {writerImageKeys.length > 0 ? (
          <p className="hint">
            {t('admin.blogs.field.writer_images.saved')}: {writerImageKeys.length}
          </p>
        ) : null}
        <label>
          {t('admin.blogs.field.designation')}
          <input value={designation} onChange={(event) => setDesignation(event.target.value)} maxLength={200} />
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
            {t('admin.blogs.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.blogs.save')}
          </button>
        </div>
      </form>
    </section>
  );
}
