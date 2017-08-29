class Client {
  public room: string;
  public id: string;
  public colour: string;

  constructor() {
    this.room = window.location.href.split('/').pop();
  }

  public assignColour(connectionNumber: number): string {
    this.colour = this.colourChoices[connectionNumber % this.colourChoices.length];
    return this.colour;
  }

  private get colourChoices(): Array<string> {
    return ['#e74c3c', '#3498db', '#27ae60', '#f4d03f', '#ecf0f1']
  }
}

export default Client;
