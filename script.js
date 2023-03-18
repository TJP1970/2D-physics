const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Shape objects are shapes that appear on the canvas
// this class holds functions to draw, translate, rotate, enlarge shapes etc
class Shape
{
  // vertices is an array of each vertice coordinate e.g. for a triangle its [[0, 0], [0, 1], [1, 0]]
  // note: the coordinates are local/relative to the shape
  // note: in this case the center of the shape is off center
  // position is the coordinates for the shape as an array e.g. [1, 2]
  // size is the multiplier applied to the vertices which controls the size of the shape
  constructor(vertices, position, color)
  {
    this.vertices = vertices;
    this.position = position;
    this.color = color;
  }

  draw()
  {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "red";
    ctx.beginPath()
    ctx.moveTo(this.position[0] + this.vertices[0][0], this.position[1] + this.vertices[0][1]); // move to first vertice
    // draws a line between each vertice, starts at 1 as starts drawing at first vertice
    for (let i=1; i<this.vertices.length; i++)
    {
      ctx.lineTo(this.position[0] + this.vertices[i][0], this.position[1] + this.vertices[i][1]); // line to the next vertice
      console.log([this.position[0] + this.vertices[i][0], this.position[1] + this.vertices[i][1]]);
    }
    ctx.lineTo(this.position[0] + this.vertices[0][0], this.position[1] + this.vertices[0][1]); // draw final line back to first vertice
    ctx.stroke();
    ctx.fill()
  }
}


var rect = [[-100, -100], [-100, 100], [100, 100], [100, -100]];
var myShape = new Shape(rect, [500, 500], "red");
myShape.draw();



