import {server} from '../server/index';
import {createErrorMessage} from '../error/index';

const table = document.querySelector('#companiesTable tbody');

const updateProxy = (data) => {
  const {name, proxy} = data;

  server.updateProxy(data)
    .then(resp => {
      if (resp.status) {
        const tr = Array.from(table.querySelectorAll('tr'))
          .find(item => item.getAttribute('data-name') === name);

        tr.children[3].textContent = proxy;
      }
    });
};

const createRow = (data) => {
  console.log(data)
  const tr = document.createElement('tr');
  tr.setAttribute('data-name', data.name);
  tr.innerHTML = ` 
    <td scope="col">${data.name}</td>
    <td scope="col">${data.login}</td>
    <td scope="col">${data.password}</td>
    <td scope="col">${data.proxy}</td>
    <td scope="col"><input type="text" placeholder="Новый прокси: "></td>
  `;

  table.appendChild(tr);
};

const getCompanies = () => {
  server.getCompanies()
    .then(rowsData => rowsData.forEach(data => createRow(data)));
};

if (window.location.pathname === '/company.html') {
  getCompanies();

  document.querySelector('#companyCreate form').addEventListener('submit', (event) => {
    event.preventDefault();

    const inputs = document.querySelectorAll('#companyCreate input');
    const button = document.querySelector('#companyCreate button');

    const values = Array.from(inputs).reduce((acc, item) => {
      return {...acc, [item.getAttribute('data-type')]: item.value}
    }, {});

    server.createCompany(values)
      .then(response => {
        !response.status && createErrorMessage(response.message);
        button.removeAttribute('disabled');

        response.status && createRow(values);
      });

    inputs.forEach(item => item.value = '');
    button.setAttribute('disabled', 'true');
  });

  table.addEventListener('keypress', (e) => {
    if (e.target.tagName === 'INPUT' && e.keyCode === 13) {
      updateProxy({name: e.target.closest('tr').getAttribute('data-name'), proxy: e.target.value});
      e.target.value = '';
    }
  })
}
