import { useState } from 'react';
import { API_BASE } from '../config.js';
import { StorageBrowserModal } from './StorageBrowser.jsx';

function previewUrl(item) {
  if (item.imageUrl?.trim()) return item.imageUrl.trim();
  if (!item.imagePath?.trim()) return null;
  const path = item.imagePath.trim();
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}/main/photo/${encodeURIComponent(path)}`;
}

function emptyImage() {
  return { imagePath: '', imageUrl: '' };
}

export function ProjectImagesEditor({ images, onChange }) {
  const [storageOpen, setStorageOpen] = useState(false);
  const [pickIndex, setPickIndex] = useState(null);
  const [urlDraft, setUrlDraft] = useState('');

  const list = Array.isArray(images) ? images : [];

  function updateList(next) {
    onChange(next.map((item, index) => ({ ...item, sortOrder: index })));
  }

  function addFromStorage() {
    setPickIndex(list.length);
    setStorageOpen(true);
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    updateList([...list, { ...emptyImage(), imageUrl: url }]);
    setUrlDraft('');
  }

  function removeAt(index) {
    updateList(list.filter((_, i) => i !== index));
  }

  function move(index, direction) {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateList(next);
  }

  function patchAt(index, patch) {
    updateList(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleStorageSelect(fileName) {
    if (pickIndex == null) return;
    const next = [...list];
    if (pickIndex >= next.length) {
      next.push({ ...emptyImage(), imagePath: fileName });
    } else {
      next[pickIndex] = { ...next[pickIndex], imagePath: fileName };
    }
    updateList(next);
    setPickIndex(null);
  }

  return (
    <div className="project-images-editor">
      <div className="project-images-editor__toolbar">
        <button type="button" className="btn btn--primary" onClick={addFromStorage}>
          Из хранилища
        </button>
        <div className="project-images-editor__urlRow">
          <input
            type="url"
            placeholder="https://ссылка-на-фото…"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <button type="button" className="btn btn--ghost" onClick={addUrl}>
            Добавить URL
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="project-images-editor__empty">Добавьте хотя бы одно фото проекта.</p>
      ) : null}

      <ul className="project-images-editor__list">
        {list.map((item, index) => {
          const preview = previewUrl(item);
          return (
            <li key={`${index}-${item.imagePath}-${item.imageUrl}`} className="project-images-editor__item">
              <div className="project-images-editor__preview">
                {preview ? <img src={preview} alt="" /> : <span>Нет превью</span>}
              </div>
              <div className="project-images-editor__fields">
                <div className="field">
                  <label>Файл в хранилище</label>
                  <div className="project-images-editor__pathRow">
                    <input value={item.imagePath ?? ''} placeholder="выберите из хранилища" readOnly />
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        setPickIndex(index);
                        setStorageOpen(true);
                      }}
                    >
                      Выбрать
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>или URL</label>
                  <input
                    type="url"
                    value={item.imageUrl ?? ''}
                    onChange={(e) => patchAt(index, { imageUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
              </div>
              <div className="project-images-editor__actions">
                <button type="button" className="btn btn--ghost" disabled={index === 0} onClick={() => move(index, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={index >= list.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button type="button" className="btn btn--danger" onClick={() => removeAt(index)}>
                  Удалить
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <StorageBrowserModal
        open={storageOpen}
        onClose={() => {
          setStorageOpen(false);
          setPickIndex(null);
        }}
        onSelect={handleStorageSelect}
      />
    </div>
  );
}
