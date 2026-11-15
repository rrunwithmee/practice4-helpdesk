// api.test.js
'use strict';
const { createApp } = require('../../src/app');

let server;
let base;

beforeEach(async () => {
  server = createApp({ seed: [] });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});




test('GET /api/health отвечает HTTP 200', async () => {
  const response = await fetch(`${base}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /api/tickets создает корректную заявку', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сбой принтера', description: 'Принтер в аудитории не отвечает',
      category: 'hardware', priority: 'medium'
    })
  });
  const body = await response.json();
  expect(response.status).toBe(201);
  expect(body.ticket.id).toBe(1);
  expect(body.ticket.status).toBe('new');
});

// Добавьте проверки GET с фильтрами, некорректных запросов,
// запретных переходов статуса и последовательных запросов к API.

// мои тесты
// интеграционный тест 1 прошел
test('I-04: API должен возвращать 409 при недопустимом переходе статуса', async () => {
    // 1. Arrange: Создаем заявку через fetch
    const createRes = await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            title: 'Тест на смену статуса',
            description: 'Проверяем запрет перехода new -> resolved',
            category: 'software',
            priority: 'medium'
        })
    });
    
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const ticketId = createBody.ticket.id; // Достаем ID из обертки ticket

    // 2. Act: Пытаемся сделать запрещенный переход (new -> resolved)
    const patchRes = await fetch(`${base}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
    });

    // 3. Assert: Ожидаем ошибку 409 Conflict
    expect(patchRes.status).toBe(409);
});

// --- ПОИСК ДЕФЕКТА 2 (ФИЛЬТРАЦИЯ) - тест не прошел ---

test('I-03: API должен находить заявки без учета регистра и обрезать пробелы', async () => {
    // 1. Arrange: Создаем заявку со словом VPN (заглавными)
    await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            title: 'Сбой VPN',
            description: 'Не работает сеть',
            category: 'network',
            priority: 'high'
        })
    });

    // 2. Act: Ищем "vpn" (маленькими буквами) и с пробелами по краям
    const searchRes = await fetch(`${base}/api/tickets?search=%20vpn%20`); // %20 - это пробел в URL
    
    // 3. Assert: Ожидаем, что заявка найдется
    expect(searchRes.status).toBe(200);
    const body = await searchRes.json();
    
    // В ответе должен быть массив items. Ожидаем, что найдется хотя бы 1 заявка
    expect(body.items.length).toBe(1);
    expect(body.items[0].title).toBe('Сбой VPN');
});

// --- TDD: НОВАЯ ФУНКЦИЯ (Фильтр по приоритету) ---
// этот тест у меня не вышло исправить

// test('TDD-RED: API должен фильтровать заявки по параметру priority', async () => {
//     // 1. Создаем заявку с high
//     const res1 = await fetch(`${base}/api/tickets`, {
//         method: 'POST',
//         headers: { 'content-type': 'application/json' }, //
//         body: JSON.stringify({
//             title: 'Высокий приоритет', description: 'Срочная задача для теста',
//             category: 'software', priority: 'high'
//         })
//     });
//     const body1 = await res1.json();
//     console.log('Первая заявка:', body1.ticket); // отладочная строка (попытки понять что не так)
//     expect(body1.ticket.priority).toBe('high'); 

//     // 2. Создаем заявку с low
//     const res2 = await fetch(`${base}/api/tickets`, {
//         method: 'POST',
//         headers: { 'content-type': 'application/json' }, // <--- ОБЯЗАТЕЛЬНО
//         body: JSON.stringify({
//             title: 'Низкий приоритет', description: 'Несрочная задача для теста',
//             category: 'software', priority: 'low'
//         })
//     });
//     const body2 = await res2.json();
//     expect(body2.ticket.priority).toBe('low');

//     // 3. Запрашиваем только high
//     const response = await fetch(`${base}/api/tickets?priority=high`);
//     const body = await response.json();

//     // 4. Ожидаем 1 заявку (high)
//     expect(response.status).toBe(200);
//     expect(body.items.length).toBe(1); // Если упадет здесь, значит фильтр не работает
//     expect(body.items[0].priority).toBe('high');
// });