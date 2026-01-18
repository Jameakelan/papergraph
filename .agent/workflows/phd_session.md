---
description: Simulate a PhD supervision session with the multi-agent system
---

# PhD Agent Session Workflow

This workflow simulates a session where the Project Manager coordinates other agents to help the student.

1.  **Define the Goal**
    User should identify the current immediate goal (e.g., "I need to write a literature review for my thesis").

2.  **Activate Project Manager**
    Read the Project Manager prompt:
    `cat agents/project_manager.md`

    _Instruction: Paste this prompt into your LLM context or think of this role._

    Ask the Project Manager to break down the goal.

3.  **Execute Sub-tasks**
    Based on the Project Manager's plan, activate the necessary agents.
    - **Need Papers?** -> `cat agents/research_librarian.md`
    - **Need Writing?** -> `cat agents/academic_writer.md`
    - **Need Analysis?** -> `cat agents/methodologist.md`

4.  **Review Loop**
    Once a draft or result is produced, activate the Peer Reviewer.
    `cat agents/peer_reviewer.md`

    Ask for a critique.

5.  **Final Polish**
    Return to the Academic Writer to incorporate feedback.

---

**Example Command Sequence:**

To quickly load an agent's context into your clipboard (Mac), you can run:

```bash
pbcopy < agents/project_manager.md
```

Then paste it into your chat interface.
