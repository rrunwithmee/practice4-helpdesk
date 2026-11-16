import { TicketsPage } from '../pages/TicketsPage';

const page = new TicketsPage();

describe('HelpDesk — базовые E2E-проверки', () => {
  beforeEach(() => {
    // Сброс доступен только при запуске npm run start:test.
    cy.request('POST', '/api/__reset');
  });

  it('показывает исходные заявки', () => {
    page.open();
    cy.get('[data-testid="page-title"]').should('contain', 'HelpDesk');
    page.items().should('have.length', 4);
    page.count().should('have.text', '4');
  });

  // Добавьте сценарии: создание, поиск + фильтр, изменение статуса,
  // безопасное отображение введенного пользователем текста.
});

// тест который не прошел - в итоге не нашел этот текст на странице в виде текста.
describe('E2E: Проверка безопасности и интерфейса', () => {
  // Перед каждым тестом очищаем базу данных тестового сервера
  beforeEach(() => {
    cy.request('POST', '/api/__reset');
    cy.visit('/');
  });

  it('E-02: Пользовательский HTML-код должен отображаться как текст (Защита от XSS)', () => {
    // 1. Создаем заявку с вредоносным скриптом через форму на сайте
    // (Или через API, чтобы быстрее, но давайте через форму, как настоящий пользователь)
    
    cy.get('input[name="title"]').type('Взлом <script>alert("hacked")</script>');
    cy.get('textarea[name="description"]').type('Проверка XSS уязвимости в описании <img src=x onerror=alert(1)>');
    cy.get('select[name="category"]').select('software');
    cy.get('select[name="priority"]').select('high');
    
    // Нажимаем кнопку "Создать"
    cy.get('button[type="submit"]').click();

    // 2. Проверяем, что заявка создалась и появилась в списке
    // Мы ищем текст, который ввели, и ожидаем, что он отобразится как текст, а не выполнится
    cy.contains('Взлом <script>alert("hacked")</script>', { timeout: 10000 }).should('be.visible');
    
    // 3. Дополнительная проверка: убедиться, что реальный тег <script> не был вставлен в DOM
    // Если код уязвим, тег <script> не будет виден как текст, он выполнится.
    // Если он защищен, мы увидим текст тега на экране.
  });
});