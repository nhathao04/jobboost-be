# Video Call (WebRTC + Socket.IO)

Short guide for integrating video calls using WebRTC signaling with Socket.IO.

## REST endpoints

- POST /api/video/calls

  - Creates a call session (host). JSON body: { room_name?: string }
  - Response: { success: true, data: { id, host_id, guest_id, status, room_name } }

- POST /api/video/calls/:callId/join

  - Join call as guest. Path param: callId (UUID)
  - Response: updated call object (status becomes "active")

- POST /api/video/calls/:callId/end

  - End call as participant. Sets status = "ended"

- GET /api/video/calls/:callId
  - Get call info

All endpoints require authentication (use existing Authorization flow in the project).

## Socket.IO signaling events

Clients should include the same auth token used for REST in the socket handshake (socket.io client options -> auth: { token }).

Rooms:

- Each user is joined to `user:<userId>` room on connection.

Events sent from caller -> server -> callee

- webrtc:call

  - Payload: { to: '<calleeUserId>', callId?: '<uuid>', room_name?: 'optional' }
  - Server will forward to callee as `webrtc:incoming-call` and may create a VideoCall record when callId not provided.

- webrtc:offer

  - Payload: { to: '<userId>', sdp: <offerSDP>, callId?: '<uuid>' }
  - Server forwards to `user:<to>` with event `webrtc:offer` (includes from, sdp, callId)

- webrtc:answer

  - Payload: { to: '<userId>', sdp: <answerSDP>, callId?: '<uuid>' }
  - Server forwards to `user:<to>` with event `webrtc:answer`

- webrtc:ice-candidate

  - Payload: { to: '<userId>', candidate: <iceCandidate>, callId?: '<uuid>' }
  - Server forwards to `user:<to>` with event `webrtc:ice-candidate`

- webrtc:end-call
  - Payload: { to: '<userId>', callId?: '<uuid>' }
  - Server updates VideoCall.status to 'ended' if callId provided and forwards `webrtc:end-call` to recipient

## Client-side flow (simplified)

1. Caller creates call via POST /api/video/calls -> receives callId (optional)
2. Caller connects to socket.io with token in handshake
3. Caller sends `webrtc:call` to the callee (include callId or let server create one)
4. Callee receives `webrtc:incoming-call`, opens UI to accept/decline
5. If accepted, callee creates RTCPeerConnection, gathers local stream, creates offer/answer flow using `webrtc:offer`/`webrtc:answer` via socket
6. Both peers exchange ICE candidates via `webrtc:ice-candidate`
7. To end call, emit `webrtc:end-call` (server will forward and mark call ended)

## Notes

- This repo already authenticates sockets and joins users to `user:<id>` rooms.
- In production, change CORS origins in `src/config/socket.js` from `*` to your front-end domain(s).
- Consider TURN servers (e.g., coturn) for NAT traversal in real-world deployments.
