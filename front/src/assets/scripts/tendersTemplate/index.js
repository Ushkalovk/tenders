import {server} from '../server/index';
import * as $ from 'jquery';
import 'datatables';

class Template {
  constructor() {
    this.table = $('#dataTable')
      .DataTable({
        'pageLength': 100,
        'lengthMenu': [[50, 100, 200, -1], [50, 100, 200, 'All']],
      });
    this.tableLogs = document.querySelector('#tableLogs tbody');
    this.activeLink = null;

    this.companies = [];
  }

  showLogs(object, index) {
    const tr = document.createElement('tr');

    for (let i = 0; i < 5; i++) {
      tr.appendChild(document.createElement('td'));
    }

    tr.children[0].textContent = `${index + 1}`;
    tr.children[1].textContent = this.transformTime(new Date((Date.parse(object.bitTime))));
    tr.children[2].textContent = object.participant;
    tr.children[3].textContent = `${object.round}`;
    tr.children[4].textContent = object.bet;

    this.tableLogs.appendChild(tr);
  }

  removePreviousTr() {
    Array.from(this.tableLogs.querySelectorAll('tr'))
      .forEach(i => i.remove());
  }

  removePreviousBetsInfo() {
    Array.from([...document.getElementById('betsPage')
      .querySelectorAll('li'), ...document.getElementById('betsPage')
      .querySelectorAll('h3')])
      .forEach(i => i.remove());
  }

  transformTime(date) {
    let dayOfMonth = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours();
    let minutes = date.getMinutes();

    // форматирование
    year = year.toString()
      .slice(-2);
    month = month < 10 ? `0${month}` : month;
    dayOfMonth = dayOfMonth < 10 ? `0${dayOfMonth}` : dayOfMonth;
    hour = hour < 10 ? `0${hour}` : hour;
    minutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${dayOfMonth}.${month}.${year} - ${hour}:${minutes}`;
  }

  createTender(link, company, minBet) {
    console.log(link, company)
    const dataTender = {
      creationsTime: this.transformTime(new Date()),
      name: '',
      link,
      company,
      creator: localStorage.getItem('email'),
      status: 'Не начался',
      timeForNextStep: '',
      newTender: true,
      minBet,
    };

    return dataTender;
  }

  createRows() {
    server.getCompanies()
      .then(companies => {
        this.companies = [...companies];
        this.companies.forEach(company => {
          const option = document.createElement('option');
          option.value = company.name;
          option.textContent = company.name;

          document.getElementById('linkSelect').appendChild(option);
        });

        server.getTenders()
          .then(rows => rows.forEach((i, index) => this.addRow(i, index + 1)));
      });
  }

  addRow(dataTender, index) {
    const {creationsTime, name, link, creator, status, timeForNextStep, isWork, company, minBet} = dataTender;
    // const shortLink = link.length > 15 ?
    //   `${link.split('')
    //     .splice(0, 15)
    //     .join('')}...` : link;
    const row = this.table.row.add([
      index,
      creationsTime,
      `<a href=${link} target="_blank">${name}</a>`,
      creator,
      '<select data-type="company"></select>',
      `${minBet} грн`,
      status,
      timeForNextStep,
      `<button class='btn btn-primary' data-link="${dataTender.link}">${isWork ? 'Стоп' : 'Старт'}</button>`,
      `<button class='btn cur-p btn-danger' data-link="${dataTender.link}">Удалить</button>`,
      `<button class='btn cur-p btn-success' data-toggle='modal' data-target='#modalLogs' data-link="${dataTender.link}">Смотреть</button>`,
      `<button class='btn cur-p btn-info' data-link="${dataTender.link}">Перейти</button>`,
    ])
      .draw()
      .node();

    row.setAttribute('data-link', dataTender.link);

    this.createSelect(link, company);
  }

  createSelect(link, company) {
    const cell = this.findRowByLink(link).children[4];
    const select = cell.children[0];

    this.companies.forEach(item => {
      const option = document.createElement('option');
      option.textContent = item.name;

      item.name === company && option.setAttribute('selected', 'selected');

      select.appendChild(option);
    });

    this.table.cell(cell).draw();
  }

  dispatch(data) {
    if (this.activeLink === data.link && data.logs) {
      this.displayTextAboutBets({
        item: data.logs,
        numberOfParticipants: data.numberOfParticipants,
      });
    } else if (data.deleteTender) {
      this.deleteRow(data.link);
    } else if (data.tenderName) {
      this.refreshCellText({
        cell: this.findRowByLink(data.link).children[2],
        text: `<a href=${data.link} target="_blank">${data.tenderName}</a>`,
      });
    } else if (data.timer) {
      this.refreshCellText({cell: this.findRowByLink(data.link).children[7], text: data.timer});

      if (this.activeLink === data.link) {
        document.getElementById('timer').textContent = data.timer;
      }
    } else if (data.newTender) {
      this.addRow(data, ++this.table.rows().data().length);
    } else if (data.toggleTender) {
      this.refreshCellText({
        cell: this.findRowByLink(data.link).children[8],
        text: `<button class='btn btn-primary' data-link="${data.link}">${data.isWork ? 'Стоп' : 'Старт'}</button>`,
      });
    } else if (data.toggleBot) {
      document.getElementById('bot').textContent = data.isBotOn ? 'Выключить бота' : 'Включить бота';
    } else if (data.isModalBets) {
      this.toggleVisibleModalBets(data.link, data.bet);
    }

    if (data.status) {
      this.refreshCellText({cell: this.findRowByLink(data.link).children[6], text: data.status});
    }
  }

  toggleVisibleModalBets(link, bet) {
    const popup = document.getElementById('popupMakeABet');

    if (this.activeLink === link && bet) {
      document.getElementById('footer').style.display = 'none';
      popup.style.display = 'block';
      popup.setAttribute('link', link);
      popup.querySelector('.textBet').textContent = ` ${bet}`;
    } else {
      document.getElementById('footer').style.display = 'block';
      popup.style.display = 'none';
    }
  }

  displayTextAboutBets({item, numberOfParticipants}) {
    const {participant, bet, currentMemberNumber} = item;
    const roundText = ['Первоначальные ставки', 'Раунд 1', 'Раунд 2', 'Раунд 3', 'Объявление результатов'];
    const elem = document.createElement('li');

    if (currentMemberNumber % (numberOfParticipants / 5) === 0) {
      const h3 = document.createElement('h3');
      h3.textContent = `${roundText[currentMemberNumber / (numberOfParticipants / 5)]}`;

      document.getElementById('betsPage')
        .querySelector('.tendersList')
        .appendChild(h3);
    }

    elem.textContent = `Участник: ${participant}, ставка: ${bet}`;
    elem.style.margin = '10px 0';

    document.getElementById('betsPage')
      .querySelector('.tendersList')
      .appendChild(elem);
  }

  showBets({logs, numberOfParticipants}, link, isBotOn, timer, panelBid) {
    this.activeLink = link;

    panelBid && this.toggleVisibleModalBets(link, panelBid);

    document.getElementById('mainInfo').style.display = 'none';
    document.getElementById('betsPage').style.display = 'flex';

    this.removePreviousBetsInfo();

    logs.forEach(item => this.displayTextAboutBets({
      item,
      numberOfParticipants,
    }));

    document.getElementById('timer').textContent = timer;
    document.getElementById('betsPage')
      .querySelector('#bot').textContent = isBotOn ? 'Выключить бота' : 'Включить бота';
  }

  findRowByLink(link) {
    return this.table.row(`[data-link="${link}"]`).node();
  }

  refreshCellText({cell, text}) {
    this.table.cell(cell)
      .data(text)
      .draw();
  }

  deleteRow(link) {
    this.table.row(this.findRowByLink(link))
      .remove()
      .draw();
  }
}

export const template = new Template();
