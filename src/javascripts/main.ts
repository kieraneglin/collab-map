import Client from './client';
import Canvas from './canvas';
import Toolbar from './toolbar';

declare let fabric; // So TS will play nicely with non-node JS files
declare let io;

const socket = io.connect();
const client = new Client(socket);
const canvas = new Canvas(client);
const toolbar = new Toolbar(client, canvas);

socket.on('connect', () => {
  socket.emit('room', client.room);
});

socket.on('identification', (data) => {
  canvas.fabric.freeDrawingBrush.color = client.assignColour(data.colour);
  client.id = data.id;
});

socket.on('draw_path', (data) => {
  canvas.applyPath(data);
});

socket.on('clear', (data) => {
  canvas.applyClear(data.client);
});
