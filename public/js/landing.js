const createButton = document.querySelector("#createroom");
const joinBut = document.querySelector("#joinroom");
const videoCont = document.querySelector(".video-self");
const codeCont = document.querySelector("#roomcode");
const mic = document.querySelector("#mic");
const cam = document.querySelector("#webcam");

let micAllowed = 1;
let camAllowed = 1;

// ✅ Access camera and mic on page load
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    videoCont.srcObject = stream;
    console.log("✅ Camera & Mic stream ready");
  })
  .catch(err => {
    console.error("❌ Media Error:", err);
    alert("Camera/Mic access failed: " + err.message + "\n\nGo to browser settings and enable camera/mic manually.");
  });

function uuidv4() {
  return 'xxyxyxxyx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ✅ Create Room Button
createButton.addEventListener('click', (e) => {
  e.preventDefault();
  createButton.disabled = true;
  createButton.innerHTML = 'Creating Room...';
  createButton.classList = 'createroom-clicked';

  let i = 0;
  const dots = ['.', '..', '...'];
  const interval = setInterval(() => {
    createButton.innerHTML = 'Creating Room' + dots[i % dots.length];
    i++;
  }, 500);

  const roomId = uuidv4();
  setTimeout(() => {
    clearInterval(interval);
    location.href = `/room.html?room=${roomId}`;
  }, 1500);
});

// ✅ Join Room Button
joinBut.addEventListener('click', (e) => {
  e.preventDefault();
  const code = codeCont.value.trim();
  if (code === "") {
    codeCont.classList.add('roomcode-error');
    return;
  }
  location.href = `/room.html?room=${code}`;
});

codeCont.addEventListener('input', () => {
  if (codeCont.value.trim() !== "") {
    codeCont.classList.remove('roomcode-error');
  }
});

// ✅ Toggle Camera
cam.addEventListener('click', () => {
  if (!videoCont.srcObject) return;
  const videoTrack = videoCont.srcObject.getVideoTracks()[0];
  if (!videoTrack) return;

  videoTrack.enabled = !videoTrack.enabled;
  camAllowed = videoTrack.enabled ? 1 : 0;

  cam.classList = camAllowed ? "device" : "nodevice";
  cam.innerHTML = camAllowed
    ? '<i class="fas fa-video"></i>'
    : '<i class="fas fa-video-slash"></i>';
});

// ✅ Toggle Mic
mic.addEventListener('click', () => {
  if (!videoCont.srcObject) return;
  const audioTrack = videoCont.srcObject.getAudioTracks()[0];
  if (!audioTrack) return;

  audioTrack.enabled = !audioTrack.enabled;
  micAllowed = audioTrack.enabled ? 1 : 0;

  mic.classList = micAllowed ? "device" : "nodevice";
  mic.innerHTML = micAllowed
    ? '<i class="fas fa-microphone"></i>'
    : '<i class="fas fa-microphone-slash"></i>';
});