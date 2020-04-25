// const ws = new require('ws');
// const wss = new ws.Server({port: 9090});
//
// const clients = new Set();
//
// // wss.broadcast = (data) => {
// //     this.clients.forEach(client => {
// //         client.send(data);
// //     });
// // };
//
//
// wss.on("connection", ws => {
//     clients.add(ws);
//
//     ws.on('message', (message) => {
//         for (let client of clients) {
//             client.send(message);
//         }
//     });
//
//     ws.on('close', () => clients.delete(ws));
//
//     // ws.on('message', message => {
//     //     //  отправляем сообщение всем, кроме автора
//     //     wss.broadcast(message, client => client !== ws);
//     // });
// });
//
// module.exports = clients;
