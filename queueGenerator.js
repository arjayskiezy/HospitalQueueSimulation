function openModal() {
  document.getElementById("queueModal").style.display = "block";
}

function closeModal() {
  document.getElementById("queueModal").style.display = "none";
}

function generateRandomQueue() {
  let randomPatientCount = Math.floor(Math.random() * 3) + 3; // Random between 3-5 patients
  let queueData = generateQueue(randomPatientCount);
  localStorage.setItem("queueData", JSON.stringify(queueData)); // Store in localStorage
  console.log("Random Queue generated:", queueData);
  document.getElementById(
    "display"
  ).innerHTML = `<b>Random Queue Generated with ${randomPatientCount} Patients</b>`;

  closeModal(); // Close modal after generating random queue
}

function handleQueueGeneration() {
  let patientCount = document.getElementById("patientCount").value;

  if (!patientCount || patientCount <= 0) {
    alert("Please enter a valid number of patients.");
    return;
  }

  let queueData = generateQueue(parseInt(patientCount)); // Generate queue with input value
  localStorage.setItem("queueData", JSON.stringify(queueData)); // Store in localStorage
  console.log("Queue generated:", queueData);
  document.getElementById(
    "display"
  ).innerHTML = `<b>Queue Generated with ${patientCount} Patients</b>`;

  closeModal(); // Close modal after generating queue
}

function generateQueue(patientCount) {
  const steps = [
    { step: "Registration", time: 5 },
    { step: "Vital Signs Check", time: 8 },
    { step: "Triage", time: 6 },
    { step: "Doctor Consultation", time: 10 },
    { step: "Pharmacy", time: 7 },
    { step: "Exit", time: 3 },
  ];

  const patients = [];
  for (let i = 0; i < patientCount; i++) {
    patients.push({
      id: i + 1,
      name: `Patient ${i + 1}`,
      steps: [...steps], // Clone steps for each patient
    });
  }

  return { patients };
}
