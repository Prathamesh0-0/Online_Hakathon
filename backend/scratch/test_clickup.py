import sys
import os
import requests

# Add parent directory to path so we can import app.config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def test_clickup_connection():
    token = settings.CLICKUP_ACCESS_TOKEN
    list_id = settings.CLICKUP_LIST_ID
    print(f"Testing ClickUp connection...")
    print(f"Token: {token[:10]}...{token[-5:] if len(token) > 10 else ''}")
    print(f"List ID: {list_id}")

    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }

    # Step 1: Check accessible Workspaces
    teams_url = "https://api.clickup.com/api/v2/team"
    try:
        print("\nChecking accessible Workspaces (Teams) for this token...")
        teams_resp = requests.get(teams_url, headers=headers, timeout=10.0)
        if teams_resp.status_code == 200:
            teams_data = teams_resp.json()
            print("SUCCESS! Accessible Workspaces:")
            for team in teams_data.get("teams", []):
                print(f" - Workspace Name: '{team.get('name')}', ID: {team.get('id')}")
        else:
            print(f"FAILED to check Workspaces. Status: {teams_resp.status_code}, Body: {teams_resp.text}")
    except Exception as e:
        print(f"ERROR checking Workspaces: {e}")

    # Step 2: Auto-discover Spaces and Lists inside the Workspace(s)
    print("\nAttempting to auto-discover spaces and lists...")
    try:
        teams_resp = requests.get(teams_url, headers=headers, timeout=10.0)
        if teams_resp.status_code == 200:
            teams = teams_resp.json().get("teams", [])
            for team in teams:
                team_id = team.get("id")
                spaces_url = f"https://api.clickup.com/api/v2/team/{team_id}/space"
                spaces_resp = requests.get(spaces_url, headers=headers, timeout=10.0)
                if spaces_resp.status_code == 200:
                    spaces = spaces_resp.json().get("spaces", [])
                    print(f"\nWorkspace: '{team.get('name')}' (ID: {team_id}) has {len(spaces)} Space(s):")
                    for space in spaces:
                        space_id = space.get("id")
                        print(f"  + Space: '{space.get('name')}' (ID: {space_id})")
                        
                        # Get folderless lists in this space
                        folderless_url = f"https://api.clickup.com/api/v2/space/{space_id}/list"
                        folderless_resp = requests.get(folderless_url, headers=headers, timeout=10.0)
                        if folderless_resp.status_code == 200:
                            f_lists = folderless_resp.json().get("lists", [])
                            for fl in f_lists:
                                print(f"    - List (Folderless): '{fl.get('name')}' (ID: {fl.get('id')})")
                        
                        # Get folders in this space
                        folders_url = f"https://api.clickup.com/api/v2/space/{space_id}/folder"
                        folders_resp = requests.get(folders_url, headers=headers, timeout=10.0)
                        if folders_resp.status_code == 200:
                            folders = folders_resp.json().get("folders", [])
                            for folder in folders:
                                folder_id = folder.get("id")
                                print(f"    - Folder: '{folder.get('name')}' (ID: {folder_id})")
                                
                                # Get lists in this folder
                                lists_url = f"https://api.clickup.com/api/v2/folder/{folder_id}/list"
                                lists_resp = requests.get(lists_url, headers=headers, timeout=10.0)
                                if lists_resp.status_code == 200:
                                    lists = lists_resp.json().get("lists", [])
                                    for l in lists:
                                        print(f"      * List: '{l.get('name')}' (ID: {l.get('id')})")
                else:
                    print(f"  FAILED to retrieve spaces for team {team_id}. Status: {spaces_resp.status_code}")
        else:
            print("FAILED to retrieve workspaces.")
    except Exception as e:
        print(f"ERROR during discovery: {e}")

    # Step 3: Create a test task
    print(f"\nAttempting to create a test task in List ID {list_id}...")
    task_url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
    payload = {
        "name": "Verify AI Copilot Sync Connection",
        "description": "This is a test task to verify that the AI Meeting Copilot can successfully write and sync action items to ClickUp.",
        "status": "to do"
    }
    try:
        task_resp = requests.post(task_url, headers=headers, json=payload, timeout=10.0)
        if task_resp.status_code in [200, 201]:
            task_data = task_resp.json()
            print("SUCCESS! Test task created successfully:")
            print(f" - Task Name: '{task_data.get('name')}'")
            print(f" - Task ID: {task_data.get('id')}")
            print(f" - Task URL: {task_data.get('url')}")
        else:
            print(f"FAILED to create test task. Status: {task_resp.status_code}, Body: {task_resp.text}")
    except Exception as e:
        print(f"ERROR creating test task: {e}")

if __name__ == "__main__":
    test_clickup_connection()
