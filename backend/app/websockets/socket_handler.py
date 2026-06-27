import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.models.transcript import Transcript
from app.models.action_item import ActionItem
from app.models.risk import Risk
from app.models.extra import ChannelMessage, DirectMessage
from app.models.user import User
from app.ai_workflow.agents.action_item import action_item_agent
from app.ai_workflow.agents.risk import risk_agent

logger = logging.getLogger("socket_handler")

# Track background execution state to prevent parallel overlaps per meeting
analysis_state = {}

# Track participants in the waiting room
waiting_participants = {}
sid_to_waiting_info = {}

# Track active participants in meetings
active_participants = {}
sid_to_meeting_info = {}

def to_iso(dt):
    if not dt:
        return None
    return dt.isoformat() + "Z"

def run_realtime_ai(meeting_id: str, db: Session):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or not meeting.transcripts:
        return None

    # Get raw lines
    raw_lines = [f"{t.speakerName}: {t.text}" for t in meeting.transcripts]
    state = {
        "cleaned_transcript": raw_lines,
        "action_items": [],
        "risks": []
    }

    # Execute agents directly for fast real-time response
    try:
        action_results = action_item_agent(state)
        risk_results = risk_agent(state)
        
        action_items = action_results.get("action_items") or []
        risks = risk_results.get("risks") or []
    except Exception as e:
        logger.error(f"Real-time AI execution failed: {e}")
        return None

    # Save action items (delete previous, insert new)
    db.query(ActionItem).filter(ActionItem.meetingId == meeting_id).delete()
    for item in action_items:
        due_date_parsed = None
        if item.get("dueDate"):
            try:
                due_date_parsed = datetime.strptime(item["dueDate"], "%Y-%m-%d")
            except Exception:
                due_date_parsed = None
        
        db_item = ActionItem(
            meetingId=meeting_id,
            text=item["text"],
            assigneeName=item.get("assigneeName"),
            status="PENDING",
            dueDate=due_date_parsed
        )
        db.add(db_item)

    # Save risks
    db.query(Risk).filter(Risk.meetingId == meeting_id).delete()
    for r in risks:
        db_risk = Risk(
            meetingId=meeting_id,
            text=r["text"],
            severity=r["severity"],
            status="OPEN"
        )
        db.add(db_risk)

    db.commit()

    # Query back for serialization formatting
    db_action_items = db.query(ActionItem).filter(ActionItem.meetingId == meeting_id).all()
    db_risks = db.query(Risk).filter(Risk.meetingId == meeting_id).all()

    return {
        "actionItems": [
            {
                "id": a.id,
                "text": a.text,
                "assigneeName": a.assigneeName,
                "status": a.status,
                "dueDate": to_iso(a.dueDate)
            } for a in db_action_items
        ],
        "risks": [
            {
                "id": r.id,
                "text": r.text,
                "severity": r.severity,
                "status": r.status
            } for r in db_risks
        ]
    }

def run_realtime_ai_standalone(meeting_id: str):
    db = SessionLocal()
    try:
        return run_realtime_ai(meeting_id, db)
    finally:
        db.close()

def register_socket_handlers(sio):
    @sio.event
    async def connect(sid, environ):
        logger.info(f"Socket connected: {sid}")

    @sio.event
    async def disconnect(sid):
        logger.info(f"Socket disconnected: {sid}")
        if sid in sid_to_waiting_info:
            participant = sid_to_waiting_info[sid]
            meeting_id = participant["meetingId"]
            participants = waiting_participants.get(meeting_id, [])
            if participant in participants:
                participants.remove(participant)
            del sid_to_waiting_info[sid]
            
            lobby_room = f"waiting_lobby_{meeting_id}"
            await sio.emit("waitingListUpdated", participants, room=lobby_room)
            await sio.emit("waitingListUpdated", participants, room=meeting_id)

        if sid in sid_to_meeting_info:
            participant = sid_to_meeting_info[sid]
            meeting_id = participant["meetingId"]
            p_list = active_participants.get(meeting_id, [])
            if participant in p_list:
                p_list.remove(participant)
            del sid_to_meeting_info[sid]
            await sio.emit("participantsUpdated", p_list, room=meeting_id)

    @sio.event
    async def joinWaitingRoom(sid, data):
        meeting_id = data.get("meetingId")
        name = data.get("name")
        email = data.get("email")
        if not meeting_id or not name or not email:
            logger.warning(f"Invalid joinWaitingRoom payload from {sid}: {data}")
            return {"status": "error", "message": "Missing meetingId, name, or email"}
        
        participants = waiting_participants.setdefault(meeting_id, [])
        existing = next((p for p in participants if p["socketId"] == sid), None)
        if not existing:
            participant = {
                "socketId": sid,
                "name": name,
                "email": email,
                "meetingId": meeting_id
            }
            participants.append(participant)
            sid_to_waiting_info[sid] = participant
            logger.info(f"Guest {name} ({email}) joined waiting room for meeting {meeting_id}")
            
        lobby_room = f"waiting_lobby_{meeting_id}"
        await sio.enter_room(sid, lobby_room)
        await sio.emit("waitingListUpdated", participants, room=lobby_room)
        
        await sio.emit("participantWaiting", {
            "socketId": sid,
            "name": name,
            "email": email,
            "meetingId": meeting_id
        }, room=meeting_id)
        await sio.emit("waitingListUpdated", participants, room=meeting_id)
        return {"status": "success"}

    @sio.event
    async def getWaitingList(sid, data):
        meeting_id = data.get("meetingId")
        if not meeting_id:
            return {"status": "error", "message": "Missing meetingId"}
        current_list = waiting_participants.get(meeting_id, [])
        return {"status": "success", "waitingList": current_list}

    @sio.event
    async def approveParticipant(sid, data):
        meeting_id = data.get("meetingId")
        guest_socket_id = data.get("guestSocketId")
        if not meeting_id or not guest_socket_id:
            return {"status": "error", "message": "Missing meetingId or guestSocketId"}
        
        logger.info(f"Host approved guest {guest_socket_id} for meeting {meeting_id}")
        
        participants = waiting_participants.get(meeting_id, [])
        participant = next((p for p in participants if p["socketId"] == guest_socket_id), None)
        if participant:
            participants.remove(participant)
            if guest_socket_id in sid_to_waiting_info:
                del sid_to_waiting_info[guest_socket_id]
                
        await sio.emit("joinApproved", {"meetingId": meeting_id}, room=guest_socket_id)
        
        lobby_room = f"waiting_lobby_{meeting_id}"
        await sio.emit("waitingListUpdated", participants, room=lobby_room)
        await sio.emit("waitingListUpdated", participants, room=meeting_id)
        return {"status": "success"}

    @sio.event
    async def rejectParticipant(sid, data):
        meeting_id = data.get("meetingId")
        guest_socket_id = data.get("guestSocketId")
        if not meeting_id or not guest_socket_id:
            return {"status": "error", "message": "Missing meetingId or guestSocketId"}
        
        logger.info(f"Host rejected guest {guest_socket_id} for meeting {meeting_id}")
        
        participants = waiting_participants.get(meeting_id, [])
        participant = next((p for p in participants if p["socketId"] == guest_socket_id), None)
        if participant:
            participants.remove(participant)
            if guest_socket_id in sid_to_waiting_info:
                del sid_to_waiting_info[guest_socket_id]
                
        await sio.emit("joinRejected", {}, room=guest_socket_id)
        
        lobby_room = f"waiting_lobby_{meeting_id}"
        await sio.emit("waitingListUpdated", participants, room=lobby_room)
        await sio.emit("waitingListUpdated", participants, room=meeting_id)
        return {"status": "success"}

    @sio.event
    async def joinMeeting(sid, data):
        meeting_id = data.get("meetingId")
        name = data.get("name") or "Unknown"
        if meeting_id:
            await sio.enter_room(sid, meeting_id)
            logger.info(f"Client {sid} joined meeting room: {meeting_id}")
            
            p_list = active_participants.setdefault(meeting_id, [])
            participant = {"socketId": sid, "name": name, "meetingId": meeting_id}
            p_list.append(participant)
            sid_to_meeting_info[sid] = participant
            
            await sio.emit("participantsUpdated", p_list, room=meeting_id)
            return {"status": "success", "room": meeting_id}
        return {"status": "error", "message": "Missing meetingId"}

    @sio.event
    async def getParticipants(sid, data):
        meeting_id = data.get("meetingId")
        p_list = active_participants.get(meeting_id, [])
        return {"status": "success", "participants": p_list}

    @sio.event
    async def leaveMeeting(sid, data):
        meeting_id = data.get("meetingId")
        if meeting_id:
            await sio.leave_room(sid, meeting_id)
            logger.info(f"Client {sid} left meeting room: {meeting_id}")
            
            p_list = active_participants.get(meeting_id, [])
            if sid in sid_to_meeting_info:
                participant = sid_to_meeting_info[sid]
                if participant in p_list:
                    p_list.remove(participant)
                del sid_to_meeting_info[sid]
                await sio.emit("participantsUpdated", p_list, room=meeting_id)
                
            return {"status": "success", "room": meeting_id}
        return {"status": "error", "message": "Missing meetingId"}

    @sio.event
    async def sendTranscript(sid, data):
        meeting_id = data.get("meetingId")
        speaker_name = data.get("speakerName")
        text = data.get("text")
        
        if not meeting_id or not speaker_name or not text:
            logger.warning(f"Invalid transcript stream request payload from {sid}")
            return

        logger.info(f"Real-time transcript in {meeting_id} from {speaker_name}: {text}")

        db = SessionLocal()
        try:
            # Save segment to database
            t = Transcript(meetingId=meeting_id, speakerName=speaker_name, text=text)
            db.add(t)
            db.commit()
            db.refresh(t)

            # Broadcast new transcript segment to the room
            await sio.emit("transcriptAdded", {
                "id": t.id,
                "meetingId": t.meetingId,
                "speakerName": t.speakerName,
                "text": t.text,
                "timestamp": to_iso(t.timestamp)
            }, room=meeting_id)

            # Run continuous, non-blocking background AI analysis
            async def trigger_analysis(mid: str):
                state = analysis_state.setdefault(mid, {'running': False, 'pending': False})
                if state['running']:
                    state['pending'] = True
                    return

                state['running'] = True
                state['pending'] = False

                try:
                    logger.info(f"Running real-time background analysis for meeting {mid}...")
                    analysis = await asyncio.to_thread(run_realtime_ai_standalone, mid)
                    if analysis:
                        await sio.emit("liveAnalysisUpdated", {
                            "actionItems": analysis["actionItems"],
                            "risks": analysis["risks"]
                        }, room=mid)
                except Exception as ex:
                    logger.error(f"Error in background AI analysis: {ex}")
                finally:
                    state['running'] = False
                    if state['pending']:
                        # trigger again if new data arrived during processing
                        asyncio.create_task(trigger_analysis(mid))

            asyncio.create_task(trigger_analysis(meeting_id))

        except Exception as e:
            logger.error(f"Error handling sendTranscript event: {e}")
        finally:
            db.close()

    @sio.event
    async def triggerManualAnalysis(sid, data):
        meeting_id = data.get("meetingId")
        if not meeting_id:
            return {"status": "error", "message": "Missing meetingId"}
            
        db = SessionLocal()
        try:
            analysis = run_realtime_ai(meeting_id, db)
            if analysis:
                await sio.emit("liveAnalysisUpdated", {
                    "actionItems": analysis["actionItems"],
                    "risks": analysis["risks"]
                }, room=meeting_id)
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Manual AI analysis failed: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @sio.event
    async def joinChannel(sid, data):
        channel_id = data.get("channelId")
        if channel_id:
            room = f"channel_{channel_id}"
            await sio.enter_room(sid, room)
            logger.info(f"Client {sid} joined channel room: {room}")
            return {"status": "success", "room": room}
        return {"status": "error", "message": "Missing channelId"}

    @sio.event
    async def leaveChannel(sid, data):
        channel_id = data.get("channelId")
        if channel_id:
            room = f"channel_{channel_id}"
            await sio.leave_room(sid, room)
            logger.info(f"Client {sid} left channel room: {room}")
            return {"status": "success", "room": room}
        return {"status": "error", "message": "Missing channelId"}

    @sio.event
    async def sendChannelMessage(sid, data):
        channel_id = data.get("channelId")
        sender_id = data.get("senderId")
        sender_name = data.get("senderName")
        text = data.get("text")
        
        if not channel_id or not sender_id or not sender_name or not text:
            logger.warning(f"Invalid channel message payload from {sid}")
            return {"status": "error", "message": "Invalid message data"}

        db = SessionLocal()
        try:
            msg = ChannelMessage(
                channelId=channel_id,
                senderId=sender_id,
                senderName=sender_name,
                text=text
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)
            
            room = f"channel_{channel_id}"
            await sio.emit("channelMessageAdded", {
                "id": msg.id,
                "channelId": msg.channelId,
                "senderId": msg.senderId,
                "senderName": msg.senderName,
                "text": msg.text,
                "createdAt": to_iso(msg.createdAt)
            }, room=room)
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Failed to save channel message: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @sio.event
    async def joinUserRoom(sid, data):
        user_id = data.get("userId")
        if user_id:
            room = f"user_{user_id}"
            await sio.enter_room(sid, room)
            logger.info(f"Client {sid} joined user-specific room: {room}")
            return {"status": "success", "room": room}
        return {"status": "error", "message": "Missing userId"}

    @sio.event
    async def sendDirectMessage(sid, data):
        sender_id = data.get("senderId")
        receiver_id = data.get("receiverId")
        text = data.get("text")
        
        if not sender_id or not receiver_id or not text:
            logger.warning(f"Invalid direct message payload from {sid}")
            return {"status": "error", "message": "Invalid message data"}

        db = SessionLocal()
        try:
            msg = DirectMessage(
                senderId=sender_id,
                receiverId=receiver_id,
                text=text
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)
            
            # Fetch sender and receiver for client-side serialization compatibility
            sender = db.query(User).filter(User.id == sender_id).first()
            receiver = db.query(User).filter(User.id == receiver_id).first()
            
            payload = {
                "id": msg.id,
                "senderId": msg.senderId,
                "receiverId": msg.receiverId,
                "text": msg.text,
                "createdAt": to_iso(msg.createdAt),
                "sender": {
                    "id": sender.id,
                    "name": sender.name,
                    "email": sender.email
                } if sender else None,
                "receiver": {
                    "id": receiver.id,
                    "name": receiver.name,
                    "email": receiver.email
                } if receiver else None
            }
            
            # Emit to both sender and receiver rooms
            await sio.emit("directMessageAdded", payload, room=f"user_{sender_id}")
            await sio.emit("directMessageAdded", payload, room=f"user_{receiver_id}")
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Failed to save direct message: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            db.close()

    @sio.event
    async def webrtc_offer(sid, data):
        meeting_id = data.get("meetingId")
        target = data.get("target")
        payload = {"sdp": data.get("sdp"), "sender": sid}
        if target:
            await sio.emit("webrtc_offer", payload, room=target)
        else:
            await sio.emit("webrtc_offer", payload, room=meeting_id, skip_sid=sid)

    @sio.event
    async def webrtc_answer(sid, data):
        target = data.get("target")
        payload = {"sdp": data.get("sdp"), "sender": sid}
        if target:
            await sio.emit("webrtc_answer", payload, room=target)

    @sio.event
    async def webrtc_ice_candidate(sid, data):
        meeting_id = data.get("meetingId")
        target = data.get("target")
        payload = {"candidate": data.get("candidate"), "sender": sid}
        if target:
            await sio.emit("webrtc_ice_candidate", payload, room=target)
        else:
            await sio.emit("webrtc_ice_candidate", payload, room=meeting_id, skip_sid=sid)
