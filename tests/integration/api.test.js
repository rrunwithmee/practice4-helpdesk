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

// ТЕСТ 1 прошел
test('GET /api/health отвечает HTTP 200', async () => {
  const response = await fetch(`${base}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

// ТЕСТ 2 прошел
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

// мои тесты
// ТЕСТ 3 запрет недопустимого перехода статуса (I-04) прошел
test('I-04: API должен возвращать 409 при недопустимом переходе статуса', async () => {
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
    const ticketId = createBody.ticket.id;

    const patchRes = await fetch(`${base}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
    });

    expect(patchRes.status).toBe(409);
});

// ТЕСТ 4 поиск без учета регистра (I-03) не прошел
// Тест упал, так как сервер не приводил строки к нижнему регистру.
test('I-03: API должен находить заявки без учета регистра и обрезать пробелы', async () => {
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

    const searchRes = await fetch(`${base}/api/tickets?search=%20vpn%20`);
    
    expect(searchRes.status).toBe(200);
    const body = await searchRes.json();
    
    expect(body.items.length).toBe(1);
    expect(body.items[0].title).toBe('Сбой VPN');
});

// ТЕСТ 5 Фильтр по приоритету (TDD-RED) не прошел
// дефект наконец-то вышло исправить!!
test('TDD-RED: API должен фильтровать заявки по параметру priority', async () => {
    const res1 = await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            title: 'Высокий приоритет', description: 'Срочная задача для теста',
            category: 'software', priority: 'high'
        })
    });
    const body1 = await res1.json();
    expect(body1.ticket.priority).toBe('high'); 

    const res2 = await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            title: 'Низкий приоритет', description: 'Несрочная задача для теста',
            category: 'software', priority: 'low'
        })
    });
    const body2 = await res2.json();
    expect(body2.ticket.priority).toBe('low');

    const response = await fetch(`${base}/api/tickets?priority=high`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items.length).toBe(1);
    expect(body.items[0].priority).toBe('high');
});

// ТЕСТ 6 ошибка валидации (I-02) прошел
test('I-02: API должен возвращать 400 при невалидных данных и не сохранять заявку', async () => {
    const beforeRes = await fetch(`${base}/api/tickets`);
    const beforeBody = await beforeRes.json();
    const countBefore = beforeBody.items.length;

    const postRes = await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            title: '', 
            description: 'Это описание достаточно длинное для теста',
            category: 'software',
            priority: 'medium'
        })
    });

    expect(postRes.status).toBe(400);

    const afterRes = await fetch(`${base}/api/tickets`);
    const afterBody = await afterRes.json();
    expect(afterBody.items.length).toBe(countBefore);
});

// ТЕСТ 7 сортировка (I-05) прошел
test('I-05: API должен сортировать заявки по приоритету и времени', async () => {
    await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Задача 1', description: 'Описание задачи 1', category: 'software', priority: 'low' })
    });
    await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Задача 2', description: 'Описание задачи 2', category: 'hardware', priority: 'high' })
    });
    await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Задача 3', description: 'Описание задачи 3', category: 'network', priority: 'high' })
    });

    const response = await fetch(`${base}/api/tickets`);
    const body = await response.json();

    expect(body.items[0].title).toBe('Задача 3');
    expect(body.items[1].title).toBe('Задача 2');
    expect(body.items[2].title).toBe('Задача 1');
});