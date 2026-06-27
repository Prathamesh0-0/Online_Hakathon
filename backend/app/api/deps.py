from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_jwt_token

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )
    
    token = authorization.split(" ")[1]
    try:
        payload = decode_jwt_token(token)
        # Note: the key inside the token payload is 'userId'
        if "userId" not in payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid token structure"
            )
        return payload  # Dict containing 'userId' and 'email'
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
