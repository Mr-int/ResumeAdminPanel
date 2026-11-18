import { useCallback, useEffect, useMemo, useState } from 'react';
import * as skillsApi from '../api/skills.js';
import { getSpecialityOptions } from '../lib/referenceCache.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

const FETCH_SIZE = 200;

async function loadAllSkills() {
  const all = [];
  for (let page = 0; page < 50; page += 1) {
    const { data } = await skillsApi.filterSkills({}, page, FETCH_SIZE, ['name,asc']);
    const rows = data?.data ?? [];
    all.push(...rows);
    const totalPages = data?.totalPages ?? 1;
    if (!rows.length || page + 1 >= totalPages) break;
  }
  return all;
}

function childrenByParent(skills) {
  const map = new Map();
  for (const skill of skills) {
    const key = skill.parentId == null ? 'root' : String(skill.parentId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(skill);
  }
  for (const list of map.values()) {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
  }
  return map;
}

function flattenTree(skills) {
  const grouped = childrenByParent(skills);
  const placed = new Set();
  const rows = [];
  function walk(key, depth) {
    for (const skill of grouped.get(key) ?? []) {
      if (placed.has(skill.id)) continue;
      placed.add(skill.id);
      rows.push({ skill, depth });
      walk(String(skill.id), depth + 1);
    }
  }
  walk('root', 0);
  for (const skill of skills) {
    if (!placed.has(skill.id)) rows.push({ skill, depth: 0 });
  }
  return rows;
}

function matchingIds(skills, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const keep = new Set();
  for (const skill of skills) {
    if (!String(skill.name ?? '').toLowerCase().includes(needle)) continue;
    let current = skill;
    const guard = new Set();
    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      keep.add(current.id);
      current = current.parentId == null ? null : byId.get(current.parentId);
    }
  }
  return keep;
}

function blockedParentIds(skills, skillId) {
  const grouped = childrenByParent(skills);
  const blocked = new Set([skillId]);
  const stack = [skillId];
  while (stack.length) {
    const current = stack.pop();
    for (const child of grouped.get(String(current)) ?? []) {
      if (blocked.has(child.id)) continue;
      blocked.add(child.id);
      stack.push(child.id);
    }
  }
  return blocked;
}

export function Skills() {
  const [skills, setSkills] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [newSpecialityId, setNewSpecialityId] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editSpecialityId, setEditSpecialityId] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [skillRows, specialityRows] = await Promise.all([
        loadAllSkills(),
        getSpecialityOptions().catch(() => []),
      ]);
      setSkills(skillRows);
      setSpecialities(specialityRows);
    } catch (e) {
      setError(e.message);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const specialityName = useMemo(() => {
    const map = new Map(specialities.map((item) => [String(item.id), item.name]));
    return (id) => (id == null ? '' : map.get(String(id)) || '');
  }, [specialities]);

  const visible = useMemo(() => {
    const keep = matchingIds(skills, debouncedQuery);
    const source = keep ? skills.filter((skill) => keep.has(skill.id)) : skills;
    return flattenTree(source);
  }, [skills, debouncedQuery]);

  const editing = skills.find((skill) => skill.id === editId) ?? null;
  const parentChoices = useMemo(() => {
    if (!editing) return skills;
    const blocked = blockedParentIds(skills, editing.id);
    return skills.filter((skill) => !blocked.has(skill.id));
  }, [skills, editing]);

  async function handleCreate(event) {
    event.preventDefault();
    setMsg(null);
    const body = { name: newName.trim() };
    if (newParentId) body.parentId = Number(newParentId);
    else if (newSpecialityId) body.specialityId = Number(newSpecialityId);
    try {
      await skillsApi.createSkill(body);
      setNewName('');
      setNewParentId('');
      setNewSpecialityId('');
      setMsg({ type: 'ok', text: 'Навык создан' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  function startEdit(skill) {
    setEditId(skill.id);
    setEditName(skill.name ?? '');
    setEditParentId(skill.parentId == null ? '' : String(skill.parentId));
    setEditSpecialityId(skill.specialityId == null ? '' : String(skill.specialityId));
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!editing) return;
    setMsg(null);
    const body = { name: editName.trim() };
    if (editParentId) {
      body.parentId = Number(editParentId);
    } else if (editing.parentId != null) {
      body.clearParent = true;
    }
    if (!editParentId) {
      if (editSpecialityId) body.specialityId = Number(editSpecialityId);
      else if (editing.specialityId != null) body.clearSpeciality = true;
    }
    try {
      await skillsApi.updateSkill(editing.id, body);
      setEditId(null);
      setMsg({ type: 'ok', text: 'Навык обновлён' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(skill) {
    if (!window.confirm(`Удалить «${skill.name}»?`)) return;
    setMsg(null);
    try {
      await skillsApi.deleteSkill(skill.id);
      if (editId === skill.id) setEditId(null);
      setMsg({ type: 'ok', text: 'Навык удалён' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Навыки"
        lead="Дерево справочника. Специальность задаётся только навыку без родителя."
      />

      <div className="panel">
        <h2 className="panel__title">Поиск и создание</h2>
        <div className="field">
          <label htmlFor="skill-search">Название</label>
          <input
            id="skill-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пусто — всё дерево"
          />
        </div>
        <form className="form-row" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="skill-new-name">Новый навык</label>
            <input
              id="skill-new-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="skill-new-parent">Родитель</label>
            <select
              id="skill-new-parent"
              value={newParentId}
              onChange={(event) => {
                setNewParentId(event.target.value);
                if (event.target.value) setNewSpecialityId('');
              }}
            >
              <option value="">Корень</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </div>
          {!newParentId ? (
            <div className="field">
              <label htmlFor="skill-new-speciality">Специальность корня</label>
              <select
                id="skill-new-speciality"
                value={newSpecialityId}
                onChange={(event) => setNewSpecialityId(event.target.value)}
              >
                <option value="">Без специальности</option>
                {specialities.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          ) : null}
          <button type="submit" className="btn btn--primary">Добавить</button>
        </form>
      </div>

      <FlashMessages
        error={error || (msg?.type === 'err' ? msg.text : null)}
        success={msg?.type === 'ok' ? msg.text : null}
      />

      <div className="panel">
        <h2 className="panel__title">Дерево</h2>
        {loading ? <LoadingBlock /> : null}
        {!loading && visible.length === 0 ? <EmptyState title="Навыки не найдены" /> : null}
        {!loading && visible.length > 0 ? (
          <div className="skill-tree">
            {visible.map(({ skill, depth }) => (
              <div className="skill-tree__row" key={skill.id} style={{ paddingLeft: `${depth * 1.25}rem` }}>
                <div className="skill-tree__name">
                  <span>{skill.name}</span>
                  {skill.parentId == null && skill.specialityId != null ? (
                    <span className="skill-tree__meta">{specialityName(skill.specialityId)}</span>
                  ) : null}
                </div>
                <div className="skill-tree__actions">
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => startEdit(skill)}>
                    Изменить
                  </button>
                  <button type="button" className="btn btn--danger btn--small" onClick={() => handleDelete(skill)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {editing ? (
        <form className="panel" onSubmit={handleUpdate}>
          <h2 className="panel__title">Изменение «{editing.name}»</h2>
          <div className="form-row">
            <div className="field">
              <label htmlFor="skill-edit-name">Название</label>
              <input
                id="skill-edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="skill-edit-parent">Родитель</label>
              <select
                id="skill-edit-parent"
                value={editParentId}
                onChange={(event) => setEditParentId(event.target.value)}
              >
                <option value="">Корень</option>
                {parentChoices.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
            </div>
            {!editParentId ? (
              <div className="field">
                <label htmlFor="skill-edit-speciality">Специальность корня</label>
                <select
                  id="skill-edit-speciality"
                  value={editSpecialityId}
                  onChange={(event) => setEditSpecialityId(event.target.value)}
                >
                  <option value="">Без специальности</option>
                  {specialities.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <div className="form-row">
            <button type="submit" className="btn btn--primary">Сохранить</button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditId(null)}>Отмена</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
