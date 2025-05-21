var videoTexture;
var webcamElement;

async function initWebcam() {
	webcamElement = document.getElementById("webcam");
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		webcamElement.srcObject = stream;

		videoTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, videoTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	} catch (error) {
		console.error("Error accessing webcam:", error);
	}
}

function initBackgroundShaders() {
	const backgroundVertexShader = `
        attribute vec2 position;
        attribute vec2 texCoord;
        varying vec2 vTexCoord;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
            vTexCoord = texCoord;
        }
    `;

	const backgroundFragmentShader = `
        precision mediump float;
        uniform sampler2D uTexture;
        varying vec2 vTexCoord;
        void main() {
            gl_FragColor = texture2D(uTexture, vTexCoord);
        }
    `;

	// Create a proper shader program instance
	const backgroundProgram = new ShProgram("Background");
	backgroundProgram.init(gl, backgroundVertexShader, backgroundFragmentShader);

	// Store the program object, not just the ID
	shProgram.backgroundProgram = backgroundProgram;

	// Initialize background shader attributes and uniforms
	shProgram.backgroundProgram.positionLoc = gl.getAttribLocation(
		shProgram.backgroundProgram.prog,
		"position",
	);
	shProgram.backgroundProgram.texCoordLoc = gl.getAttribLocation(
		shProgram.backgroundProgram.prog,
		"texCoord",
	);
	shProgram.backgroundProgram.textureLoc = gl.getUniformLocation(
		shProgram.backgroundProgram.prog,
		"uTexture",
	);
}

function drawVideoBackground() {
	if (!shProgram.backgroundProgram) {
		initBackgroundShaders();
	}

	gl.useProgram(shProgram.backgroundProgram.prog);

	// Set up a simple quad for the background
	const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

	// Flip the texture coordinates both horizontally and vertically
	// Original: [0, 0, 1, 0, 0, 1, 1, 1]
	// Horizontal flip: [1, 0, 0, 0, 1, 1, 0, 1]
	// Vertical flip: [1, 1, 0, 1, 1, 0, 0, 0]
	const texCoords = new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]);

	// Create and bind buffers
	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

	// Set up attributes
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.enableVertexAttribArray(shProgram.backgroundProgram.positionLoc);
	gl.vertexAttribPointer(shProgram.backgroundProgram.positionLoc, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.enableVertexAttribArray(shProgram.backgroundProgram.texCoordLoc);
	gl.vertexAttribPointer(shProgram.backgroundProgram.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

	// Set the texture unit
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webcamElement);
	gl.uniform1i(shProgram.backgroundProgram.textureLoc, 0);

	// Draw
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	// Clean up
	gl.deleteBuffer(vertexBuffer);
	gl.deleteBuffer(texCoordBuffer);

	gl.useProgram(shProgram.prog);
}