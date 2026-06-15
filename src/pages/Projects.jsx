import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as projectsApi from '../api/projects.js';
import { fromApiDateTime, toApiDateTime } from '../utils/dateTimeApi.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ProjectImagesEditor } from '../components/ProjectImagesEditor.jsx';
import { SkillPicker } from '../components/SkillPicker.jsx';
import * as skillsApi from '../api/skills.js';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { SortableTable } from '../components/SortableTable.jsx';

const emptyCreate = () => ({
  title: '',
  section: '',
  summary: '',
  body: '',
  images: [],
  skillIds: [],
  visibleToAnonymous: true,
  publishedFrom: '',
  publishedTo: '',
});

export function Projects() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [reordering, setReordering] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [skillsOptions, setSkillsOptions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: skillsRes } = await skillsApi.filterSkills({}, 0, 500, ['id,asc']);
        setSkillsOptions(skillsRes?.data ?? []);
      } catch {
        setSkillsOptions([]);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await projectsApi.listProjects(searchQuery || undefined);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const payload = {
        title: createForm.title.trim(),
        section: createForm.section.trim() || undefined,
        summary: createForm.summary.trim() || undefined,
        body: createForm.body.trim() || undefined,
        images: (createForm.images ?? [])
          .map((img, index) => ({
            imagePath: img.imagePath?.trim() || undefined,
            imageUrl: img.imageUrl?.trim() || undefined,
            sortOrder: index,
          }))
          .filter((img) => img.imagePath || img.imageUrl),
        skillIds: (createForm.skillIds ?? []).map(Number).filter((id) => !Number.isNaN(id)),
        visibleToAnonymous: createForm.visibleToAnonymous,
        publishedFrom: toApiDateTime(createForm.publishedFrom),
        publishedTo: toApiDateTime(createForm.publishedTo),
      };
      await projectsApi.createProject(payload);
      setCreateForm(emptyCreate());
      setCreating(false);
      setMsg({ type: 'ok', text: 'Проект создан' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить проект?')) return;
    setMsg(null);
    try {
      await projectsApi.deleteProject(id);
      setMsg({ type: 'ok', text: 'Проект удалён' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleVisibleToggle(project, checked) {
    setMsg(null);
    try {
      await projectsApi.updateProject(project.id, { visibleToAnonymous: checked });
      setRows((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, visibleToAnonymous: checked } : p)),
      );
      setMsg({ type: 'ok', text: 'Видимость на главной обновлена' });
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleReorder(orderedIds) {
    const byId = new Map(rows.map((p) => [String(p.id), p]));
    const next = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
    setRows(next);
    setReordering(true);
    setError(null);
    try {
      await projectsApi.reorderProjects(orderedIds);
      setMsg({ type: 'ok', text: 'Порядок сохранён' });
    } catch (e) {
      setError(e.message);
      await load();
    } finally {
      setReordering(false);
    }
  }

  const flashError = msg?.type === 'err' ? msg.text : error;

  return (
    <div className="page projects-admin">
      <PageHeader
        title="Проекты ленты"
        lead="Кейсы и работы студентов на главной странице сайта. Порядок, публикация и привязка участников."
      />

      <div className="panel panel--accent projects-admin__create-panel">
        <div className="projects-admin__panel-head">
          <h2 className="panel__title">Создание</h2>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? 'Скрыть форму' : 'Новый проект'}
          </button>
        </div>
        {creating ? (
          <form className="projects-admin__create-form" onSubmit={handleCreate}>
            <div className="form-row">
              <div className="field">
                <label>Заголовок</label>
                <input
                  required
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Раздел</label>
                <input
                  value={createForm.section}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, section: e.target.value }))
                  }
                  placeholder="Например: Веб-разработка"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Краткое описание</label>
                <input
                  value={createForm.summary}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, summary: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Полный текст</label>
              <textarea
                rows={4}
                value={createForm.body}
                onChange={(e) => setCreateForm((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Галерея</label>
              <ProjectImagesEditor
                images={createForm.images}
                onChange={(images) => setCreateForm((p) => ({ ...p, images }))}
              />
            </div>
            <div className="field skill-picker-field">
              <label>Навыки</label>
              <SkillPicker
                options={skillsOptions}
                selectedIds={createForm.skillIds ?? []}
                onChange={(skillIds) => setCreateForm((p) => ({ ...p, skillIds }))}
              />
            </div>
            <div className="form-row">
              <div className="field projects-admin__checkbox-field">
                <label className="projects-admin__checkbox-label">
                  <input
                    type="checkbox"
                    checked={createForm.visibleToAnonymous}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        visibleToAnonymous: e.target.checked,
                      }))
                    }
                  />
                  Показывать на главной
                </label>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Публикация с</label>
                <input
                  type="datetime-local"
                  value={createForm.publishedFrom}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, publishedFrom: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Публикация до</label>
                <input
                  type="datetime-local"
                  value={createForm.publishedTo}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, publishedTo: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="projects-admin__form-actions">
              <button type="submit" className="btn btn--primary">
                Создать
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <FlashMessages
        success={msg?.type === 'ok' ? msg.text : null}
        error={flashError}
      />

      <div className="panel projects-admin__list-panel">
        <div className="projects-admin__panel-head">
          <h2 className="panel__title">
            Список
            {reordering ? <span className="projects-admin__reorder-hint">сохранение…</span> : null}
            {!loading && rows.length > 0 ? (
              <span className="projects-admin__count">{rows.length}</span>
            ) : null}
          </h2>
          <div className="field projects-admin__search">
            <label htmlFor="projects-search">Поиск</label>
            <input
              id="projects-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Название, описание или раздел…"
            />
          </div>
        </div>
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <p className="projects-admin__empty">
            {searchQuery ? 'По запросу ничего не найдено.' : 'Проектов пока нет — создайте первый.'}
          </p>
        ) : (
          <SortableTable
            items={rows}
            disabled={reordering}
            onReorder={handleReorder}
            headerCells={
              <>
                <th>#</th>
                <th>Заголовок</th>
                <th>Раздел</th>
                <th>Навыки</th>
                <th>На главной</th>
                <th>Публикация</th>
              </>
            }
            extraHeaderCells={<th />}
            renderCells={(p) => (
              <>
                <td className="cell-mono">{p.sortOrder}</td>
                <td className="projects-admin__title-cell">{p.title}</td>
                <td className="cell-muted">{p.section || '—'}</td>
                <td>
                  <div className="project-table-skills">
                    {(p.skills ?? []).length ? (
                      p.skills.map((s) => (
                        <span key={s.id} className="project-table-skills__tag">
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="project-table-skills__empty">—</span>
                    )}
                  </div>
                </td>
                <td>
                  <label className="projects-admin__visibility">
                    <input
                      type="checkbox"
                      className="projects-admin__visibility-input"
                      checked={!!p.visibleToAnonymous}
                      onChange={(e) => handleVisibleToggle(p, e.target.checked)}
                    />
                    <StatusBadge variant={p.visibleToAnonymous ? 'success' : 'default'}>
                      {p.visibleToAnonymous ? 'на главной' : 'скрыт'}
                    </StatusBadge>
                  </label>
                </td>
                <td className="cell-muted projects-admin__dates-cell">
                  <span>{fromApiDateTime(p.publishedFrom) || '—'}</span>
                  <span className="projects-admin__dates-sep">—</span>
                  <span>{fromApiDateTime(p.publishedTo) || '—'}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link className="btn btn--ghost" to={`/projects/${p.id}`}>
                      Открыть
                    </Link>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
}
