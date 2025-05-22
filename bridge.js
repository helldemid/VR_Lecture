const http = require("http");
const axios = require("axios");
const WebSocket = require("ws");
const os = require("os");

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3000 }, () => {
	console.log("WebSocket server init on port 3000");

	// show local IP
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			if (iface.family === 'IPv4' && !iface.internal) {
				console.log(`Local IP-address: ws://${iface.address}:3000`);
			}
		}
	}
});
let lastData = {};

wss.on("connection", (ws) => {
	console.log("WebSocket client connected");
	ws.send(JSON.stringify(lastData));
});

// Each 20 мс get data from accelerometer
setInterval(async () => {
	try {
		const response = await axios.get("http://192.168.0.108/get?accX&accY&accZ&acc");

		const responseData = response.data.buffer;
		const accX = responseData.accX.buffer[0] || 0;
		const accY = responseData.accY.buffer[0] || 0;
		const accZ = responseData.accZ.buffer[0] || 0;
		lastData = {
			accX: accX,
			accY: accY,
			accZ: accZ,
		};

		// Send to WebSocket-clients
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(lastData));
			}
		});

	} catch (err) {
		console.error("Error during get data:", err.message);
	}
}, 20);
