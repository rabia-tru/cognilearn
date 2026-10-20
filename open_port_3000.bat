@echo off
echo Opening port 3000 for CogniLearn...
netsh advfirewall firewall add rule name="CogniLearn3000" dir=in action=allow protocol=TCP localport=3000 profile=any
echo Done! Port 3000 is now open.
pause
