Require vhs
Require ffmpeg
Require ttyd

Output apps/docs/public/media/demos/list-web-catalog.gif

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

Type "echo '$ tinkerise list'"
Enter
Type "echo Web  Backend  Mobile  Templates  Enhancements"
Enter
Sleep 700ms

Type "echo '$ tinkerise list web'"
Enter
Type "echo Next.js  Vite  Astro  T3  Remix  TanStack-Start  Turborepo"
Enter
Sleep 800ms

Type "echo fast discoverability: choose web then scaffold immediately"
Enter
Sleep 1000ms
