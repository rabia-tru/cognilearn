# CogniLearn Mobile App Setup Guide

## ✅ Backend is Running
Your backend server is running on: `http://192.168.18.174:3000`

## 📱 Steps to Get Mobile App Working

### 1. Setup Windows Firewall (Required)
**Right-click** on `setup-firewall.bat` and select **"Run as administrator"**

This will allow your mobile device to connect to port 3000.

### 2. Install the Updated Mobile App
- Transfer `cognilearn-app-updated.apk` to your Android phone
- Install the APK (you may need to allow installation from unknown sources)
- Or use: `adb install cognilearn-app-updated.apk` if your phone is connected via USB

### 3. Connect Your Phone
Make sure your phone is on the **same Wi-Fi network** as your PC:
- **Your PC Wi-Fi IP:** `192.168.18.174`
- **Your Wi-Fi Network:** Check it matches your phone's Wi-Fi

### 4. Test the Connection
1. Open the CogniLearn app on your phone
2. Go to Settings (gear icon)
3. The app will automatically try to connect to:
   - `http://localhost:3000` (USB connection)
   - `http://10.0.2.2:3000` (Android emulator)
   - `http://192.168.18.174:3000` (Your Wi-Fi network) ✅

### 5. Alternative: USB Connection (Faster & More Stable)
If Wi-Fi doesn't work, you can use USB with ADB:

```bash
# Connect phone via USB, enable USB debugging, then run:
adb reverse tcp:3000 tcp:3000
```

This makes `localhost:3000` on the phone connect to your PC.

### 6. Manual Configuration (If Auto-detect Fails)
In the mobile app:
1. Open Settings
2. Scroll to "Backend Server URL"
3. Enter: `http://192.168.18.174:3000`
4. Save

## 🔧 Troubleshooting

### App can't connect to server
- Check firewall is configured (run setup-firewall.bat as admin)
- Verify both devices are on same Wi-Fi network
- Try USB method with `adb reverse tcp:3000 tcp:3000`
- Check server is running: open http://localhost:3000 in your PC browser

### Firewall issues
If Windows Defender blocks the connection:
- Open Windows Defender Firewall
- Allow "Node.js" or "tsx.exe" through the firewall
- Or run: `netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000`

### Server not responding
Make sure the dev server is running:
```bash
npm run dev
```

Check for output: "CogniLearn server listening on port 3000"

## 📍 Current Configuration
- **Backend URL:** http://192.168.18.174:3000
- **API Endpoints:**
  - Health check: `/api/health`
  - Generate deck: `/api/generate-deck`
  - Explain concept: `/api/explain-concept`
  - Reinforce weak areas: `/api/reinforce-weak-areas`

## 🎉 Success Indicators
- App loads without "Cannot connect" errors
- You can upload documents and generate flashcards
- Quiz questions load properly
- AI explanations work
