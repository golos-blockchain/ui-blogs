'use strict';
const find = document.getElementById('find');
const cancel = document.getElementById('cancel');
const status = document.getElementById('status');
const results = document.getElementById('results');
const messages = {
  NATIVE_CLIENT_MISSING: 'Нативный клиент поиска не включён в эту сборку. Установить полный узел вместо него приложение не пытается.',
  STOP_FAILED: 'Клиент не подтвердил остановку. Повторный запуск заблокирован до завершения процесса.',
  BUSY: 'Предыдущий поиск ещё завершается. Дождитесь остановки.',
  TIMEOUT: 'Время поиска истекло. Результаты не приняты.',
  OUTPUT_LIMIT: 'Клиент превысил допустимый объём ответа.',
  INVALID_OUTPUT: 'Ответ клиента отклонён: неверный формат или адрес.',
  UNSUPPORTED_PLATFORM: 'Для этой системы нативный поиск пока недоступен.'
};
find.addEventListener('click', async () => {
  find.disabled = true; cancel.disabled = false; results.replaceChildren();
  status.textContent = 'Поиск RPC через P2P… Не более 15 секунд плюс время остановки. Текущий RPC не меняется.';
  try {
    const result = await window.rpcDiscovery.start();
    if (result.status === 'done') {
      status.textContent = 'Найдены непроверенные объявления RPC. Автоматического подключения нет.';
      for (const [index, entry] of result.endpoints.entries()) {
        const li = document.createElement('li');
        const label = document.createElement('label'); label.textContent = 'Непроверенный адрес RPC (можно скопировать): ';
        const input = document.createElement('input'); input.type = 'text'; input.readOnly = true; input.value = entry.url;
        label.appendChild(input); li.appendChild(label);
        const choose = document.createElement('button'); choose.type = 'button'; choose.textContent = 'Выбрать RPC';
        choose.setAttribute('aria-label', 'Выбрать RPC ' + entry.url);
        choose.addEventListener('click', async () => {
          choose.disabled = true;
          try { const selection = await window.rpcDiscovery.select(index); status.textContent = selection.status === 'staged' ? 'Адрес передан в настройки. Проверьте выбор и нажмите «Сохранить и перезапустить».' : 'Выбор отменён. Текущий RPC не изменён.'; }
          catch (_) { status.textContent = 'Адрес больше недоступен для выбора. Повторите поиск.'; }
          finally { choose.disabled = false; }
        });
        li.appendChild(choose); results.appendChild(li);
      }
    } else if (result.status === 'empty') status.textContent = 'RPC не найдены. Это не означает, что сеть недоступна: обычный seed может не передавать каталог RPC.';
    else if (result.status === 'canceled') status.textContent = 'Поиск отменён. Текущий RPC не изменён.';
    else status.textContent = messages[result.code] || 'Не удалось выполнить поиск. Текущий RPC не изменён.';
  } catch (_) { status.textContent = 'Ошибка связи с процессом поиска. Текущий RPC не изменён.'; }
  finally { find.disabled = false; cancel.disabled = true; }
});
cancel.addEventListener('click', async () => {
  cancel.disabled = true; status.textContent = 'Остановка поиска…';
  try { await window.rpcDiscovery.cancel(); } catch (_) { status.textContent = 'Не удалось запросить остановку поиска.'; }
});
