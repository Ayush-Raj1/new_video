const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const cors = require('cors');
const bodyParser = require('body-parser');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid');

const fs = require('fs');
const path = require('path');
// Use a Set to store valid appointment IDs
const validAppointmentIds = {};

app.use(bodyParser.json());
app.use(cors());
app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.redirect(`/v1/user`);
});


app.get('/v1/user', (req, res) => {
  res.render('user');
});

app.get('/:room', (req, res) => {
  const roomIdWithToken = req.params.room || '';
  if(roomIdWithToken === 'favicon.ico') {
    return res.redirect('/favicon.ico');
  }
  const [appointmentId, token] = roomIdWithToken.split('-');
  const expire = Buffer.from(req.query.exp, 'base64').toString('ascii');
  console.log("🚀 ~ file: server.js:40 ~ app.get ~ expire:", expire)
  if (!isValidAppointmentId(appointmentId) || !isValidToken(token) || isLinkExpired(expire, appointmentId)){
    return res.status(400).json({ error: 'Invalid or expired link' });
  }
  return res.render('room', { roomId: appointmentId });
});

app.get('/v1/home', (req, res) => {
  res.render('home');
});

app.get('/favicon.ico', (req, res) => {
  // Return an empty response to ignore the favicon request
  res.status(204).end();
});

app.post('/generate-link', (req, res, next) => {
  const { userId, appointmentId } = req.body;
  // In a real-world scenario, you would validate the appointmentId against a database
  let link;
  if(validAppointmentIds[appointmentId]) {
    link = validAppointmentIds[appointmentId];
  }
  else {
    const roomId = `${appointmentId}-${generateRandomToken()}`;
    const expirationTime = Buffer.from((Date.now() + 5 * 60 * 1000).toString()).toString('base64');
    console.log("🚀 ~ file: server.js:66 ~ app.post ~ expirationTime:", expirationTime);
    link = `/${roomId}?exp=${expirationTime}`;
    validAppointmentIds[appointmentId] = link;
  }
  // return res.status(200).send(JSON.stringify({}));
  return res.json({ link });
})

io.on('connection', socket => {

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  socket.on('leave-room', ({ roomId, userId }) => {
    socket.to(roomId).emit('user-left', userId);
    socket.emit('redirect-home', userId); // Assuming this event triggers the redirect
  });
});

function isValidAppointmentId(appointmentId) {
  return validAppointmentIds[appointmentId];
}

function generateRandomToken(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }
  return token;
}

function isValidToken(token) {
  // Implement your own validation logic for tokens
  // You can compare it against a database or use other security measures
  // For simplicity, this example assumes any token is valid
  return true;
}

function isLinkExpired(expirationTime, appointmentId) {
  const currentTimestamp = Date.now();
  if(currentTimestamp > Number(expirationTime)) {
    delete validAppointmentIds[appointmentId];
    return true;
  }
  return false;
}

server.listen(process.env.PORT || 3030, () => {
  console.log('Server is listening on port', server.address().port); // Added console log
});


