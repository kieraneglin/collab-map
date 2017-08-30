import Client from './client';
import Canvas from './canvas';

class Toolbar {
  public client: Client;
  public canvas: Canvas;

  constructor(client, canvas) {
    this.client = client;
    this.canvas = canvas;

    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    (document.getElementById('clear') as HTMLElement).onclick = (): void => {
      this.client.broadcastClear();
    };

    (document.getElementById('reset-zoom') as HTMLElement).onclick = (): void => {
      this.canvas.resetZoom();
    };
  }
}

export default Toolbar;
