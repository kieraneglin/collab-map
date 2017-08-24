const Mouse = require('./mouse');
const Canvas = require('./canvas');

document.addEventListener('DOMContentLoaded', () => {
  const room = window.location.href.split('/').pop(); // This is cheeky and gross and I hate myself for it
  const socket = io.connect();
  const mouse = new Mouse();
  const canvas = new Canvas();

  socket.on('connect', () => {
    socket.emit('room', room);
  });
  socket.on('colour', (data) => {
    mouse.colour = mouse.colours[data % mouse.colours.length];
  });
  socket.on('draw_line', (data) => {
    canvas.instructions.push(data);
    canvas.draw(data);
  });

  canvas.registerDrawEventListeners(mouse);
  canvas.registerToolEventListeners(mouse);

  const emitLines = () => {
    if (mouse.shouldDraw()) {
      socket.emit('draw_line', {
        room: room,
        tool: mouse.selectedTool,
        colour: mouse.colour,
        line: [mouse.pos, mouse.previousPos]
      });
      mouse.move = false;
    }
    mouse.previousPos = {
      x: mouse.pos.x,
      y: mouse.pos.y
    };

    setTimeout(emitLines, 25); // I should be using requestAnimationFrame, but this is simple enough
  };

  emitLines();
});
