import { fromApiDateTime, toApiDateTime } from '../utils/dateTimeApi.js';

export function emptyRecruitmentForm() {
  return {
    companyName: '',
    tasks: '',
    qualificationRequirements: '',
    workConditions: '',
    studentCount: '1',
    cooperationFormat: '',
    readyToRequestStudents: '',
    scheduleNote: '',
    extraInfo: '',
    publishedFrom: '',
    publishedTo: '',
    specialityIds: [],
    cityIds: [],
  };
}

export function formFromRequest(row) {
  let ready = '';
  if (row?.readyToRequestStudents === true) ready = 'yes';
  if (row?.readyToRequestStudents === false) ready = 'no';
  return {
    companyName: row?.companyName ?? '',
    tasks: row?.tasks ?? '',
    qualificationRequirements: row?.qualificationRequirements ?? '',
    workConditions: row?.workConditions ?? '',
    studentCount: String(row?.studentCount ?? 1),
    cooperationFormat: row?.cooperationFormat ?? '',
    readyToRequestStudents: ready,
    scheduleNote: row?.scheduleNote ?? '',
    extraInfo: row?.extraInfo ?? '',
    publishedFrom: fromApiDateTime(row?.publishedFrom),
    publishedTo: fromApiDateTime(row?.publishedTo),
    specialityIds: (row?.specialityIds ?? []).map(Number).filter((id) => Number.isFinite(id)),
    cityIds: (row?.cityIds ?? []).map(Number).filter((id) => Number.isFinite(id)),
  };
}

function uniquePositiveIds(ids) {
  const unique = [];
  const seen = new Set();
  for (const raw of ids ?? []) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }
  return unique;
}

export function payloadFromForm(form) {
  const companyName = form.companyName?.trim() ?? '';
  const tasks = form.tasks?.trim() ?? '';
  const qualificationRequirements = form.qualificationRequirements?.trim() ?? '';
  const workConditions = form.workConditions?.trim() ?? '';
  const studentCount = Number(form.studentCount);
  const specialityIds = uniquePositiveIds(form.specialityIds);
  const cityIds = uniquePositiveIds(form.cityIds);
  const publishedFrom = toApiDateTime(form.publishedFrom);
  const publishedTo = toApiDateTime(form.publishedTo);

  if (!companyName) throw new Error('Укажите название компании');
  if (!tasks || !qualificationRequirements || !workConditions) {
    throw new Error('Заполните задачи, требования и условия работы');
  }
  if (!Number.isInteger(studentCount) || studentCount < 1) {
    throw new Error('Укажите число студентов от 1');
  }
  if (!specialityIds.length) throw new Error('Выберите хотя бы одну специальность');
  if (!cityIds.length) throw new Error('Выберите хотя бы один город');
  if (publishedFrom && publishedTo && publishedFrom > publishedTo) {
    throw new Error('Начало публикации позже её конца');
  }

  let readyToRequestStudents = null;
  if (form.readyToRequestStudents === 'yes') readyToRequestStudents = true;
  if (form.readyToRequestStudents === 'no') readyToRequestStudents = false;

  return {
    companyName,
    tasks,
    qualificationRequirements,
    workConditions,
    studentCount,
    cooperationFormat: form.cooperationFormat || null,
    readyToRequestStudents,
    scheduleNote: form.scheduleNote?.trim() || null,
    extraInfo: form.extraInfo?.trim() || null,
    publishedFrom,
    publishedTo,
    specialityIds,
    cityIds,
  };
}
