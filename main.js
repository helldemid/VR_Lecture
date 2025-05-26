document.addEventListener('DOMContentLoaded', function () {
	// Create a new Three.js scene
	var scene = new THREE.Scene();

	// Create a camera and add it to the scene
	var camera = new THREE.Camera();
	scene.add(camera);

	// Add ambient light to the scene
	var light = new THREE.AmbientLight(0xffffff, 0.8);
	scene.add(light);

	// Add directional light to the scene
	var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	directionalLight.position.set(1, 1, 1);
	scene.add(directionalLight);

	// Create a WebGL renderer and add it to the DOM
	var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('ar-container').appendChild(renderer.domElement);

	// Initialize AR source (webcam)
	var arSource = new THREEx.ArToolkitSource({ sourceType: 'webcam' });

	// Handle resizing of the renderer and AR elements
	function onResize() {
		arSource.onResizeElement();
		arSource.copyElementSizeTo(renderer.domElement);
		if (arContext.arController !== null) {
			arSource.copyElementSizeTo(arContext.arController.canvas);
		}
		renderer.setSize(window.innerWidth, window.innerHeight, false);
	}

	// Initialize AR source and set up resize listeners
	arSource.init(function onReady() {
		onResize();
	});
	window.addEventListener('resize', function () { onResize(); });
	window.addEventListener('orientationchange', function () { setTimeout(onResize, 500); });

	// Initialize AR context with camera parameters
	var arContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: './data/camera_para.dat',
		detectionMode: 'mono'
	});

	// Copy AR projection matrix to camera when AR context is ready
	arContext.init(function onCompleted() {
		camera.projectionMatrix.copy(arContext.getProjectionMatrix());
	});

	// Create a group for the marker root and add it to the scene
	var markerRoot = new THREE.Group();
	scene.add(markerRoot);

	// Set up marker controls for pattern recognition
	var markerControls = new THREEx.ArMarkerControls(arContext, markerRoot, {
		type: 'pattern',
		patternUrl: './data/VR_Study_Logo.patt',
	});

	// Create a custom surface mesh and add it to the marker root
	var surface = new SurfaceThreeJS('MySurface', 1, 1, 50, 50);
	var mesh = surface.createMesh();
	mesh.rotation.x = -Math.PI / 6;
	markerRoot.add(mesh);

	// Animation loop: update AR context, rotate mesh, and render the scene
	function animate() {
		requestAnimationFrame(animate);
		if (arSource.ready) arContext.update(arSource.domElement);
		mesh.rotation.z += 0.05;
		renderer.render(scene, camera);
	}
	animate();
});