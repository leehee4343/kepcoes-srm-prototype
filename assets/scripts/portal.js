document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.portal-thumb-grid');
  const saveButton = document.getElementById('portalLayoutSave');
  const status = document.getElementById('portalLayoutStatus');
  if (!grid || !saveButton) return;

  const storageKey = 'kepcoEsPortalCardOrder';
  const cards = Array.from(grid.querySelectorAll('.portal-thumb-card'));
  cards.forEach((card, index) => {
    const href = card.querySelector('a[href]')?.getAttribute('href');
    card.dataset.cardId = href || `portal-card-${index + 1}`;
    card.draggable = true;
    card.tabIndex = 0;
  });

  const announce = message => {
    status.textContent = message;
    window.clearTimeout(announce.timer);
    announce.timer = window.setTimeout(() => {
      status.textContent = '';
    }, 2600);
  };

  const getOrder = () => Array.from(grid.querySelectorAll('.portal-thumb-card'))
    .map(card => card.dataset.cardId);

  const applyOrder = order => {
    if (!Array.isArray(order)) return;
    const byId = new Map(cards.map(card => [card.dataset.cardId, card]));
    const orderedIds = new Set(order);
    order.forEach(id => {
      const card = byId.get(id);
      if (card) grid.appendChild(card);
    });
    cards.forEach(card => {
      if (!orderedIds.has(card.dataset.cardId)) grid.appendChild(card);
    });
  };

  try {
    applyOrder(JSON.parse(localStorage.getItem(storageKey)));
  } catch (error) {
    localStorage.removeItem(storageKey);
  }

  cards.forEach(card => {
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'portal-card-drag-handle';
    handle.setAttribute('aria-label', `${card.querySelector('.card-thumb-title')?.textContent.trim() || '화면 카드'} 위치 이동`);
    handle.title = '드래그 또는 Alt + 방향키로 위치 이동';
    handle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="6" r="1"></circle><circle cx="16" cy="6" r="1"></circle><circle cx="8" cy="12" r="1"></circle><circle cx="16" cy="12" r="1"></circle><circle cx="8" cy="18" r="1"></circle><circle cx="16" cy="18" r="1"></circle></svg>';
    card.appendChild(handle);

    handle.addEventListener('keydown', event => {
      if (!event.altKey || !['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const currentCards = Array.from(grid.querySelectorAll('.portal-thumb-card'));
      const currentIndex = currentCards.indexOf(card);
      const offset = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
      const nextIndex = currentIndex + offset;
      if (nextIndex < 0 || nextIndex >= currentCards.length) return;

      if (offset < 0) grid.insertBefore(card, currentCards[nextIndex]);
      else grid.insertBefore(card, currentCards[nextIndex].nextSibling);
      handle.focus();
      announce(`${nextIndex + 1}번째 위치로 이동했습니다. 저장 버튼을 눌러주세요.`);
    });
  });

  let draggedCard = null;

  grid.addEventListener('dragstart', event => {
    const card = event.target.closest('.portal-thumb-card');
    if (!card) return;
    draggedCard = card;
    card.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', card.dataset.cardId);
  });

  grid.addEventListener('dragover', event => {
    event.preventDefault();
    const target = event.target.closest('.portal-thumb-card');
    grid.querySelectorAll('.is-drag-target').forEach(card => card.classList.remove('is-drag-target'));
    if (!draggedCard || !target || target === draggedCard) return;

    target.classList.add('is-drag-target');
    const rect = target.getBoundingClientRect();
    const isSameRow = event.clientY >= rect.top && event.clientY <= rect.bottom;
    const insertAfter = isSameRow
      ? event.clientX > rect.left + rect.width / 2
      : event.clientY > rect.top + rect.height / 2;
    grid.insertBefore(draggedCard, insertAfter ? target.nextSibling : target);
  });

  grid.addEventListener('drop', event => {
    event.preventDefault();
    announce('위치를 변경했습니다. 저장 버튼을 눌러주세요.');
  });

  grid.addEventListener('dragend', () => {
    draggedCard?.classList.remove('is-dragging');
    grid.querySelectorAll('.is-drag-target').forEach(card => card.classList.remove('is-drag-target'));
    draggedCard = null;
  });

  saveButton.addEventListener('click', () => {
    localStorage.setItem(storageKey, JSON.stringify(getOrder()));
    announce('현재 배치를 저장했습니다.');
  });
});
