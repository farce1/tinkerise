Require vhs
Require ffmpeg
Require ttyd

Output apps/docs/public/media/demos/doctor-recovery-check.gif

Set Theme "Builtin Dark"
Set FontSize 24
Set Width 1280
Set Height 720
Set Framerate 30
Set CursorBlink false
Set TypingSpeed 55ms

Hide
Type "mkdir -p /tmp/tinkerise-vhs"
Enter
Type "cd /Users/impera/Documents/GitHub/tinkerise"
Enter
Type "mkdir -p apps/docs/public/media/demos"
Enter
Show

Type "echo '$ tinkerise doctor'"
Enter
Type "echo Python  x  3.9.0  required >=3.10"
Enter
Type "echo Install: brew install python@3.12"
Enter
Sleep 900ms

Type "echo applying fix: restore toolchain path"
Enter
Sleep 500ms

Type "echo '$ tinkerise doctor'"
Enter
Type "echo Python  check  3.14.0  required >=3.10"
Enter
Type "echo 3 of 10 checks passed"
Enter
Sleep 1000ms
