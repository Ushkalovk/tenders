const io = require('../app.js');
const clients = new Set();

io.on('connection', (socket) => {
    clients.add(socket);
});

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

module.exports = (data) => {
    for (const client of clients) {
        // console.log("Data= ",data)
        client.emit('message', JSON.stringify(data,getCircularReplacer() ));
    }
};


