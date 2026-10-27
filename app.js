const elements = {
  rows: document.querySelector('#student-rows'),
  search: document.querySelector('#search-input'),
  modal: document.querySelector('#student-modal'),
  form: document.querySelector('#student-form'),
  formError: document.querySelector('#form-error'),
  modalTitle: document.querySelector('#modal-title'),
  modalSubtitle: document.querySelector('#modal-subtitle'),
  submitLabel: document.querySelector('#submit-label'),
  submitButton: document.querySelector('#submit-button'),
  submitSpinner: document.querySelector('#submit-spinner'),
  toast: document.querySelector('#toast'),
};

const avatarColors = [
  ['#eeeaff', '#6655d8'],
  ['#e8f7ef', '#39845f'],
  ['#fff0e4', '#ce8243'],
  ['#e8f2ff', '#4b78bb'],
  ['#fbeaf1', '#bb587e'],
];
let students = [];
let editingStudentId = null;
let toastTimer;

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast show${type === 'success' ? '' : ` ${type}`}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 3200);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

function setConnectionStatus(connected) {
  const dot = document.querySelector('#connection-dot');
  const label = document.querySelector('#connection-label');
  dot.classList.toggle('offline', !connected);
  label.textContent = connected ? 'MySQL connected' : 'Database unavailable';
}

function renderStudents() {
  const query = elements.search.value.trim().toLowerCase();
  const filtered = students.filter((student) => [
    student.name, student.email, student.course, String(student.student_id), String(student.semester),
  ].some((value) => value.toLowerCase().includes(query)));

  document.querySelector('#total-count').textContent = students.length;
  document.querySelector('#course-count').textContent = new Set(students.map((student) => student.course.toLowerCase())).size;
  document.querySelector('#semester-count').textContent = new Set(students.map((student) => student.semester)).size;
  document.querySelector('#records-count').textContent = filtered.length;
  document.querySelector('#nav-count').textContent = students.length;
  document.querySelector('#table-summary').textContent = query
    ? `Showing ${filtered.length} of ${students.length} students`
    : `Showing ${students.length} student${students.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    const title = students.length === 0 ? 'Your directory is ready' : 'No students found';
    const description = students.length === 0
      ? 'Add your first student to get started.'
      : 'Try a different name, email, course, or ID.';
    elements.rows.innerHTML = `<tr><td class="empty-cell" colspan="5"><div class="empty-state"><strong>${title}</strong><span>${description}</span></div></td></tr>`;
    return;
  }

  elements.rows.innerHTML = filtered.map((student) => {
    const [background, foreground] = avatarColors[Math.abs(Number(student.student_id)) % avatarColors.length];
    return `<tr>
      <td><div class="student-cell"><div class="student-avatar" style="background:${background};color:${foreground}">${escapeHtml(initials(student.name))}</div><div><div class="student-name">${escapeHtml(student.name)}</div><div class="student-email">${escapeHtml(student.email)}</div></div></div></td>
      <td><span class="id-pill">#${escapeHtml(student.student_id)}</span></td>
      <td><span class="course-label">${escapeHtml(student.course)}</span></td>
      <td><span class="semester-pill">Semester ${escapeHtml(student.semester)}</span></td>
      <td><div class="row-actions">
        <button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(student.student_id)}" aria-label="Edit ${escapeHtml(student.name)}" title="Edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button>
        <button class="row-action delete" type="button" data-action="delete" data-id="${escapeHtml(student.student_id)}" aria-label="Delete ${escapeHtml(student.name)}" title="Delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
}

async function loadStudents() {
  elements.rows.innerHTML = '<tr><td class="loading-cell" colspan="5"><span class="spinner"></span> Loading student records...</td></tr>';
  try {
    const payload = await requestJson('/api/students');
    students = payload.students;
    setConnectionStatus(true);
    renderStudents();
  } catch (error) {
    students = [];
    setConnectionStatus(false);
    renderStudents();
    elements.rows.innerHTML = `<tr><td class="empty-cell" colspan="5"><div class="empty-state"><strong>Could not load student records</strong><span>${escapeHtml(error.message)} Check your MySQL server and settings.</span></div></td></tr>`;
    showToast(error.message, 'error');
  }
}

function openModal(student = null) {
  editingStudentId = student ? Number(student.student_id) : null;
  elements.form.reset();
  elements.formError.hidden = true;
  elements.formError.textContent = '';
  elements.modalTitle.textContent = student ? 'Edit student' : 'Add a student';
  elements.modalSubtitle.textContent = student ? 'Update this student’s directory record.' : 'Add a new record to your directory.';
  elements.submitLabel.textContent = student ? 'Save changes' : 'Add student';
  document.querySelector('#student-id').disabled = Boolean(student);
  if (student) {
    document.querySelector('#student-id').value = student.student_id;
    document.querySelector('#student-name').value = student.name;
    document.querySelector('#student-email').value = student.email;
    document.querySelector('#student-course').value = student.course;
    document.querySelector('#student-semester').value = student.semester;
  }
  elements.modal.hidden = false;
  document.querySelector('#student-name').focus();
}

function closeModal() {
  elements.modal.hidden = true;
  elements.formError.hidden = true;
  document.querySelector('#student-id').disabled = false;
}

function setSubmitting(isSubmitting) {
  elements.submitButton.disabled = isSubmitting;
  elements.submitSpinner.hidden = !isSubmitting;
  elements.submitLabel.textContent = isSubmitting ? 'Saving...' : (editingStudentId ? 'Save changes' : 'Add student');
}

async function submitStudent(event) {
  event.preventDefault();
  elements.formError.hidden = true;
  const formData = new FormData(elements.form);
  const student = Object.fromEntries(formData.entries());
  student.student_id = Number(student.student_id);
  student.semester = Number(student.semester);
  setSubmitting(true);
  try {
    if (editingStudentId) {
      await requestJson(`/api/students/${editingStudentId}`, { method: 'PUT', body: JSON.stringify(student) });
      showToast('Student record updated.');
    } else {
      await requestJson('/api/students', { method: 'POST', body: JSON.stringify(student) });
      showToast('Student added to your directory.');
    }
    closeModal();
    await loadStudents();
  } catch (error) {
    elements.formError.textContent = error.message;
    elements.formError.hidden = false;
  } finally {
    setSubmitting(false);
  }
}

async function deleteStudent(student) {
  const confirmed = window.confirm(`Delete ${student.name} from the student directory? This cannot be undone.`);
  if (!confirmed) return;
  try {
    await requestJson(`/api/students/${student.student_id}`, { method: 'DELETE' });
    showToast('Student record deleted.');
    await loadStudents();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

document.querySelector('#add-student-button').addEventListener('click', () => openModal());
document.querySelector('#close-modal').addEventListener('click', closeModal);
document.querySelector('#cancel-modal').addEventListener('click', closeModal);
document.querySelector('#refresh-button').addEventListener('click', loadStudents);
elements.search.addEventListener('input', renderStudents);
elements.form.addEventListener('submit', submitStudent);
elements.rows.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const student = students.find((item) => Number(item.student_id) === Number(button.dataset.id));
  if (!student) return;
  if (button.dataset.action === 'edit') openModal(student);
  if (button.dataset.action === 'delete') deleteStudent(student);
});
elements.modal.addEventListener('click', (event) => {
  if (event.target === elements.modal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !elements.modal.hidden) closeModal();
  if (event.key === '/' && elements.modal.hidden && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.search.focus();
  }
});
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date());
loadStudents();
