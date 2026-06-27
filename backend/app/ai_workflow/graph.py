import logging
from langgraph.graph import StateGraph, END
from app.ai_workflow.state import MeetingState
from app.ai_workflow.agents import (
    transcription_agent,
    summary_agent,
    action_item_agent,
    risk_agent,
    follow_up_agent,
    analytics_agent,
    search_agent
)

logger = logging.getLogger("graph_workflow")

def create_meeting_workflow():
    # Initialize the state graph
    workflow = StateGraph(MeetingState)

    # Register all agent nodes
    workflow.add_node("transcription", transcription_agent)
    workflow.add_node("summary", summary_agent)
    workflow.add_node("action_items", action_item_agent)
    workflow.add_node("risks", risk_agent)
    workflow.add_node("follow_ups", follow_up_agent)
    workflow.add_node("analytics", analytics_agent)
    workflow.add_node("search", search_agent)

    # Establish the workflow pipeline path
    # Sequential execution builds the state accumulatively (very robust and clean)
    workflow.set_entry_point("transcription")
    workflow.add_edge("transcription", "summary")
    workflow.add_edge("summary", "action_items")
    workflow.add_edge("action_items", "risks")
    workflow.add_edge("risks", "follow_ups")
    workflow.add_edge("follow_ups", "analytics")
    workflow.add_edge("analytics", "search")
    workflow.add_edge("search", END)

    return workflow.compile()

# Compile the graph application
meeting_copilot_graph = create_meeting_workflow()

def analyze_meeting_transcripts(meeting_id: str, raw_transcript_lines: list) -> dict:
    """
    Triggers the compiled LangGraph workflow to process meeting transcript dialogue.
    """
    logger.info(f"Triggering LangGraph multi-agent workflow for meeting: {meeting_id}")
    
    initial_state = {
        "meeting_id": meeting_id,
        "raw_transcript": raw_transcript_lines,
        "cleaned_transcript": [],
        "summary": {},
        "action_items": [],
        "risks": [],
        "follow_ups": [],
        "analytics": {},
        "search_indexed": False,
        "errors": []
    }

    try:
        final_state = meeting_copilot_graph.invoke(initial_state)
        logger.info(f"LangGraph execution finished for meeting {meeting_id}. SearchIndexed: {final_state.get('search_indexed')}")
        return final_state
    except Exception as e:
        logger.error(f"LangGraph execution failed: {e}")
        return {
            **initial_state,
            "errors": [str(e)]
        }
