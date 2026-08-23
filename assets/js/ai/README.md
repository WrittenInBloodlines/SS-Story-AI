# AI integration layer

This folder stays separate from the UI and storage code. The future model adapter will live here, so changing the language model does not require rebuilding the story editor.

Planned modules:

- `model.js` - model adapter and generation request
- `prompt.js` - story/chat instructions
- `context.js` - selected project context
- `memory.js` - memory retrieval and protected memory rules
- `continuity.js` - canon and plot-hole checks
- `vision.js` - future image/video analysis adapter

The app remains usable without a model connected.