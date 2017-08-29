class Canvas {
  constructor() {
    // Check which edge is smaller, then set both edges to that size.  This makes it square and fit in screen
    let size = Math.min(window.innerWidth, window.innerHeight);

    this.element = document.getElementById('map');
    this.context = this.element.getContext('2d');
    this.image = new Image();
    this.setBackground();
    this.instructions = [];
    this.toolPalette = document.querySelectorAll('.tool');
    this.element.width = size;
    this.element.height = size;
    this.scale = 1;
    this.zoom = {
      increase: 2,
      decrease: 0.5
    };
    this.transformHistory = [];
  }
  setBackground() {
    this.image.onload = () => {
      this.context.drawImage(this.image, 0, 0, this.element.width, this.element.height);
    };
    this.image.src = '/images/map.png';
  }
  draw(data) {
    this.context.beginPath();
    this.context.moveTo(data.line[0].x * this.element.width, data.line[0].y * this.element.height);
    this.context.lineTo(data.line[1].x * this.element.width, data.line[1].y * this.element.height);
    this.context.lineWidth = 2 / this.scale;
    this.context.strokeStyle = data.colour;
    this.context.stroke();
  }
  registerDrawEventListeners(mouse) {
    this.element.onmousedown = () => {
      mouse.down();
    };
    this.element.onmouseup = () => {
      mouse.up();
    };
    this.element.onmousemove = (e) => {
      mouse.drag(e, this);
    };
    this.element.onwheel = (e) => {
      let zoom;
      let transform;

      if (e.deltaY <= 0) {
        zoom = this.zoom.increase;
        this.scale++;

        transform = {
          x: e.pageX - e.target.offsetLeft,
          y: e.pageY - e.target.offsetTop
        };

        this.transformHistory.push(transform);
      } else if (e.deltaY >= 0 && this.scale > 1) {
        zoom = this.zoom.decrease;
        this.scale--;

        transform = this.transformHistory.pop();
      } else {
        return;
      }

      this.context.translate(transform.x, transform.y);
      this.context.scale(zoom, zoom); // Sponsored by Mazda
      this.context.translate(-transform.x, -transform.y);

      this.context.drawImage(this.image, 0, 0, this.element.width, this.element.height);

      this.instructions.forEach((instruction) => {
        this.draw(instruction);
      });
    };
  }
  registerToolEventListeners(mouse) {
    this.toolPalette.forEach((tool) => {
      tool.onclick = (e) => {
        mouse.changeTool(e.target.dataset.tool);
      };
    });
  }
}

module.exports = Canvas;
