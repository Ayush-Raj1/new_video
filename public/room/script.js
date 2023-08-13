var appointments = JSON.parse(localStorage.getItem("userId"));
console.log(appointments);
let peer = {};
const socket = io('/', {
  query: {
    appointmentId: appointments.appointmentId,
  }
});
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(appointments.userId, {
  path: '/peerjs',
  host: '/',
  port: '3030'
})
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    console.log("🚀 ~ file: script.js:34 ~ userId:", userId);
    connectToNewUser(userId, stream)
  })
  // Get the input element
let text = document.querySelector("input");

// Add event listener for keydown event on the HTML element
document.querySelector('html').addEventListener('keydown', function(e) {
  // Check if the pressed key is Enter (key code 13) and the input value is not empty
  if (e.which === 13 && text.value.length !== 0) {
    // Emit a 'message' event through the socket with the input value as the message
    socket.emit('message', text.value);
    // Clear the input value
    text.value = '';
  }
});
  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom()
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  console.log("🚀 ~ file: script.js:66 ~ connectToNewUser ~ call:", call);
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}



const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const leaveCall = () => {
    // Emit an event to the server to indicate that the user is leaving
    socket.emit('leave-room', { roomId: ROOM_ID, userId: myPeer.id });
    console.log("hello", myPeer.id);
    // Implement any additional logic, like redirecting the user to a different page
  };

// socket.on('user-left', () => {
//     // Implement any logic you want when a user leaves the room
//     // Redirect the user who left to the home page
// });

socket.on('redirect-home', (userId) => {
    window.location.href = `/v1/home?userId=${userId}`;
});

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

