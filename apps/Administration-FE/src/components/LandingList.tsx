import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteLanding,
  listLandings,
  type LandingListPayload,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import type { LandingSection } from '../lib/landing-sections';
import TableLogo from './TableLogo';

interface Props {
  section: LandingSection;
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

function snippet(value: string): string {
  const text = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

export default function LandingList({ section, onAdd, onEdit, notice }: Props) {
  const ns = section.ns;
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LandingListPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      setData(await listLandings(section.path, nextQuery, nextPage));
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

  useEffect(() => {
    load(appliedQuery, page).catch(() => undefined);
  }, [appliedQuery, page, section.path]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  }

  async function confirmDelete() {
    if (!pendingId) return;
    try {
      await deleteLanding(section.path, pendingId);
      setPendingId(null);
      dialogRef.current?.close();
      await load(appliedQuery, page);
    } catch (caught) {
      dialogRef.current?.close();
      setPendingId(null);
      setError(apiErrorMessage(caught));
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;
  const loading = data === null && !error;

  return (
    <section className="roles-page">
      <div className="roles-toolbar">
        <h2>{t(`${ns}.title`)}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t(`${ns}.add`)}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t(`${ns}.search`)}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t(`${ns}.search.submit`)}</button>
      </form>
      {error && (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          {t('admin.workspace.loading')}
        </p>
      ) : (
        <>
          <table className="roles-table">
            <thead>
              <tr>
                <th scope="col">{t(`${ns}.id`)}</th>
                <th scope="col">{t(`${ns}.banner_title`)}</th>
                <th scope="col">{t(`${ns}.banner_image`)}</th>
                {section.listColumns.includes('introduction_title') && (
                  <th scope="col">{t(`${ns}.introduction_title`)}</th>
                )}
                {section.listColumns.includes('introduction_first') && (
                  <th scope="col">{t(`${ns}.introduction_first`)}</th>
                )}
                {section.listColumns.includes('seo') && <th scope="col">{t(`${ns}.seo`)}</th>}
                {section.listColumns.includes('locale') && (
                  <th scope="col">{t(`${ns}.content_available_in`)}</th>
                )}
                <th scope="col">{t(`${ns}.state`)}</th>
                <th scope="col">{t(`${ns}.actions`)}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item, index) => (
                <tr key={item.id}>
                  <td data-label={t(`${ns}.id`)}>{(data.page - 1) * data.per_page + index + 1}</td>
                  <td data-label={t(`${ns}.banner_title`)}>{item.banner_title}</td>
                  <td data-label={t(`${ns}.banner_image`)}>
                    <TableLogo mediaKey={item.banner_image_key} alt={item.banner_title} />
                  </td>
                  {section.listColumns.includes('introduction_title') && (
                    <td data-label={t(`${ns}.introduction_title`)}>{item.introduction_title}</td>
                  )}
                  {section.listColumns.includes('introduction_first') && (
                    <td data-label={t(`${ns}.introduction_first`)} className="table-review-cell">
                      {snippet(item.introduction_first_paragraph || '')}
                    </td>
                  )}
                  {section.listColumns.includes('seo') && (
                    <td data-label={t(`${ns}.seo`)} className="table-review-cell">
                      {snippet(item.seo || '')}
                    </td>
                  )}
                  {section.listColumns.includes('locale') && (
                    <td data-label={t(`${ns}.content_available_in`)}>
                      {item.content_available_in}
                    </td>
                  )}
                  <td data-label={t(`${ns}.state`)}>
                    {item.state === 'publish' ? t(`${ns}.status.publish`) : t(`${ns}.status.draft`)}
                  </td>
                  <td data-label={t(`${ns}.actions`)} className="roles-row-actions">
                    <button type="button" onClick={() => onEdit(item.id)}>
                      {t(`${ns}.edit_action`)}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        setPendingId(item.id);
                        dialogRef.current?.showModal();
                      }}
                    >
                      {t(`${ns}.delete_action`)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.items.length === 0 && (
            <p className="roles-empty empty-state">{t(`${ns}.empty`)}</p>
          )}
          {data && data.total > data.per_page && (
            <nav className="roles-pagination" aria-label={t(`${ns}.title`)}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                {t(`${ns}.previous`)}
              </button>
              <span>
                {t(`${ns}.page`)} {data.page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                {t(`${ns}.next`)}
              </button>
            </nav>
          )}
        </>
      )}
      <dialog ref={dialogRef}>
        <h3>{t(`${ns}.delete.confirm`)}</h3>
        <p>{t(`${ns}.delete.confirm_body`)}</p>
        <div className="actions">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            {t(`${ns}.delete.cancel`)}
          </button>
          <button type="button" className="danger" onClick={() => confirmDelete()}>
            {t(`${ns}.delete_action`)}
          </button>
        </div>
      </dialog>
    </section>
  );
}
