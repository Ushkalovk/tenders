import {template} from '../tendersTemplate';
import {server} from '../server';
import {createErrorMessage} from '../error/index';


// if (!localStorage.getItem('email')) {
//   window.location.href = './signin.html';
// }

const setUserInfo = () => {
  const role = localStorage.getItem('role') === 'admin' ?
    'Администратор' :
    'Менеджер';

  document.getElementById('username').textContent = localStorage.getItem('email');
  document.getElementById('role').textContent = `Ваш статус: ${role}`;
};

if (window.location.pathname !== '/signin.html' && window.location.pathname !== '/signup.html') {
  setUserInfo();
}

if (window.location.pathname === '/index.html') {
  template.createRows();

  document.querySelector('#dataTable tbody')
    .addEventListener('click', (e) => {
      const target = e.target;

      if (target.tagName === 'BUTTON') {
        const link = target.getAttribute('data-link');

        target.setAttribute('disabled', 'true');

        if (target.classList.contains('btn-primary')) {
          // target.textContent === 'Старт' ?
            server.startTender(link)
              .then(resp => {
                !resp.status && createErrorMessage(resp.message);
                target.removeAttribute('disabled');
            })
            // server.stopTender(link)
            //   .then(resp => {
            //     !resp.status && createErrorMessage(resp.message);
            //     target.removeAttribute('disabled');
            //   });
        }

        if (target.classList.contains('btn-danger')) {
          server.deleteTender(link)
            .then(isDelete => {
              !isDelete.status && createErrorMessage(isDelete.message);

              target.removeAttribute('disabled');
            });
        }

        if (target.classList.contains('btn-success')) {
          target.removeAttribute('disabled');

          server.getLogs(link)
            .then(response => {
              console.log(response);
              if (response.status) {
                template.removePreviousTr();
                response.object.logs.forEach((object, index) => template.showLogs(object, index, response.object.logs.length));
              }
            });
        }

        if (target.classList.contains('btn-info')) {
          target.removeAttribute('disabled');

          server.getLogs(link)
            .then(response => response.status && template.showBets(response.object, link, response.isBotOn, response.timer));
        }
      }
    });

  document.querySelector('#linkInput form')
    .addEventListener('submit', (event) => {
      event.preventDefault();

      const input = document.querySelector('#linkInput input');
      const select = document.querySelector('#linkInput select');
      const button = document.querySelector('#linkInput button');

      if (input.value && select.value) {
        const dataTender = template.createTender(input.value, select.value);

        server.createTender(dataTender)
          .then(response => {
            !response.status && createErrorMessage(response.message);
            button.removeAttribute('disabled');
          });

        input.value = '';
        button.setAttribute('disabled', 'true');
      }
    });

  document.getElementById('logout')
    .addEventListener('click', (event) => {
      event.preventDefault();
      server.logout();
    });

  document.getElementById('backToHome')
    .addEventListener('click', () => {
      template.activeLink = null;

      document.getElementById('mainInfo').style.display = 'block';
      document.getElementById('betsPage').style.display = 'none';
      template.toggleVisibleModalBets(template.activeLink);
    });

  document.getElementById('bot')
    .addEventListener('click', function (e) {
      this.setAttribute('disabled', 'true');
      server.toggleBot(template.activeLink)
        .then(response => {
          !response.status && createErrorMessage(response.message);
          this.removeAttribute('disabled');
        });
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


  // меняем базовый текст с англ на русский

  document.querySelector('#dataTable_filter label').firstChild.textContent = 'Поиск: ';
  document.querySelector('#dataTable_length label').firstChild.textContent = 'Вывести ';
  document.querySelector('#dataTable_length label').lastChild.textContent = ' элементов';
  document.querySelector('.dataTables_empty').textContent = 'Данных нет';

}



