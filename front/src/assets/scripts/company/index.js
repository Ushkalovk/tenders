import {server} from '../server/index';
import {createErrorMessage} from '../error/index';

const table = document.querySelector('#companiesTable tbody');

const setValue = (name, text, proxyField) => {
  const tr = Array.from(table.querySelectorAll('tr'))
    .find(item => item.getAttribute('data-name') === name);

  tr.querySelector(`[data-name=${proxyField}]`).textContent = text;
};

const updateField = (data) => {
  const {name, text, proxyField} = data;

  server.updateProxy(data)
    .then(resp => {
      if (resp.status) {
        setValue(name, text, proxyField)
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
    <td scope="col" data-name="proxyIP">${data.proxyIP}</td>
    <td scope="col" data-name="proxyLogin">${data.proxyLogin}</td>
    <td scope="col" data-name="proxyPassword">${data.proxyPassword}</td>
    <td scope="col"><input type="text" data-type='proxyIP' placeholder="Новый прокси: "></td>
    <td scope="col"><input type="text" data-type='proxyLogin' placeholder="Новый логин (прокси): "></td>
    <td scope="col"><input type="text" data-type='proxyPassword' placeholder="Новый пароль (прокси): "></td>
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
    if (e.keyCode === 13 && e.target.tagName === 'INPUT') {
      const proxyField = e.target.getAttribute('data-type');

      updateField({
        name: e.target.closest('tr').getAttribute('data-name'),
        text: e.target.value,
        proxyField
      });

      e.target.value = '';
    }
  })
}
