import Client from './client';
import Path from './path';

declare let fabric;

class Canvas { // TODO: Getting too beefy again.  Refactor
  public fabric: any;
  public size: number;
  public client: Client;
  public brushWidth: number = 2;

  private brushScaleFactor: number = 2;
  private zoomInFactor: number = 1.1;
  private zoomOutFactor: number = 0.9;

  constructor(client) {
    this.client = client;

    this.fabric = new fabric.Canvas('map', this.canvasOptions);
    this.fabric.freeDrawingBrush.width = this.brushWidth;

    this.scaleFabricToWindow();
    this.setBackgroundImage();
    this.registerEventListeners();
    this.enablePanning();
  }

  public applyPath(data): void {
    if(data.sender !== this.client.id) {
      let path: any = Path.scaleIncoming(data, this.client.size);
      path.strokeWidth = this.scaledBrushSize;

      fabric.util.enlivenObjects([path], (objects) => {
        objects.forEach((object) => {
          object.senderId = data.sender; // Since `enlivenObjects` strips all non-standard props
          this.fabric.add(object);
        });
      });
    }
  }

  public applyClear(sender: string): void {
    let objects = this.fabric.getObjects().filter((line) => line.senderId === sender);

    objects.forEach((object) => {
      this.fabric.remove(object);
    });
  }

  public resetZoom() {
    this.fabric.setZoom(1);
    this.fabric.zoomToPoint(0, 0);
    this.fabric.renderAll();
  }

  private scaleFabricToWindow(): void {
    this.fabric.setHeight(this.client.size);
    this.fabric.setWidth(this.client.size);
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

      this.applyScaledBrush();
      this.applyScaledBrushToCanvas();
    });

    this.fabric.on('path:created', (e) => {
      this.client.broadcastPath(e);
    });

    document.body.onkeydown = (e) => {
      if (e.shiftKey) {
        this.fabric.isDrawingMode = false;
      }
    };

    document.body.onkeyup = (e) => {
      this.fabric.isDrawingMode = true;
    };
  }

  private enablePanning(): void {
    let panning = false;
    this.fabric.on('mouse:up', (e) => {
      panning = false;
    });
    this.fabric.on('mouse:out', (e) => {
      panning = false;
    });
    this.fabric.on('mouse:down', (e) => {
      panning = true;
    });
    this.fabric.on('mouse:move', (e) => {
      if (panning && e.e && e.e.shiftKey) {
        let delta = new fabric.Point(e.e.movementX, e.e.movementY);
        this.fabric.relativePan(delta);
      }
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

  private applyScaledBrush(): void { // Sets your brush size
    this.fabric.freeDrawingBrush.width = this.scaledBrushSize;
  }

  private applyScaledBrushToCanvas(): void { // Sets brush size of existing paths
    this.fabric.getObjects().map((path) => {
      path.strokeWidth = this.applyScaledBrush();
    });
  }

  private get scaledBrushSize(): number {
    return this.brushScaleFactor / this.fabric.getZoom();
  }

  private get canvasOptions(): object {
    return {
      isDrawingMode: true,
      selection: false
    }
  }
}

export default Canvas;
