class Canvas {
  constructor() {
    this.element = document.getElementById('map');
    this.context = this.element.getContext('2d');
    this.toolPalette = document.querySelectorAll('.tool');
    // Check which edge is smaller, then set both edges to that size.  This makes it square and fit in screen
    let size = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    this.element.width = size;
    this.element.height = size;
  }
  draw(data) {
    this.context.beginPath();
    this.context.moveTo(data.line[0].x * this.element.width, data.line[0].y * this.element.height);
    this.context.lineTo(data.line[1].x * this.element.width, data.line[1].y * this.element.height);
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
