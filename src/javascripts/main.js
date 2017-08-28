const Mouse = require('./mouse');
const Canvas = require('./canvas');

document.addEventListener('DOMContentLoaded', () => {
  const room = window.location.href.split('/').pop(); // This is cheeky and gross and I hate myself for it
  const socket = io.connect();
  const colours = ['#e74c3c', '#3498db', '#27ae60', '#f4d03f', '#ecf0f1'];

  socket.on('connect', () => {
    socket.emit('room', room);
  });

  var canvas = new fabric.Canvas('map', {
    isDrawingMode: true
  });

  let size = Math.min(window.innerWidth, window.innerHeight);
  canvas.setHeight(size);
  canvas.setWidth(size);

  canvas.freeDrawingBrush.color = "purple";
  canvas.freeDrawingBrush.width = 2;

  socket.on('colour', (data) => {
    canvas.freeDrawingBrush.color = colours[data % colours.length];
  });

  var img = new Image();
  img.onload = function () {
    canvas.setBackgroundImage(img.src, canvas.renderAll.bind(canvas), {
      width: canvas.width,
      height: canvas.height,
    });
  };
  img.src = "/images/map.jpg";

  canvas.wrapperEl.addEventListener('wheel', (e) => {
    if (e.deltaY <= 0) {
      canvas.zoomToPoint({
        x: e.offsetX,
        y: e.offsetY
      }, canvas.getZoom() * 1.1);
    } else {
      canvas.zoomToPoint({
        x: e.offsetX,
        y: e.offsetY
      }, canvas.getZoom() * 0.9);
    }
    // console.log(canvas.getZoom());
    canvas.freeDrawingBrush.width = 2 / canvas.getZoom();
    canvas.getObjects().map((line) => {
      line.strokeWidth = 2 / canvas.getZoom();
    });
  });

  canvas.on('path:created', function (e) {
    canvas.remove(e.path);
    socket.emit('draw_line', {
      line: e.path.toJSON(),
      room: room,
      size: size
    });
  });

  socket.on('draw_line', function (path) {
    let scale = canvas.width / path.size;
    // path.scaleX = 2;
    // path.scaleY = 2;
    console.log(size / path.size);
    path.line.left *= scale;
    path.line.top *= scale;
    path.line.scaleX *= scale;
    path.line.scaleY *= scale;
    path.line.strokeWidth = 2 / canvas.getZoom();
    console.log(path.line);
    fabric.util.enlivenObjects([path.line], function (objects) {
      objects.forEach(function (o) {
        canvas.add(o);
      });
    });
  });

  function resetZoom() {
    canvas.setZoom(1);
    canvas.renderAll();
  }

  canvas.on("after:render", function(){canvas.calcOffset();});


  var panning = false;
  canvas.on('mouse:up', function (e) {
    panning = false;
  });
  canvas.on('mouse:out', function (e) {
    panning = false;
  });
  canvas.on('mouse:down', function (e) {
    panning = true;
  });
  canvas.on('mouse:move', function (e) {
    //allowing pan only if the image is zoomed.
    if (panning && e && e.e && e.e.shiftKey) {
      var delta = new fabric.Point(e.e.movementX, e.e.movementY);
      canvas.relativePan(delta);
    }
  });
  // canvas.backgroundImage.width = canvas.getWidth();
  // canvas.backgroundImage.height = canvas.getHeight();

  // const room = window.location.href.split('/').pop(); // This is cheeky and gross and I hate myself for it
  // const socket = io.connect();
  // const mouse = new Mouse();
  // const canvas = new Canvas();
  //
  // socket.on('connect', () => {
  //   socket.emit('room', room);
  // });
  // socket.on('colour', (data) => {
  //   mouse.colour = mouse.colours[data % mouse.colours.length];
  // });
  // socket.on('draw_line', (data) => {
  //   canvas.instructions.push(data);
  //   canvas.draw(data);
  // });
  //
  // canvas.registerDrawEventListeners(mouse);
  // canvas.registerToolEventListeners(mouse);
  //
  // const emitLines = () => {
  //   if (mouse.shouldDraw()) {
  //     socket.emit('draw_line', {
  //       room: room,
  //       tool: mouse.selectedTool,
  //       colour: mouse.colour,
  //       line: [mouse.pos, mouse.previousPos]
  //     });
  //     mouse.move = false;
  //   }
  //   mouse.previousPos = {
  //     x: mouse.pos.x,
  //     y: mouse.pos.y
  //   };
  //
  //   setTimeout(emitLines, 25); // I should be using requestAnimationFrame, but this is simple enough
  // };
  //
  // emitLines();
});
