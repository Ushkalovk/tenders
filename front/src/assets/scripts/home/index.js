import {template} from '../tendersTemplate';
import {server} from '../server';
import {createErrorMessage} from '../error/index';

const setUserInfo = () => {
  const role = localStorage.getItem('role') === 'admin' ?
    'Администратор' :
    'Менеджер';

  document.getElementById('username').textContent = localStorage.getItem('email');
  document.getElementById('role').textContent = `Ваш статус: ${role}`;
};

if (window.location.pathname !== '/signin.html' && window.location.pathname !== '/signup.html') {
  setUserInfo();

  if (!localStorage.getItem('email')) {
    window.location.href = './signin.html';
  }
} else {
  if (localStorage.getItem('email')) {
    window.location.href = './index.html';
  }
}

const tableActions = {
  bot(link, target) {
    server.toggleBot(link)
      .then(response => {
        !response.status && createErrorMessage(response.message);

        target.removeAttribute('disabled');
      });
  },

  delete(link, target) {
    server.deleteTender(link)
      .then(isDelete => {
        !isDelete.status && createErrorMessage(isDelete.message);

        target.removeAttribute('disabled');
      });
  },

  logs(link, target) {
    target.removeAttribute('disabled');

    server.getLogs(link)
      .then(response => {
        console.log(response);
        if (response.status) {
          template.removePreviousTr();
          response.object.logs.forEach((object, index) => template.showLogs(object, index));
        }
      });
  },

  bets(link, target) {
    server.getLogs(link)
      .then(response => {
        target.removeAttribute('disabled');

        response.status && template.showBets(
          response.object, link, response.isBotOn, response.timer, response.panelBid, response.botSuggest
        );
      });
  }
};

if (window.location.pathname === '/index.html') {
  template.createRows();

  document.querySelector('#dataTable tbody')
    .addEventListener('click', (e) => {
      const action = e.target.dataset.action;

      if (action) {
        const link = e.target.dataset.link;

        e.target.setAttribute('disabled', 'true');

        tableActions[action](link, e.target);
      }
    });

  document.querySelector('#linkInput form')
    .addEventListener('submit', (event) => {
      event.preventDefault();

      const inputLink = document.querySelector('#linkInput [data-type=link]');
      const inputBet = document.querySelector('#linkInput [data-type=bet]');
      const select = document.querySelector('#linkInput select');
      const button = document.querySelector('#linkInput button');

      if (inputLink.value && select.value && inputBet.value) {
        const dataTender = template.createTender(inputLink.value, select.value, inputBet.value);

        server.createTender(dataTender)
          .then(response => {
            !response.status && createErrorMessage(response.message);
            button.removeAttribute('disabled');
          });

        inputLink.value = '';
        inputBet.value = '';
        button.setAttribute('disabled', 'true');
      }
    });

  document.getElementById('logout')
    .addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.setItem('email', '');
      server.logout();
    });

  document.getElementById('backToHome')
    .addEventListener('click', () => {
      template.activeLink = null;

      document.getElementById('mainInfo').style.display = 'block';
      document.getElementById('betsPage').style.display = 'none';
      template.toggleVisibleModalBets(template.activeLink);
    });

  document.getElementById('popupMakeABet')
    .addEventListener('click', function (e) {
      e.preventDefault();
      const target = e.target;
      const link = this.getAttribute('link');

      if (target.classList.contains('btn-primary')) {
        this.querySelector('input').value = '';
      } else if (target.classList.contains('btn-success')) {
        const bet = this.querySelector('input').value;
        this.querySelector('input').value = '';

        server.makeABet(link, bet)
          .then(response => {
            !response.status && createErrorMessage(response.message);
          });
      }
    });
}



