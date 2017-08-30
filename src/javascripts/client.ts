declare let socket;

class Client {
  public size: number;
  public room: string;
  public name: string;
  public id: string;
  public colour: string;
  public socket: any; // Since TS doesn't play nice with non-node libs

  constructor(socket) {
    this.size = Math.min(window.innerWidth, window.innerHeight); // So canvas won't exceed the browser height
    this.room = window.location.href.split('/').pop();
    this.socket = socket;
  }

  public broadcastPath(e): void {
    e.path.senderId = this.id; // So that we can identify what lines are our own, since `draw_line` events from self are ignored

    this.socket.emit('draw_path', {
      path: e.path.toJSON(),
      room: this.room,
      size: this.size,
      sender: this.id
    });
  }

  public broadcastClear(): void {
    this.socket.emit('clear', {
      client: this.id,
      room: this.room
    });
  }

  public assignColour(connectionNumber: number): string {
    this.colour = this.colourChoices[connectionNumber % this.colourChoices.length];
    return this.colour;
  }

  private get colourChoices(): Array<string> {
    return ['#e74c3c', '#3498db', '#27ae60', '#f4d03f', '#bf26e9', '#0bf7e7', '#f08080']
  }
}

export default Client;
