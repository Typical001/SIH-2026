import json

with open(r'C:\Users\_7ansh_\.gemini\antigravity-ide\brain\9adf47a7-df91-450a-84d1-1db3bfa2995a\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for l in lines[-35:]:
        obj = json.loads(l)
        typ = obj.get('type')
        idx = obj.get('step_index')
        src = obj.get('source')
        if typ in ('PLANNER_RESPONSE', 'RUN_COMMAND', 'USER_INPUT'):
            content = obj.get('content', '')
            if isinstance(content, str):
                summary = content[:150].replace('\n', ' ')
            else:
                summary = str(content)[:150]
            print(f'[{idx}] {src} {typ}: {summary}')
            tc = obj.get('tool_calls', [])
            for c in tc:
                print('   TOOL CALL:', c.get('name'), str(c.get('args'))[:120])
