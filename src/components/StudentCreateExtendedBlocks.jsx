/**
 * Необязательные блоки для создания студента (расширенный POST).
 * Пустые / неполные строки в API не отправляются.
 */
export function StudentCreateExtendedBlocks({ form, setForm }) {
  return (
    <div className="extended-blocks">
      <p className="extended-blocks__lead">
        Ниже — необязательные блоки. Пустые или неполные строки в запрос не попадают.
      </p>

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
          <p className="extended-block__empty">Пока нет записей</p>
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
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
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
          <p className="extended-block__empty">Пока нет записей</p>
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
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
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
          <p className="extended-block__empty">Пока нет записей</p>
        ) : (
          form.institutionRows.map((row, idx) => (
            <div key={idx} className="extended-block__row">
              <div className="form-row">
                <div className="field">
                  <label>Education ID</label>
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
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
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
          <p className="extended-block__empty">Пока нет записей</p>
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
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
