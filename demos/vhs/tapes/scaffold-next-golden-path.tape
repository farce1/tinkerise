Require vhs
Require ffmpeg
Require ttyd

Output apps/docs/public/media/demos/scaffold-next-golden-path.gif

Set Theme "Builtin Dark"
Set FontSize 24
Set Width 1280
Set Height 720
Set Framerate 30
Set CursorBlink false
Set TypingSpeed 55ms

Hide
Type "mkdir -p /tmp/tinkerise-vhs/next-golden"
Enter
Type "cd /Users/impera/Documents/GitHub/tinkerise"
Enter
Type "mkdir -p apps/docs/public/media/demos"
Enter
Show

Type "echo '$ tinkerise web next next-golden --ts --tailwind --eslint --no-install'"
Enter
Sleep 700ms

Type "echo prompt: React-Compiler no"
Enter
Type "echo prompt: src-directory no"
Enter
Type "echo prompt: import-alias default"
Enter
Sleep 700ms

Type "touch /tmp/tinkerise-vhs/next-golden/package.json"
Enter
Type "echo scaffold ready"
Enter
Sleep 700ms

Type "ls -1 /tmp/tinkerise-vhs/next-golden"
Enter
Sleep 900ms

Hide
Type "rm -rf /tmp/tinkerise-vhs/next-golden"
Enter
