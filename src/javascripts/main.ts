import Client from './client';
import Canvas from './canvas';

declare let fabric; // So TS will play nicely with non-node JS files
declare let io;

const socket = io.connect();
const client = new Client();
const canvas = new Canvas();

socket.on('connect', () => {
  socket.emit('room', client.room);
});

socket.on('identification', (data) => {
  canvas.fabric.freeDrawingBrush.color = client.assignColour(data.colour);
  client.id = data.id;
});
