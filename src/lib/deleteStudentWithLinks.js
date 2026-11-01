async function deleteAllByFilter(filterFn, deleteFn, filter) {
  const safeList = (res) => {
    const v = res?.data?.data ?? res?.data ?? [];
    return Array.isArray(v) ? v : [];
  };
  for (let i = 0; i < 10; i += 1) {
    const { data } = await filterFn(filter, 0, 200);
    const rows = safeList({ data });
    if (!rows.length) return;
    for (const row of rows) {
      const rid = row && typeof row === 'object' && 'id' in row ? row.id : row;
      const idStr = rid == null ? '' : String(rid).trim();
      if (!idStr || idStr.toLowerCase() === 'nan' || idStr === '[object Object]') continue;
      await deleteFn(idStr);
    }
  }
}

export async function deleteStudentWithLinks(studentId, apis, onStatus) {
  try {
    await apis.studentsApi.deleteStudent(studentId);
  } catch (error) {
    const msg = String(error?.message ?? '');
    if (!(msg.includes('409') || msg.toLowerCase().includes('conflict'))) {
      throw error;
    }
    onStatus?.('Удаляем связанные данные…');
    const sid = String(studentId);
    await deleteAllByFilter(apis.requestsApi.filterRequests, apis.requestsApi.deleteRequest, { studentId: sid });
    await deleteAllByFilter(apis.portfolioApi.filterPortfolio, apis.portfolioApi.deletePortfolio, { studentId: sid });
    await deleteAllByFilter(apis.experienceApi.filterExperience, apis.experienceApi.deleteExperience, { studentId: sid });
    await deleteAllByFilter(
      apis.institutionApi.filterInstitutions,
      apis.institutionApi.deleteInstitution,
      { studentId: sid },
    );
    await apis.studentsApi.deleteStudent(studentId);
    onStatus?.(null);
  }
}
