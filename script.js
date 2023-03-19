const fps = 60; // the number of frames per second
const centerAccuracy = 10; // accuracy of center of mass calculations, the lower this value is the more accurate the calculations are but the longer they take
const metre = 100; // how many pixels equates to 1 metre in game
const gravity = [0, 9.8]; // gravity in N/Kg as vector
const mouseDragMultiplier = 0.3; // multiplier applied to shapes velocity after being dragged by mouse so they dont fly off too fast

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 3;

var drawingShape = false; // wether the user is currently drawing a shape to add
var drawingVertices = []; // the vertices of the current drawing

var mouse = [0, 0]; // current coordinates of the mouse
var mouseDown = false; // wether the mouse is down or not
var mouseVelocity = [0, 0]; // the current velocity of the mouse as a vector
var shapes = []; // array of Shape objects holds all the shapes
var paused = false;

// track current mouse coords on canvas
function getMouseCords(event)
{
  var e = window.event;

  var rect = canvas.getBoundingClientRect(); // gets info about the actual size of the element
  var scaleX = canvas.width / rect.width; // finds the scale between the actual size of the canvas on screen and the number of pixels high e.g. it is 1920px tall in html but it is actually smaller as it has been scaled down by css 
  var scaleY = canvas.height / rect.height;

  mouse[0] = (e.clientX - rect.left) * scaleX;
  mouse[1] = (e.clientY - rect.top) * scaleY;
}

// detect left mouse clicks
canvas.addEventListener("click", (event) => 
{
  if (drawingShape)
  {
    drawingVertices.push(JSON.parse(JSON.stringify(mouse))); // adds new vertice to drawing
    if (drawingVertices.length > 0)
    {
      // draws line between vertices as user is drawing them to make shape easier to visualise
      ctx.strokeStyle = "black";
      ctx.moveTo(drawingVertices[drawingVertices.length-2][0], drawingVertices[drawingVertices.length-2][1]);
      ctx.lineTo(drawingVertices[drawingVertices.length-1][0], drawingVertices[drawingVertices.length-1][1]);
      ctx.stroke();
    }
  }
});

// tracks if mouse up or down
canvas.addEventListener("mousedown", (event) => mouseDown = true);
canvas.addEventListener("mouseup", (event) => mouseDown = false);

function pause()
{
  if (paused)
  {
    document.getElementById("playPause").innerText = "Pause";
    paused = false;
  }
  else
  {
    document.getElementById("playPause").innerText = "Play";
    paused = true;
  }
}


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

//adds 2 vectors
function vector_add(v1, v2)
{
  return [v1[0]+v2[0], v1[1]+v2[1]];
}

// subtracts a vector from another (v1-v2)
function vector_sub(v1, v2)
{
  return [v1[0]-v2[0], v1[1]-v2[1]];
}

// translates an array of vertices in the format [[x, y], [x, y], [x, y], ...] by a vector
function vertices_translate(vertices, vector)
{
  var newVertices = [];

  for (let i=0; i<vertices.length; i++)
  {
    newPoint = vector_add(vertices[i], vector);
    //newPoint[0] = vertices[i][0] + vector[0];
    //newPoint[1] = vertices[i][1] + vector[1];
    newVertices[i] = newPoint;
  }

  return newVertices;
}

// returns true if the points are listen in a counterclockwise order
// points are in the format: [x, y]
function counter_clockwise(p1, p2, p3)
{
  return (p3[1]-p1[1])*(p2[0]-p1[0]) > (p2[1]-p1[1])*(p3[0]-p1[0]);
}

// returns true if the two lines intersect
// lines are in the format: [[x, y], [x, y]]
// note: doesn't work if one line just touches the end of the other
function intersects(line1, line2)
{
  return counter_clockwise(line1[0], line2[0], line2[1]) != counter_clockwise(line1[1], line2[0], line2[1]) & counter_clockwise(line1[0], line1[1], line2[0]) != counter_clockwise(line1[0], line1[1], line2[1]);
}






// Shape objects are shapes that appear on the canvas
// this class holds functions to draw, translate, rotate, enlarge shapes etc
class Shape
{
  velocity = [0, 0]; // the velocity of the shape as a vector
  momentum = [0, 0];
  followingMouse = false; // used to know if the shape should be following mouse
  
  // vertices is an array of each vertice coordinate relative to the center of the shape e.g. for a triangle its [[0, 0], [0, 1], [1, 0]]
  // note: the coordinates are local/relative to the shape
  // note: in this case the center of the shape is off center
  // position is the coordinates for the center of the shape as an array e.g. [1, 2]
  // size is the multiplier applied to the vertices which controls the size of the shape
  constructor(vertices, color, mass, moveable=true)
  {
    this.vertices = vertices; // enlarges the shape by the size variable then adjusts the position of the shape vertices based on the position
    this.position = this.center(); // calculates the position of the center based on the coordinates of all the vertices
    this.color = color;
    this.mass = mass; // the mass in kg
    this.moveable = moveable; // wether the object is affected by forces
  }

  draw()
  {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
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

  // calculates the center of mass of the shape by working out an estimate for the average x and y coordinates of all points inside the shape
  center()
  {
    var points = 0; // the number of points that are inside
    var pointsTotal = [0, 0]; // the sum of all points that are inside (used with points to calculate an average)

    var minX = this.vertices[0][0]; // the lowest value X reaches
    var maxX = this.vertices[0][0]; // the highest value X reaches
    var minY = this.vertices[0][1];
    var maxY = this.vertices[0][1];

    // finding the maximum and minimum values for x and y
    for (let i=0; i<this.vertices.length; i++)
    {
      var vertice = this.vertices[i];
      
      if (vertice[0] < minX) {minX = vertice[0];}
      if (vertice[0] > maxX) {maxX = vertice[0];}
      if (vertice[1] < minY) {minY = vertice[1];}
      if (vertice[1] > maxY) {maxY = vertice[1];}
    }

    // working out the total of the x and y coordinates of points inside the shape
    for (let x=minX; x<maxX; x+=centerAccuracy)
    {
      for (let y=minY; y<maxY; y+=centerAccuracy)
      {
         if (this.inside([x, y]))
         {
           points++;
           pointsTotal[0] += x;
           pointsTotal[1] += y;
         }
      }
    }

    return [pointsTotal[0]/points, pointsTotal[1]/points]; // finding the average x and y coordinates of all points inside shape
  }

  // returns true if point (format: [x, y]) is inside the shape
  inside(point)
  {
    var ray = [point, [0, 10000]]; // line from point straight upwards to check how many times it collides with the edges of the shape
    
    var collisions = 0; // number of times a ray from point intersects a line of the shape (if its odd the point is inside the shape else it is outside)
    
    for (let i=0; i<this.vertices.length-1; i++) // loops through each vertice and tests if each line intersects with ray
    {
      if (intersects(ray, [this.vertices[i], this.vertices[i+1]]))
      {
        collisions++;
      }
    }
    if (intersects(ray, [this.vertices[this.vertices.length-1], this.vertices[0]])) // test if ray intersects the final line from last vertice back to the first
    {
      collisions++;
    }

    // if the collisions is even the point is outside the shape else it is inside
    if (collisions % 2 == 0)
    {
      return false;
    }
    else
    {
      return true;
    }
  }
}

// run when user clicks draw shape button, allows the user to draw out a shape and then click again to add it to the game
function drawShape()
{
  
  if (!drawingShape)
  {
    drawingShape = true; // when this is true mouse click coords get added to an array to add vertices to drawing.
    drawingVertices = []; // clearing drawingVerices for the next drawing
    document.getElementById("drawShape").innerText = "Finish Shape";
    document.getElementById("playPause").innerText = "Play";
    paused = true; // pause game whilst drawing shape
  }
  else
  {
    drawingShape = false;
    document.getElementById("drawShape").innerText = "Draw Shape";
    color = prompt("What color would you like the shape to be"); // get user input on shape color 
    mass = Number(prompt("What is the mass of this shape")); // get user input on mass
    moveable = (prompt("should this shape be moveable (true/false)") == "true"); // get user input on wether the object is moveable or not
    var shape = new Shape(drawingVertices, color, mass, moveable);
    shapes.push(shape); // pushes the shape onto the array holding all shapes 
    shape.draw(); // draw shape so it can be seen before unpause
    drawingVertices = []; // clearing drawingVerices for the next drawing
  }
}

// calculates the resultant force from any number of force vectors
// takes any number of arguments
function resultant_force()
{
  var rf = [0, 0]; // the resultant force as a vector

  // getting the sum of all forces
  for (let i=0; i<arguments.length; i++)
  {
    rf = vector_add(rf, arguments[i]);
  }

  return rf;
}

// calculates the force of weight on an object as a vector using its mass and gravity
// weight is in N
function weight(mass)
{
  return [gravity[0]*mass, gravity[1]*mass];
}

// calculates the acceleration of an object in m/s^2 as a vector using its mass and a force
// force is in format: [x, y]
function acceleration(mass, force)
{
  return [force[0]/mass, force[1]/mass]; // works out acceleration with equation A = F/m
}

var lastMouse = [0, 0]; // stores the mouse position the previous frame to work out mouse velocity
var lastMouseDown = false; // stores wether the mouse was down last frame (used to detect when mouse is let go of or pressed inside game loop)

// this function runs the fps variable times per second and draws each frame
// this is the game loop
function update() 
{
    
  if (!paused)
  {
    var mouseMovement = vector_sub(mouse, lastMouse); // calculates the displacement of the mouse since last frame
    var time = 1/fps; // working out how many seconds have passed since the last frame
    var mouseVelocity = [(mouseMovement[0]/time)/metre, (mouseMovement[1]/time)/metre]; // current mouse velocity vector

    
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas for the next frame
    
    for (let i=0; i<shapes.length; i++)
    {
      if (shapes[i].moveable)
      {
        var shapeWeight = weight(shapes[i].mass); // calculating the shapes weight 
        var shapeAcc = acceleration(shapes[i].mass, shapeWeight); // calculating the shapes accelleration as vector
  
        var shapeVelocityChange = [shapeAcc[0]/fps, shapeAcc[1]/fps]; // accelleration adjusted for fps
        shapes[i].velocity = vector_add(shapes[i].velocity, shapeVelocityChange);
      }

      // if the shape has just been clicked on it should follow the mouse
      if (mouseDown & !lastMouseDown & shapes[i].inside(mouse))
      {
        shapes[i].followingMouse = true;
      }

      // if following mouse but immovable move it anyway
      if (shapes[i].followingMouse & !shapes[i].moveable)
      {
        shapes[i].translate([shapes[i].velocity[0]/fps*metre, shapes[i].velocity[1]/fps*metre]);
      }
      
      // if mouse button up and following mouse stop following mouse
      if (shapes[i].followingMouse & !mouseDown & lastMouseDown)
      {
        shapes[i].followingMouse = false;

        // if moveable slow shape down by multiplier so it doesnt fly too far, if its immovable set its velocity to [0, 0]
        if (shapes[i].moveable)
        {
          shapes[i].velocity = [shapes[i].velocity[0]*mouseDragMultiplier, shapes[i].velocity[1]*mouseDragMultiplier];
        }
        else
        {
          shapes[i].velocity = [0, 0];
        }
      }

      // if should be following mouse make shape follow by changing its velocity to that of the mouse
      if (shapes[i].followingMouse)
      {
        shapes[i].velocity = mouseVelocity;
      }

      // if the object is moveable move it according to its velocity
      if (shapes[i].moveable)
      {
        shapes[i].translate([shapes[i].velocity[0]/fps*metre, shapes[i].velocity[1]/fps*metre]); // translating the shape by its velocity taking into account fps and metre (how many pixels equates to 1 meter) so it moves the right distance per second
      }

      shapes[i].momentum = [shapes[i].velocity[0]*shapes[i].mass, shapes[i].velocity[1]*shapes[i].mass]; // calculating the shapes momentum vector using the equation p = mv
      
      shapes[i].draw(); // draw the shape onto the canvas

      ////////// printing momentums ontop of shapes
      ctx.font = "30px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(JSON.stringify([Math.round(shapes[i].momentum[0]), Math.round(shapes[i].momentum[1])]), shapes[i].position[0], shapes[i].position[1]);
    }
  }

  lastMouse = JSON.parse(JSON.stringify(mouse)); // setting lastMouse position for next frame
  lastMouseDown = mouseDown; // setting wether the mouse was down this frame for next frame
}

intervalId = window.setInterval(update, 1000/fps); // setting update function to run fps times per second


// make it so shapes show their velocity on them