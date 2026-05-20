const { ipcRenderer } = require('electron');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');


const translations = {
    ar: {
        title: '⚡ FlashForge', subtitle: 'أداة احترافية لحرق أنظمة التشغيل على USB',
        lblIso: '💿 ملف ISO / IMG', lblDownloadWindows: '🌐 تحميل Windows ISO من مايكروسوفت',
        lblUsb: '📀 قرص USB الهدف', lblFileSystem: '⚙️ نظام الملفات', lblPartScheme: '💻 نظام التقسيم',
        lblAdvanced: '🔧 خيارات متقدمة', txtQuickFormat: 'تهيئة سريعة', txtBadBlocks: 'فحص القطاعات التالبة',
        txtRepairMode: 'وضع الإصلاح (Repair Mode)',
        txtVerify: 'التحقق من البيانات بعد الحرق', txtBypassTPM: 'تجاوز TPM 2.0 (لـ Windows 11)',
        txtWindowsToGo: 'Windows To Go', txtLocalAccount: 'حساب محلي (تجاوز حساب مايكروسوفت)',
        lblHash: '📊 التحقق من MD5 / SHA-256', calcHash: 'حساب', burn: '🔥 ابدأ الحرق',
        download: '⬇️ تحميل', usbSearch: '-- جاري البحث عن الأقراص --',
        noUsb: 'لا توجد أقراص USB', selectUsb: '-- اختر قرص USB --',
        txtDDMode: 'وضع DD (لحرق Linux ISOs)',
        txtBIOSUpdate: 'تحديث BIOS من DOS',
        txtSilentInstall: 'تثبيت صامت (Silent Install)',
        selectBiosFolder: 'اختر مجلد ملفات BIOS',
        biosFolderNotSelected: 'لم يتم اختيار مجلد BIOS',
        alertSelectBiosFolder: 'الرجاء اختيار مجلد ملفات BIOS',
        biosProgressText: '🔧 جاري تجهيز USB لتحديث BIOS...',
        biosSuccess: '✅ تم تجهيز USB لتحديث BIOS بنجاح',
        biosError: '❌ فشل تجهيز USB لتحديث BIOS',
        suggestionLinux: '🐧 توزيعة لينكس: نوصي بـ ext4، GPT، وضع DD',
        suggestionWin11: '🪟 Windows 11: قد تحتاج تجاوز TPM 2.0 وحساب محلي',
        suggestionWin10: '🪟 Windows 10/8: نوصي بـ NTFS، GPT، تهيئة سريعة',
        suggestionBootable: '💿 أداة إقلاع: نوصي بـ FAT32، MBR، وضع DD',
        suggestionDefault: '💡 لم يتم التعرف على نوع ISO. الإعدادات الافتراضية.',
        healthCheckBtnText: '🩺 فحص',
        healthCheckProgress: '⏳ جاري فحص الصحة...',
        healthCheckComplete: '✅ الفحص اكتمل',
        healthDisk: '📀 القرص:',
        healthSpeed: '⚡ السرعة المقدرة:',
        healthInterface: '🔌 الواجهة:',
        healthStatus: '🩺 الحالة:',
        healthCheckGood: '✅ سليم',
        healthCheckBad: '⚠️ توجد قطاعات تالبة',
        noFileSelected: 'لم يتم اختيار ملف',
        fileBtnText: 'اختيار ملف...',
        expectedHashPlaceholder: 'القيمة المتوقعة',
        alertSelectIso: 'الرجاء اختيار ملف ISO أو تفعيل وضع الإصلاح أو تحديث BIOS',
        alertSelectUsb: 'الرجاء اختيار قرص USB',
        copyingFileText: '📋 جاري تجهيز الملف...',
        alertCopyFailed: '❌ فشل تجهيز ملف ISO. تأكد من وجود مساحة كافية في القرص المؤقت.',
        aboutBtnText: 'عن المطور',
        about_title: 'عن التطبيق',
        app_name: 'اسم التطبيق',
        version: 'الإصدار',
        developer: 'المطور',
        tech: 'التقنيات المستخدمة',
        description: 'الوصف',
        app_description: 'تطبيق سطح مكتب لحرق أنظمة التشغيل على USB بتصميم عصري وميزات متقدمة.',
        rights: '© 2025 جميع الحقوق محفوظة - Mohamed Haddan',
        downloadProgressText: 'جاري تحميل {version}...',
        downloadSuccess: '✅ تم التحميل بنجاح',
        burnProgressText: 'جاري الحرق...',
        scanProgressText: '🔍 جاري فحص القطاعات التالبة...',
        scanDoneText: '✅ اكتمل الفحص: {bad} قطاع تالف',
        scanNoneText: '✅ لا توجد قطاعات تالفة',
        repairProgressText: '🔧 جاري إصلاح القرص...',
        repairSuccess: '✅ تم إصلاح القرص بنجاح',
        repairError: '❌ فشل إصلاح القرص',
        verifyProgressText: '🔎 جاري التحقق من البيانات...',
        verifySuccess: '✅ تم التحقق من البيانات بنجاح',
        verifyError: '❌ فشل التحقق من البيانات',
        burnSuccess: '✅ تم الحرق بنجاح',
        burnError: '❌ فشل الحرق'
    },
    en: {
        title: '⚡ FlashForge', subtitle: 'Professional tool for burning OS images to USB',
        lblIso: '💿 ISO / IMG File', lblDownloadWindows: '🌐 Download Windows ISO from Microsoft',
        lblUsb: '📀 Target USB Drive', lblFileSystem: '⚙️ File System', lblPartScheme: '💻 Partition Scheme',
        lblAdvanced: '🔧 Advanced Options', txtQuickFormat: 'Quick Format', txtBadBlocks: 'Check for Bad Blocks',
        txtRepairMode: 'Repair Mode',
        txtVerify: 'Verify after burning', txtBypassTPM: 'Bypass TPM 2.0 (for Windows 11)',
        txtWindowsToGo: 'Windows To Go', txtLocalAccount: 'Local Account (bypass Microsoft login)',
        lblHash: '📊 Check MD5 / SHA-256', calcHash: 'Calculate', burn: '🔥 Start Burning',
        download: '⬇️ Download', usbSearch: '-- Searching for drives --',
        noUsb: 'No USB drives found', selectUsb: '-- Select USB Drive --',
        txtDDMode: 'DD Mode (for Linux ISOs)',
        txtBIOSUpdate: 'BIOS Update from DOS',
        txtSilentInstall: 'Silent Install',
        selectBiosFolder: 'Select BIOS Files Folder',
        biosFolderNotSelected: 'No BIOS folder selected',
        alertSelectBiosFolder: 'Please select BIOS files folder',
        biosProgressText: '🔧 Preparing USB for BIOS update...',
        biosSuccess: '✅ USB prepared for BIOS update successfully',
        biosError: '❌ Failed to prepare USB for BIOS update',
        suggestionLinux: '🐧 Linux distro: ext4, GPT, DD mode recommended',
        suggestionWin11: '🪟 Windows 11: TPM bypass & local account may be needed',
        suggestionWin10: '🪟 Windows 10/8: NTFS, GPT, Quick format recommended',
        suggestionBootable: '💿 Bootable tool: FAT32, MBR, DD mode recommended',
        suggestionDefault: '💡 ISO type unknown. Default settings applied.',
        healthCheckBtnText: '🩺 Check',
        healthCheckProgress: '⏳ Checking health...',
        healthCheckComplete: '✅ Health check complete',
        healthDisk: '📀 Disk:',
        healthSpeed: '⚡ Estimated speed:',
        healthInterface: '🔌 Interface:',
        healthStatus: '🩺 Status:',
        healthCheckGood: '✅ Healthy',
        healthCheckBad: '⚠️ Bad sectors found',
        noFileSelected: 'No file selected',
        fileBtnText: 'Choose File...',
        expectedHashPlaceholder: 'Expected value',
        alertSelectIso: 'Please select an ISO file or enable Repair Mode or BIOS Update',
        alertSelectUsb: 'Please select a USB drive',
        copyingFileText: '📋 Preparing file...',
        alertCopyFailed: '❌ Failed to prepare ISO file. Ensure sufficient disk space in temp folder.',
        aboutBtnText: 'About Developer',
        about_title: 'About App',
        app_name: 'App Name',
        version: 'Version',
        developer: 'Developer',
        tech: 'Technologies',
        description: 'Description',
        app_description: 'A desktop application to burn operating systems to USB with a modern design and advanced features.',
        rights: '© 2025 All Rights Reserved - Mohamed Haddan',
        downloadProgressText: 'Downloading {version}...',
        downloadSuccess: '✅ Download completed',
        burnProgressText: 'Burning...',
        scanProgressText: '🔍 Checking for bad blocks...',
        scanDoneText: '✅ Scan complete: {bad} bad sectors',
        scanNoneText: '✅ No bad sectors found',
        repairProgressText: '🔧 Repairing drive...',
        repairSuccess: '✅ Drive repaired successfully',
        repairError: '❌ Repair failed',
        verifyProgressText: '🔎 Verifying data...',
        verifySuccess: '✅ Data verified successfully',
        verifyError: '❌ Verification failed',
        burnSuccess: '✅ Burning completed',
        burnError: '❌ Burn failed'
    },
    fr: {
        title: '⚡ FlashForge', subtitle: 'Outil professionnel pour graver des images OS sur USB',
        lblIso: '💿 Fichier ISO / IMG', lblDownloadWindows: '🌐 Télécharger Windows ISO depuis Microsoft',
        lblUsb: '📀 Clé USB cible', lblFileSystem: '⚙️ Système de fichiers', lblPartScheme: '💻 Schéma de partition',
        lblAdvanced: '🔧 Options avancées', txtQuickFormat: 'Formatage rapide', txtBadBlocks: 'Vérifier les blocs défectueux',
        txtRepairMode: 'Mode réparation',
        txtVerify: 'Vérifier après gravure', txtBypassTPM: 'Contourner TPM 2.0 (pour Windows 11)',
        txtWindowsToGo: 'Windows To Go', txtLocalAccount: 'Compte local (contourner Microsoft)',
        lblHash: '📊 Vérifier MD5 / SHA-256', calcHash: 'Calculer', burn: '🔥 Démarrer la gravure',
        download: '⬇️ Télécharger', usbSearch: '-- Recherche de lecteurs --',
        noUsb: 'Aucun lecteur USB trouvé', selectUsb: '-- Sélectionnez un lecteur USB --',
        txtDDMode: 'Mode DD (pour ISOs Linux)',
        txtBIOSUpdate: 'Mise à jour du BIOS depuis DOS',
        txtSilentInstall: 'Installation silencieuse',
        selectBiosFolder: 'Sélectionner le dossier des fichiers BIOS',
        biosFolderNotSelected: 'Aucun dossier BIOS sélectionné',
        alertSelectBiosFolder: 'Veuillez sélectionner un dossier de fichiers BIOS',
        biosProgressText: '🔧 Préparation de la clé USB pour la mise à jour du BIOS...',
        biosSuccess: '✅ Clé USB préparée pour la mise à jour du BIOS avec succès',
        biosError: '❌ Échec de la préparation de la clé USB pour la mise à jour du BIOS',
        suggestionLinux: '🐧 Distribution Linux : ext4, GPT, mode DD recommandés',
        suggestionWin11: '🪟 Windows 11 : contournement TPM et compte local conseillés',
        suggestionWin10: '🪟 Windows 10/8 : NTFS, GPT, formatage rapide recommandés',
        suggestionBootable: '💿 Outil bootable : FAT32, MBR, mode DD recommandés',
        suggestionDefault: '💡 Type ISO inconnu. Paramètres par défaut.',
        healthCheckBtnText: '🩺 Vérifier',
        healthCheckProgress: '⏳ Vérification de l\'état...',
        healthCheckComplete: '✅ Vérification terminée',
        healthDisk: '📀 Disque :',
        healthSpeed: '⚡ Vitesse estimée :',
        healthInterface: '🔌 Interface :',
        healthStatus: '🩺 État :',
        healthCheckGood: '✅ Sain',
        healthCheckBad: '⚠️ Secteurs défectueux',
        noFileSelected: 'Aucun fichier sélectionné',
        fileBtnText: 'Choisir un fichier...',
        expectedHashPlaceholder: 'Valeur attendue',
        alertSelectIso: 'Veuillez sélectionner un fichier ISO ou activer le mode réparation ou la mise à jour du BIOS',
        alertSelectUsb: 'Veuillez sélectionner une clé USB',
        copyingFileText: '📋 Préparation du fichier...',
        alertCopyFailed: '❌ Échec de la préparation du fichier ISO. Vérifiez l\'espace disque temporaire.',
        aboutBtnText: 'À propos du développeur',
        about_title: 'À propos de l\'application',
        app_name: 'Nom de l\'application',
        version: 'Version',
        developer: 'Développeur',
        tech: 'Technologies',
        description: 'Description',
        app_description: 'Une application de bureau pour graver des systèmes d\'exploitation sur USB avec un design moderne et des fonctionnalités avancées.',
        rights: '© 2025 Tous droits réservés - Mohamed Haddan',
        downloadProgressText: 'Téléchargement de {version}...',
        downloadSuccess: '✅ Téléchargement terminé',
        burnProgressText: 'Gravure en cours...',
        scanProgressText: '🔍 Vérification des blocs défectueux...',
        scanDoneText: '✅ Vérification terminée : {bad} secteurs défectueux',
        scanNoneText: '✅ Aucun secteur défectueux',
        repairProgressText: '🔧 Réparation du lecteur...',
        repairSuccess: '✅ Lecteur réparé avec succès',
        repairError: '❌ Échec de la réparation',
        verifyProgressText: '🔎 Vérification des données...',
        verifySuccess: '✅ Données vérifiées avec succès',
        verifyError: '❌ Échec de la vérification',
        burnSuccess: '✅ Gravure terminée',
        burnError: '❌ Échec de la gravure'
    }
};

let currentLang = 'ar';
let lastHealthData = null;
let downloadState = { active: false, version: '' };
let burnState = { active: false };
let biosFolderPath = '';
let selectedIsoPath = '';
let selectedIsoName = '';
let burnStatusTextKey = ''; 

function t(key, replacements = {}) {
    let str = translations[currentLang][key] || key;
    for (const [k, v] of Object.entries(replacements)) {
        str = str.replace(`{${k}}`, v);
    }
    return str;
}


const isoFile = document.getElementById('isoFile');
const usbSelect = document.getElementById('usbSelect');
const burnBtn = document.getElementById('burnBtn');
const burnProgress = document.getElementById('burnProgress');
const burnProgressFill = document.getElementById('burnProgressFill');
const burnProgressText = document.getElementById('burnProgressText');
const burnStatus = document.getElementById('burnStatus');
const downloadWindowsBtn = document.getElementById('downloadWindowsBtn');
const downloadProgress = document.getElementById('downloadProgress');
const downloadProgressFill = document.getElementById('downloadProgressFill');
const downloadStatus = document.getElementById('downloadStatus');
const calcHashBtn = document.getElementById('calcHashBtn');
const expectedHash = document.getElementById('expectedHash');
const hashResult = document.getElementById('hashResult');
const fileBtn = document.getElementById('fileBtn');
const fileName = document.getElementById('fileName');
const healthCheckBtn = document.getElementById('healthCheckBtn');
const healthResult = document.getElementById('healthResult');
const refreshUsbBtn = document.getElementById('refreshUsbBtn');
const alertModal = document.getElementById('alertModal');
const alertMessage = document.getElementById('alertMessage');
const alertCloseBtn = document.getElementById('alertCloseBtn');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const aboutClose = document.getElementById('aboutClose');


function updateUITexts() {
    document.querySelector('h1').textContent = t('title');
    document.getElementById('subtitle').textContent = t('subtitle');
    document.getElementById('lblIso').textContent = t('lblIso');
    document.getElementById('lblDownloadWindows').textContent = t('lblDownloadWindows');
    document.getElementById('lblUsb').textContent = t('lblUsb');
    document.getElementById('lblFileSystem').textContent = t('lblFileSystem');
    document.getElementById('lblPartScheme').textContent = t('lblPartScheme');
    document.getElementById('lblAdvanced').textContent = t('lblAdvanced');
    document.getElementById('txtQuickFormat').textContent = t('txtQuickFormat');
    document.getElementById('txtBadBlocks').textContent = t('txtBadBlocks');
    document.getElementById('txtRepairMode').textContent = t('txtRepairMode');
    document.getElementById('txtVerify').textContent = t('txtVerify');
    document.getElementById('txtBypassTPM').textContent = t('txtBypassTPM');
    document.getElementById('txtWindowsToGo').textContent = t('txtWindowsToGo');
    document.getElementById('txtLocalAccount').textContent = t('txtLocalAccount');
    document.getElementById('lblHash').textContent = t('lblHash');
    document.getElementById('calcHashBtn').textContent = t('calcHash');
    document.getElementById('burnBtn').textContent = t('burn');
    document.getElementById('downloadWindowsBtn').textContent = t('download');
    document.getElementById('txtDDMode').textContent = t('txtDDMode');
    document.getElementById('txtBIOSUpdate').textContent = t('txtBIOSUpdate');
    document.getElementById('txtSilentInstall').textContent = t('txtSilentInstall');
    const usbSelect = document.getElementById('usbSelect');
    if (usbSelect && usbSelect.options[0]?.value === '') usbSelect.options[0].textContent = t('selectUsb');
    
    const healthCheckBtn = document.getElementById('healthCheckBtn');
    if (healthCheckBtn) healthCheckBtn.textContent = t('healthCheckBtnText');

    if (expectedHash) expectedHash.placeholder = t('expectedHashPlaceholder');
    if (fileBtn) fileBtn.textContent = t('fileBtnText');
    if (fileName && !selectedIsoName) fileName.textContent = t('noFileSelected');

    
    if (burnStatusTextKey && burnState.active) {
        burnStatus.textContent = t(burnStatusTextKey);
    }

    const aboutSpan = document.querySelector('.btn-about span');
    if (aboutSpan) aboutSpan.textContent = t('aboutBtnText');

    const aboutTitleEl = document.querySelector('[data-key="about_title"]');
    const appNameEl = document.querySelector('[data-key="app_name"]');
    const versionEl = document.querySelector('[data-key="version"]');
    const developerEl = document.querySelector('[data-key="developer"]');
    const techEl = document.querySelector('[data-key="tech"]');
    const descEl = document.querySelector('[data-key="description"]');
    const appDescEl = document.querySelector('[data-key="app_description"]');
    const rightsEl = document.querySelector('[data-key="rights"]');
    if (aboutTitleEl) aboutTitleEl.textContent = t('about_title');
    if (appNameEl) appNameEl.textContent = t('app_name');
    if (versionEl) versionEl.textContent = t('version');
    if (developerEl) developerEl.textContent = t('developer');
    if (techEl) techEl.textContent = t('tech');
    if (descEl) descEl.textContent = t('description');
    if (appDescEl) appDescEl.textContent = t('app_description');
    if (rightsEl) rightsEl.textContent = t('rights');

    if (downloadProgress && !downloadProgress.classList.contains('hidden')) {
        if (downloadState.active) downloadStatus.textContent = t('downloadProgressText').replace('{version}', downloadState.version);
        else downloadStatus.textContent = t('downloadSuccess');
    }

    if (suggestionBox && suggestionBox.style.display !== 'none') updateSuggestionText();
    if (lastHealthData) updateHealthResultDisplay();
}

function showModal(message) { alertMessage.textContent = message; alertModal.classList.add('show'); }


let suggestionBox = document.getElementById('suggestionBox');
if (!suggestionBox) {
    suggestionBox = document.createElement('div');
    suggestionBox.id = 'suggestionBox';
    suggestionBox.className = 'hidden';
    suggestionBox.style = 'background: rgba(0,160,255,0.15); border: 1px solid #00a0ff; border-radius: 8px; padding: 10px; margin-bottom: 15px; color: #ffcc00; font-size: 0.85rem; display: none;';
    const leftPanel = document.querySelector('.left-panel');
    const isoSection = document.querySelector('.left-panel .section:first-child');
    if (leftPanel && isoSection) leftPanel.insertBefore(suggestionBox, isoSection);
    else if (leftPanel) leftPanel.insertBefore(suggestionBox, leftPanel.firstChild);
}

function detectISOType(filename) {
    const name = filename.toLowerCase();
    if (name.includes('ubuntu') || name.includes('debian') || name.includes('fedora') || name.includes('kali') || name.includes('linux') || name.includes('arch')) {
        return { os: 'Linux', fs: 'ext4', part: 'GPT', dd: true, repair: false, tpm: false, winto: false, local: false };
    } else if (name.includes('win') || name.includes('windows')) {
        if (name.includes('11')) {
            return { os: 'Windows 11', fs: 'NTFS', part: 'GPT', dd: false, repair: false, tpm: true, winto: false, local: true };
        } else {
            return { os: 'Windows 10/8', fs: 'NTFS', part: 'MBR', dd: false, repair: false, tpm: false, winto: false, local: false };
        }
    } else if (name.includes('hiren') || name.includes('boot') || name.includes('rescue') || name.includes('gparted')) {
        return { os: 'Rescue Disk', fs: 'FAT32', part: 'MBR', dd: true, repair: false, tpm: false, winto: false, local: false };
    } else if (name.includes('bios') || name.includes('firmware')) {
        return { os: 'BIOS Update', fs: 'FAT32', part: 'MBR', dd: false, repair: false, tpm: false, winto: false, local: false };
    }
    return null;
}

function applySuggestion(suggestion) {
    if (!suggestion) {
        document.getElementById('fileSystem').value = 'NTFS';
        document.getElementById('partitionScheme').value = 'MBR';
        document.getElementById('ddMode').checked = false;
        document.getElementById('repairMode').checked = false;
        document.getElementById('bypassTPM').checked = false;
        document.getElementById('windowsToGo').checked = false;
        document.getElementById('localAccount').checked = false;
    } else {
        document.getElementById('fileSystem').value = suggestion.fs;
        document.getElementById('partitionScheme').value = suggestion.part;
        document.getElementById('ddMode').checked = suggestion.dd;
        document.getElementById('repairMode').checked = suggestion.repair;
        document.getElementById('bypassTPM').checked = suggestion.tpm;
        document.getElementById('windowsToGo').checked = suggestion.winto;
        document.getElementById('localAccount').checked = suggestion.local;
    }
}


document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); currentLang = btn.dataset.lang; updateUITexts();
    });
});


if (isoFile) isoFile.style.display = 'none';

fileBtn.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('select-iso-file');
    if (!result.canceled && result.filePath) {
        selectedIsoPath = result.filePath;
        selectedIsoName = path.basename(result.filePath);
        fileName.textContent = selectedIsoName;
        fileName.style.color = '#00ff88';
        const suggestion = detectISOType(selectedIsoName);
        applySuggestion(suggestion);
        suggestionBox.style.display = 'block';
        suggestionBox.textContent = getSuggestionText(suggestion);
    } else {
        if (!selectedIsoPath) {
            fileName.textContent = t('noFileSelected');
            fileName.style.color = '#a0b0d0';
        }
    }
});


const biosUpdateCheckbox = document.getElementById('biosUpdate');
biosUpdateCheckbox.addEventListener('change', async function() {
    if (this.checked) {
        const result = await ipcRenderer.invoke('select-bios-folder');
        if (result.canceled || !result.folderPath) {
            this.checked = false;
            biosFolderPath = '';
        } else {
            biosFolderPath = result.folderPath;
        }
    } else {
        biosFolderPath = '';
    }
});


async function listUSBDrives() {
    try {
        const cmd = `powershell -Command "Get-Disk | Where-Object BusType -eq USB | Select-Object Number, FriendlyName, Size, PartitionStyle | ConvertTo-Json"`;
        const stdout = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
        
        if (stdout && stdout.trim()) {
            let disks = JSON.parse(stdout);
            if (!Array.isArray(disks)) disks = [disks];
            
            usbSelect.innerHTML = `<option value="">${t('selectUsb')}</option>`;
            disks.forEach(disk => {
                if (disk) {
                    const num = disk.Number;
                    const name = disk.FriendlyName || 'USB Drive';
                    const size = disk.Size ? (disk.Size / (1024*1024*1024)).toFixed(1) + ' GB' : 'Unknown';
                    const option = document.createElement('option');
                    option.value = num;
                    option.textContent = `Disk ${num} - ${name} (${size})`;
                    usbSelect.appendChild(option);
                }
            });
        } else {
            usbSelect.innerHTML = `<option value="">${t('noUsb')}</option>`;
        }
    } catch (error) {
        console.error('Error listing USB drives:', error);
        usbSelect.innerHTML = `<option value="">${t('noUsb')}</option>`;
    }
}
listUSBDrives();
refreshUsbBtn.addEventListener('click', listUSBDrives);


downloadWindowsBtn.addEventListener('click', async () => {
    const version = document.getElementById('windowsVersion').value;
    const versionName = version === 'win11' ? 'Windows 11' : 'Windows 10';
    downloadState = { active: true, version: versionName };
    downloadProgress.classList.remove('hidden');
    downloadStatus.textContent = t('downloadProgressText').replace('{version}', versionName);
    const result = await ipcRenderer.invoke('download-windows', { version });
    downloadState.active = false;
    if (result.success) downloadStatus.textContent = t('downloadSuccess');
    else downloadStatus.textContent = 'فشل التحميل';
});


calcHashBtn.addEventListener('click', async () => {
    const filePath = selectedIsoPath;
    if (!filePath) return showModal(t('alertSelectIso'));
    hashResult.textContent = '⏳ جاري الحساب...';
    const result = await ipcRenderer.invoke('calculate-hash', { filePath, algorithm: 'MD5' });
    if (result.success) {
        hashResult.textContent = `MD5: ${result.hash}`;
        hashResult.style.color = expectedHash.value.trim() === result.hash ? '#00ff88' : '#ffaa00';
    } else hashResult.textContent = 'فشل الحساب';
});


function copyIsoToTempPs(filePath) {
    const tempDir = path.join(os.tmpdir(), 'flashforge_iso');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFileName = `flashforge_iso_${Date.now()}.iso`;
    const tempFilePath = path.join(tempDir, tempFileName);

    const longPath = `\\\\?\\` + path.resolve(filePath);
    const escapedSrc = longPath.replace(/'/g, "''");
    const escapedDst = tempFilePath.replace(/'/g, "''");

    try {
        const cmd = `powershell -Command "Copy-Item -LiteralPath '${escapedSrc}' -Destination '${escapedDst}'"`;
        execSync(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
        return tempFilePath;
    } catch (error) {
        console.error('Copy via PowerShell failed:', error.message);
        try {
            const simpleEscapedSrc = filePath.replace(/'/g, "''");
            const cmd2 = `powershell -Command "Copy-Item -LiteralPath '${simpleEscapedSrc}' -Destination '${escapedDst}'"`;
            execSync(cmd2, { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
            return tempFilePath;
        } catch (err2) {
            throw new Error(`فشل النسخ: ${error.message}`);
        }
    }
}


burnBtn.addEventListener('click', async () => {
    const repairModeChecked = document.getElementById('repairMode').checked;
    const biosUpdateChecked = document.getElementById('biosUpdate').checked;

    if (!selectedIsoPath && !repairModeChecked && !biosUpdateChecked) {
        return showModal(t('alertSelectIso'));
    }
    if (!usbSelect.value) return showModal(t('alertSelectUsb'));

    if (biosUpdateChecked && !biosFolderPath) {
        return showModal(t('alertSelectBiosFolder'));
    }

    let finalIsoPath = '';

    if (selectedIsoPath) {
        try {
            burnStatusTextKey = 'copyingFileText';
            burnStatus.textContent = t(burnStatusTextKey);
            burnProgress.classList.remove('hidden');
            burnProgressFill.style.width = '10%';
            burnProgressText.textContent = '10%';
            
            finalIsoPath = copyIsoToTempPs(selectedIsoPath);
            
            burnProgressFill.style.width = '100%';
            burnProgressText.textContent = '100%';
            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            console.error(err);
            showModal(t('alertCopyFailed'));
            burnProgress.classList.add('hidden');
            return;
        }
        burnProgress.classList.add('hidden');
    }

    const options = {
        isoPath: finalIsoPath || selectedIsoPath,
        diskNumber: parseInt(usbSelect.value),
        fileSystem: document.getElementById('fileSystem').value,
        partitionScheme: document.getElementById('partitionScheme').value,
        quickFormat: document.getElementById('quickFormat').checked,
        ddMode: document.getElementById('ddMode').checked,
        badBlocks: document.getElementById('badBlocks').checked,
        repairMode: repairModeChecked,
        verifyBurn: document.getElementById('verifyBurn').checked,
        bypassTPM: document.getElementById('bypassTPM').checked,
        localAccount: document.getElementById('localAccount').checked,
        windowsToGo: document.getElementById('windowsToGo').checked,
        biosUpdate: biosUpdateChecked,
        biosFolder: biosFolderPath,
        silentInstall: document.getElementById('silentInstall').checked
    };

    burnState.active = true;
    burnProgress.classList.remove('hidden');
    
    if (options.biosUpdate) {
        burnStatusTextKey = 'biosProgressText';
    } else if (options.badBlocks) {
        burnStatusTextKey = 'scanProgressText';
    } else if (options.repairMode && !options.isoPath) {
        burnStatusTextKey = 'repairProgressText';
    } else {
        burnStatusTextKey = 'burnProgressText';
    }
    burnStatus.textContent = t(burnStatusTextKey);

    ipcRenderer.on('burn-progress', (event, data) => {
        if (data.status === 'scanning') {
            burnProgressFill.style.width = `${data.percent}%`;
            burnProgressText.textContent = `${Math.round(data.percent)}%`;
            burnStatusTextKey = 'scanProgressText';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'scan_done') {
            burnProgressFill.style.width = '100%';
            burnProgressText.textContent = '100%';
            if (data.badSectors && data.badSectors > 0) {
                burnStatusTextKey = 'scanDoneText';
                burnStatus.textContent = t(burnStatusTextKey, { bad: data.badSectors });
            } else {
                burnStatusTextKey = 'scanNoneText';
                burnStatus.textContent = t(burnStatusTextKey);
            }
        } else if (data.status === 'repairing') {
            burnProgressFill.style.width = `${data.percent}%`;
            burnProgressText.textContent = `${Math.round(data.percent)}%`;
            burnStatusTextKey = 'repairProgressText';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'repair_done') {
            burnProgressFill.style.width = '100%';
            burnProgressText.textContent = '100%';
            burnStatusTextKey = 'repairSuccess';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'burning') {
            burnProgressFill.style.width = `${data.percent}%`;
            burnProgressText.textContent = `${Math.round(data.percent)}%`;
            burnStatusTextKey = 'burnProgressText';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'verifying') {
            burnProgressFill.style.width = `${data.percent}%`;
            burnProgressText.textContent = `${Math.round(data.percent)}%`;
            burnStatusTextKey = 'verifyProgressText';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'verify_done') {
            burnProgressFill.style.width = '100%';
            burnProgressText.textContent = '100%';
            burnStatusTextKey = 'verifySuccess';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'bios_preparing') {
            burnProgressFill.style.width = `${data.percent}%`;
            burnProgressText.textContent = `${Math.round(data.percent)}%`;
            burnStatusTextKey = 'biosProgressText';
            burnStatus.textContent = t(burnStatusTextKey);
        } else if (data.status === 'completed') {
            burnProgressFill.style.width = '100%';
            burnProgressText.textContent = '100%';
            if (options.biosUpdate) {
                burnStatusTextKey = 'biosSuccess';
            } else {
                burnStatusTextKey = 'burnSuccess';
            }
            burnStatus.textContent = t(burnStatusTextKey);
            burnState.active = false;
        } else if (data.status === 'error') {
            burnStatus.textContent = t('burnError') + ': ' + data.message;
            burnState.active = false;
        }
    });

    const result = await ipcRenderer.invoke('burn-iso', options);
    if (!result.success) {
        burnStatusTextKey = options.biosUpdate ? 'biosError' : 'burnError';
        burnStatus.textContent = t(burnStatusTextKey) + ': ' + result.error;
        burnState.active = false;
    }
});


healthCheckBtn.addEventListener('click', async () => {
    const selectedDisk = usbSelect.value;
    if (!selectedDisk) return showModal(t('alertSelectUsb'));
    healthResult.style.display = 'block';
    healthResult.style.color = '#00a0ff';
    healthResult.textContent = t('healthCheckProgress');
    
    const result = await ipcRenderer.invoke('check-usb-health', parseInt(selectedDisk));
    if (result.success) {
        lastHealthData = {
            diskName: result.healthData.FriendlyName,
            health: result.healthData.HealthStatus,
            speed: 'غير معروف',
            interface: result.healthData.BusType
        };
        updateHealthResultDisplay();
    } else {
        healthResult.style.color = '#ff4444';
        healthResult.textContent = '❌ فشل الفحص: ' + (result.error || 'خطأ غير معروف');
    }
});

function updateHealthResultDisplay() {
    if (!healthResult || !lastHealthData) return;
    const isGood = lastHealthData.health === 'Healthy' || lastHealthData.health === 'سليم';
    const color = isGood ? '#00ff88' : '#ffaa00';
    healthResult.style.color = color;
    healthResult.innerHTML = `
        ${t('healthCheckComplete')}<br>
        ${t('healthDisk')} ${lastHealthData.diskName}<br>
        ${t('healthInterface')} ${lastHealthData.interface}<br>
        ${t('healthStatus')} ${isGood ? t('healthCheckGood') : t('healthCheckBad')}
    `;
}


alertCloseBtn.addEventListener('click', () => alertModal.classList.remove('show'));
alertModal.addEventListener('click', (e) => { if (e.target === alertModal) alertModal.classList.remove('show'); });

aboutBtn.addEventListener('click', () => aboutModal.classList.add('show'));
aboutClose.addEventListener('click', () => aboutModal.classList.remove('show'));
aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.classList.remove('show'); });

document.querySelectorAll('.about-social a').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault(); const url = link.getAttribute('href');
        if (url && url !== '#') await ipcRenderer.invoke('open-external-link', url);
    });
});

const collapseBtn = document.getElementById('collapseBtn');
if (collapseBtn) {
    const rightPanelEl = document.getElementById('rightPanel');
    if (rightPanelEl) {
        collapseBtn.addEventListener('click', () => {
            rightPanelEl.classList.toggle('collapsed'); collapseBtn.classList.toggle('flip');
            collapseBtn.textContent = rightPanelEl.classList.contains('collapsed') ? '▶' : '◀';
        });
    }
}

function updateSuggestionText() {
    if (!suggestionBox) return;
    if (!selectedIsoName) { suggestionBox.style.display = 'none'; return; }
    const suggestion = detectISOType(selectedIsoName);
    if (!suggestion) suggestionBox.textContent = t('suggestionDefault');
    else suggestionBox.textContent = getSuggestionText(suggestion);
    suggestionBox.style.display = 'block';
}

function getSuggestionText(suggestion) {
    if (!suggestion) return '';
    switch (suggestion.os) {
        case 'Linux': return t('suggestionLinux');
        case 'Windows 11': return t('suggestionWin11');
        case 'Windows 10/8': return t('suggestionWin10');
        case 'Rescue Disk': case 'BIOS Update': return t('suggestionBootable');
        default: return t('suggestionDefault');
    }
}