const DAY = 86_400_000;
const dateFromToday = offset => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const tasks = [
  { id:'SMEO-2481', title:'Обновление образа Istio', description:'Подготовить и согласовать обновление образа сервисной сетки в продуктивном контуре.', service:'БХБ161 Управление бизнес-функциями', leader:'Анна Нестерова', type:'МПР', okr:'Надёжность', created:dateFromToday(-19), deadline:dateFromToday(3), related:[{id:'SMEP-914',status:'In Progress'},{id:'THETA-302',status:'In Review'}], status:'Выполнение' },
  { id:'SMEO-2457', title:'Уточнить маршрут обработки событий', description:'Собрать требования к обработке ошибок и подтвердить сценарий с владельцем услуги.', service:'БХБ162 Интеграционная платформа', leader:'Илья Морозов', type:'ЗПП', okr:'Зелёный коридор', created:dateFromToday(-8), deadline:dateFromToday(16), related:[], status:'Уточнение' },
  { id:'SMEO-2442', title:'План миграции конфигурации', description:'Определить этапы переноса и контрольные точки для тестового контура.', service:'БХБ161 Управление бизнес-функциями', leader:'Анна Нестерова', type:'МПР', okr:'Надёжность', created:dateFromToday(-12), deadline:dateFromToday(23), related:[{id:'ATOM-118',status:'To Do'}], status:'Планирование' },
  { id:'SMEO-2396', title:'Проверка восстановления сервиса', description:'Результаты проверки приняты, осталось подтвердить закрытие и приложить отчёт.', service:'БХБ163 Мониторинг сервисов', leader:'Мария Соколова', type:'Проблема', okr:'Надёжность', created:dateFromToday(-31), deadline:dateFromToday(12), related:[], status:'Закрытие' },
  { id:'SMEO-2490', title:'Настроить мониторинг задержек', description:'Добавить метрики задержки и уведомления для основных бизнес-операций.', service:'БХБ163 Мониторинг сервисов', leader:'Мария Соколова', type:'ЗПП', okr:'Зелёный коридор', created:dateFromToday(-4), deadline:dateFromToday(20), related:[], status:'Выполнение' },
  { id:'SMEO-2368', title:'Разбор повторяющихся ошибок API', description:'Сопоставить события с задачами смежной команды и проверить исправление.', service:'БХБ162 Интеграционная платформа', leader:'Илья Морозов', type:'Инцидент', okr:'Надёжность', created:dateFromToday(-17), deadline:dateFromToday(26), related:[{id:'THETA-541',status:'Blocked'},{id:'ATOM-206',status:'Done'}], status:'Выполнение' },
  { id:'SMEO-2214', title:'Обновить правила проверки доступности', description:'Проверка выполнена, изменения внедрены и подтверждены владельцем услуги.', service:'БХБ161 Управление бизнес-функциями', leader:'Анна Нестерова', type:'МПР', okr:'Надёжность', created:dateFromToday(-46), deadline:dateFromToday(-13), related:[], status:'Архивная', closed:dateFromToday(-8) }
];

const $ = selector => document.querySelector(selector);
const storageKey = 'fuss-archived-tasks-v1';
let savedArchive = {};
try { savedArchive = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { savedArchive = {}; }
for (const task of tasks) {
  if (savedArchive[task.id]) { task.status = 'Архивная'; task.closed = savedArchive[task.id]; }
}
let currentTab = 'active';
let currentFilter = 'all';
let query = '';

const formatDate = value => new Intl.DateTimeFormat('ru-RU', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(`${value}T12:00:00`));
const daysLeft = value => {
  const today = new Date(); today.setHours(12,0,0,0);
  return Math.round((new Date(`${value}T12:00:00`) - today) / DAY);
};
const isUrgent = task => task.status !== 'Архивная' && daysLeft(task.deadline) <= 7;
const taskGroup = task => {
  if (task.status === 'Архивная') return 'archived';
  if (isUrgent(task)) return 'urgent';
  if (task.status === 'Уточнение') return 'clarification';
  if (task.status === 'Планирование') return 'planning';
  if (task.status === 'Закрытие') return 'closing';
  return task.related.length ? 'team' : 'personal';
};
const priority = { urgent:0, clarification:1, planning:2, closing:3, personal:4, team:5, archived:6 };
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const statusClass = status => ({ 'To Do':'todo', 'In Progress':'in-progress', 'In Review':'in-review', 'Done':'done', 'Blocked':'blocked' })[status] || 'todo';

function cardHtml(task) {
  const group = taskGroup(task);
  const related = task.related.length ? `<div class="related-column" aria-label="Связанные задачи"><span class="column-label">Связанные задачи</span>${task.related.map(item => `<div class="related-item"><span class="related-id">${escapeHtml(item.id)}</span><span class="jira-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join('')}</div>` : '';
  const role = task.status === 'Выполнение' ? `<span class="task-dependency">${task.related.length ? 'Командная' : 'Личная'}</span>` : '';
  return `<article class="task-card ${group}${task.related.length ? ' has-related' : ''}" data-task="${escapeHtml(task.id)}" role="button" tabindex="0" aria-haspopup="dialog" aria-label="Открыть задачу ${escapeHtml(task.id)}: ${escapeHtml(task.title)}">
    <div class="task-main"><div class="task-topline"><span class="task-number">${escapeHtml(task.id)}</span><span class="task-status">${escapeHtml(task.status)}</span>${role}</div>
      <h2 class="task-title">${escapeHtml(task.title)}</h2><p class="task-description">${escapeHtml(task.description)}</p>
      <div class="task-bottom"><span class="service">${escapeHtml(task.service)}</span><span class="tag">${escapeHtml(task.type)}</span><span class="tag okr">ОКР: ${escapeHtml(task.okr)}</span></div>
    </div>${related}<div class="task-dates"><div class="date-row"><span>Создана</span><strong>${formatDate(task.created)}</strong></div><div class="date-row deadline"><span>Контрольный срок</span><strong>${formatDate(task.deadline)}</strong></div>${task.status === 'Архивная' ? `<div class="date-row"><span>Закрыта</span><strong>${formatDate(task.closed)}</strong></div>` : ''}<div class="date-row leader-row"><span>Лидер АС</span><strong>${escapeHtml(task.leader)}</strong></div></div></article>`;
}

function render() {
  const active = tasks.filter(task => task.status !== 'Архивная');
  const archived = tasks.filter(task => task.status === 'Архивная');
  $('#stat-active').textContent = active.length;
  $('#stat-urgent').textContent = active.filter(isUrgent).length;
  $('#stat-team').textContent = active.filter(task => task.related.length).length;
  $('#active-count').textContent = active.length;
  $('#archive-count').textContent = archived.length;
  $('#list-heading').textContent = currentTab === 'archive' ? 'Архивные задачи' : 'Текущие задачи';
  $('#sort-caption').textContent = currentTab === 'archive' ? 'По дате закрытия' : 'По приоритету';
  $('#filter-row').hidden = currentTab === 'archive';
  $('#filter-quick-label').hidden = currentTab === 'archive';
  let list = currentTab === 'archive' ? archived : active;
  if (currentTab === 'active') {
    if (currentFilter === 'urgent') list = list.filter(isUrgent);
    if (currentFilter === 'personal') list = list.filter(task => !task.related.length);
    if (currentFilter === 'team') list = list.filter(task => task.related.length);
    list = [...list].sort((a,b) => priority[taskGroup(a)] - priority[taskGroup(b)] || a.deadline.localeCompare(b.deadline));
  } else list = [...list].sort((a,b) => b.closed.localeCompare(a.closed));
  const fieldFilters = { leader:$('#leader-filter').value, service:$('#service-filter').value, status:$('#status-filter').value, type:$('#type-filter').value, okr:$('#okr-filter').value };
  list = list.filter(task => Object.entries(fieldFilters).every(([field,value]) => !value || task[field] === value));
  if (query) list = list.filter(task => [task.id,task.title,task.description,task.service,task.leader,task.type,task.okr,task.status,...task.related.flatMap(item => [item.id,item.status])].some(value => value.toLocaleLowerCase('ru').includes(query)));
  $('#visible-count').textContent = String(list.length).padStart(2,'0');
  $('#task-list').innerHTML = list.length ? list.map(cardHtml).join('') : `<div class="empty-state"><strong>Задачи не найдены</strong><span>Измените запрос или фильтр, чтобы увидеть другие задачи.</span></div>`;
}

function showTask(task) {
  const related = task.related.length ? task.related.map(item => `<div class="dialog-related-item"><span>${escapeHtml(item.id)}</span><span class="jira-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join('') : '<em>Связанных задач нет — задача личная.</em>';
  $('#dialog-content').innerHTML = `<div class="dialog-kicker">${escapeHtml(task.id)} · ${escapeHtml(task.status)}</div><h2 id="dialog-title">${escapeHtml(task.title)}</h2><p class="dialog-description">${escapeHtml(task.description)}</p>
    <div class="dialog-grid"><div class="dialog-field"><span>ИТ-услуга</span><strong>${escapeHtml(task.service)}</strong></div><div class="dialog-field"><span>Лидер АС</span><strong>${escapeHtml(task.leader)}</strong></div><div class="dialog-field"><span>Тип</span><strong>${escapeHtml(task.type)}</strong></div><div class="dialog-field"><span>ОКР</span><strong>${escapeHtml(task.okr)}</strong></div><div class="dialog-field"><span>Дата создания</span><strong>${formatDate(task.created)}</strong></div><div class="dialog-field"><span>Контрольный срок</span><strong>${formatDate(task.deadline)}</strong></div>${task.status === 'Архивная' ? `<div class="dialog-field"><span>Дата закрытия</span><strong>${formatDate(task.closed)}</strong></div>` : ''}</div><div class="dialog-related"><strong>Связанные задачи</strong>${related}</div>${task.status === 'Закрытие' ? `<button type="button" class="archive-action" data-archive="${escapeHtml(task.id)}">Завершить и архивировать →</button>` : ''}`;
  $('#task-dialog').showModal();
}

document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  currentTab = button.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(tab => { tab.classList.toggle('is-active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
  render();
}));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(filter => filter.classList.toggle('is-selected', filter === button));
  render();
}));
for (const field of ['leader','service','status','type','okr']) {
  const select = $(`#${field}-filter`);
  for (const value of [...new Set(tasks.map(task => task[field]))].sort((a,b) => a.localeCompare(b,'ru'))) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
  select.addEventListener('change', render);
}
$('#reset-filters').addEventListener('click', () => {
  for (const field of ['leader','service','status','type','okr']) $(`#${field}-filter`).value = '';
  currentFilter = 'all';
  document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('is-selected', button.dataset.filter === 'all'));
  $('#search-input').value = '';
  query = '';
  render();
});
$('#search-input').addEventListener('input', event => { query = event.target.value.trim().toLocaleLowerCase('ru'); render(); });
$('#task-list').addEventListener('click', event => {
  const card = event.target.closest('.task-card');
  if (card) showTask(tasks.find(task => task.id === card.dataset.task));
});
$('#task-list').addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key) || !event.target.matches('.task-card')) return;
  event.preventDefault();
  showTask(tasks.find(task => task.id === event.target.dataset.task));
});
$('#dialog-close').addEventListener('click', () => $('#task-dialog').close());
$('#task-dialog').addEventListener('click', event => { if (event.target === $('#task-dialog')) $('#task-dialog').close(); });
$('#task-dialog').addEventListener('click', event => {
  const button = event.target.closest('[data-archive]');
  if (!button) return;
  const task = tasks.find(item => item.id === button.dataset.archive);
  if (!task || task.status !== 'Закрытие') return;
  task.status = 'Архивная'; task.closed = dateFromToday(0);
  savedArchive[task.id] = task.closed;
  try { localStorage.setItem(storageKey, JSON.stringify(savedArchive)); } catch {}
  $('#task-dialog').close();
  render();
});

const sections = {
  dashboard: { title:'Дашборд', description:'Сводка по задачам и показателям появится здесь.' },
  tasks: { title:'Задачи' },
  infrastructure: { title:'Инфраструктура', description:'Здесь появятся инфраструктурные объекты и их состояние.' },
  reliability: { title:'Надёжность', description:'Здесь появятся показатели надёжности ИТ-услуг.' }
};
function openSection(section) {
  document.body.dataset.view = section;
  document.querySelectorAll('[data-section]').forEach(button => {
    const current = button.dataset.section === section;
    button.classList.toggle('is-current', current);
    if (current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#tasks-view').hidden = section !== 'tasks';
  $('#section-placeholder').hidden = section === 'tasks';
  if (section !== 'tasks') {
    $('#section-title').textContent = sections[section].title;
    $('#section-description').textContent = sections[section].description;
  }
  document.title = `${sections[section].title} · ТРБ надёжность`;
}
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => openSection(button.dataset.section)));

const themeKey = 'fuss-theme';
const notificationsKey = 'fuss-notifications-enabled';
const systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches:false };
let themePreference = 'system';
let notificationsEnabled = true;
try {
  const savedTheme = localStorage.getItem(themeKey);
  if (['system','light','dark'].includes(savedTheme)) themePreference = savedTheme;
  notificationsEnabled = localStorage.getItem(notificationsKey) !== 'false';
} catch {}
const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
function applyTheme() {
  document.documentElement.dataset.theme = themePreference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : themePreference;
  document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === 'light' ? '#f2f6fb' : '#071321';
}
function applyNotificationPreference() {
  $('.notification-count').hidden = !notificationsEnabled;
  $('.notifications-empty').hidden = notificationsEnabled;
  document.querySelectorAll('.notification-item').forEach(item => { item.hidden = !notificationsEnabled; });
  $('.popover-heading span').textContent = notificationsEnabled ? '3 новых' : 'Отключены';
  $('.notifications-action').setAttribute('aria-label', notificationsEnabled ? 'Уведомления: 3 новых' : 'Уведомления отключены');
}
document.querySelector(`input[name="theme"][value="${themePreference}"]`).checked = true;
$('#notifications-enabled').checked = notificationsEnabled;
applyTheme();
applyNotificationPreference();
if (systemTheme.addEventListener) systemTheme.addEventListener('change', () => { if (themePreference === 'system') applyTheme(); });
document.querySelectorAll('input[name="theme"]').forEach(input => input.addEventListener('change', () => {
  if (!input.checked) return;
  themePreference = input.value;
  savePreference(themeKey, themePreference);
  applyTheme();
}));
$('#notifications-enabled').addEventListener('change', event => {
  notificationsEnabled = event.target.checked;
  savePreference(notificationsKey, String(notificationsEnabled));
  applyNotificationPreference();
});
document.querySelector('button[title="Настройки"]').addEventListener('click', () => $('#settings-dialog').showModal());
$('#settings-close').addEventListener('click', () => $('#settings-dialog').close());
$('#settings-dialog').addEventListener('click', event => { if (event.target === $('#settings-dialog')) $('#settings-dialog').close(); });
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSection('tasks'); $('#search-input').focus(); } });
const today = new Date();
const quarterEnd = new Date(today.getFullYear(), (Math.floor(today.getMonth() / 3) + 1) * 3, 0);
const calendarDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
const daysToQuarterEnd = Math.round((calendarDay(quarterEnd) - calendarDay(today)) / DAY);
const dayWord = value => value % 10 === 1 && value % 100 !== 11 ? 'день' : [2,3,4].includes(value % 10) && ![12,13,14].includes(value % 100) ? 'дня' : 'дней';
const quarterLabel = `До конца квартала — ${daysToQuarterEnd} ${dayWord(daysToQuarterEnd)}`;
$('#today-label').innerHTML = `<span class="quarter-label-long">${quarterLabel}</span><span class="quarter-label-short">${daysToQuarterEnd} дн.</span>`;
$('#today-label').setAttribute('aria-label', quarterLabel);
$('#today-label').title = quarterLabel;
render();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
