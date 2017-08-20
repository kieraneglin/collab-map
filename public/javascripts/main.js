'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var room = window.location.href.split('/').pop(); // This is cheeky and gross and I hate myself for it
  var id = Math.floor(Math.random() * 9e15); // We need to ignore our own messages, so we need an ID.  This is also weak, but so is my will to live
  var socket = io.connect();

  socket.on('connect', function () {
    socket.emit('room', room);
  });

  socket.on('line', function (data) {
    console.log('Incoming line:', data);
  });

  setTimeout(function () {
    socket.emit('draw_line', { room: room, message: 'HEY' });
  }, 3000);
});