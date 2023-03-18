const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// performs a matrix multiplication on a coordinate for the purpose of transformations
// point is in format [x, y]
// matrix is in format (this example is for the identity matrix):
// [
//    [1, 0]       x
//    [0, 1]       y
// ]
function matrix_multiply(point, matrix)  
{
  var newPoint = [];
  newPoint[0] = matrix[0][0]*point[0] + matrix[0][1]*point[1];
  newPoint[1] = matrix[1][0]*point[0] + matrix[1][1]*point[1];

  return newPoint;
}

// uses the matrix_multiply() function to transform an array of vertices by the same matrix
// vertices is in the format [[x, y], [x, y], [x, y], ...]
function matrix_transform(vertices, matrix)
{
  var newVertices = [];

  for (let i=0; i<vertices.length; i++)
  {
    newVertices[i] = matrix_multiply(vertices[i], matrix);
  }

  return newVertices;
}

// translates an array of vertices in the format [[x, y], [x, y], [x, y], ...] by a vector
function vertices_translate(vertices, vector)
{
  var newVertices = [];

  for (let i=0; i<vertices.length; i++)
  {
    newPoint = []
    newPoint[0] = vertices[i][0] + vector[0];
    newPoint[1] = vertices[i][1] + vector[1];
    newVertices[i] = newPoint;
  }

  return newVertices;
}




// Shape objects are shapes that appear on the canvas
// this class holds functions to draw, translate, rotate, enlarge shapes etc
class Shape
{
  // vertices is an array of each vertice coordinate relative to the center of the shape e.g. for a triangle its [[0, 0], [0, 1], [1, 0]]
  // note: the coordinates are local/relative to the shape
  // note: in this case the center of the shape is off center
  // position is the coordinates for the center of the shape as an array e.g. [1, 2]
  // size is the multiplier applied to the vertices which controls the size of the shape
  constructor(vertices, size, position, color)
  {
    this.vertices = vertices_translate(matrix_transform(vertices, [[size, 0], [0, size]]), position); // enlarges the shape by the size variable then adjusts the position of the shape vertices based on the position
    this.position = position;
    this.color = color;
  }

  draw()
  {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "red";
    ctx.beginPath()
    ctx.moveTo(this.vertices[0][0], this.vertices[0][1]); // move to first vertice
    // draws a line between each vertice, starts at 1 as starts drawing at first vertice
    for (let i=1; i<this.vertices.length; i++)
    {
      ctx.lineTo(this.vertices[i][0], this.vertices[i][1]); // line to the next vertice
    }
    ctx.lineTo(this.vertices[0][0], this.vertices[0][1]); // draw final line back to first vertice
    ctx.stroke();
    ctx.fill()
  }

  // translates the shape by vector
  translate(vector)
  {
    this.vertices = vertices_translate(this.vertices, vector);
    this.position = vertices_translate([this.position], vector)[0];  // doing the same transformation on the center of the shape
  }

  // rotates the shape using matrix multiplication
  // the center is in the format [x, y]
  // anticlockwise rotations can be represented as a negative e.g. -90 deg
  rotate(degrees, center=this.position)
  {
    var radians = degrees * (Math.PI/180); // converts from degrees to radians to find the matrix

    var matrix = [[Math.cos(radians), -Math.sin(radians)], [Math.sin(radians), Math.cos(radians)]]; // calculating the transformation matrix
    
    this.vertices = vertices_translate(matrix_transform(vertices_translate(this.vertices, matrix_multiply(center, [[-1, 0], [0, -1]])), matrix), center); // performs the transformation by translating shape to origin, rotating round origin then translating back

    this.position = vertices_translate(matrix_transform(vertices_translate([this.position], matrix_multiply(center, [[-1, 0], [0, -1]])), matrix), center)[0]; // doing the same transformation on the center of the shape
  }

  // enlarges the shape by sf (the scale factor)
  enlarge(sf, center=this.position)
  {
    var matrix = [[sf, 0], [0, sf]]; // the matrix is the identity matrix multiplied by the scale factor
    
    this.vertices = vertices_translate(matrix_transform(vertices_translate(this.vertices, matrix_multiply(center, [[-1, 0], [0, -1]])), matrix), center); // performs the transformation by translating shape to origin, enlarging it with the center as the origin then translating back

    this.position = vertices_translate(matrix_transform(vertices_translate([this.position], matrix_multiply(center, [[-1, 0], [0, -1]])), matrix), center)[0]; // doing the same transformation on the center of the shape
  }
}


var rect = [[-1, -1], [-1, 1], [1, 1], [1, -1]];

//rect = matrix_transform(rect, [[0.707, 0.707], [-0.707, 0.707]]);
var myShape = new Shape(rect, 100, [500, 500], "red");
myShape.draw();
myShape.rotate(45, [400, 400]);
myShape.color = "green";
myShape.draw();

ctx.strokeStyle = "black";
ctx.moveTo(myShape.position[0], myShape.position[1]);
ctx.lineTo(0, 0);
ctx.stroke();

