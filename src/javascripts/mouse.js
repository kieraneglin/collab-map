class Mouse {
  constructor() {
    this.tools = { // Since we don't have enums...
      PEN: 'PEN',
      DISTANCE: 'DISTANCE'
    };
    this.colours = ['#f4d03f', '#58d68d', '#3498db', '#e74c3c', '#ecf0f1']; // This class is getting beefy.  TODO: break out into Mouse, Colour, and Tool
    this.colour = undefined; // To bet set on connection.
    this.selectedTool = this.tools.PEN;
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
    this.pos.x = ((e.pageX - e.target.offsetLeft) / canvas.element.width) * Math.pow(0.5, canvas.scale - 1); // Sets the scaling for any zoom level
    this.pos.y = ((e.pageY - e.target.offsetTop) / canvas.element.height) * Math.pow(0.5, canvas.scale - 1); // Just trust
    console.log(this.pos);
    this.move = true;
  }
  shouldDraw() { // It's at this point that I regretted not using TypeScript
    return this.click && this.move && this.previousPos && this.selectedTool;
  }
  changeTool(newTool) {
    this.selectedTool = newTool == this.selectedTool ? undefined : newTool;
  }
}

module.exports = Mouse;
