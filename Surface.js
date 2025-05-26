
class SurfaceThreeJS {
    constructor(name, p, h, uSegmentsNumber, vSegmentsNumber) {
        this.name = name;
        this.p = p;
        this.h = h;
        this.uSegmentsNumber = uSegmentsNumber;
        this.vSegmentsNumber = vSegmentsNumber;

        this.geometry = new THREE.BufferGeometry();

        this.updateSurfaceData();
    }

    // Generate vertices and indices based on the provided formula
    updateSurfaceData() {
        const positions = [];
        const indices = [];
        const uvs = [];

        const vMax = 2 * Math.PI;

        // vertices generation
        for (let i = 0; i <= this.uSegmentsNumber; i++) {
            let z = -this.h + (i / this.uSegmentsNumber) * (2 * this.h);
            for (let j = 0; j <= this.vSegmentsNumber; j++) {
                const v = (j / this.vSegmentsNumber) * vMax;

                const radius = (((Math.abs(z) - this.h) ** 2) / (2 * this.p));
                const x = radius * Math.cos(v);
                const y = radius * Math.sin(v);

                positions.push(x, y, z);

                // texture coordinates are normalized to the range [0, 1]
                uvs.push(i / this.uSegmentsNumber, j / this.vSegmentsNumber);
            }
        }

        // generate indices for the triangles
        for (let u = 0; u < this.uSegmentsNumber; u++) {
            for (let v = 0; v < this.vSegmentsNumber; v++) {
                const topLeft = u * (this.vSegmentsNumber + 1) + v;
                const topRight = topLeft + 1;
                const bottomLeft = (u + 1) * (this.vSegmentsNumber + 1) + v;
                const bottomRight = bottomLeft + 1;

                indices.push(topLeft, bottomLeft, topRight);
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }

        // create BufferAttributes for positions, uvs, and indices
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        this.geometry.setIndex(indices);

        // automatically compute normals
        this.geometry.computeVertexNormals();
    }

    // create a mesh with a material
    createMesh() {
        const material = new THREE.MeshStandardMaterial({
            color: 0x45366d,
            metalness: 0.6,
            roughness: 0.1,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(this.geometry, material);
        return this.mesh;
    }
}
