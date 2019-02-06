
// how to make the drawing
/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 *
 * @author Joshua Cuneo
 */

var gl;
var program;
var canvas;

var colors = [];
var theta = 0;
var alpha = 0;
var vertices = [];
var polygons = [];
var points = [];
var colors = [];

//perspective stuff
var tp;
var bottom;
var r;
var l;
var near;
var far;

var tx = 0;
var ty = 0;
var tz = 0;


function main()
{
  // We process the data in the file
  var fileInput = document.getElementById('fileInput');
  var inputDiv = document.getElementById('inputDiv');
  fileInput.addEventListener('change', function (e) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    vertices = [];
    colors = [];
    polygons = [];
    points = [];
    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        var data = reader.result.split(/\r\n?|\n/);
        if (data[0] !== "ply") {
          alert('File does not contain "ply"');
        } else {

          // number of vertices
          var nrVerticesArr = data[2].match(/\d+/).map(function (v) {
            return parseInt(v);
          });
          var nrVertices = nrVerticesArr[0];

          // number of polygons
          var nrPolygonsArr = data[6].match(/\d+/).map(function (v) {
            return parseInt(v);
          });
          var nrPolygons = nrPolygonsArr[0];
          //console.log(nrVertices);
          //console.log(nrPolygons);


          // what initial values
          var coords = data[9].split(" ");
          var x = parseFloat(coords[0]);
          var y = parseFloat(coords[1]);
          var z = parseFloat(coords[2]);
          vertices.push(vec4( x, y, z, 1.0 ));
          tp = x;
          bottom = x;
          r = y;
          l = y;
          far = z;
          near = z;

          var i = 0;
          for (i =10; i < nrVertices + 9; i++) {
            var coords = data[i].split(" ");
            var x = parseFloat(coords[0]);
            var y = parseFloat(coords[1]);
            var z = parseFloat(coords[2]);
            vertices.push(vec4( x, y, z, 1.0 ));

            //now we we check for the max x, y and z in order to plug these values in the perspective function
            //these are model coordinates, we have to pass them to eye coordinates
            r = Math.max(x,r);
            l = Math.min(x, l);

            tp = Math.max(y,tp);
            bottom = Math.min(y, bottom);

            far = Math.max(z,far);
            near = Math.min(z, near);


            //colors.push(vec4(1.0, 0.0, 0.0, 1.0));
            //console.log(coords[0] + " " + coords[1] + " " + coords[2]);
          }
          //console.log(r + " ")

          //console.log("---------------------------------");
          const j = i;
          for (i = j; i < nrPolygons + j; i++) {
            var pols = data[i].split(" ");
            //polygons.push(vec3( parseFloat(pols[0]), parseFloat(pols[1]),  parseFloat(pols[2])));
            poly(parseFloat(pols[1]), parseFloat(pols[2]),  parseFloat(pols[3]));
            //console.log(pols[1] + " " + pols[2] + " " + pols[3]);
          }
          console.log(vertices.length);
          console.log(points.length);
          console.log("--------");
          console.log(polygons.length);
          //console.log(vertices);
          console.log("--------");
          //console.log(points);


        	//Necessary for animation
        	render();


        }

    }
    reader.readAsText(file);

  });


	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl)
	{
		//console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	// This function call will create a shader, upload the GLSL source, and compile the shader
	program = initShaders(gl, "vshader", "fshader");

	// We tell WebGL which shader program to execute.
	gl.useProgram(program);

	//Set up the viewport
	//x, y - specify the lower-left corner of the viewport rectangle (in pixels)
	//In WebGL, x and y are specified in the <canvas> coordinate system
	//width, height - specify the width and height of the viewport (in pixels)
	//canvas is the window, and viewport is the viewing area within that window
		//This tells WebGL the -1 +1 clip space maps to 0 <-> gl.canvas.width for x and 0 <-> gl.canvas.height for y
	gl.viewport( 0, 0, canvas.width, canvas.height );

	/**********************************
	* Points, Lines, and Fill
	**********************************/

	/*** VERTEX DATA ***/
	//Define the positions of our points
	//Note how points are in a range from 0 to 1
  /*
	points = [];
	colors = [];

	quad( 1, 0, 3, 2 );
	quad( 2, 3, 7, 6 );
	quad( 3, 0, 4, 7 );
	quad( 6, 5, 1, 2 );
	quad( 4, 5, 6, 7 );
	quad( 5, 4, 0, 1 ); */

  //this is the code that handles thevent when a key is pressed
  window.onkeypress = function(event) {
      var key = event.key;
      switch(key) {
          case 'w':
              tx += 0.01;
              render();
          case 'd':

              userPoints = [];
              colors = [];
              gl.clear(gl.ARRAY_BUFFER);
              console.log(userPoints);
              draw = true;
              gl.clearColor(1.0, 1.0, 1.0, 1.0); // we can avoid this if we want to use the same background
              gl.clear(gl.COLOR_BUFFER_BIT);
              inputDiv.style.visibility = "hidden";
              header.innerHTML = "Draw Mode";
              break;

          case 'c':
              colorIdx= (colorIdx + 1)%4; // this iterates through the array of colors, that is a global variable
              if (!draw) { // if we are not in draw mode
                  drawPolylineFromInput();
              } else { //if we are in draw mode
                  render();
              }
      }
  }



}

var id;

function render() {
  //Create the buffer object
  var vBuffer = gl.createBuffer();

  //Bind the buffer object to a target
  //The target tells WebGL what type of data the buffer object contains,
  //allowing it to deal with the contents correctly
  //gl.ARRAY_BUFFER - specifies that the buffer object contains vertex data
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

  //Allocate storage and write data to the buffer
  //Write the data specified by the second parameter into the buffer object
  //bound to the first parameter
  //We use flatten because the data must be a single array of ints, uints, or floats (float32 or float64)
  //This is a typed array, and we can't use push() or pop() with it
  //
  //The last parameter specifies a hint about how the program is going to use the data
  //stored in the buffer object. This hint helps WebGL optimize performance but will not stop your
  //program from working if you get it wrong.
  //STATIC_DRAW - buffer object data will be specified once and used many times to draw shapes
  //DYNAMIC_DRAW - buffer object data will be specified repeatedly and used many times to draw shapes
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  //Get the location of the shader's vPosition attribute in the GPU's memory
  var vPosition = gl.getAttribLocation(program, "vPosition");

  //Specifies how shader should pull the data
  //A hidden part of gl.vertexAttribPointer is that it binds the current ARRAY_BUFFER to the attribute.
  //In other words now this attribute is bound to vColor. That means we're free to bind something else
  //to the ARRAY_BUFFER bind point. The attribute will continue to use vPosition.
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

  //Turns the attribute on
  gl.enableVertexAttribArray(vPosition);

  //Specify the vertex size
  var offsetLoc = gl.getUniformLocation(program, "vPointSize");
  gl.uniform1f(offsetLoc, 10.0);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  //This is how we handle extents
  //We need to change this to see things once we've added perspective
  //var thisProj = ortho(-5, 5, -5, 5, -5, 100);

  var  fovy = Math.atan(tp/near); // ymax/zmin // height of the bounding box div by 2 then also only distance from eye to the near plane


  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var thisProj = perspective(fovy, aspect, 0.1, 100);

  var projMatrix = gl.getUniformLocation(program, 'projMatrix');
  gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
  // for proj perspective(fovy, 1, 0, zDist)

  // Set clear color
  //gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

	var rotMatrix = rotate(0, vec3(-1, -1, 0));
	//var rotMatrix = rotateY(theta);
	//var rotMatrix2 = rotateX(45);
	var translateMatrix = translate(tx, ty, tz);
	//var tempMatrix = mult(rotMatrix, rotMatrix2);
	//var ctMatrix = mult(translateMatrix, tempMatrix);
	var ctMatrix = mult(translateMatrix, rotMatrix);

	//theta += 0.05;
	//alpha += 0.005;

  // 1. get extents, min max xyz
  // 2. based on extents where do we put the eye and where does the eye look : view ctMatrix
  // 3. based on extents what is fovy : proj matrix

  /*
  r = Math.max(x,r);
  l = Math.min(x, l);

  top = Math.max(y,top);
  bottom = Math.min(y, bottom);

  near = Math.max(z,far);
  far = Math.min(z, near);
  */

	var eye = vec3((r-l)/2, (tp-bottom)/2, near + 100);
	var at = vec3((r-l)/2, (tp-bottom)/2, (near - far)/2); // should be out from the viewing frustum
	var up = vec3(0.0, 1.0, 0.0);

	var viewMatrix = lookAt(eye, at, up);

	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

    	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//gl.drawArrays(gl.POINTS, 0, points.length);
	gl.drawArrays(gl.LINE_LOOP, 0, points.length);

	//console.log(theta);

	//if(theta < -90) {
	//	cancelAnimationFrame(id);
	//}
	//else
	//{
		id = requestAnimationFrame(render);
	//}

}

function poly(a, b, c)
{
  //console.log("abc = " + a + " " + b + " " + c);

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //console.log(indices[i] + " --> " + vertices[indices[i]]);
        //console.log("nr of vertices = " + vertices.length);
        //console.log("nr of points = " + points.length);
        colors.push(vec4(1.0, 1.0, 1.0, 1.0));
        //console.log("nr of colors = " + colors.length);
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);


    }
}
