/**
 * Блоки портфолио / опыт / institution / education.
 * Режим создания: только черновики (уходят в POST /student/extended).
 * Режим редактирования: черновики + кнопка «Добавить в профиль» + снизу уже сохранённые строки с удалением.
 */

function normalizePortfolio(raw) {
  return {
    id: raw?.id,
    name: raw?.name ?? '',
    link: raw?.link ?? '',
    additionalInfo: raw?.additionalInfo ?? '',
  };
}

function normalizeExperience(raw) {
  const e = raw?.experience && typeof raw.experience === 'object' ? raw.experience : raw;
  return {
    id: raw?.id,
    companyId: raw?.companyId != null ? String(raw.companyId) : '',
    position: e?.position ?? raw?.position ?? '',
    additionalInfo: e?.additionalInfo ?? raw?.additionalInfo ?? '',
    startDate: e?.startDate ?? raw?.startDate ?? '',
    endDate: e?.endDate ?? raw?.endDate ?? '',
  };
}

function normalizeInstitution(raw) {
  const ins = raw?.institution && typeof raw.institution === 'object' ? raw.institution : raw;
  return {
    id: raw?.id,
    educationId: raw?.educationId != null ? String(raw.educationId) : '',
    startYear: ins?.startYear ?? raw?.startYear ?? '',
    endYear: ins?.endYear ?? raw?.endYear ?? '',
  };
}

function normalizeEducation(raw) {
  return {
    id: raw?.id,
    institution: raw?.institution ?? '',
    webUrl: raw?.webUrl ?? '',
    additionalInfo: raw?.additionalInfo ?? '',
  };
}

export function StudentCreateExtendedBlocks({
  form,
  setForm,
  showLead = true,
  editMode = false,
  editLeadText = '',
  existingPortfolios = [],
  onDeletePortfolio,
  onCommitPortfolios,
  committingPortfolio = false,
  existingExperiences = [],
  onDeleteExperience,
  onCommitExperiences,
  committingExperience = false,
  existingInstitutions = [],
  onDeleteInstitution,
  onCommitInstitutions,
  committingInstitution = false,
  existingEducations = [],
  onDeleteEducation,
  onCommitEducations,
  committingEducation = false,
}) {
  return (
    <div className="extended-blocks">
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
                  <label>Доп. информация</label>
                  <input
                    value={row.additionalInfo}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.portfolioRows];
                        next[idx] = {
                          ...next[idx],
                          additionalInfo: e.target.value,
                        };
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
          <>
            <p className="extended-block__saved">Уже в профиле</p>
            {existingPortfolios.map((raw) => {
              const row = normalizePortfolio(raw);
              const kid = row.id != null ? `p-${row.id}` : `p-${row.name}`;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 140 }}>
                      <label>Название</label>
                      <input readOnly value={row.name} />
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 140 }}>
                      <label>Ссылка</label>
                      <input readOnly value={row.link} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 200 }}>
                      <label>Доп. информация</label>
                      <input readOnly value={row.additionalInfo} />
                    </div>
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
          </>
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
                <div className="field">
                  <label>ID компании</label>
                  <input
                    type="number"
                    min="0"
                    value={row.companyId}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = {
                          ...next[idx],
                          companyId: e.target.value,
                        };
                        return { ...p, experienceRows: next };
                      })
                    }
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
                <div className="field">
                  <label>С даты</label>
                  <input
                    type="date"
                    value={row.startDate}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = {
                          ...next[idx],
                          startDate: e.target.value,
                        };
                        return { ...p, experienceRows: next };
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>По дату</label>
                  <input
                    type="date"
                    value={row.endDate}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = {
                          ...next[idx],
                          endDate: e.target.value,
                        };
                        return { ...p, experienceRows: next };
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 200 }}>
                  <label>Доп. информация</label>
                  <input
                    value={row.additionalInfo}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.experienceRows];
                        next[idx] = {
                          ...next[idx],
                          additionalInfo: e.target.value,
                        };
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
          <>
            <p className="extended-block__saved">Уже в профиле</p>
            {existingExperiences.map((raw) => {
              const row = normalizeExperience(raw);
              const kid = row.id != null ? `e-${row.id}` : `e-${row.position}`;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field">
                      <label>ID компании</label>
                      <input readOnly value={row.companyId} />
                    </div>
                    <div className="field" style={{ minWidth: 160, flex: 1 }}>
                      <label>Должность</label>
                      <input readOnly value={row.position} />
                    </div>
                    <div className="field">
                      <label>С даты</label>
                      <input readOnly value={row.startDate} />
                    </div>
                    <div className="field">
                      <label>По дату</label>
                      <input readOnly value={row.endDate} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 200 }}>
                      <label>Доп. информация</label>
                      <input readOnly value={row.additionalInfo} />
                    </div>
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
          </>
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
                <div className="field">
                  <label>ID образования (education)</label>
                  <input
                    type="number"
                    min="0"
                    value={row.educationId}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.institutionRows];
                        next[idx] = {
                          ...next[idx],
                          educationId: e.target.value,
                        };
                        return { ...p, institutionRows: next };
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>Год начала</label>
                  <input
                    type="number"
                    min="1900"
                    value={row.startYear}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.institutionRows];
                        next[idx] = {
                          ...next[idx],
                          startYear: e.target.value,
                        };
                        return { ...p, institutionRows: next };
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>Год окончания</label>
                  <input
                    type="number"
                    min="1900"
                    value={row.endYear}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.institutionRows];
                        next[idx] = {
                          ...next[idx],
                          endYear: e.target.value,
                        };
                        return { ...p, institutionRows: next };
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
          <>
            <p className="extended-block__saved">Уже в профиле</p>
            {existingInstitutions.map((raw) => {
              const row = normalizeInstitution(raw);
              const kid = row.id != null ? `i-${row.id}` : `i-${row.educationId}`;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field">
                      <label>ID образования (education)</label>
                      <input readOnly value={row.educationId} />
                    </div>
                    <div className="field">
                      <label>Год начала</label>
                      <input readOnly value={row.startYear} />
                    </div>
                    <div className="field">
                      <label>Год окончания</label>
                      <input readOnly value={row.endYear} />
                    </div>
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
          </>
        ) : null}
      </div>

      <div className="extended-block">
        <div className="extended-block__head">
          <h3 className="extended-block__title">Образование (education)</h3>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() =>
              setForm((p) => ({
                ...p,
                educationRows: [
                  ...p.educationRows,
                  {
                    institution: '',
                    additionalInfo: '',
                    webUrl: '',
                  },
                ],
              }))
            }
          >
            + Добавить
          </button>
        </div>
        {form.educationRows.length === 0 ? (
          <p className="extended-block__empty">Пока нет новых строк — нажмите «+ Добавить»</p>
        ) : (
          form.educationRows.map((row, idx) => (
            <div key={idx} className="extended-block__row">
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 180 }}>
                  <label>Заведение</label>
                  <input
                    value={row.institution}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.educationRows];
                        next[idx] = {
                          ...next[idx],
                          institution: e.target.value,
                        };
                        return { ...p, educationRows: next };
                      })
                    }
                  />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label>Сайт</label>
                  <input
                    value={row.webUrl}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.educationRows];
                        next[idx] = {
                          ...next[idx],
                          webUrl: e.target.value,
                        };
                        return { ...p, educationRows: next };
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 200 }}>
                  <label>Доп. информация</label>
                  <input
                    value={row.additionalInfo}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = [...p.educationRows];
                        next[idx] = {
                          ...next[idx],
                          additionalInfo: e.target.value,
                        };
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
              {committingEducation ? 'Отправка…' : 'Добавить новые в профиль'}
            </button>
          </div>
        ) : null}
        {editMode && existingEducations?.length ? (
          <>
            <p className="extended-block__saved">Уже в профиле</p>
            {existingEducations.map((raw) => {
              const row = normalizeEducation(raw);
              const kid = row.id != null ? `ed-${row.id}` : `ed-${row.institution}`;
              return (
                <div key={kid} className="extended-block__row extended-block__row--saved">
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 180 }}>
                      <label>Заведение</label>
                      <input readOnly value={row.institution} />
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 140 }}>
                      <label>Сайт</label>
                      <input readOnly value={row.webUrl} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field" style={{ flex: 1, minWidth: 200 }}>
                      <label>Доп. информация</label>
                      <input readOnly value={row.additionalInfo} />
                    </div>
                    {onDeleteEducation && row.id != null ? (
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => onDeleteEducation(row.id)}
                      >
                        Удалить из профиля
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}
