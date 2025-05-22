var gl;                         // The webgl context.
var surface;                    // A surface model
var shProgram;                  // A shader program
var spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

const lightParameters = { x: 10, y: 10, z: 10 };
const stereoParams = { eyeSeparation: 0.1, fov: 60, nearClip: 0.1, convergence: 5 };
const gyroRotation = { x: 0, y: 0, z: 0 };

const socket = new WebSocket("ws://192.168.0.101:3000");

function getAngles(accX, accY, accZ) {
	const pitch = Math.atan2(accX, Math.sqrt(accY * accY + accZ * accZ));
	const roll = Math.atan2(accY, accZ);
	return {
		pitch: pitch * 180 / Math.PI,
		roll: roll * 180 / Math.PI
	};
}

socket.onmessage = function (event) {
	const data = JSON.parse(event.data);
	const angles = getAngles(data.accX, data.accY, data.accZ);
	gyroRotation.x = angles.pitch * -0.02;
	gyroRotation.y = angles.roll * 0.02;
	gyroRotation.z = 0; // Usually not used, but can be added
};

/* Initialize the WebGL context. Called from init() */
function initGL() {
	shProgram = new ShProgram("Basic");
	shProgram.init(gl, vertexShaderSource, fragmentShaderSource);
	shProgram.use(gl);

	// create surface model
	surface = new Surface("Parabolic Humming-Top", 1, 1, 65, 65);
	surface.initBuffer(gl);
	surface.createTextures(gl);

	gl.enable(gl.DEPTH_TEST);
}

function animateLight(time) {
	const baseRadius = 10.0;
	const speed = 0.001; // Speed of light rotation
	const radiusAmplitude = 2.0; // Amplitude for radius variation
	const heightAmplitude = 3.0; // Amplitude for height variation

	// Dynamic radius change
	const radius = baseRadius + radiusAmplitude * Math.sin(time * speed * 0.5);

	// Light position coordinates
	lightParameters.x = radius * Math.cos(time * speed); // X-coordinate changes in a circular motion
	lightParameters.z = radius * Math.sin(time * speed); // Z-coordinate changes in a circular motion
	lightParameters.y = 5.0 + heightAmplitude * Math.sin(time * speed * 0.7); // Y-coordinate changes smoothly over time

	requestAnimationFrame(animateLight); // Recursive call for animation
}

function animate() {
	draw();
	requestAnimationFrame(animate);
}

function drawEye(offset) {
	const projection = m4.perspective((stereoParams.fov * Math.PI) / 180, 1, stereoParams.nearClip, 100);
	const modelView = spaceball.getViewMatrix();

	//--- Add rotation from the gyroscope ---
	let gyroMatrix = m4.identity();
	gyroMatrix = m4.xRotate(gyroMatrix, gyroRotation.x);
	gyroMatrix = m4.yRotate(gyroMatrix, gyroRotation.y);
	gyroMatrix = m4.zRotate(gyroMatrix, gyroRotation.z);

	// Apply the gyro rotation to the current view matrix
	const rotatedView = m4.multiply(gyroMatrix, modelView);

	// Apply eye offset
	const eyeMatrix = m4.translation(offset, 0, 0);
	const viewMatrix = m4.multiply(eyeMatrix, rotatedView);

	const rotateToPointZero = m4.axisRotation([Math.SQRT1_2, Math.SQRT1_2, 0], 0.7);
	const translateToPointZero = m4.translation(0, 0, -stereoParams.convergence);

	const matAcc0 = m4.multiply(rotateToPointZero, viewMatrix);
	const matAcc1 = m4.multiply(translateToPointZero, matAcc0);

	const modelViewProjection = m4.multiply(projection, matAcc1);

	// Set up matrices
	gl.uniformMatrix4fv(shProgram.matrixUni, false, modelViewProjection);
	const normalMatrix = m4.transpose(m4.inverse(matAcc1));
	gl.uniformMatrix4fv(shProgram.normalMatrixUni, false, normalMatrix);


	gl.uniform3fv(shProgram.viewPositionUni, [0.0, 0.0, 5.0]);
	gl.uniform3f(shProgram.lightDirectionUni, lightParameters.x, lightParameters.y, lightParameters.z);

	// render surface
	gl.uniform1i(shProgram.isWireframeUni, false);
	surface.draw(gl, shProgram);

	// render frame
	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1, 1);
	gl.uniform1i(shProgram.isWireframeUni, true);
	surface.initTextures(gl, shProgram);
	surface.draw(gl, shProgram);
	gl.disable(gl.POLYGON_OFFSET_FILL);
}

function draw() {
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Draw background video if available
	if (WebCamObj && WebCamObj.videoWidth > 0) {
		drawVideoBackground();
	}

	// Set lighting parameters with brighter values for anaglyphic view
	gl.uniform3f(shProgram.ambientColorUni, 0.05, 0.05, 0.05);
	gl.uniform3f(shProgram.diffuseColorUni, 0.8, 0.8, 0.8);
	gl.uniform3f(shProgram.specularColorUni, 1.0, 1.0, 1.0);
	gl.uniform1f(shProgram.shininessUni, 32.0);

	// Render left eye (red)
	gl.colorMask(true, false, false, true);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	drawEye(stereoParams.eyeSeparation / 2);

	// Render right eye (cyan)
	gl.colorMask(false, true, true, true);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	drawEye(-stereoParams.eyeSeparation / 2);

	gl.colorMask(true, true, true, true);
}

/**
 * initialization function that will be called when the page has loaded
 */
async function init() {
	const canvas = document.getElementById("webglcanvas");
	try {
		gl = canvas.getContext("webgl");
		if (!gl) {
			throw "Browser does not support WebGL";
		}
		initGL()
		$('#p').val(surface.getP());
		$('#h').val(surface.getH());
	} catch (e) {
		console.error('Someting went wrong' + e)
		$("#canvas-holder").html(
			`<p>Sorry, something went wrong: ${e}</p>`
		)
		return;
	}
	spaceball = new TrackballRotator(canvas, draw, 0);
	await intVideoStream();
	draw();
	animateLight(0);
	animate()
}