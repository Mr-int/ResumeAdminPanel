import { useRef } from 'react';

function replaceRange(str, start, end, insert) {
  return str.slice(0, start) + insert + str.slice(end);
}

/** Жирный: **текст** (Markdown). Пустое выделение — вставляет ** ** с курсором посередине. */
export function applyBold(str, start, end) {
  if (start > end) [start, end] = [end, start];
  const sel = str.slice(start, end);
  if (sel.length === 0) {
    const ins = '****';
    const next = replaceRange(str, start, end, ins);
    return { text: next, selStart: start + 2, selEnd: start + 2 };
  }
  const wrapped = `**${sel}**`;
  const next = replaceRange(str, start, end, wrapped);
  return { text: next, selStart: start + wrapped.length, selEnd: start + wrapped.length };
}

/** Маркированный список: добавляет «- » в начале каждой строки выделения. */
export function applyBulletList(str, start, end) {
  if (start > end) [start, end] = [end, start];
  const block = str.slice(start, end);
  const lines = block.split('\n');
  const nextBlock = lines
    .map((line) => {
      const t = line.trimStart();
      if (t.startsWith('- ')) return line;
      return `- ${line}`;
    })
    .join('\n');
  const next = replaceRange(str, start, end, nextBlock);
  return { text: next, selStart: start + nextBlock.length, selEnd: start + nextBlock.length };
}

/** Нумерованный список: 1. 2. … по строкам выделения. */
export function applyNumberedList(str, start, end) {
  if (start > end) [start, end] = [end, start];
  const block = str.slice(start, end);
  const lines = block.split('\n');
  let n = 1;
  const nextBlock = lines
    .map((line) => {
      const t = line.trimStart();
      if (/^\d+\.\s/.test(t)) return line;
      const prefix = `${n}. `;
      n += 1;
      return `${prefix}${line}`;
    })
    .join('\n');
  const next = replaceRange(str, start, end, nextBlock);
  return { text: next, selStart: start + nextBlock.length, selEnd: start + nextBlock.length };
}

/**
 * Многострочное поле + простая панель форматирования (Markdown: жирный, списки).
 */
export function TextAreaWithToolbar({
  label,
  id,
  value = '',
  onChange,
  rows = 4,
  disabled = false,
  readOnly = false,
  hint = '',
}) {
  const taRef = useRef(null);
  const locked = disabled || readOnly;

  function commitSelection(nextText, selStart, selEnd) {
    onChange(nextText);
    queueMicrotask(() => {
      const el = taRef.current;
      if (!el) return;
      const a = Math.max(0, Math.min(selStart, nextText.length));
      const b = Math.max(0, Math.min(selEnd, nextText.length));
      el.focus();
      el.setSelectionRange(a, b);
    });
  }

  function run(fn) {
    if (locked) return;
    const el = taRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const { text, selStart, selEnd } = fn(value, start, end);
    commitSelection(text, selStart, selEnd);
  }

  return (
    <div className="textarea-toolbar">
      {label ? (
        <label htmlFor={id} className="textarea-toolbar__label">
          {label}
        </label>
      ) : null}
      {!locked ? (
        <div className="format-toolbar" role="toolbar" aria-label="Форматирование текста">
          <button type="button" className="format-toolbar__btn" title="Жирный (**текст**)" onClick={() => run(applyBold)}>
            <strong>B</strong>
          </button>
          <button type="button" className="format-toolbar__btn" title="Маркированный список" onClick={() => run(applyBulletList)}>
            • Список
          </button>
          <button type="button" className="format-toolbar__btn" title="Нумерованный список" onClick={() => run(applyNumberedList)}>
            1. Список
          </button>
        </div>
      ) : null}
      {hint && !locked ? <p className="textarea-toolbar__hint">{hint}</p> : null}
      <textarea
        ref={taRef}
        id={id}
        className="textarea-toolbar__input"
        rows={rows}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
