const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");
const crypto = require("crypto");

const app = express();
app.use(cors());

const API_KEY = "APILzbDEgCoiunT";
const API_SECRET = "ReHYd0KFBHN0jeQ6uJOcRNbbnPl9UUUiwMYuepdQ381A";

app.get("/api/create-room", async (req, res) => {
  const roomName = crypto.randomUUID();
  const identity = "host-" + Math.floor(Math.random() * 10000);

  const token = new AccessToken(API_KEY, API_SECRET, { identity });
  token.addGrant({ roomJoin: true, room: roomName });

  res.json({
    room: roomName,
    token: await token.toJwt(),
    role: "host",
  });
});

app.get("/api/join-room", async (req, res) => {
  const roomName = req.query.room;
  if (!roomName) {
    return res.status(400).json({ error: "Room name required" });
  }

  const identity = "viewer-" + Math.floor(Math.random() * 10000);
  const token = new AccessToken(API_KEY, API_SECRET, { identity });
  token.addGrant({ roomJoin: true, room: roomName });

  res.json({
    token: await token.toJwt(),
    identity,
    role: "viewer",
  });
});

const PORT = 7000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
