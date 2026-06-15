/**
 * Блоки портфолио / опыт / institution / education.
 * Режим создания: только черновики (уходят в POST /student/extended).
 * Режим редактирования: черновики + кнопка «Добавить в профиль» + снизу уже сохранённые строки с удалением.
 */

import { useEffect, useMemo, useState } from 'react';
import { TextAreaWithToolbar } from './TextAreaWithToolbar.jsx';
import { DateField, YearSelect } from './ui/DateTimeField.jsx';

function normalizeId(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isNaN(v)) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.toLowerCase() === 'nan') return null;
  return s;
}

function normalizePortfolio(raw) {
  return {
    id: normalizeId(raw?.id),
    name: raw?.name ?? '',
    link: raw?.link ?? '',
    additionalInfo: raw?.additionalInfo ?? '',
  };
}

function normalizeExperience(raw) {
  const e = raw?.experience && typeof raw.experience === 'object' ? raw.experience : raw;
  return {
    id: normalizeId(raw?.id ?? e?.id ?? raw?.experienceId ?? raw?.experienceID),
    companyId:
      raw?.companyId != null
        ? String(raw.companyId)
        : e?.companyId != null
          ? String(e.companyId)
          : '',
    companyName: raw?.companyName ?? e?.companyName ?? '',
    position: e?.position ?? raw?.position ?? '',
    additionalInfo: e?.additionalInfo ?? raw?.additionalInfo ?? '',
    startDate: e?.startDate ?? raw?.startDate ?? '',
    endDate: e?.endDate ?? raw?.endDate ?? '',
  };
}

function normalizeInstitution(raw) {
  const ins = raw?.institution && typeof raw.institution === 'object' ? raw.institution : raw;
  return {
    id: normalizeId(raw?.id ?? ins?.id ?? raw?.institutionId ?? raw?.institutionID),
    educationId: raw?.educationId ?? ins?.educationId ?? '',
    startYear: ins?.startYear ?? raw?.startYear ?? '',
    endYear: ins?.endYear ?? raw?.endYear ?? '',
  };
}

function normalizeEducation(raw) {
  return {
    id: normalizeId(raw?.id),
    institution: raw?.institution ?? '',
    webUrl: raw?.webUrl ?? '',
    additionalInfo: raw?.additionalInfo ?? '',
  };
}

const COMPANY_DATALIST_ID = 'extended-company-options';

function pickCompanyByName(companyOptions, name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return { companyId: '', companyName: '' };
  const picked = companyOptions.find((c) => c.name === trimmed);
  return {
    companyId: picked ? String(picked.id) : '',
    companyName: trimmed,
  };
}

function SavedRecordsSection({ count, label, children }) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  return (
    <div className="extended-saved-section">
      <button
        type="button"
        className="btn btn--ghost btn--small extended-saved-section__toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {label} ({count}) {open ? '▾' : '▸'}
      </button>
      {open ? <div className="extended-saved-section__body">{children}</div> : null}
    </div>
  );
}

export function StudentCreateExtendedBlocks({
  form,
  setForm,
  showLead = true,
  editMode = false,
  editLeadText = '',
  companyOptions = [],
  educationOptions = [],
  existingPortfolios = [],
  onDeletePortfolio,
  onUpdatePortfolio,
  onCommitPortfolios,
  committingPortfolio = false,
  existingExperiences = [],
  onDeleteExperience,
  onUpdateExperience,
  onCommitExperiences,
  committingExperience = false,
  existingInstitutions = [],
  onDeleteInstitution,
  onUpdateInstitution,
  onCommitInstitutions,
  committingInstitution = false,
  existingEducations = [],
  onDeleteEducation,
  onUpdateEducation,
  onCommitEducations,
  committingEducation = false,
}) {
  const portfolioSaved = useMemo(
    () => (existingPortfolios ?? []).map((x) => normalizePortfolio(x)).filter((x) => x.id != null),
    [existingPortfolios]
  );
  const experienceSaved = useMemo(
    () => (existingExperiences ?? []).map((x) => normalizeExperience(x)).filter((x) => x.id != null),
    [existingExperiences]
  );
  const institutionSaved = useMemo(
    () => (existingInstitutions ?? []).map((x) => normalizeInstitution(x)).filter((x) => x.id != null),
    [existingInstitutions]
  );
  const educationSaved = useMemo(
    () => (existingEducations ?? []).map((x) => normalizeEducation(x)).filter((x) => x.id != null),
    [existingEducations]
  );

  const [savedEdit, setSavedEdit] = useState({
    portfolios: {},
    experiences: {},
    institutions: {},
    educations: {},
  });

  useEffect(() => {
    if (!editMode) return;
    setSavedEdit((prev) => {
      let changed = false;
      const next = {
        portfolios: { ...prev.portfolios },
        experiences: { ...prev.experiences },
        institutions: { ...prev.institutions },
        educations: { ...prev.educations },
      };
      for (const r of portfolioSaved) {
        if (next.portfolios[r.id] == null) {
          next.portfolios[r.id] = r;
          changed = true;
        }
      }
      for (const r of experienceSaved) {
        if (next.experiences[r.id] == null) {
          next.experiences[r.id] = r;
          changed = true;
        }
      }
      for (const r of institutionSaved) {
        if (next.institutions[r.id] == null) {
          next.institutions[r.id] = r;
          changed = true;
        }
      }
      for (const r of educationSaved) {
        if (next.educations[r.id] == null) {
          next.educations[r.id] = r;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [editMode, portfolioSaved, experienceSaved, institutionSaved, educationSaved]);

  return (
    <div className="extended-blocks">
      {companyOptions.length ? (
        <datalist id={COMPANY_DATALIST_ID}>
          {companyOptions.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      ) : null}
      {showLead ? (
        <p className="extended-blocks__lead">
          Ниже — необязательные блоки. Пустые или неполные строки в запрос не попадают.
        </p>
      ) : null}
      {editMode && editLeadText ? (
        <p className="extended-blocks__lead extended-blocks__lead--edit">{editLeadText}</p>
      ) : null}

      <div className="extended-block">
        <div className="extended-block__head">
          <h3 className="extended-block__title">Портфолио</h3>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() =>
              setForm((p) => ({
                ...p,
                portfolioRows: [
                  ...p.portfolioRows,
                  { name: '', link: '', additionalInfo: '' },
                ],
              }))
            }
          >
            + Добавить
          </button>
        </div>
        {form.portfolioRows.length === 0 ? (
          <p className="extended-block__empty">Пока нет новых строк — нажмите «+ Добавить»</p>
        ) : (
          form.portfolioRows.map((row, idx) => (
            <div key={idx} className="extended-block__row">
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label>Название</label>
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.portfolioRows];
                        next[idx] = { ...next[idx], name: e.target.value };
                        return { ...p, portfolioRows: next };
                      })
                    }
                  />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label>Ссылка</label>
                  <input
                    value={row.link}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.portfolioRows];
                        next[idx] = { ...next[idx], link: e.target.value };
                        return { ...p, portfolioRows: next };
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 200 }}>
                  <TextAreaWithToolbar
                    label="Доп. информация"
                    id={`portfolio-draft-${idx}`}
                    value={row.additionalInfo}
                    onChange={(v) =>
                      setForm((p) => {
                        const next = [...p.portfolioRows];
                        next[idx] = { ...next[idx], additionalInfo: v };
                        return { ...p, portfolioRows: next };
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      portfolioRows: p.portfolioRows.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Убрать строку
                </button>
              </div>
            </div>
          ))
        )}
        {editMode && onCommitPortfolios ? (
          <div className="extended-block__commit">
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={committingPortfolio}
              onClick={onCommitPortfolios}
            >
              {committingPortfolio ? 'Отправка…' : 'Добавить новые в профиль'}
            </button>
          </div>
        ) : null}
        {editMode && existingPortfolios?.length ? (
          <SavedRecordsSection count={existingPortfolios.length} label="Уже в профиле — портфолио">
            {existingPortfolios.map((raw) => {
              const row = normalizePortfolio(raw);
              const kid = row.id != null ? `p-${row.id}` : `p-${row.name}`;
              const canEdit = row.id != null && typeof onUpdatePortfolio === 'function';
              const current =
                row.id != null && savedEdit.portfolios[row.id]
                  ? savedEdit.portfolios[row.id]
                  : row;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 140 }}>
                      <label>Название</label>
                      <input
                        readOnly={!canEdit}
                        value={current.name}
                        onChange={(e) => {
                          if (!canEdit) return;
                          const v = e.target.value;
                          setSavedEdit((p) => ({
                            ...p,
                            portfolios: {
                              ...p.portfolios,
                              [row.id]: { ...current, name: v },
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 140 }}>
                      <label>Ссылка</label>
                      <input
                        readOnly={!canEdit}
                        value={current.link}
                        onChange={(e) => {
                          if (!canEdit) return;
                          const v = e.target.value;
                          setSavedEdit((p) => ({
                            ...p,
                            portfolios: {
                              ...p.portfolios,
                              [row.id]: { ...current, link: v },
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 200 }}>
                      <TextAreaWithToolbar
                        label="Доп. информация"
                        id={`portfolio-saved-${row.id}`}
                        readOnly={!canEdit}
                        value={current.additionalInfo}
                        onChange={(v) => {
                          if (!canEdit) return;
                          setSavedEdit((p) => ({
                            ...p,
                            portfolios: {
                              ...p.portfolios,
                              [row.id]: { ...current, additionalInfo: v },
                            },
                          }));
                        }}
                      />
                    </div>
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          onClick={() => onUpdatePortfolio(row.id, current)}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() =>
                            setSavedEdit((p) => {
                              const next = { ...p, portfolios: { ...p.portfolios } };
                              next.portfolios[row.id] = row;
                              return next;
                            })
                          }
                        >
                          Сбросить
                        </button>
                      </>
                    ) : null}
                    {onDeletePortfolio && row.id != null ? (
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => onDeletePortfolio(row.id)}
                      >
                        Удалить из профиля
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </SavedRecordsSection>
        ) : null}
      </div>

      <div className="extended-block">
        <div className="extended-block__head">
          <h3 className="extended-block__title">Опыт (experience)</h3>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() =>
              setForm((p) => ({
                ...p,
                experienceRows: [
                  ...p.experienceRows,
                  {
                    companyId: '',
                    companyName: '',
                    position: '',
                    additionalInfo: '',
                    startDate: '',
                    endDate: '',
                  },
                ],
              }))
            }
          >
            + Добавить
          </button>
        </div>
        {form.experienceRows.length === 0 ? (
          <p className="extended-block__empty">Пока нет новых строк — нажмите «+ Добавить»</p>
        ) : (
          form.experienceRows.map((row, idx) => (
            <div key={idx} className="extended-block__row">
              <div className="form-row">
                <div className="field" style={{ minWidth: 220, flex: 1 }}>
                  <label>Компания</label>
                  <input
                    list={companyOptions.length ? COMPANY_DATALIST_ID : undefined}
                    value={row.companyName ?? ''}
                    placeholder="Название компании"
                    onChange={(e) => {
                      const picked = pickCompanyByName(companyOptions, e.target.value);
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = {
                          ...next[idx],
                          companyId: picked.companyId,
                          companyName: picked.companyName,
                        };
                        return { ...p, experienceRows: next };
                      });
                    }}
                  />
                </div>
                <div className="field" style={{ minWidth: 160, flex: 1 }}>
                  <label>Должность</label>
                  <input
                    value={row.position}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = {
                          ...next[idx],
                          position: e.target.value,
                        };
                        return { ...p, experienceRows: next };
                      })
                    }
                  />
                </div>
                <DateField
                  id={`experience-start-${idx}`}
                  label="С даты"
                  value={row.startDate}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...p.experienceRows];
                      next[idx] = { ...next[idx], startDate: v };
                      return { ...p, experienceRows: next };
                    })
                  }
                />
                <DateField
                  id={`experience-end-${idx}`}
                  label="По дату"
                  value={row.endDate}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...p.experienceRows];
                      next[idx] = { ...next[idx], endDate: v };
                      return { ...p, experienceRows: next };
                    })
                  }
                />
              </div>
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 200 }}>
                  <TextAreaWithToolbar
                    label="Доп. информация"
                    id={`experience-draft-${idx}`}
                    value={row.additionalInfo}
                    onChange={(v) =>
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = { ...next[idx], additionalInfo: v };
                        return { ...p, experienceRows: next };
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      experienceRows: p.experienceRows.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Убрать строку
                </button>
              </div>
            </div>
          ))
        )}
        {editMode && onCommitExperiences ? (
          <div className="extended-block__commit">
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={committingExperience}
              onClick={onCommitExperiences}
            >
              {committingExperience ? 'Отправка…' : 'Добавить новые в профиль'}
            </button>
          </div>
        ) : null}
        {editMode && existingExperiences?.length ? (
          <SavedRecordsSection count={existingExperiences.length} label="Уже в профиле — опыт">
            {existingExperiences.map((raw) => {
              const row = normalizeExperience(raw);
              const kid = row.id != null ? `e-${row.id}` : `e-${row.position}`;
              const canEdit = row.id != null && typeof onUpdateExperience === 'function';
              const current =
                row.id != null && savedEdit.experiences[row.id]
                  ? savedEdit.experiences[row.id]
                  : row;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field" style={{ minWidth: 220, flex: 1 }}>
                      <label>Компания</label>
                      <input
                        readOnly={!canEdit}
                        list={canEdit && companyOptions.length ? COMPANY_DATALIST_ID : undefined}
                        value={current.companyName ?? ''}
                        placeholder="Название компании"
                        onChange={(e) => {
                          if (!canEdit) return;
                          const picked = pickCompanyByName(companyOptions, e.target.value);
                          setSavedEdit((p) => ({
                            ...p,
                            experiences: {
                              ...p.experiences,
                              [row.id]: {
                                ...current,
                                companyId: picked.companyId,
                                companyName: picked.companyName,
                              },
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="field" style={{ minWidth: 160, flex: 1 }}>
                      <label>Должность</label>
                      <input
                        readOnly={!canEdit}
                        value={current.position}
                        onChange={(e) => {
                          if (!canEdit) return;
                          const v = e.target.value;
                          setSavedEdit((p) => ({
                            ...p,
                            experiences: {
                              ...p.experiences,
                              [row.id]: { ...current, position: v },
                            },
                          }));
                        }}
                      />
                    </div>
                    <DateField
                      id={`experience-saved-start-${row.id}`}
                      label="С даты"
                      value={current.startDate}
                      disabled={!canEdit}
                      onChange={(v) => {
                        if (!canEdit) return;
                        setSavedEdit((p) => ({
                          ...p,
                          experiences: {
                            ...p.experiences,
                            [row.id]: { ...current, startDate: v },
                          },
                        }));
                      }}
                    />
                    <DateField
                      id={`experience-saved-end-${row.id}`}
                      label="По дату"
                      value={current.endDate}
                      disabled={!canEdit}
                      onChange={(v) => {
                        if (!canEdit) return;
                        setSavedEdit((p) => ({
                          ...p,
                          experiences: {
                            ...p.experiences,
                            [row.id]: { ...current, endDate: v },
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 200 }}>
                      <TextAreaWithToolbar
                        label="Доп. информация"
                        id={`experience-saved-${row.id}`}
                        readOnly={!canEdit}
                        value={current.additionalInfo}
                        onChange={(v) => {
                          if (!canEdit) return;
                          setSavedEdit((p) => ({
                            ...p,
                            experiences: {
                              ...p.experiences,
                              [row.id]: { ...current, additionalInfo: v },
                            },
                          }));
                        }}
                      />
                    </div>
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          onClick={() => onUpdateExperience(row.id, current)}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() =>
                            setSavedEdit((p) => {
                              const next = { ...p, experiences: { ...p.experiences } };
                              next.experiences[row.id] = row;
                              return next;
                            })
                          }
                        >
                          Сбросить
                        </button>
                      </>
                    ) : null}
                    {onDeleteExperience && row.id != null ? (
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => onDeleteExperience(row.id)}
                      >
                        Удалить из профиля
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </SavedRecordsSection>
        ) : null}
      </div>

      <div className="extended-block">
        <div className="extended-block__head">
          <h3 className="extended-block__title">Учебное заведение (institution)</h3>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() =>
              setForm((p) => ({
                ...p,
                institutionRows: [
                  ...p.institutionRows,
                  {
                    educationId: '',
                    startYear: '',
                    endYear: '',
                  },
                ],
              }))
            }
          >
            + Добавить
          </button>
        </div>
        {form.institutionRows.length === 0 ? (
          <p className="extended-block__empty">Пока нет новых строк — нажмите «+ Добавить»</p>
        ) : (
          form.institutionRows.map((row, idx) => (
            <div key={idx} className="extended-block__row">
              <div className="form-row">
                <div className="field" style={{ minWidth: 200, flex: 1 }}>
                  <label>Education (заведение)</label>
                  <select
                    value={row.educationId ?? ''}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.institutionRows];
                        next[idx] = { ...next[idx], educationId: e.target.value };
                        return { ...p, institutionRows: next };
                      })
                    }
                  >
                    <option value="">Не выбрано</option>
                    {(educationOptions ?? []).map((ed) => (
                      <option key={ed.id} value={String(ed.id)}>
                        {ed.institution || `Education #${ed.id}`} (ID: {ed.id})
                      </option>
                    ))}
                  </select>
                </div>
                <YearSelect
                  id={`institution-start-${idx}`}
                  label="Год начала"
                  value={String(row.startYear ?? '')}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...p.institutionRows];
                      next[idx] = { ...next[idx], startYear: v };
                      return { ...p, institutionRows: next };
                    })
                  }
                />
                <YearSelect
                  id={`institution-end-${idx}`}
                  label="Год окончания"
                  value={String(row.endYear ?? '')}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...p.institutionRows];
                      next[idx] = { ...next[idx], endYear: v };
                      return { ...p, institutionRows: next };
                    })
                  }
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      institutionRows: p.institutionRows.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Убрать строку
                </button>
              </div>
            </div>
          ))
        )}
        {editMode && onCommitInstitutions ? (
          <div className="extended-block__commit">
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={committingInstitution}
              onClick={onCommitInstitutions}
            >
              {committingInstitution ? 'Отправка…' : 'Добавить новые в профиль'}
            </button>
          </div>
        ) : null}
        {editMode && existingInstitutions?.length ? (
          <SavedRecordsSection count={existingInstitutions.length} label="Уже в профиле — обучение">
            {existingInstitutions.map((raw) => {
              const row = normalizeInstitution(raw);
              const kid = row.id != null ? `i-${row.id}` : `i-${row.educationId || row.startYear}`;
              const canEdit = row.id != null && typeof onUpdateInstitution === 'function';
              const current =
                row.id != null && savedEdit.institutions[row.id]
                  ? savedEdit.institutions[row.id]
                  : row;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field" style={{ minWidth: 200, flex: 1 }}>
                      <label>Education (заведение)</label>
                      <select
                        disabled={!canEdit}
                        value={current.educationId ?? ''}
                        onChange={(e) => {
                          if (!canEdit) return;
                          const v = e.target.value;
                          setSavedEdit((p) => ({
                            ...p,
                            institutions: {
                              ...p.institutions,
                              [row.id]: { ...current, educationId: v },
                            },
                          }));
                        }}
                      >
                        <option value="">Не выбрано</option>
                        {(educationOptions ?? []).map((ed) => (
                          <option key={ed.id} value={String(ed.id)}>
                            {ed.institution || `Education #${ed.id}`} (ID: {ed.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <YearSelect
                      id={`institution-saved-start-${row.id}`}
                      label="Год начала"
                      value={String(current.startYear ?? '')}
                      disabled={!canEdit}
                      onChange={(v) => {
                        if (!canEdit) return;
                        setSavedEdit((p) => ({
                          ...p,
                          institutions: {
                            ...p.institutions,
                            [row.id]: { ...current, startYear: v },
                          },
                        }));
                      }}
                    />
                    <YearSelect
                      id={`institution-saved-end-${row.id}`}
                      label="Год окончания"
                      value={String(current.endYear ?? '')}
                      disabled={!canEdit}
                      onChange={(v) => {
                        if (!canEdit) return;
                        setSavedEdit((p) => ({
                          ...p,
                          institutions: {
                            ...p.institutions,
                            [row.id]: { ...current, endYear: v },
                          },
                        }));
                      }}
                    />
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          onClick={() => onUpdateInstitution(row.id, current)}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() =>
                            setSavedEdit((p) => {
                              const next = { ...p, institutions: { ...p.institutions } };
                              next.institutions[row.id] = row;
                              return next;
                            })
                          }
                        >
                          Сбросить
                        </button>
                      </>
                    ) : null}
                    {onDeleteInstitution && row.id != null ? (
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => onDeleteInstitution(row.id)}
                      >
                        Удалить из профиля
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </SavedRecordsSection>
        ) : null}
      </div>

      <div className="extended-block">
        <div className="extended-block__head">
          <h3 className="extended-block__title">Education</h3>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() =>
              setForm((p) => ({
                ...p,
                educationRows: [
                  ...(p.educationRows ?? []),
                  { institution: '', webUrl: '', additionalInfo: '' },
                ],
              }))
            }
          >
            + Добавить
          </button>
        </div>

        {!form.educationRows?.length ? (
          <p className="extended-block__empty">Пока нет новых строк — нажмите «+ Добавить»</p>
        ) : (
          form.educationRows.map((row, idx) => (
            <div key={idx} className="extended-block__row">
              <div className="form-row">
                <div className="field" style={{ minWidth: 220, flex: 1 }}>
                  <label>Учреждение</label>
                  <input
                    value={row.institution ?? ''}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.educationRows];
                        next[idx] = { ...next[idx], institution: e.target.value };
                        return { ...p, educationRows: next };
                      })
                    }
                  />
                </div>
                <div className="field" style={{ minWidth: 220, flex: 1 }}>
                  <label>Сайт</label>
                  <input
                    value={row.webUrl ?? ''}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.educationRows];
                        next[idx] = { ...next[idx], webUrl: e.target.value };
                        return { ...p, educationRows: next };
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{ minWidth: 240, flex: 1 }}>
                  <TextAreaWithToolbar
                    label="Доп. информация"
                    id={`education-draft-${idx}`}
                    value={row.additionalInfo ?? ''}
                    onChange={(v) =>
                      setForm((p) => {
                        const next = [...p.educationRows];
                        next[idx] = { ...next[idx], additionalInfo: v };
                        return { ...p, educationRows: next };
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      educationRows: p.educationRows.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Убрать строку
                </button>
              </div>
            </div>
          ))
        )}

        {editMode && onCommitEducations ? (
          <div className="extended-block__commit">
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={committingEducation}
              onClick={onCommitEducations}
            >
              {committingEducation ? 'Отправка…' : 'Добавить новые в справочник'}
            </button>
          </div>
        ) : null}

        {editMode && existingEducations?.length ? (
          <SavedRecordsSection count={existingEducations.length} label="Уже в справочнике — education">
            {existingEducations.map((raw) => {
              const row = normalizeEducation(raw);
              const kid = row.id != null ? `ed-${row.id}` : `ed-${row.institution}`;
              const canEdit = row.id != null && typeof onUpdateEducation === 'function';
              const current =
                row.id != null && savedEdit.educations[row.id]
                  ? savedEdit.educations[row.id]
                  : row;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field" style={{ minWidth: 220, flex: 1 }}>
                      <label>Учреждение</label>
                      <input
                        readOnly={!canEdit}
                        value={current.institution}
                        onChange={(e) => {
                          if (!canEdit) return;
                          const v = e.target.value;
                          setSavedEdit((p) => ({
                            ...p,
                            educations: {
                              ...p.educations,
                              [row.id]: { ...current, institution: v },
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="field" style={{ minWidth: 220, flex: 1 }}>
                      <label>Сайт</label>
                      <input
                        readOnly={!canEdit}
                        value={current.webUrl}
                        onChange={(e) => {
                          if (!canEdit) return;
                          const v = e.target.value;
                          setSavedEdit((p) => ({
                            ...p,
                            educations: {
                              ...p.educations,
                              [row.id]: { ...current, webUrl: v },
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field" style={{ minWidth: 240, flex: 1 }}>
                      <TextAreaWithToolbar
                        label="Доп. информация"
                        id={`education-saved-${row.id}`}
                        readOnly={!canEdit}
                        value={current.additionalInfo}
                        onChange={(v) => {
                          if (!canEdit) return;
                          setSavedEdit((p) => ({
                            ...p,
                            educations: {
                              ...p.educations,
                              [row.id]: { ...current, additionalInfo: v },
                            },
                          }));
                        }}
                      />
                    </div>
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          onClick={() => onUpdateEducation(row.id, current)}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() =>
                            setSavedEdit((p) => {
                              const next = { ...p, educations: { ...p.educations } };
                              next.educations[row.id] = row;
                              return next;
                            })
                          }
                        >
                          Сбросить
                        </button>
                      </>
                    ) : null}
                    {onDeleteEducation && row.id != null ? (
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => onDeleteEducation(row.id)}
                      >
                        Удалить
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </SavedRecordsSection>
        ) : null}
      </div>

    </div>
  );
}
