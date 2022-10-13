module.exports.start = () => { return io };
//Creates and returns the server instance on localhost.

const express = require('express');
const compress = require('compression');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { path: '/ktools/socket.io', perMessageDeflate: {}, maxHttpBufferSize: 10e6 /*10 MB*/ });
const port = 8065;

app.use(compress({ threshold: 100 }));
app.use('/ktools', express.static('public'));

server.listen(port, () => console.log(`listening on port ${port}`));