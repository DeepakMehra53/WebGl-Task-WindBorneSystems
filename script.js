const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl');
    const lineWidthInput = document.getElementById('lineWidth');
    let points = [-0.8, 0]; // Starting point (normalized coordinates)
    let draggingPoint = null; // To track the point being dragged
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    }

    // Compile shaders and create program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Get attribute/uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getUniformLocation(program, 'u_color');

    // Set line color
    gl.useProgram(program);
    gl.uniform4f(colorLocation, 0.4, 0.7, 1, 1); // Black color

    // Function to render points
    function render() {
      gl.clear(gl.COLOR_BUFFER_BIT);

    //   Render the line
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    //   gl.lineWidth(lineWidthInput.value);
    //   gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);

      // Render dots at endpoints
      gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);


    }


    // Function to draw a dot (small square) at a given position
    function drawDot(x, y) {
      const size = 0.05; // Size of the dot
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      // Draw a small square to represent the dot
      const dotVertices = new Float32Array([
        x - size, y - size,
        x + size, y - size,
        x - size, y + size,
        x + size, y + size
      ]);

      gl.bufferData(gl.ARRAY_BUFFER, dotVertices, gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    // Normalize canvas coordinates to WebGL coordinates (-1 to 1)
    function normalizeCoord(x, y) {
      return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
      ];
    }

    // Add random segment
    function addRandomSegment() {
      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      const randomX = lastX + Math.random() * 0.2 - 0.1;
      const randomY = lastY + Math.random() * 0.2 - 0.1;
      points.push(randomX, randomY);
      render();
    }

    // Add custom segment
    function addCustomSegment() {
      const x = parseFloat(document.getElementById('xCoord').value);
      const y = parseFloat(document.getElementById('yCoord').value);
      if (!isNaN(x) && !isNaN(y)) {
        const [normX, normY] = normalizeCoord(x, y);
        points.push(normX, normY);
        render();
      } else {
        alert('Please enter valid x and y coordinates');
      }
    }

    // Add segment on canvas click
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const [normX, normY] = normalizeCoord(x, y);
      points.push(normX, normY);
      render();
    });

    // Undo the last added segment
    function undoSegment() {
      if (points.length > 2) { // Keep at least the initial point
        points.pop(); // Remove last Y coordinate
        points.pop(); // Remove last X coordinate
        
        render();
      }
}

function isClosedShape() {
            if (points.length < 6) return false;
            const [firstX, firstY] = points.slice(0, 2);
            const [lastX, lastY] = points.slice(-2);
            return Math.abs(firstX - lastX) < 0.05 && Math.abs(firstY - lastY) < 0.05;
        }


document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault(); // Prevent default undo behavior in browsers
       
        undoSegment();
      }
    });

    // Set line width
    lineWidthInput.addEventListener('input', () => {
      gl.lineWidth(lineWidthInput.value);
      render();
    });
     // Mouse event handling for dragging dots
     canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left) / canvas.width * 2 - 1;
      const mouseY = -(event.clientY - rect.top) / canvas.height * 2 + 1;

      for (let i = 0; i < points.length; i += 2) {
        const dx = points[i] - mouseX;
        const dy = points[i + 1] - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
          draggingPoint = i; // Mark the point as being dragged
          break;
        }
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      if (draggingPoint !== null) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) / canvas.width * 2 - 1;
        const mouseY = -(event.clientY - rect.top) / canvas.height * 2 + 1;

        points[draggingPoint] = mouseX;
        points[draggingPoint + 1] = mouseY;
        render();
      }
    });

    canvas.addEventListener('mouseup', () => {
      draggingPoint = null;
    });

    // Initialize WebGL
    gl.clearColor(1, 1, 1, 1); // White background
    gl.clear(gl.COLOR_BUFFER_BIT);
    render();