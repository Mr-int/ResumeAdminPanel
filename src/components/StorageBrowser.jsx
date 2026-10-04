import { useCallback, useEffect, useRef, useState } from 'react';
import * as storageApi from '../api/storage.js';
import { ApiPhoto } from './ui/ApiPhoto.jsx';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StoragePreview({ fileName }) {
  return (
    <ApiPhoto
      imagePath={fileName}
      brokenClassName="storage-browser__broken"
      brokenText="нет превью"
    />
  );
}

/**
 * Содержимое браузера хранилища (страница или модалка).
 * @param {{ onSelect?: (fileName: string) => void, selectLabel?: string }} props
 */
export function StorageBrowser({ onSelect, selectLabel = 'Выбрать' }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await storageApi.listStorageFiles();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await storageApi.uploadStorageFile(file);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileName) {
    if (!window.confirm(`Удалить файл «${fileName}» из хранилища?`)) return;
    setError(null);
    try {
      await storageApi.deleteStorageFile(fileName);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="storage-browser">
      <div className="storage-browser__toolbar">
        <button
          type="button"
          className="btn btn--primary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Загрузка…' : 'Загрузить файл'}
        </button>
        <button type="button" className="btn btn--ghost" disabled={loading} onClick={load}>
          Обновить
        </button>
        <span className="storage-browser__hint">До 10 МБ на файл (JPEG, PNG, WebP и др.)</span>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {loading ? <p className="storage-browser__muted">Загрузка списка…</p> : null}

      <div className="storage-browser__grid">
        {files.map((f) => (
          <article key={f.fileName} className="storage-browser__item">
            <div className="storage-browser__preview">
              <StoragePreview fileName={f.fileName} />
            </div>
            <div className="storage-browser__meta">
              <span className="storage-browser__name" title={f.fileName}>
                {f.fileName}
              </span>
              <span className="storage-browser__size">{formatSize(f.sizeBytes)}</span>
            </div>
            <div className="storage-browser__actions">
              {onSelect ? (
                <button type="button" className="btn btn--primary" onClick={() => onSelect(f.fileName)}>
                  {selectLabel}
                </button>
              ) : null}
              <button type="button" className="btn btn--danger" onClick={() => handleDelete(f.fileName)}>
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && files.length === 0 ? (
        <p className="storage-browser__muted">Файлов пока нет — загрузите первое изображение.</p>
      ) : null}
    </div>
  );
}

export function StorageBrowserModal({ open, onClose, onSelect, selectLabel = 'Выбрать' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="storage-modal" role="dialog" aria-modal="true" aria-label="Хранилище файлов">
      <button type="button" className="storage-modal__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="storage-modal__panel">
        <div className="storage-modal__header">
          <h2 className="storage-modal__title">Хранилище изображений</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <StorageBrowser
          onSelect={
            onSelect
              ? (fileName) => {
                  onSelect(fileName);
                  onClose();
                }
              : undefined
          }
          selectLabel={selectLabel}
        />
      </div>
    </div>
  );
}
