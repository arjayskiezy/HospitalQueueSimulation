const express = require("express");
const { SerialPort } = require("serialport");
const cors = require("cors");
const fs = require("fs");

// Define COM port
const portName = "COM3";
const baudRate = 9600;

// Express App Setup
const app = express();
app.use(cors());
app.use(express.json()); // Use the built-in express.json() for JSON body parsing

// Function to log errors to a file
function logError(error) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${error}\n`;
  console.error(logMessage); // Log to console
  fs.appendFileSync("error.log", logMessage); // Append to error.log
}

// Initialize Serial Port with error handling
let serialPort;
try {
  serialPort = new SerialPort({ path: portName, baudRate: baudRate });

  serialPort.on("open", () => {
    console.log(`✅ Serial Port ${portName} opened at ${baudRate} baud.`);
  });

  serialPort.on("error", (err) => {
    logError(`Serial Port Error: ${err.message}`);
  });

  serialPort.on("data", (data) => {
    console.log(`📡 Received from Arduino: ${data.toString().trim()}`);
  });
} catch (error) {
  logError(`Failed to initialize Serial Port: ${error.message}`);
}

// Handle API Requests
app.post("/send-command", (req, res) => {
  console.log("Raw request body:", req.body); // Debugging

  const { action, patient = "", step = "", time = 0 } = req.body;

  if (!action) {
    logError("Missing 'action' parameter in request.");
    return res.status(400).json({ error: "Missing 'action' parameter." });
  }

  const validActions = ["START", "STOP"];
  if (!validActions.includes(action)) {
    logError(`Invalid action received: ${action}`);
    return res.status(400).json({ error: "Invalid action" });
  }

  // Send command to Arduino
  const command = `${action},${patient}\n`;
  serialPort.write(command, (err) => {
    if (err) {
      logError(`Failed to send command: ${err.message}`);
      return res
        .status(500)
        .json({ error: "Failed to send command to Arduino" });
    }
    console.log(`✅ Command sent: ${command.trim()}`);
    res.json({ status: "Command sent", command });
  });
});

// Handle Port Already in Use Error
app
  .listen(8081, () => {
    console.log("🚀 Server running on http://localhost:8081");
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logError("Port 8081 is already in use. Try using a different port.");
    } else {
      logError(`Server Error: ${err.message}`);
    }
  });
