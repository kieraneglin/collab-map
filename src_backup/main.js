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
    isDrawingMode: true,
    selection: false
  });

  let size = Math.min(window.innerWidth, window.innerHeight);
  canvas.setHeight(size);
  canvas.setWidth(size);

  canvas.freeDrawingBrush.color = "purple";
  canvas.freeDrawingBrush.width = 2;

  socket.on('identification', (data) => {
    canvas.freeDrawingBrush.color = colours[data.colour % colours.length];
    canvas.id = data.id;
  });

  socket.on('clear', (data) => {
    removeLines(data.client);
  });

  var img = new Image();
  img.onload = function () {
    canvas.setBackgroundImage(img.src, canvas.renderAll.bind(canvas), {
      width: canvas.width,
      height: canvas.height,
    });
  };
  img.src = "/images/map.jpg";

  canvas.on('mouse:wheel', (e) => {
    if (e.e.deltaY <= 0) {
      canvas.zoomToPoint({
        x: e.e.offsetX,
        y: e.e.offsetY
      }, canvas.getZoom() * 1.1);
    } else {
      canvas.zoomToPoint({
        x: e.e.offsetX,
        y: e.e.offsetY
      }, canvas.getZoom() * 0.9);
    }

    canvas.freeDrawingBrush.width = 2 / canvas.getZoom();
    canvas.getObjects().map((line) => {
      line.strokeWidth = 2 / canvas.getZoom();
    });
  });

  function removeLines(client) {
    var objects = canvas.getObjects().filter((line) => line.senderId === client);

    objects.forEach((object) => {
      canvas.remove(object);
    });
  }

  document.querySelector('.clear').addEventListener('click', () => {
    socket.emit('clear', { client: canvas.id, room: room});
  });

  canvas.on('path:created', function (e) {
    e.path.senderId = canvas.id;

    socket.emit('draw_line', {
      line: e.path.toJSON(),
      room: room,
      size: size,
      sender: canvas.id
    });
  });

  socket.on('draw_line', function (path) {
    if(path.sender !== canvas.id) {
      let scale = canvas.width / path.size;
      path.line.left *= scale;
      path.line.top *= scale;
      path.line.scaleX *= scale;
      path.line.scaleY *= scale;
      path.line.strokeWidth = 2 / canvas.getZoom();

      fabric.util.enlivenObjects([path.line], function (objects) {
        objects.forEach(function (o) {
          o.senderId = path.sender;
          canvas.add(o);
        });
      });
    }
  });

  function resetZoom() {
    canvas.setZoom(1);
    canvas.zoomToPoint(0, 0);
    canvas.renderAll();
  }

  canvas.on("after:render", function () {
    canvas.calcOffset();
  });

  document.body.onkeydown = (e) => {
    if (e.shiftKey) {
      canvas.isDrawingMode = false;
    }
  };
  document.body.onkeyup = (e) => {
    canvas.isDrawingMode = true;
  };

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
    if (panning && e.e && e.e.shiftKey) {
      // testerino = true;
      var delta = new fabric.Point(e.e.movementX, e.e.movementY);
      canvas.relativePan(delta);
    }
  });
});
