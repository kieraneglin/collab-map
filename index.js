const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', (socket) => {
  socket.on('room', (room) => {
    socket.join(room);
  });
  
  socket.on('draw_line', (data) => {
    io.sockets.in(data.room).emit('line', data);
  });
});

app.get('/:id', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(3000);
