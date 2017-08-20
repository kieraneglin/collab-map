class Canvas {
  constructor() {
    this.element = document.getElementById('map');
    this.context = this.element.getContext('2d');

    // Check which edge is smaller, then set both edges to that size.  This makes it square and fit in screen
    let size = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    this.element.width = size;
    this.element.height = size;
  }
  draw(line) {
    this.context.beginPath();
    this.context.moveTo(line[0].x * this.element.width, line[0].y * this.element.height);
    this.context.lineTo(line[1].x * this.element.width, line[1].y * this.element.height);
    this.context.stroke();
  }
  registerEventListeners(mouse) {
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
}

module.exports = Canvas;
