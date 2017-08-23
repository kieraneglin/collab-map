class Mouse {
  constructor() {
    this.click = false;
    this.move = false;
    this.pos = {
      x: 0,
      y: 0
    };
    this.previousPos = {
      x: 0,
      y: 0
    };
  }
  down() {
    this.click = true;
  }
  up() {
    this.click = false;
  }
  drag(e, canvas) {
    // normalize mouse position to range 0.0 - 1.0
    this.pos.x = (e.clientX - e.target.offsetLeft) / canvas.element.width;
    this.pos.y = (e.clientY - e.target.offsetTop) / canvas.element.height;
    this.move = true;
  }
}

module.exports = Mouse;
