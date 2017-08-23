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
  draw(line) {
    this.context.beginPath();
    this.context.moveTo(line[0].x * this.element.width, line[0].y * this.element.height);
    this.context.lineTo(line[1].x * this.element.width, line[1].y * this.element.height);
    this.context.strokeStyle = "#ffffff";
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
