@echo off
echo Setting up firewall rule for CogniLearn backend (Port 3000)...
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
echo.
echo Firewall rule added successfully!
echo You can now connect to the app from your mobile device.
pause
