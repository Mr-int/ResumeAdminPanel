import { DateTimeField } from './ui/DateTimeField.jsx';
import { SkillPicker } from './SkillPicker.jsx';
import { COOPERATION_FORMAT_LABELS } from '../lib/labels.js';

const FORMATS = Object.keys(COOPERATION_FORMAT_LABELS);

export function RecruitmentRequestForm({
  form,
  onChange,
  specialities,
  cities,
  companyHint,
  idPrefix,
  disabled,
}) {
  function set(patch) {
    onChange({ ...form, ...patch });
  }

  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-company`}>Компания</label>
        <input
          id={`${idPrefix}-company`}
          required
          disabled={disabled}
          value={form.companyName}
          onChange={(e) => set({ companyName: e.target.value })}
        />
        {companyHint ? <p className="page__lead" style={{ margin: '0.35rem 0 0' }}>{companyHint}</p> : null}
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-tasks`}>Задачи</label>
        <textarea
          id={`${idPrefix}-tasks`}
          required
          rows={4}
          disabled={disabled}
          value={form.tasks}
          onChange={(e) => set({ tasks: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-qual`}>Требования к квалификации</label>
        <textarea
          id={`${idPrefix}-qual`}
          required
          rows={4}
          disabled={disabled}
          value={form.qualificationRequirements}
          onChange={(e) => set({ qualificationRequirements: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-work`}>Условия работы</label>
        <textarea
          id={`${idPrefix}-work`}
          required
          rows={4}
          disabled={disabled}
          value={form.workConditions}
          onChange={(e) => set({ workConditions: e.target.value })}
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${idPrefix}-count`}>Сколько студентов нужно</label>
          <input
            id={`${idPrefix}-count`}
            type="number"
            min="1"
            step="1"
            required
            disabled={disabled}
            value={form.studentCount}
            onChange={(e) => set({ studentCount: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-format`}>Формат сотрудничества</label>
          <select
            id={`${idPrefix}-format`}
            disabled={disabled}
            value={form.cooperationFormat}
            onChange={(e) => set({ cooperationFormat: e.target.value })}
          >
            <option value="">Не указан</option>
            {FORMATS.map((id) => (
              <option key={id} value={id}>
                {COOPERATION_FORMAT_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-ready`}>Готовы запросить студентов</label>
          <select
            id={`${idPrefix}-ready`}
            disabled={disabled}
            value={form.readyToRequestStudents}
            onChange={(e) => set({ readyToRequestStudents: e.target.value })}
          >
            <option value="">Не указано</option>
            <option value="yes">Да</option>
            <option value="no">Нет</option>
          </select>
        </div>
      </div>
      <div className="field skill-picker-field">
        <label>Специальности</label>
        <SkillPicker
          options={specialities}
          selectedIds={form.specialityIds}
          onChange={(specialityIds) => set({ specialityIds })}
          searchPlaceholder="Поиск специальности…"
        />
      </div>
      <div className="field skill-picker-field">
        <label>Города</label>
        <SkillPicker
          options={cities}
          selectedIds={form.cityIds}
          onChange={(cityIds) => set({ cityIds })}
          searchPlaceholder="Поиск города…"
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-schedule`}>Сроки работы</label>
        <textarea
          id={`${idPrefix}-schedule`}
          rows={3}
          disabled={disabled}
          value={form.scheduleNote}
          onChange={(e) => set({ scheduleNote: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-extra`}>Прочая информация</label>
        <textarea
          id={`${idPrefix}-extra`}
          rows={3}
          disabled={disabled}
          value={form.extraInfo}
          onChange={(e) => set({ extraInfo: e.target.value })}
        />
      </div>
      <div className="form-row">
        <DateTimeField
          id={`${idPrefix}-from`}
          label="Публикация с"
          value={form.publishedFrom}
          onChange={(publishedFrom) => set({ publishedFrom })}
        />
        <DateTimeField
          id={`${idPrefix}-to`}
          label="Публикация до"
          value={form.publishedTo}
          onChange={(publishedTo) => set({ publishedTo })}
        />
      </div>
    </>
  );
}
