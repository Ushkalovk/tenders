class Server {
  constructor() {
    this.baseUrl = '';
  }

  auth(data, endPoint) {
    return fetch(`/${endPoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(resp => resp.json());
  }

  logout() {
    return fetch(`${this.baseUrl}/logout`)
      .then(resp => resp.json())
      .then(resp => {
        if (resp.status) {
          delete localStorage.username;
          delete localStorage.token;
          window.location.href = './signin.html';
        }
      });
  }

  getLogs(link) {
    console.log(link);
    return fetch(`${this.baseUrl}/getLogs`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link,
      }),
    })
      .then(resp => resp.json());
  }

  toggleBot(link) {
    return fetch(`${this.baseUrl}/toggleBot`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email'),
        link,
      }),
    })
      .then(resp => resp.json());
  }

  deleteTender(link) {
    console.log(link)
    return fetch(`${this.baseUrl}/tender`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email'),
        link,
      }),
    })
      .then(resp => resp.json());
  }

  getTenders() {
    return fetch(`${this.baseUrl}/tender`)
      .then(resp => resp.json());
  }

  createTender(object) {
    return fetch(`${this.baseUrl}/tender`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(object),
    })
      .then(resp => resp.json());
  }

  startTender(link) {
    return fetch(`${this.baseUrl}/tender`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email'),
        link,
      }),
    })
      .then(resp => resp.json());
  }

  stopTender(link) {
    return fetch(`${this.baseUrl}/stopTender`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link,
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email'),
      }),
    })
      .then(resp => resp.json());
  }

  makeABet(link, bet) {
    return fetch(`${this.baseUrl}/makeABet`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link,
        bet,
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email'),
      }),
    })
      .then(resp => resp.json());
  }

  createCompany(object) {
    return fetch(`${this.baseUrl}/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(object),
    })
      .then(resp => resp.json());
  }

  getCompanies() {
    return fetch(`${this.baseUrl}/company`)
      .then(resp => resp.json());
  }

  updateProxy(data) {
    return fetch(`${this.baseUrl}/company`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(resp => resp.json());
  }
}

export const server = new Server();
