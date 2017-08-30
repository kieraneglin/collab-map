import Client from './client';

class Toolbar {
  public client: Client;

  constructor(client) {
    this.client = client;

    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    (document.querySelector('.clear') as HTMLInputElement).onclick = () => {
      this.client.broadcastClear();
    };
  }
}

export default Toolbar;
