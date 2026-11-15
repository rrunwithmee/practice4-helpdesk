'use strict';
// Импортируем правильные названия функций из вашего core.js
const { normalizeTitle, validateTicketInput, canChangeStatus } = require('../../src/core');

describe('Базовые unit-тесты', () => {
  test('удаляет пробелы в начале и конце темы', () => {
    expect(normalizeTitle('  Ошибка принтера  ')).toBe('Ошибка принтера');
  });

  test('отклоняет неизвестную категорию', () => {
    const errors = validateTicketInput({
      title: 'Ошибка печати', description: 'Принтер не печатает документ',
      category: 'unknown', priority: 'low'
    });
    expect(errors).toHaveProperty('category');
  });

  test('запрещает возвращение из закрытого статуса', () => {
    expect(canChangeStatus('resolved', 'new')).toBe(false);
  });
});

// --- МОИ ТЕСТЫ ---

describe('Проверка требований ТЗ (Поиск дефектов)', () => {
    
    // Проверка границ длины темы (U-02 и U-03)
    test('U-02: Тема из 4 символов должна быть невалидной', () => {
        // validateTicketInput возвращает объект с ошибками. 
        // Если тема короткая, в объекте должно появиться свойство title
        const errors = validateTicketInput({
            title: 'Тест', 
            description: 'Это описание достаточно длинное для теста',
            category: 'hardware',
            priority: 'low'
        });
        expect(errors).toHaveProperty('title'); 
    });

    test('U-03: Тема из 81 символа должна быть невалидной', () => {
        const errors = validateTicketInput({
            title: 'A'.repeat(81), 
            description: 'Это описание достаточно длинное для теста',
            category: 'hardware',
            priority: 'low'
        });
        expect(errors).toHaveProperty('title'); 
    });

    // Проверка переходов статусов (U-04 и U-05)
    test('U-04: Переход new -> in_progress разрешен', () => {
        expect(canChangeStatus('new', 'in_progress')).toBe(true);
    });

    test('U-05: Прямой переход new -> resolved запрещен', () => {
        expect(canChangeStatus('new', 'resolved')).toBe(false); 
    });
});