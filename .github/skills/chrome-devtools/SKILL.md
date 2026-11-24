---
name: chrome-devtools
description: Browser debugging through Chrome DevTools via MCPorter. Use when asked to inspect a local web page, take a screenshot, inspect network requests, or run a Lighthouse audit.
allowed-tools: shell
---

# Chrome DevTools Skill

Before running commands, check that MCPorter is running:

mcporter daemon status

If it is not running, start it:

mcporter daemon start

Use this command format:

mcporter call chrome-devtools.<tool> [key:"value" ...]

Useful commands:

- `mcporter call chrome-devtools.navigate_page url:"<url>"`
- `mcporter call chrome-devtools.take_snapshot`
- `mcporter call chrome-devtools.take_screenshot filePath:"dashboard.png"`
- `mcporter call chrome-devtools.list_network_requests`
- `mcporter call chrome-devtools.lighthouse_audit`