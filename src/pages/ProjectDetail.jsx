import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as projectsApi from '../api/projects.js';
import { ProjectImagesEditor } from '../components/ProjectImagesEditor.jsx';
import { StudentPicker } from '../components/StudentPicker.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { SkillPicker } from '../components/SkillPicker.jsx';
import { useSkillsOptions } from '../hooks/useSkillsOptions.js';
import { fromApiDateTime, toApiDateTime } from '../utils/dateTimeApi.js';
import { pageItems } from '../lib/pageable.js';

function participantName(p) {
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Студент';
}

function mapImagesFromApi(images) {
  if (!Array.isArray(images)) return [];
  return [...images]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => ({
      imagePath: img.imagePath ?? '',
      imageUrl: img.imageUrl ?? '',
      sortOrder: img.sortOrder ?? 0,
    }));
}

function serializeImagesForApi(images) {
  return (images ?? [])
    .map((img, index) => ({
      imagePath: img.imagePath?.trim() || undefined,
      imageUrl: img.imageUrl?.trim() || undefined,
      sortOrder: index,
    }))
    .filter((img) => img.imagePath || img.imageUrl);
}

export function ProjectDetail() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const { skillsOptions } = useSkillsOptions();

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [{ data: project }, { data: studentsPayload }] = await Promise.all([
        projectsApi.getProject(id),
        projectsApi.listProjectStudents(id),
      ]);
      if (!project) throw new Error('Проект не найден');
      setForm({
        title: project.title ?? '',
        section: project.section ?? '',
        summary: project.summary ?? '',
        body: project.body ?? '',
        images: mapImagesFromApi(project.images),
        visibleToAnonymous: Boolean(project.visibleToAnonymous),
        publishedFrom: fromApiDateTime(project.publishedFrom),
        publishedTo: fromApiDateTime(project.publishedTo),
        skillIds: (project.skills ?? []).map((s) => Number(s.id)).filter((id) => !Number.isNaN(id)),
      });
      const listed = pageItems(studentsPayload);
      const embedded = pageItems(project.students);
      setParticipants(listed.length ? listed : embedded);
    } catch (e) {
      setError(e.message);
      setForm(null);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const boundIds = useMemo(
    () => participants.map((p) => String(p.id)),
    [participants]
  );

  async function handleSave(e) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        title: form.title.trim(),
        section: form.section.trim() || undefined,
        summary: form.summary.trim() || undefined,
        body: form.body.trim() || undefined,
        images: serializeImagesForApi(form.images),
        visibleToAnonymous: form.visibleToAnonymous,
        publishedFrom: toApiDateTime(form.publishedFrom),
        publishedTo: toApiDateTime(form.publishedTo),
        skillIds: (form.skillIds ?? []).map(Number).filter((id) => !Number.isNaN(id)),
      };
      await projectsApi.updateProject(id, payload);
      setMsg({ type: 'ok', text: 'Проект сохранён' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleBind(studentIds) {
    if (!studentIds.length) return;
    setMsg(null);
    try {
      await projectsApi.bindProjectStudents(id, studentIds);
      setMsg({ type: 'ok', text: 'Студенты привязаны' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleUnbind(sid) {
    if (!window.confirm('Отвязать студента от проекта?')) return;
    setMsg(null);
    try {
      await projectsApi.unbindProjectStudents(id, [sid]);
      setMsg({ type: 'ok', text: 'Студент отвязан' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingBlock text="Загрузка проекта…" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="page">
        <div className="alert alert--error">{error ?? 'Проект не найден'}</div>
        <Link to="/projects" className="btn btn--ghost">
          ← К списку
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <p style={{ margin: '0 0 1rem' }}>
        <Link to="/projects" className="btn btn--ghost" style={{ textDecoration: 'none' }}>
          ← Проекты
        </Link>
      </p>
      <PageHeader
        title={form.title || 'Проект'}
        lead="Редактирование карточки, галереи и состава команды"
      />

      <FlashMessages
        success={msg?.type === 'ok' ? msg.text : null}
        error={msg?.type === 'err' ? msg.text : error}
      />

      <div className="panel">
        <h2 className="panel__title">Основное</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="field">
              <label>Заголовок</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Раздел</label>
              <input
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                placeholder="Например: Веб-разработка"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Краткое описание</label>
              <input
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Полный текст</label>
            <textarea
              rows={6}
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            />
          </div>

          <div className="field">
            <label>Галерея проекта</label>
            <ProjectImagesEditor
              images={form.images}
              onChange={(images) => setForm((p) => ({ ...p, images }))}
            />
          </div>

          <div className="field skill-picker-field">
            <label>Навыки проекта</label>
            <SkillPicker
              options={skillsOptions}
              selectedIds={form.skillIds ?? []}
              onChange={(skillIds) => setForm((p) => ({ ...p, skillIds }))}
              searchPlaceholder="Поиск навыка для проекта…"
            />
          </div>

          <div className="form-row" style={{ marginTop: '0.75rem' }}>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={form.visibleToAnonymous}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, visibleToAnonymous: e.target.checked }))
                  }
                  style={{ marginRight: '0.35rem' }}
                />
                Виден на публичной витрине
              </label>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Публикация с</label>
              <input
                type="datetime-local"
                value={form.publishedFrom}
                onChange={(e) =>
                  setForm((p) => ({ ...p, publishedFrom: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>Публикация до</label>
              <input
                type="datetime-local"
                value={form.publishedTo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, publishedTo: e.target.value }))
                }
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
            style={{ marginTop: '0.75rem' }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel__title">Участники ({participants.length})</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Студент</th>
                <th>Специальность</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {participants.length ? (
                participants.map((p) => (
                  <tr key={p.id}>
                    <td>{participantName(p)}</td>
                    <td>{p.speciality ?? '—'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link
                        className="btn btn--ghost"
                        to={`/students/${p.id}`}
                        style={{ textDecoration: 'none', display: 'inline-flex' }}
                      >
                        Карточка
                      </Link>
                      <button
                        type="button"
                        className="btn btn--danger"
                        style={{ marginLeft: '0.5rem' }}
                        onClick={() => handleUnbind(String(p.id))}
                      >
                        Отвязать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--text-muted)' }}>
                    Нет привязанных студентов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 className="panel__subtitle" style={{ marginTop: '1.25rem' }}>
          Добавить студентов
        </h3>
        <StudentPicker excludeIds={boundIds} onBind={handleBind} />
      </div>
    </div>
  );
}
