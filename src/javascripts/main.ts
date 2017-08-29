declare let fabric;
declare let io;

const socket = io.connect();
const room = window.location.href.split('/').pop();

var canvas = new fabric.Canvas('map', {
  isDrawingMode: true,
  selection: false
});

socket.on('connect', () => {
  socket.emit('room', room);
});
