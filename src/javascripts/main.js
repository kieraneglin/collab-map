document.addEventListener('DOMContentLoaded', () => {
  const room = window.location.href.split('/').pop(); // This is cheeky and gross and I hate myself for it
  const id = Math.floor(Math.random() * 9e15); // We need to ignore our own messages, so we need an ID.  This is also weak, but so is my will to live
  const socket = io.connect();

  socket.on('connect', () => {
     socket.emit('room', room);
  });

  socket.on('line', (data) => {
     console.log('Incoming line:', data);
  });

  setTimeout(() => {
    socket.emit('draw_line', { room: room, message: 'HEY'});
  }, 3000);
});
