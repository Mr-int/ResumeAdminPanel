/** Собирает тела для POST /student/extended из строк формы (без JSON). */
export function buildExtendedNestedBodies(form) {
  const portfolios = form.portfolioRows
    .filter((r) => r.name?.trim())
    .map((r) => ({
      id: 0,
      name: r.name.trim(),
      link: (r.link || '').trim(),
      additionalInfo: (r.additionalInfo || '').trim(),
    }));

  const experiences = form.experienceRows
    .filter(
      (r) =>
        r.position?.trim() &&
        (r.companyName ?? r.company ?? '').trim()
    )
    .map((r) => {
      const cn = (r.companyName ?? r.company ?? '').trim();
      return {
        companyId: 0,
        companyName: cn,
        company: cn,
        position: r.position.trim(),
        additionalInfo: (r.additionalInfo || '').trim(),
        startDate: r.startDate || '',
        endDate: r.endDate || '',
      };
    });

  const institutions = form.institutionRows
    .filter(
      (r) =>
        (r.institutionName ?? r.institution ?? '').trim() &&
        r.startYear !== '' &&
        r.endYear !== '' &&
        !Number.isNaN(Number(r.startYear)) &&
        !Number.isNaN(Number(r.endYear))
    )
    .map((r) => {
      const nm = (r.institutionName ?? r.institution ?? '').trim();
      return {
        educationId: 0,
        institutionName: nm,
        institution: nm,
        startYear: Number(r.startYear),
        endYear: Number(r.endYear),
      };
    });

  const educations = form.educationRows
    .filter((r) => r.institution?.trim())
    .map((r) => ({
      id: 0,
      institution: r.institution.trim(),
      additionalInfo: (r.additionalInfo || '').trim(),
      webUrl: (r.webUrl || '').trim(),
    }));

  return { portfolios, experiences, institutions, educations };
}
