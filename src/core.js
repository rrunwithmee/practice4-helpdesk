'use strict';

const CATEGORIES = ['hardware', 'software', 'network'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['new', 'in_progress', 'resolved'];
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

/**
 * Нормализует тему заявки: внешние и повторяющиеся пробелы незначимы.
 * Продукт передан студентам в исходном состоянии; корректность НЕ гарантируется.
 */
function normalizeTitle(title) {
  return typeof title === 'string' ? title.trim() : '';
}

function validateTicketInput(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { input: 'Ожидается объект с данными заявки' };
  }

  if (typeof input.title !== 'string' || input.title.length < 5 || input.title.length > 80) {
    errors.title = 'Тема должна содержать от 5 до 80 символов';
  }

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length < 10 || description.length > 500) {
    errors.description = 'Описание должно содержать от 10 до 500 символов';
  }
  if (!CATEGORIES.includes(input.category)) {
    errors.category = 'Неизвестная категория';
  }
  if (!PRIORITIES.includes(input.priority)) {
    errors.priority = 'Неизвестный приоритет';
  }
  return errors;
}
// старое нерабоачее которое разрешало из new in resolved
// function canChangeStatus(from, to) {
//   if (!STATUSES.includes(from) || !STATUSES.includes(to)) return false;
//   if (from === 'new') return to === 'in_progress' || to === 'resolved';
//   if (from === 'in_progress') return to === 'resolved';
//   return false;
// }
// ispravlennoe
function canChangeStatus(from, to) {
  if (!STATUSES.includes(from) || !STATUSES.includes(to)) return false;
  if (from === 'new') return to === 'in_progress'; 
  if (from === 'in_progress') return to === 'resolved';
  return false;
}



/**
 * Условия поиска объединяются оператором AND.
 * В результирующем списке первыми должны идти важные и новые заявки.
 */
// старое не рабочее - не используется приведение к нижнему регистру 
// function filterAndSort(tickets, filters = {}) {
//   const search = String(filters.search || '').trim();
//   const status = String(filters.status || '').trim();
//   const category = String(filters.category || '').trim();
//   return tickets
//     .filter((ticket) => {
//       if (status && ticket.status !== status) return false;
//       if (category && ticket.category !== category) return false;
//       if (!search) return true;
//       return ticket.title.includes(search) || ticket.description.includes(search);
//     })
//     .sort((a, b) => {
//       const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
//       if (byPriority !== 0) return byPriority;
//       return b.createdAt.localeCompare(a.createdAt);
//     });
// }
// исправленное
function filterAndSort(tickets, filters = {}) {
  const search = String(filters.search || '').trim();
  const status = String(filters.status || '').trim();
  const category = String(filters.category || '').trim();
  const priority = String(filters.priority || '').trim(); // чиню фильтр
  
  return tickets
    .filter((ticket) => {
      if (status && ticket.status !== status) return false;
      if (category && ticket.category !== category) return false;
      if (priority && ticket.priority !== priority) return false; // чиню фильтр
      
      if (!search) return true;
      
      // ИСПРАВЛЕНИЕ ДЕФЕКТА 2: приводим все к нижнему регистру для поиска
      const searchLower = search.toLowerCase();
      const titleLower = ticket.title.toLowerCase();
      const descLower = ticket.description.toLowerCase();
      
      return titleLower.includes(searchLower) || descLower.includes(searchLower);
    })
    .sort((a, b) => {
      const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]; // ИСПРАВЛЕНИЕ ДЕФЕКТА 3
      if (byPriority !== 0) return byPriority;
      
      // ИСПРАВЛЕНИЕ ДЕФЕКТА 3: новые (большая дата) должны идти первыми
      return b.createdAt.localeCompare(a.createdAt); 
    });
}
module.exports = {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  normalizeTitle,
  validateTicketInput,
  canChangeStatus,
  filterAndSort
};
