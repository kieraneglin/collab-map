import Client from './client';
import Canvas from './canvas';
import Toolbar from './toolbar';

declare let fabric; // So TS will play nicely with non-node JS files
declare let io;

const socket = io.connect();
const client = new Client(socket);
const canvas = new Canvas(client);
const toolbar = new Toolbar(client, canvas);
let peers = [];

socket.on('connect', (): void => {
  socket.emit('room', client.room);
});

socket.on('identification', (data): void => {
  canvas.fabric.freeDrawingBrush.color = client.assignColour(data.colour);
  client.id = data.id;
});

socket.on('user_connected', (data): void => {
  // Doing it here for tonight because I want to play PUBG
  let clientList = document.querySelector('.clients') as HTMLElement;

  peers.push(data);

  socket.emit('sync_users', {
    id: client.id,
    room: client.room,
    name: client.name,
    colour: client.colour
  })
});

socket.on('leave', (data): void => {
  let clients = document.querySelectorAll('.clients > li');
  let temp = []

  for (let i = 0; i < clients.length; i++) {
    if((clients[i] as HTMLElement).dataset.client == data) {
      clients[i].remove();
    }
  }

  peers.forEach((peer) => {
    if(peer.id != data) {
      temp.push(peer);
    }
  });

  peers = temp;
  // console.log(peers);
});

socket.on('sync_users', (data): void => {
  // Doing it here for tonight because I want to play PUBG
  let clientList = document.querySelector('.clients') as HTMLElement;
  clientList.innerHTML = '';
  let temp = []

  // peers.forEach((peer) => {
  //   if(peer.id == data.id) {
  //     temp.push(data);
  //   } else {
  //     temp.push
  //   }
  // });

  let contains = peers.some((peer) => {
    return peer.id == data.id
  });

  if(!contains) {
    peers.push(data)
  }

  peers.forEach((peer) => {
    clientList.insertAdjacentHTML('beforeend', `
    <li data-client="${peer.id}">
      <span class="clients-name">${peer.name}</span>
      <span class="clients-colour" style="background-color: ${peer.colour}"></span>
    </li>`)
  })
});

socket.on('draw_path', (data): void => {
  canvas.applyPath(data);
});

socket.on('clear', (data): void => {
  canvas.applyClear(data.client);
});

// Modal code

(document.querySelector('.modal-submit') as HTMLElement).onclick = (e): void => {
  e.preventDefault();
  //
  let nameInput = document.querySelector('.modal-name') as HTMLInputElement;
  // let name = 'kieran';
  let name = nameInput.value;
  //
  if(name.trim() === '') {
    nameInput.className += ' error';
    return;
  }

  client.name = name;
  (document.querySelector('.modal') as HTMLElement).remove();

  let data = {
    id: client.id,
    room: client.room,
    name: name,
    colour: client.colour
  };

  socket.emit('user_connected', data);
}
