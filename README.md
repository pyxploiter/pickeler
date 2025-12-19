# Pickler

Pickler is a VS Code extension for viewing Python `.pkl` (pickle) files.

## Features
- Safe view (pickletools, no execution)
- Full view (explicit opt-in, unsafe)
- Nested data visualization
- Bounded depth and size

## ⚠️ Security Warning
Unpickling can execute arbitrary code.
Pickler defaults to safe mode. Full mode requires explicit user consent.