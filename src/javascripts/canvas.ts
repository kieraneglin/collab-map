declare let fabric;

class Canvas {
  public fabric: any;
  public size: number;
  public brushWidth: number = 2;

  private brushScaleFactor: number = 2;
  private zoomInFactor: number = 1.1;
  private zoomOutFactor: number = 0.9;

  constructor() {
    this.fabric = new fabric.Canvas('map', this.canvasOptions);
    this.size = Math.min(window.innerWidth, window.innerHeight); // So canvas won't exceed the browser height
    this.fabric.freeDrawingBrush.width = this.brushWidth;

    this.scaleFabricToWindow();
    this.setBackgroundImage();
    this.registerEventListeners();
  }

  private scaleFabricToWindow(): void {
    this.fabric.setHeight(this.size);
    this.fabric.setWidth(this.size);
  }

  private setBackgroundImage(): void {
    let img = new Image();

    img.onload = () => {
      this.fabric.setBackgroundImage(img.src, this.fabric.renderAll.bind(this.fabric), {
        width: this.fabric.width,
        height: this.fabric.height,
      });
    };

    img.src = "/images/map.jpg";
  }

  private registerEventListeners(): void {
    this.fabric.on('mouse:wheel', (e) => {
      if (e.e.deltaY <= 0) {
        this.zoomIn(e);
      } else {
        this.zoomOut(e)
      }

      this.scaleOwnBrushSize();
      this.scaleOtherBrushSize();
    });
  }

  private zoomIn(e): void {
    this.fabric.zoomToPoint({
      x: e.e.offsetX,
      y: e.e.offsetY
    }, this.fabric.getZoom() * this.zoomInFactor);
  }

  private zoomOut(e): void {
    this.fabric.zoomToPoint({
      x: e.e.offsetX,
      y: e.e.offsetY
    }, this.fabric.getZoom() * this.zoomOutFactor);
  }

  private scaleOwnBrushSize(): void {
    this.fabric.freeDrawingBrush.width = this.brushScaleFactor / this.fabric.getZoom();
  }

  private scaleOtherBrushSize(): void {
    this.fabric.getObjects().map((line) => {
      line.strokeWidth = this.brushScaleFactor / this.fabric.getZoom();
    });
  }

  private get canvasOptions(): object {
    return {
      isDrawingMode: true,
      selection: false
    }
  }
}

export default Canvas;
