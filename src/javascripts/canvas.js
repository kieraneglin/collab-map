class Canvas {
  constructor() {
    this.element = document.getElementById('map');
    this.context = this.element.getContext('2d');

    this.element.width = window.innerWidth;
    this.element.height = window.innerHeight;
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
