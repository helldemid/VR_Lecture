class Surface {
	constructor(name, p, h, uSegmentsNumber, vSegmentsNumber) {
		this.name = name; // Surface name
		this.p = p; // Paraboloid parameter
		this.h = h; // Height of the surface
		this.uSegmentsNumber = uSegmentsNumber; // Number of U-segments
		this.vSegmentsNumber = vSegmentsNumber; // Number of V-segments
		this.uSegments = []; // U-segment polylines
		this.vSegments = []; // V-segment polylines
		this.vertexList = []; // List of vertex positions
		this.normalsList = []; // List of normals for vertices
		this.indicesList = []; // List of indices for drawing triangles
		this.tangentsList = [];
		this.textures = {
			diffuse: '',
			normal: '',
			specular: ''
		}
		this.texturesCoordinates = [];
		this.updateSurfaceData();
	}

	// Generates the vertex data for the surface
	generateVertices() {
		this.vertexList = [];
		this.uSegments = [];
		this.vSegments = [];
		const vMax = 2 * Math.PI; // Maximum angle for V

		// Generate U-segment polylines
		for (let i = 0; i <= this.uSegmentsNumber; i++) {
			let z = -this.h + (i / this.uSegmentsNumber) * (2 * this.h); // Z changes from -h to h
			const uSegment = [];
			for (let j = 0; j <= this.vSegmentsNumber; j++) {
				const v = (j / this.vSegmentsNumber) * vMax; // Angle V
				// Parabolic Humming-Top equation
				const x = (((Math.abs(z) - this.h) ** 2) / (2 * this.p)) * Math.cos(v);
				const y = (((Math.abs(z) - this.h) ** 2) / (2 * this.p)) * Math.sin(v);
				uSegment.push([x, y, z]);
			}
			this.uSegments.push(uSegment);
		}

		// Generate V-segment polylines
		for (let i = 0; i <= this.vSegmentsNumber; i++) {
			const vSegment = this.uSegments.map((uSegment) => uSegment[i]);
			this.vSegments.push(vSegment);
		}
		this.vertexList = this.uSegments.flat(2); // Flatten the vertex array
	}

	// Generates the index list for triangle connections
	generateIndicesList() {
		this.indicesList = [];
		for (let u = 0; u < this.uSegmentsNumber; u++) {
			for (let v = 0; v < this.vSegmentsNumber; v++) {
				const topLeft = u * (this.vSegmentsNumber + 1) + v;
				const topRight = topLeft + 1;
				const bottomLeft = (u + 1) * (this.vSegmentsNumber + 1) + v;
				const bottomRight = bottomLeft + 1;

				// Create two triangles for each quadrilateral
				this.indicesList.push(topLeft, bottomLeft, topRight);
				this.indicesList.push(topRight, bottomLeft, bottomRight);
			}
		}
	}

	// Generates the normals list for shading
	generateNormalsList() {
		const normalsList = new Array(this.vertexList.length).fill(0);
		const weightsList = new Array(this.vertexList.length).fill(0);

		for (let i = 0; i < this.indicesList.length; i += 3) {
			const i1 = this.indicesList[i] * 3;
			const i2 = this.indicesList[i + 1] * 3;
			const i3 = this.indicesList[i + 2] * 3;

			const v1 = this.vertexList.slice(i1, i1 + 3);
			const v2 = this.vertexList.slice(i2, i2 + 3);
			const v3 = this.vertexList.slice(i3, i3 + 3);

			const normal = this.calculateFaceNormal(v1, v2, v3);
			const area = this.calculateTriangleArea(v1, v2, v3);

			// Weight the normals by the triangle area
			for (let j = 0; j < 3; j++) {
				const idx = this.indicesList[i + j] * 3;
				normalsList[idx] += normal[0] * area;
				normalsList[idx + 1] += normal[1] * area;
				normalsList[idx + 2] += normal[2] * area;
				weightsList[idx] += area;
				weightsList[idx + 1] += area;
				weightsList[idx + 2] += area;
			}
		}

		// Normalize the weighted normals
		for (let i = 0; i < normalsList.length; i += 3) {
			const weight = weightsList[i] > 0 ? weightsList[i] : 1; // Prevent division by zero
			normalsList[i] /= weight;
			normalsList[i + 1] /= weight;
			normalsList[i + 2] /= weight;
		}

		this.normalsList = this.normalizeVectors(normalsList);
	}

	// Calculates the normal of a triangle face
	calculateFaceNormal(v1, v2, v3) {
		const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
		const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

		return [
			edge1[1] * edge2[2] - edge1[2] * edge2[1],
			edge1[2] * edge2[0] - edge1[0] * edge2[2],
			edge1[0] * edge2[1] - edge1[1] * edge2[0],
		];
	}

	// Calculates the area of a triangle using Heron's formula
	calculateTriangleArea(v1, v2, v3) {
		const a = Math.sqrt(
			(v2[0] - v1[0]) ** 2 + (v2[1] - v1[1]) ** 2 + (v2[2] - v1[2]) ** 2
		);
		const b = Math.sqrt(
			(v3[0] - v2[0]) ** 2 + (v3[1] - v2[1]) ** 2 + (v3[2] - v2[2]) ** 2
		);
		const c = Math.sqrt(
			(v1[0] - v3[0]) ** 2 + (v1[1] - v3[1]) ** 2 + (v1[2] - v3[2]) ** 2
		);

		const s = (a + b + c) / 2; // Semi-perimeter
		return Math.sqrt(s * (s - a) * (s - b) * (s - c)); // Area using Heron's formula
	}

	// Normalizes an array of 3D vectors
	normalizeVectors(vectors) {
		const normalized = [];
		for (let i = 0; i < vectors.length; i += 3) {
			const length = Math.sqrt(
				vectors[i] ** 2 + vectors[i + 1] ** 2 + vectors[i + 2] ** 2
			);
			if (length > 0) {
				normalized.push(
					vectors[i] / length,
					vectors[i + 1] / length,
					vectors[i + 2] / length
				);
			} else {
				normalized.push(0, 0, 0);
			}
		}
		return normalized;
	}

	// Regenerate surface data
	updateSurfaceData() {
		this.generateVertices();
		this.generateIndicesList();
		this.generateNormalsList();
		this.generateTangentsList();
		this.generateTexturesCoordinates();
	}

	// Generates texture coordinates for each vertex
	generateTexturesCoordinates() {
		this.texturesCoordinates = [];
		for (let i = 0; i <= this.uSegmentsNumber; i++) {
			for (let j = 0; j <= this.vSegmentsNumber; j++) {
				const u = i / this.uSegmentsNumber;
				const v = j / this.vSegmentsNumber;
				this.texturesCoordinates.push(u, v);
			}
		}
	}

	// Generates tangents for each vertex
	generateTangentsList() {
		this.tangentsList = [];
		const totalSegments = (this.uSegmentsNumber + 1) * (this.vSegmentsNumber + 1);
		this.tangentsList = Array(totalSegments * 3).fill(0);
		for (let i = 0; i < totalSegments; i++) {
			this.tangentsList[i * 3] = 1; // Устанавливаем x-компонент
		}
	}

	uploadTexture(gl, url) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 255, 255, 255]));

		const image = new Image();
		image.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.generateMipmap(gl.TEXTURE_2D);
		};
		image.src = url;

		return texture;
	}

	createTextures(gl) {
		this.textures.diffuse = this.uploadTexture(gl, "textures/diffuse.png");
		this.textures.specular = this.uploadTexture(gl, "textures/specular.png");
		this.textures.normal = this.uploadTexture(gl, "textures/normal.png");
	}

	// Initializes buffers for rendering
	initBuffer(gl) {
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexList), gl.STATIC_DRAW);

		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicesList), gl.STATIC_DRAW);

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalsList), gl.STATIC_DRAW);

		this.texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texturesCoordinates), gl.STATIC_DRAW);

		this.tangentBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangentsList), gl.STATIC_DRAW);
	}

	// Initializes textures for rendering
	initTextures(gl, shProgram) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textures.diffuse);
		gl.uniform1i(shProgram.diffuseTextureUni, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.textures.specular);
		gl.uniform1i(shProgram.specularTextureUni, 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.textures.normal);
		gl.uniform1i(shProgram.normalTextureUni, 2);
	}

	// Renders the surface
	draw(gl, shProgram) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(shProgram.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.vertexAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(shProgram.normalAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.normalAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(shProgram.texCoordAttrib, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.texCoordAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.vertexAttribPointer(shProgram.tangentAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.tangentAttrib);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.indicesList.length, gl.UNSIGNED_SHORT, 0);
	}

	setH(h) {
		h = parseFloat(h);
		if (h > 0) {
			this.h = h;
			this.updateSurfaceData();
		}
	}

	setP(p) {
		p = parseFloat(p);
		if (p > 0) {
			this.p = p;
			this.updateSurfaceData();
		}
	}

	setUSegmentsNumber(uSegmentsNumber) {
		uSegmentsNumber = parseInt(uSegmentsNumber);
		if (uSegmentsNumber >= 0) {
			this.uSegmentsNumber = uSegmentsNumber;
			this.updateSurfaceData();
		}
	}

	setVSegmentsNumber(vSegmentsNumber) {
		vSegmentsNumber = parseInt(vSegmentsNumber);
		if (vSegmentsNumber >= 0) {
			this.vSegmentsNumber = vSegmentsNumber;
			this.updateSurfaceData();
		}
	}

	getVertices() {
		return this.vertexList;
	}

	getP() {
		return this.p;
	}
	getH() {
		return this.h;
	}
	getUSegmentsNumber() {
		return this.uSegmentsNumber;
	}
	getVSegmentsNumber() {
		return this.vSegmentsNumber;
	}
}