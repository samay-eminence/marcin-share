const BackendURL = "https://dev.nexthopllc.com";
let room;


async function createAndShare() {
  try {
    const res = await fetch(`${BackendURL}/api/create-room`);
    const data = await res.json();
    const { room: roomName, token } = data;

    const shareLink = `${window.location.origin}${window.location.pathname}?room=${roomName}`;
    alert(`Share this link:\n${shareLink}`);
    console.log(shareLink);

    await connectToLivekit(roomName, token);
    await startScreenShare();
  } catch (err) {
    console.error("Error:", err);
  }
}

async function connectToRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("room");

  if (!roomName) {
    alert("No room found in URL");
    return;
  }

  try {
    const res = await fetch(
      `${BackendURL}/api/join-room?room=${roomName}`
    );
    const data = await res.json();
    const { token } = data;

    await connectToLivekit(roomName, token);
  } catch (err) {
    console.error("Error:", err);
  }
}

async function connectToLivekit(roomName, token) {
  const livekitUrl = "wss://marcin-app-nh45gwbb.livekit.cloud";
  const { Room } = window.LivekitClient;

  room = new Room({ adaptiveStream: true });

  room.on("trackSubscribed", (track) => {
    if (track.kind === "video") {
      const videoElement = document.getElementById("remote-video");
      track.attach(videoElement);
      videoElement.play().catch((e) => console.warn("Autoplay error:", e));
    }
  });

  room.on("dataReceived", (payload, participant) => {
    const msg = new TextDecoder().decode(payload);
    const data = JSON.parse(msg);

    console.log(`Received from ${participant.identity}: ${data.text}`);

    if (data.type === "inputUpdate") {
      updateSharedInput(data.text);
    }
  });

  await room.connect(livekitUrl, token);
  console.log("Connected to room:", roomName);

  setupSharedInput();
}

async function startScreenShare() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const screenTrack = new window.LivekitClient.LocalVideoTrack(
      stream.getVideoTracks()[0]
    );
    await room.localParticipant.publishTrack(screenTrack);
    console.log("Screen sharing started");
  } catch (err) {
    console.error("Error starting screen share:", err);
  }
}

function setupSharedInput() {
  const input = document.getElementById("shared-input");

  input.addEventListener("input", () => {
    const msg = {
      type: "inputUpdate",
      text: input.value,
    };
    const encoded = new TextEncoder().encode(JSON.stringify(msg));
    room.localParticipant.publishData(encoded, { reliable: true });
  });
}

function updateSharedInput(text) {
  const inputField = document.getElementById("shared-input");
  inputField.value = text; // Update the input field with the new text from the other participant
}
