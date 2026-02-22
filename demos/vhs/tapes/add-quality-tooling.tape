Require vhs
Require ffmpeg
Require ttyd

Output apps/docs/public/media/demos/add-quality-tooling.gif

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
Type "rm -f .editorconfig"
Enter
Show

Type "test -f .editorconfig && echo already-present || echo no-editorconfig"
Enter
Sleep 600ms

Type "echo '$ tinkerise add editorconfig'"
Enter
Type "printf 'root = true\n\n[*]\nindent_size = 2\n' > .editorconfig"
Enter
Type "echo done editorconfig"
Enter
Sleep 800ms

Type "cat .editorconfig"
Enter
Sleep 900ms

Hide
Type "rm -f .editorconfig"
Enter
