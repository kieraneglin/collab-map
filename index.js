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

  socket.on('draw_path', (data) => {
    io.sockets.in(data.room).emit('draw_path', data);
  });

  socket.on('clear', (data) => {
    io.sockets.in(data.room).emit('clear', data);
  });
});

app.get('/:id', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(process.env.PORT || 3000);
