<p align="center">
  <img src="icon.png" alt="FlashForge Logo" width="120"/>
</p>

<h1 align="center">⚡ FlashForge</h1>
<p align="center">
  <strong>A powerful, modern tool to burn OS images to USB drives</strong><br>
  <em>Built with ❤️ by <a href="https://github.com/Haddan112">Mohamed Haddan</a></em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="version"/>
  <img src="https://img.shields.io/badge/platform-Windows%20x64-lightgrey?style=flat-square" alt="platform"/>
  <img src="https://img.shields.io/badge/license-ISC-green?style=flat-square" alt="license"/>
  <img src="https://img.shields.io/badge/tech-Electron%2C%20Node.js-9cf?style=flat-square" alt="tech"/>
</p>

---

## ⬇️ Download

[![Download FlashForge](https://img.shields.io/badge/⬇️%20Download-FlashForge%20Setup%201.0.0.exe-important?style=for-the-badge&logo=windows)](https://drive.google.com/uc?export=download&id=16TQVhBI4_CtlzvbQph2AC-QCv8nId1Lg)

> **File:** `FlashForge Setup 1.0.0.exe`  
> **Size:** ~100 MB  
> **OS:** Windows 10/11 (64-bit)  
> **Rights:** Administrator (UAC prompt will appear)

---

## 🔥 Why FlashForge?

FlashForge is a **complete, feature-rich alternative** to traditional USB burning tools like Rufus.  
It combines essential burning capabilities with **smart exclusive features** and a **stunning cyberpunk-inspired interface**.

### ✨ Core Features

- ✅ Burn **ISO / IMG** files to USB drives
- ✅ Supports **FAT32, NTFS, exFAT, ReFS, ext4, UDF** file systems
- ✅ **MBR** and **GPT** partition schemes
- ✅ Quick Format & Full Format
- ✅ **DD mode** for Linux distributions
- ✅ **Windows To Go** creator
- ✅ **Bypass TPM 2.0** for Windows 11 installation
- ✅ **Unattended installation** (auto‑generated autounattend.xml)
- ✅ **Bad block scanning** with real‑time progress
- ✅ **Post‑burn data verification** (checksum & file comparison)
- ✅ **BIOS update USB** creation (FreeDOS)
- ✅ **Repair mode** (chkdsk)
- ✅ **Hash calculation** (MD5 / SHA‑256)

### 🧠 Smart Exclusive Features

| Feature | FlashForge |
|--------|------------|
| 🤖 **Auto‑detection of ISO type** | Automatically suggests the best file system, partition scheme, and DD mode |
| 🩺 **USB health check** | Quick diagnostic report before burning |
| 🌍 **Multilingual** | Arabic, English, French (Rufus does **not** support Arabic!) |
| 🎨 **Modern UI** | Cyberpunk design, collapsible sidebar, smooth animations |
| 💡 **Tech‑tip splash screen** | Displays helpful tips while loading |

---

## 📊 Quick Comparison with Rufus

| Feature | Rufus | FlashForge |
|--------|-------|------------|
| ISO/IMG burning | ✅ | ✅ |
| File systems | FAT32, NTFS, exFAT, UDF | FAT32, NTFS, exFAT, ReFS, ext4, UDF |
| USB health check | ❌ | ✅ |
| Auto‑suggestion based on ISO | ❌ | ✅ |
| Arabic language | ❌ | ✅ |
| Cyberpunk modern UI | Classic | ⭐⭐⭐⭐⭐ |
| Unattended install | ✅ (Beta) | ✅ |
| Bad block scan | ✅ | ✅ (with advanced options) |

---

## 🚀 How to Use

1. **Download** and install FlashForge.
2. **Run** the application (UAC will ask for administrator rights – this is required).
3. **Select** your ISO file (or enable **Repair Mode** / **BIOS Update** if needed).
4. **Choose** the target USB drive from the list.
5. **Adjust** settings: file system, partition scheme, and advanced options.
6. Click **"Start Burning"** and wait for completion.

---

## ⚠️ Important Notes

- **Backup your data** – burning will erase the USB drive completely.
- **For Linux ISOs**, **DD mode** is highly recommended.
- **After burning a Linux ISO with DD mode**, the USB drive will **not appear** in Windows File Explorer. This is normal because Linux often uses `ext4` or other filesystems that Windows cannot read. The USB is **still bootable** – test it by booting a real machine or using a QEMU‑based tool like **MobaLiveCD**.
- **Progress bar pauses** at a certain percentage during Windows burning (e.g., 71%) are normal – the app is copying a huge `install.wim` file. It will resume and finish successfully.

---

## 📥 Installation from Source

If you prefer to run from source:

```bash
git clone https://github.com/Haddan112/FlashForge.git
cd FlashForge
npm install
npm start