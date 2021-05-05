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
      resp.status && setValue(name, text, proxyField);
    });
};

const deleteRow = (name) => {
  var elem = document.querySelector(`tr[data-name=${name}]`);
  elem.remove();
}

// function deleteBtnEvent(name){
//   server.deleteCompany(name).then(response => {
//     !response.status && createErrorMessage(response.message);
//     response.status && deleteRow(name);
//   });
// }

const createRow = (data) => {
  console.log(data)
  const tr = document.createElement('tr');
  tr.setAttribute('data-name', data.name);
  console.log(tr.getAttribute('data-name'))
  tr.innerHTML = ` 
    <td scope="col"><button type="submit" id="deleteBtn" class="btn btn-danger")">Удалить</button></td>
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

  tr.querySelector('#deleteBtn').onclick = function(event) {
    console.log("Event  ",event);
      console.log(tr.getAttribute('data-name'));
      server.deleteCompany(tr.getAttribute('data-name')).then(response => {
        !response.status && createErrorMessage(response.message);
        response.status && tr.remove();
      });
  };
    // tr.addEventListener('submit', (event) => {
    //   event.preventDefault();
    //   console.log("Event  ",event);
    //   console.log(event.target.getAttribute('data-name'));
    //   server.deleteCompany(event.target.getAttribute('data-name')).then(response => {
    //     !response.status && createErrorMessage(response.message);
    //     response.status && deleteRow(event.target.getAttribute('data-name'));
    //   });
    // })
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
      return {...acc, [item.getAttribute('data-type')]: item.value.trim()}
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

  // document.querySelector('#companiesTable tbody tr').addEventListener('submit', (event) => {
  //   event.preventDefault();
  //   console.log("Event  ",event);
  //   console.log(event.target.getAttribute('data-name'));
  //   server.deleteCompany(event.target.getAttribute('data-name')).then(response => {
  //     !response.status && createErrorMessage(response.message);
  //     response.status && deleteRow(event.target.getAttribute('data-name'));
  //   });
  // })

  table.addEventListener('keypress', (e) => {
    if (e.keyCode === 13 && e.target.tagName === 'INPUT') {
      const proxyField = e.target.getAttribute('data-type');

      updateField({
        name: e.target.closest('tr').getAttribute('data-name'),
        text: e.target.value.trim(),
        proxyField
      });

      e.target.value = '';
    }
  })
}
