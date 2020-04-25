const createErrorMessage = (message) => {
  const messageDiv = document.createElement('div');

  messageDiv.id = 'modalError';
  messageDiv.innerHTML = `<div class="alert alert-danger" role="alert">${message}</div>`;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.classList.add('transition-opacity');
    messageDiv.addEventListener('transitionend', () => messageDiv.remove());
  }, 5000);
};

export {createErrorMessage};
