# 📸 Complete Screenshot Capture Guide for Saheb Paper ERP

**Created:** October 29, 2026  
**Purpose:** Capture all app screens for video production

---

## 🎯 Two Methods Available

### **Method 1: Automated Browser Capture** (Recommended - Fastest)
Uses Puppeteer to automatically capture all screens

### **Method 2: Manual Capture with Navigation Script**
Semi-automated - script navigates, you capture manually

---

## 📦 Method 1: Automated Screenshot Capture (Best)

### Prerequisites:
```powershell
# Install Puppeteer
npm install --save-dev puppeteer
```

### Run the automated capture:
```powershell
cd D:\Code\saheb-paper-demo
node scripts\automated-screenshot-capture.js
```

This will:
- ✅ Start your dev server automatically
- ✅ Navigate through all 21 modules
- ✅ Capture full-page screenshots
- ✅ Save to `screenshots/` folder
- ✅ Generate a summary report

**Time:** ~3-5 minutes for all screenshots

---

## 🖱️ Method 2: Manual Capture (If Puppeteer Fails)

### Step 1: Start Your App
```powershell
cd D:\Code\saheb-paper-demo
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### Step 2: Open the App
- Open Chrome/Edge
- Go to: http://localhost:5173
- Login to your app
- Press **F11** for fullscreen (optional, for cleaner screenshots)

### Step 3: Run the Navigation Script
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Copy and paste the content from `scripts/capture-screenshots.js`
4. Press **Enter**

The script will:
- Navigate to each module automatically
- Wait 3 seconds per screen
- Tell you when to capture

### Step 4: Capture Each Screen

**Windows Built-in Snipping Tool:**
- Press **Windows + Shift + S** when prompted
- Select full screen or region
- Image copied to clipboard
- Paste into Paint and save

**Or use ShareX (Better for batch):**
1. Download: https://getsharex.com/
2. Set up hotkey (e.g., Ctrl + Print Screen)
3. Configure auto-save location
4. Capture each screen as script navigates

---

## 📱 Desktop/Workspace Screenshots

### Capture Your Developer Workspace:

**Option A: Full Desktop**
```
1. Close unnecessary windows
2. Arrange: VS Code (left) + Browser (right)
3. Show your code + running app
4. Press Windows + Print Screen
5. Saved to: C:\Users\thako\Pictures\Screenshots\
```

**Option B: Staged Developer Setup**
```
1. Open VS Code with your project
2. Open 2-3 browser tabs (Dashboard, QR Scanner, Reports)
3. Arrange in a visually appealing way
4. Add: Coffee mug, notebook (optional props)
5. Use phone camera or screenshot tool
```

**Option C: Multiple Monitor Setup**
```
Monitor 1: VS Code with code visible
Monitor 2: Running app
Monitor 3: Design mockups/Figma (if available)

Capture: Use Windows + Print Screen for all monitors
```

---

## 📋 Complete Screenshot Checklist

### App Screenshots (21 total):

- [ ] 1. Dashboard (main view with stats)
- [ ] 2. Raw Material Stock (with data)
- [ ] 3. Orders (order list)
- [ ] 4. Pulp Mill Operations
- [ ] 5. Machine Production
- [ ] 6. Rewinding Reel Conversion
- [ ] 7. Boiler Operations
- [ ] 8. ETP Water & Chemicals
- [ ] 9. Electricity & Power Grid
- [ ] 10. Finished Stock Dispatch
- [ ] 11. Spareparts Management
- [ ] 12. Lab
- [ ] 13. Label Studio (with label preview)
- [ ] 14. Reports (with charts visible)
- [ ] 15. Dispatch - Draft Packing Slip
- [ ] 16. Dispatch - Packing Slips List
- [ ] 17. Dispatch - Dispatched Reels
- [ ] 18. Admin Panel
- [ ] 19. Company Settings
- [ ] 20. User Management (with users listed)
- [ ] 21. Profile

### Desktop/Workspace Screenshots (3-5 total):

- [ ] 22. Full desktop with code + app
- [ ] 23. Close-up of VS Code with React code
- [ ] 24. Developer hands typing (optional)
- [ ] 25. Multiple monitors setup (if available)
- [ ] 26. Mobile version of app (if testing on phone/tablet)

---

## 🎨 Screenshot Best Practices

### Before Capturing:

1. **Clean Up:**
   - Close notification popups
   - Hide browser bookmarks bar (Ctrl + Shift + B)
   - Clear desktop clutter
   - Close unnecessary apps

2. **Fill with Data:**
   - Make sure tables have data
   - Show realistic numbers (not all zeros)
   - Have charts visible with data
   - Open modals/dropdowns that look good

3. **Consistent State:**
   - Same date filter across all views
   - Logged in as same user
   - Consistent theme (light/dark)
   - Same zoom level (100%)

4. **Timing:**
   - Wait for all data to load
   - Let animations complete
   - Ensure no loading spinners visible
   - Scroll to show important content

### Image Quality:

- **Resolution:** Capture at 1920x1080 or higher
- **Format:** PNG (better quality) or JPG (smaller size)
- **Naming:** Use descriptive names: `01_dashboard.png`, `02_raw_material.png`
- **Folder:** Save all to `D:\Code\saheb-paper-demo\screenshots\`

---

## 🚀 Quick Start Commands

### Option 1: Automated (Coming up next)
```powershell
cd D:\Code\saheb-paper-demo
npm install --save-dev puppeteer
node scripts\automated-screenshot-capture.js
```

### Option 2: Manual Navigation
```powershell
# Terminal 1: Start app
cd D:\Code\saheb-paper-demo
npm run dev

# Browser: Open http://localhost:5173
# DevTools Console: Run scripts/capture-screenshots.js
# Capture manually with Windows + Shift + S
```

---

## 📁 File Organization

After capturing, organize like this:

```
screenshots/
├── app/
│   ├── 01_dashboard.png
│   ├── 02_raw_material_stock.png
│   ├── 03_orders.png
│   ├── ...
│   └── 21_profile.png
├── desktop/
│   ├── workspace_full.png
│   ├── vs_code_closeup.png
│   └── multi_monitor.png
├── mobile/ (optional)
│   ├── dashboard_mobile.png
│   └── qr_scanner_mobile.png
└── raw/ (backup of originals)
```

---

## 🎬 For Video Production

These screenshots will be used in:

1. **AI Video Generation:**
   - Import as reference images for Runway/Pika
   - Show actual UI in prompts

2. **Screen Recording Segments:**
   - Use as thumbnail previews
   - Reference for what to record

3. **Static Frames:**
   - Insert into motion graphics
   - Use in storyboard mockups

4. **Marketing Materials:**
   - Website screenshots
   - Social media posts
   - Sales presentations

---

## 🛠️ Recommended Tools

### Free Tools:
1. **Windows Snipping Tool** (Built-in)
   - Windows + Shift + S
   - Quick and easy

2. **ShareX** (Free, Open Source)
   - Auto-save with naming
   - Batch capture
   - Annotations
   - Download: https://getsharex.com/

3. **Greenshot** (Free)
   - Similar to ShareX
   - Good for annotations
   - Download: https://getgreenshot.org/

### Paid Tools:
1. **Snagit** ($50) - Professional screenshots + editing
2. **Lightshot** (Free) - Quick share to cloud

---

## ⚡ Pro Tips

1. **Use Dual Monitors:**
   - Script on one, capture tool on other
   - Faster workflow

2. **Batch Rename:**
   - Use Windows PowerShell to rename all at once
   - `Get-ChildItem | Rename-Item -NewName {$_.Name -replace 'Screenshot','app'}`

3. **Quick Review:**
   - Open all screenshots in Windows Photos
   - Delete blurry/loading ones
   - Recapture if needed

4. **Backup:**
   - Keep originals in `raw/` folder
   - Edit copies for video

5. **Dark Mode:**
   - Some screenshots in light mode
   - Some in dark mode (if your app has it)
   - Shows versatility

---

## 🤔 Troubleshooting

### Issue: Screenshots are blurry
**Solution:** 
- Increase browser zoom to 100%
- Use PNG format (not JPG)
- Capture at native resolution

### Issue: UI elements are cut off
**Solution:**
- Scroll to show all content
- Use full-page screenshot tools
- Or capture in sections and stitch

### Issue: Loading spinners visible
**Solution:**
- Wait longer before capturing
- Increase delay in script
- Manually wait for full load

### Issue: No data showing
**Solution:**
- Add sample data to your app
- Use date filters to show populated periods
- Create test entries

---

## ✅ Next Steps After Capture

1. **Review all screenshots** - Check quality and content
2. **Select best 10-15** - For video production
3. **Edit if needed** - Crop, blur sensitive data, add highlights
4. **Create contact sheet** - Overview of all screens
5. **Use in video** - Import to video editor or AI tools

---

## 📞 Need Help?

If you have issues:
1. Make sure app is running (npm run dev)
2. Check all modules load correctly
3. Try different screenshot tool
4. Ask me for specific module capture help!

---

**Ready?** Let me create the automated Puppeteer script next, or start with manual capture right now! 📸
