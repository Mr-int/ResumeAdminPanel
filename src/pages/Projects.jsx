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

  async function moveProject(index, direction) {
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    const copy = [...rows];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    setRows(copy);
    setReordering(true);
    setError(null);
    try {
      await projectsApi.reorderProjects(copy.map((p) => p.id));
      setMsg({ type: 'ok', text: 'Порядок сохранён' });
    } catch (e) {
      setError(e.message);
      await load();
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Проекты ленты"
        lead="Кейсы и работы студентов на главной странице сайта. Порядок, публикация и привязка участников."
      />

      <div className="panel">
        <h2 className="panel__title">Создание</h2>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setCreating((v) => !v)}
          style={{ marginBottom: creating ? '1rem' : 0 }}
        >
          {creating ? 'Скрыть форму' : 'Новый проект'}
        </button>
        {creating ? (
          <form onSubmit={handleCreate}>
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
              <div className="field">
                <label>
                  <input
                    type="checkbox"
                    checked={createForm.visibleToAnonymous}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        visibleToAnonymous: e.target.checked,
                      }))
                    }
                    style={{ marginRight: '0.35rem' }}
                  />
                  Виден анонимам
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
            <button type="submit" className="btn btn--primary" style={{ marginTop: '0.75rem' }}>
              Создать
            </button>
          </form>
        ) : null}
      </div>

      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">Список {reordering ? '(сохранение…)' : ''}</h2>
        <div className="field" style={{ marginBottom: '1rem', maxWidth: '420px' }}>
          <label>Поиск</label>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Название, описание или раздел…"
          />
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Заголовок</th>
                  <th>Раздел</th>
                  <th>Навыки</th>
                  <th>Анонимы</th>
                  <th>Публикация</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p, index) => (
                  <tr key={p.id}>
                    <td>{p.sortOrder}</td>
                    <td>{p.title}</td>
                    <td>{p.section || '—'}</td>
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
                    <td>{p.visibleToAnonymous ? 'да' : 'нет'}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {fromApiDateTime(p.publishedFrom) || '—'} —{' '}
                      {fromApiDateTime(p.publishedTo) || '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={index === 0 || reordering}
                        onClick={() => moveProject(index, -1)}
                        title="Выше"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={index >= rows.length - 1 || reordering}
                        onClick={() => moveProject(index, 1)}
                        title="Ниже"
                      >
                        ↓
                      </button>
                      <Link
                        className="btn btn--ghost"
                        to={`/projects/${p.id}`}
                        style={{
                          marginLeft: '0.5rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                        }}
                      >
                        Открыть
                      </Link>
                      <button
                        type="button"
                        className="btn btn--danger"
                        style={{ marginLeft: '0.5rem' }}
                        onClick={() => handleDelete(p.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
