const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use(express.static(__dirname + '/public'));

let connections = {};

io.sockets.on('connection', (socket) => {
  socket.on('room', (room) => {
    connections[room] = (connections[room] || 0) + 1; // TODO: Revisit.  This probably can be done more cleanly
    socket.join(room);
    socket.emit('identification', {
      colour: connections[room],
      id: socket.id
    });
  });

  socket.on('user_connected', (data) => {
    io.sockets.in(data.room).emit('user_connected', data);
  });

  socket.on('sync_users', (data) => {
    io.sockets.in(data.room).emit('sync_users', data);
  });

  socket.on('draw_path', (data) => {
    io.sockets.in(data.room).emit('draw_path', data);
  });

  socket.on('clear', (data) => {
    io.sockets.in(data.room).emit('clear', data);
  });
});

io.sockets.on('connection', (socket) => {
  socket.on('disconnect', () => {
    io.emit('leave', socket.id);
  });
});

app.get('/:id', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(process.env.PORT || 3000);
