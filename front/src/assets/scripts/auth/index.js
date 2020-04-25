import { server } from '../server/index';

if (window.location.pathname === '/signin.html' || window.location.pathname === '/signup.html') {
  const authForm = document.getElementById('authForm');
  const dataAuth = authForm.getAttribute('data-auth');
  const confirmButton = authForm.querySelector('.btn.btn-primary');

  const createErrorMessage = (text) => {
    if (!authForm.querySelector('#noticeError')) {
      const error = document.createElement('div');

      error.id = 'noticeError';
      error.style.color = 'red';
      error.style.marginBottom = '10px';
      error.style.fontSize = '16px';

      authForm.appendChild(error);
    }

    authForm.querySelector('#noticeError').textContent = text;
  };

  const paramsCollecting = (event) => {
    event.preventDefault();

    const params = Array.from(authForm.querySelectorAll('.form-control'))
      .reduce((obj, elem) => {
        return {
          ...obj,
          [elem.getAttribute('data-param')]: elem.value,
        };
      }, {});

    confirmButton.setAttribute('disabled', 'true');
    server.auth(params, dataAuth)
      .then(response => {
        console.log(response);

        if (response.status) {
          localStorage.setItem('email', response.email);
          localStorage.setItem('token', response.token);
          localStorage.setItem('role', response.role);
          window.location.href = './index.html';
        } else {
          confirmButton.removeAttribute('disabled');
          createErrorMessage(response.error);
        }
      });
  };

  authForm.addEventListener('submit', paramsCollecting);
  confirmButton.addEventListener('click', paramsCollecting);
}
