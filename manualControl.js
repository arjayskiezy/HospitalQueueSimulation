let patientIndex = 0;
let stepIndex = 0;
let countdown = 0;
let timer = null;
let isPaused = false;
let isStopped = false;
let queueData = null;

function sendToArduino(action, patient = "", step = "", time = countdown || 0) {
  const requestData = {
    action: action,
    patient: patient,
    step: step,
    time: time,
  };

  console.log("Sending to Arduino:", JSON.stringify(requestData, null, 2));

  fetch("http://localhost:8081/send-command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(`Server Error: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => console.log("Arduino Response:", data))
    .catch((error) => console.error("Arduino Error:", error));
}

function startSimulation() {
  let queueData = localStorage.getItem("queueData");

  if (!queueData) {
    console.log("❌ No patients available. Generate a queue first.");
    document.getElementById("display").innerHTML =
      "<b>No patients available. Generate a queue first.</b>";
    return;
  }

  try {
    queueData = JSON.parse(queueData); // Convert string back to an object
  } catch (error) {
    console.error("❌ Failed to parse queueData:", error);
    document.getElementById("display").innerHTML =
      "<b>Error loading queue. Please generate again.</b>";
    return;
  }

  if (!queueData.patients || queueData.patients.length === 0) {
    console.log("❌ No patients in queue.");
    document.getElementById("display").innerHTML =
      "<b>No patients in queue.</b>";
    return;
  }

  isStopped = false;
  patients = queueData.patients; // Use the generated queue
  patientIndex = 0;
  stepIndex = 0;
  processNextStep(); // Start simulation
  sendToArduino("START", patients[patientIndex].name);
}

function processNextStep() {
  if (isStopped) return;

  if (patientIndex < patients.length) {
    let patient = patients[patientIndex];

    if (stepIndex < patient.steps.length) {
      let step = patient.steps[stepIndex];
      countdown = step.time;
      updateDisplay(patient.name, step.step);

      // Clear any existing timer before setting a new one
      clearInterval(timer);

      // Set a new interval and assign it to the global timer
      timer = setInterval(() => {
        if (!isPaused) {
          countdown--;
          updateDisplay(patient.name, step.step);
          if (countdown <= 0) {
            clearInterval(timer);
            stepIndex++;

            // If all steps are finished for this patient, move to the next patient
            if (stepIndex >= patient.steps.length) {
              patientIndex++;
              stepIndex = 0; // Reset stepIndex for the next patient

              // If there is a new patient, notify Arduino
              if (patientIndex < patients.length) {
                sendToArduino("START", patients[patientIndex].name);
              }
            }
            processNextStep(); // Continue with the next step or patient
          }
        }
      }, 1000);
    } else {
      stepIndex = 0;
      patientIndex++; // Move to the next patient

      // If there is a new patient, notify Arduino
      if (patientIndex < patients.length) {
        sendToArduino("START", patients[patientIndex].name);
      }

      processNextStep(); // Continue with the next patient's steps
    }
  } else {
    document.getElementById("display").innerHTML =
      "<b>✅ All patients processed!</b>";
    sendToArduino("STOP"); // Stop when all patients are processed
  }
}

function skipStep() {
  if (
    patientIndex < patients.length &&
    stepIndex < patients[patientIndex].steps.length
  ) {
    clearInterval(timer);
    console.log(
      "Skipped Step: " + patients[patientIndex].steps[stepIndex].step
    );

    stepIndex++;

    // Check if we moved to a new patient
    if (stepIndex >= patients[patientIndex].steps.length) {
      patientIndex++;
      stepIndex = 0;
      if (patientIndex < patients.length) {
        sendToArduino("START", patients[patientIndex].name);
      }
    }

    processNextStep();
  }
}

function skipPatient() {
  if (patientIndex < patients.length) {
    patientIndex++;
    stepIndex = 0; // Reset step index to start the process from the beginning

    console.log("Skipped: " + patients[patientIndex].name);
    sendToArduino("START", patients[patientIndex].name); // Send command first

    // Now increment patientIndex after sending the command

    // Process next step after skipping
    if (patientIndex < patients.length) {
      processNextStep(); // Proceed with the next patient
    }
  } else {
    console.log("No more patients in the queue.");
  }
}

function stopSimulation() {
  isStopped = true;
  clearInterval(timer);
  patients = [];
  patientIndex = 0;
  stepIndex = 0;
  countdown = 0;
  document.getElementById("display").innerHTML = "<b>⚠️Simulation Stopped.</b>";
  console.log("Simulation Stopped.");
  sendToArduino("STOP");
}

function updateDisplay(patient, step) {
  if (!isStopped) {
    document.getElementById("display").innerHTML = `<b>Patient:</b>  ${patient} 
            | <b>Step:</b> ${step} 
            | <b>Time Remaining:</b> ${countdown} sec`;
  }
}

function toggleSimulation() {
  const button = document.getElementById("toggleButton");
  if (isPaused) {
    resumeSimulation();
    button.textContent = "Pause";
  } else {
    pauseSimulation();
    button.textContent = "Resume";
  }
}

function pauseSimulation() {
  if (!isPaused) {
    isPaused = true;
    clearInterval(timer);
    const display = document.getElementById("display");
    if (!display.innerHTML.includes("<b> | Paused...⚠️</b>")) {
      display.innerHTML += "<b> | Paused...⚠️</b>";
    }
  }
}

function resumeSimulation() {
  if (isPaused) {
    isPaused = false;
    // Restart the interval timer to continue the countdown
    timer = setInterval(() => {
      if (!isPaused) {
        countdown--;
        updateDisplay(
          patients[patientIndex].name,
          patients[patientIndex].steps[stepIndex].step
        );
        if (countdown <= 0) {
          clearInterval(timer);
          stepIndex++;
          processNextStep();
        }
      }
    }, 1000);
  }
}

function clearQueue() {
  if (!localStorage.getItem("queueData")) {
    console.warn("❌ No data needed to be clear!.");
    document.getElementById("display").innerHTML =
      "<b>❌ No data needed to be clear!</b>";
    return;
  }

  localStorage.removeItem("queueData"); // Remove stored queue
  console.log("✅ Queue cleared.");
  document.getElementById("display").innerHTML =
    "<b>Queue cleared successfully!</b>";
  stopSimulation();
}
