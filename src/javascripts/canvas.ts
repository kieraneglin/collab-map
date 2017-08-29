declare let fabric;

class Canvas {
  public fabric: any;

  constructor() {
    this.fabric = new fabric.Canvas('map', this.canvasOptions);
  }

  private get canvasOptions(): object {
    return {
      isDrawingMode: true,
      selection: false
    }
  }
}

export default Canvas;
