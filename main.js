const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { execFile, exec, execSync } = require('child_process');
const os = require('os');


const logFile = path.join(os.tmpdir(), 'flashforge_debug.log');
function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try { fs.appendFileSync(logFile, line); } catch(e) {}
    console.log(msg);
}
log('====== بدء تشغيل FlashForge ======');


function runPowerShellScript(scriptContent) {
    return new Promise((resolve, reject) => {
        const tmpFile = path.join(os.tmpdir(), `flashforge_${Date.now()}.ps1`);
        fs.writeFileSync(tmpFile, '\uFEFF' + scriptContent, 'utf16le');
        log(`تنفيذ سكريبت PowerShell من ملف مؤقت: ${tmpFile}`);
        execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpFile], {
            timeout: 60000,
            maxBuffer: 1024 * 1024
        }, (error, stdout, stderr) => {
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            if (error && !stdout) {
                log(`فشل سكريبت PowerShell: ${stderr || error.message}`);
                reject(new Error(stderr || error.message));
            } else {
                const out = stdout ? stdout.trim() : '';
                log(`مخرجات سكريبت PowerShell: ${out}`);
                resolve(out);
            }
        });
    });
}


function execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
        log(`تنفيذ أمر غير متزامن: ${command}`);
        exec(command, { ...options, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                const errMsg = stderr || error.message;
                log(`فشل الأمر: ${errMsg}`);
                reject(new Error(errMsg));
            } else {
                const out = stdout ? stdout.trim() : '';
                const errOut = stderr ? stderr.trim() : '';
                log(`مخرجات الأمر stdout: ${out}`);
                if (errOut) log(`stderr: ${errOut}`);
                resolve(out + (errOut ? '\n' + errOut : ''));
            }
        });
    });
}


async function getDiskSize(diskNumber) {
    try {
        const cmd = `powershell -Command "(Get-Disk -Number ${diskNumber}).Size"`;
        const stdout = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
        const size = parseInt(stdout.trim());
        log(`حجم القرص ${diskNumber}: ${size} بايت`);
        return isNaN(size) ? null : size;
    } catch (error) {
        log(`خطأ في الحصول على حجم القرص: ${error.message}`);
        return null;
    }
}


function generateAutoUnattendXML(options = {}) {
    const { bypassTPM = false, localAccount = false, silentInstall = false, username = 'User', password = '' } = options;
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
    <settings pass="windowsPE">
        <component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <UserData>
                <ProductKey>
                    <Key>VK7JG-NPHTM-C97JM-9MPGT-3V66T</Key>
                </ProductKey>
                <AcceptEula>true</AcceptEula>
            </UserData>
            <DiskConfiguration>
                <Disk wcm:action="add">
                    <CreatePartitions>
                        <CreatePartition wcm:action="add">
                            <Order>1</Order>
                            <Size>500</Size>
                            <Type>Primary</Type>
                        </CreatePartition>
                        <CreatePartition wcm:action="add">
                            <Order>2</Order>
                            <Extend>true</Extend>
                            <Type>Primary</Type>
                        </CreatePartition>
                    </CreatePartitions>
                    <ModifyPartitions>
                        <ModifyPartition wcm:action="add">
                            <Order>1</Order>
                            <PartitionID>1</PartitionID>
                            <Label>System</Label>
                            <Format>NTFS</Format>
                        </ModifyPartition>
                        <ModifyPartition wcm:action="add">
                            <Order>2</Order>
                            <PartitionID>2</PartitionID>
                            <Label>Windows</Label>
                            <Format>NTFS</Format>
                        </ModifyPartition>
                    </ModifyPartitions>
                    <DiskID>0</DiskID>
                    <WillWipeDisk>true</WillWipeDisk>
                </Disk>
                <WillShowUI>OnError</WillShowUI>
            </DiskConfiguration>
            <ImageInstall>
                <OSImage>
                    <InstallTo>
                        <DiskID>0</DiskID>
                        <PartitionID>2</PartitionID>
                    </InstallTo>
                </OSImage>
            </ImageInstall>
        </component>`;

    if (bypassTPM || silentInstall) {
        xml += `
        <component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <RunSynchronous>
                <RunSynchronousCommand wcm:action="add">
                    <Order>1</Order>
                    <Path>reg add HKLM\System\Setup\LabConfig /v BypassTPMCheck /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add">
                    <Order>2</Order>
                    <Path>reg add HKLM\System\Setup\LabConfig /v BypassSecureBootCheck /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add">
                    <Order>3</Order>
                    <Path>reg add HKLM\System\Setup\LabConfig /v BypassRAMCheck /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add">
                    <Order>4</Order>
                    <Path>reg add HKLM\System\Setup\LabConfig /v BypassCPUCheck /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
            </RunSynchronous>
        </component>`;
    }

    if (silentInstall) {
        xml += `
        <component name="Microsoft-Windows-International-Core-WinPE" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <SetupUILanguage>
                <UILanguage>en-US</UILanguage>
            </SetupUILanguage>
            <InputLocale>en-US</InputLocale>
            <SystemLocale>en-US</SystemLocale>
            <UILanguage>en-US</UILanguage>
            <UserLocale>en-US</UserLocale>
        </component>`;
    }

    xml += `
    </settings>
    <settings pass="oobeSystem">
        <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <OOBE>
                <HideEULAPage>true</HideEULAPage>
                <SkipMachineOOBE>true</SkipMachineOOBE>
                <SkipUserOOBE>true</SkipUserOOBE>
                <ProtectYourPC>1</ProtectYourPC>
            </OOBE>`;

    if (silentInstall) {
        xml += `
            <TimeZone>Pacific Standard Time</TimeZone>
            <RegisteredOrganization>FlashForge</RegisteredOrganization>
            <RegisteredOwner>User</RegisteredOwner>`;
    }

    if (localAccount || silentInstall) {
        xml += `
            <UserAccounts>
                <LocalAccounts>
                    <LocalAccount wcm:action="add">
                        <Name>${username}</Name>
                        <DisplayName>${username}</DisplayName>
                        <Password>
                            <Value>${password}</Value>
                            <PlainText>true</PlainText>
                        </Password>
                        <Group>Administrators</Group>
                    </LocalAccount>
                </LocalAccounts>
            </UserAccounts>`;
    }

    xml += `
        </component>
    </settings>
</unattend>`;
    return xml;
}


async function scanBadBlocks(diskNumber) {
    return new Promise((resolve) => {
        const script = `
$diskNumber = ${diskNumber}
$blockSize = 1MB
$drivePath = "\\\\.\\PhysicalDrive$diskNumber"

try {
    $stream = [System.IO.File]::Open($drivePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
    try {
        $total = $stream.Length
        $read = 0
        $bad = 0
        $buffer = New-Object byte[] $blockSize
        while ($read -lt $total) {
            try {
                $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
                if ($bytesRead -le 0) { break }
                $read += $bytesRead
                $percent = [Math]::Round(($read / $total) * 100, 0)
                Write-Output "SCANPROGRESS $percent"
            } catch {
                $bad++
                $stream.Position += $blockSize
                $read += $blockSize
                Write-Output "SCANBAD $read"
            }
        }
        Write-Output "SCANCOMPLETE $bad"
    } finally {
        $stream.Close()
    }
} catch {
    Write-Output "SCANERROR $($_.Exception.Message)"
}
        `;

        const child = exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`);
        let badCount = 0;
        let errorMsg = '';

        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.startsWith('SCANPROGRESS ')) {
                    const pct = parseInt(line.split(' ')[1]);
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('burn-progress', { percent: pct, status: 'scanning' });
                    }
                } else if (line.startsWith('SCANCOMPLETE ')) {
                    badCount = parseInt(line.split(' ')[1]);
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('burn-progress', { percent: 100, status: 'scan_done', badSectors: badCount });
                    }
                } else if (line.startsWith('SCANERROR ')) {
                    errorMsg = line.substring('SCANERROR '.length).trim();
                }
            });
        });

        child.on('close', (code) => {
            if (code === 0 && errorMsg === '') {
                resolve({ success: true, badSectors: badCount });
            } else {
                resolve({ success: false, error: errorMsg || `Scan exited with code ${code}` });
            }
        });
    });
}


async function repairDisk(diskNumber) {
    return new Promise(async (resolve) => {
        try {
            const driveLetter = execSync(
                `powershell -Command "(Get-Partition -DiskNumber ${diskNumber} | Select-Object -First 1).DriveLetter"`,
                { encoding: 'utf8', timeout: 5000 }
            ).trim();
            
            if (!driveLetter) {
                resolve({ success: false, error: 'قسم غير موجود' });
                return;
            }

            const child = exec(`chkdsk ${driveLetter}: /f`);
            
            child.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    const match = line.match(/(\d{1,3})\s*percent\s*completed/i);
                    if (match) {
                        const pct = parseInt(match[1]);
                        if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.send('burn-progress', { percent: pct, status: 'repairing' });
                            }
                        }
                    }
                });
            });

            child.stderr.on('data', (data) => {
                console.error('chkdsk stderr:', data.toString());
            });

            child.on('close', (code) => {
                if (code === 0 || code === 1) {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: `chkdsk exited with code ${code}` });
                }
            });
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    });
}


async function verifyAfterBurn(isoPath, diskNumber, ddMode) {
    if (ddMode) {
        let fullIsoPath;
        try {
            fullIsoPath = execSync(`powershell -Command "(Resolve-Path '${isoPath}').Path"`, { encoding: 'utf8' }).trim();
        } catch (e) {
            return { success: false, error: 'فشل تحديد مسار ISO للتحقق' };
        }

        return new Promise((resolve) => {
            const script = `
$ErrorActionPreference = 'Stop'
$isoPath = '${fullIsoPath}'
$diskNumber = ${diskNumber}
$blockSize = 1MB
$drivePath = "\\\\.\\PhysicalDrive$diskNumber"

try {
    $isoHash = (Get-FileHash -Path $isoPath -Algorithm SHA256).Hash
    $isoSize = (Get-Item $isoPath).Length

    $stream = [System.IO.File]::Open($drivePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        $read = 0
        $buffer = New-Object byte[] $blockSize
        while ($read -lt $isoSize) {
            $bytesRead = $stream.Read($buffer, 0, [Math]::Min([Int64]$buffer.Length, $isoSize - $read))
            if ($bytesRead -le 0) { break }
            $hasher.TransformBlock($buffer, 0, $bytesRead, $buffer, 0) | Out-Null
            $read += $bytesRead
            $percent = [Math]::Round(($read / $isoSize) * 100, 0)
            Write-Output "VERIFY_PROGRESS $percent"
        }
        $hasher.TransformFinalBlock($buffer, 0, 0) | Out-Null
        $usbHash = [BitConverter]::ToString($hasher.Hash).Replace('-','')
        if ($usbHash -eq $isoHash) {
            Write-Output "VERIFY_MATCH"
        } else {
            Write-Output "VERIFY_MISMATCH"
            Write-Output "ISO_HASH: $isoHash"
            Write-Output "USB_HASH: $usbHash"
        }
    } finally {
        $stream.Close()
        $hasher.Dispose()
    }
} catch {
    Write-Output "VERIFY_ERROR $($_.Exception.Message)"
}
            `;

            const tmpFile = path.join(os.tmpdir(), `flashforge_verify_${Date.now()}.ps1`);
            fs.writeFileSync(tmpFile, '\uFEFF' + script, 'utf16le');
            log(`تنفيذ سكريبت التحقق (DD) من ملف مؤقت: ${tmpFile}`);

            const child = execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpFile], {
                timeout: 300000,
                maxBuffer: 10 * 1024 * 1024
            });

            let result = { success: false, error: '' };
            child.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (line.startsWith('VERIFY_PROGRESS ')) {
                        const pct = parseInt(line.split(' ')[1]);
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('burn-progress', { percent: pct, status: 'verifying' });
                        }
                    } else if (line.includes('VERIFY_MATCH')) {
                        result.success = true;
                    } else if (line.includes('VERIFY_MISMATCH')) {
                        result.error = 'البيانات لا تتطابق';
                    } else if (line.startsWith('ISO_HASH: ')) {
                        result.error += '\nISO Hash: ' + line.substring(10);
                    } else if (line.startsWith('USB_HASH: ')) {
                        result.error += '\nUSB Hash: ' + line.substring(10);
                    } else if (line.startsWith('VERIFY_ERROR ')) {
                        result.error = line.substring('VERIFY_ERROR '.length).trim();
                    }
                });
            });

            child.stderr.on('data', (data) => {
                log(`stderr التحقق: ${data}`);
            });

            child.on('close', (code) => {
                try { fs.unlinkSync(tmpFile); } catch (e) {}
                if (!result.error && result.success) resolve({ success: true });
                else resolve({ success: false, error: result.error || `Verification failed with code ${code}` });
            });
        });
    } else {
        return new Promise((resolve) => {
            const script = `
$isoPath = '${isoPath.replace(/\\/g, '\\\\')}'
$diskNumber = ${diskNumber}

try {
    $partition = Get-Partition -DiskNumber $diskNumber | Select-Object -First 1
    $usbDrive = $partition.DriveLetter + ":"
    $isoMount = Mount-DiskImage -ImagePath $isoPath -PassThru
    $isoDrive = ($isoMount | Get-Volume).DriveLetter + ":"

    $files = Get-ChildItem -Path $isoDrive -Recurse -File
    $totalFiles = $files.Count
    $checked = 0
    $mismatch = $false

    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($isoDrive.Length)
        $usbFile = Join-Path $usbDrive $relativePath
        if (Test-Path $usbFile) {
            $isoHash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
            $usbHash = (Get-FileHash -Path $usbFile -Algorithm SHA256).Hash
            if ($isoHash -ne $usbHash) {
                $mismatch = $true
                break
            }
        } else {
            $mismatch = $true
            break
        }
        $checked++
        $percent = [Math]::Round(($checked / $totalFiles) * 100, 0)
        Write-Output "VERIFY_PROGRESS $percent"
    }
    Dismount-DiskImage -ImagePath $isoPath
    if (-not $mismatch) {
        Write-Output "VERIFY_MATCH"
    } else {
        Write-Output "VERIFY_MISMATCH"
    }
} catch {
    Write-Output "VERIFY_ERROR $($_.Exception.Message)"
}
            `;
            const child = exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`);
            let result = { success: false, error: '' };
            child.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (line.startsWith('VERIFY_PROGRESS ')) {
                        const pct = parseInt(line.split(' ')[1]);
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('burn-progress', { percent: pct, status: 'verifying' });
                        }
                    } else if (line.includes('VERIFY_MATCH')) {
                        result.success = true;
                    } else if (line.includes('VERIFY_MISMATCH')) {
                        result.error = 'Mismatch';
                    } else if (line.startsWith('VERIFY_ERROR ')) {
                        result.error = line.substring('VERIFY_ERROR '.length).trim();
                    }
                });
            });
            child.on('close', (code) => {
                if (!result.error && result.success) resolve({ success: true });
                else resolve({ success: false, error: result.error || `Verification failed with code ${code}` });
            });
        });
    }
}


function getFreeDOSFiles() {
    const commandCom = Buffer.from([
        0xE9, 0x3F, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const kernelSys = Buffer.from([
        0x4D, 0x5A, 0x80, 0x00, 0x01, 0x00, 0x00, 0x00, 0x04, 0x00, 0x10, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x40, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const fat32lba = Buffer.from([
        0xEB, 0x58, 0x90, 0x46, 0x52, 0x44, 0x4F, 0x53, 0x35, 0x2E, 0x30, 0x00,
        0x02, 0x40, 0x20, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0xF8, 0x00, 0x00
    ]);
    return { commandCom, kernelSys, fat32lba };
}


async function createBIOSUpdateUSB(diskNumber, biosFolder) {
    return new Promise(async (resolve, reject) => {
        try {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 5, status: 'bios_preparing' });
            }
            
            const formatScript = `
$disk = Get-Disk -Number ${diskNumber}
Clear-Disk -Number ${diskNumber} -RemoveData -Confirm:$false
Initialize-Disk -Number ${diskNumber} -PartitionStyle MBR
$partition = New-Partition -DiskNumber ${diskNumber} -UseMaximumSize -AssignDriveLetter -IsActive
Format-Volume -DriveLetter $partition.DriveLetter -FileSystem FAT32 -NewFileSystemLabel "BIOSUPDATE" -Confirm:$false
Write-Output "FORMAT_SUCCESS"
            `;
            await new Promise((res, rej) => {
                exec(`powershell -Command "${formatScript.replace(/"/g, '\\"')}"`, (error) => {
                    if (error) rej(error);
                    else res();
                });
            });

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 10, status: 'bios_preparing' });
            }

            const driveLetter = execSync(`powershell -Command "(Get-Partition -DiskNumber ${diskNumber} | Select-Object -First 1).DriveLetter"`, { encoding: 'utf8' }).trim();
            if (!driveLetter) {
                reject(new Error('تعذر الحصول على حرف محرك USB'));
                return;
            }
            const usbRoot = `${driveLetter}:\\`;

            const freedos = getFreeDOSFiles();
            const tmpDir = path.join(os.tmpdir(), 'flashforge_freedos');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            
            const commandPath = path.join(tmpDir, 'COMMAND.COM');
            const kernelPath = path.join(tmpDir, 'KERNEL.SYS');
            const bootPath = path.join(tmpDir, 'freedos_boot.bin');
            
            fs.writeFileSync(commandPath, freedos.commandCom);
            fs.writeFileSync(kernelPath, freedos.kernelSys);
            fs.writeFileSync(bootPath, freedos.fat32lba);

            const drivePath = `\\\\.\\${driveLetter}:`;
            const writeBootScript = `
$drivePath = '${drivePath}'
$bootSector = [System.IO.File]::ReadAllBytes('${bootPath.replace(/\\/g, '\\\\')}')
$stream = [System.IO.File]::Open($drivePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::Write)
try {
    $stream.Write($bootSector, 0, $bootSector.Length)
    Write-Output 'BOOT_WRITTEN'
} finally {
    $stream.Close()
}
            `;
            await new Promise((res, rej) => {
                exec(`powershell -Command "${writeBootScript.replace(/"/g, '\\"')}"`, (error) => {
                    if (error) rej(error);
                    else res();
                });
            });

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 20, status: 'bios_preparing' });
            }

            fs.copyFileSync(commandPath, path.join(usbRoot, 'COMMAND.COM'));
            fs.copyFileSync(kernelPath, path.join(usbRoot, 'KERNEL.SYS'));

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 30, status: 'bios_preparing' });
            }

            const copyScript = `robocopy "${biosFolder}" "${usbRoot}" /E /NFL /NDL /NJH /NJS /nc /ns /np`;
            const child = exec(copyScript);
            
            child.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    const match = line.match(/(\d{1,3}(?:\.\d)?)%/);
                    if (match) {
                        const pct = parseFloat(match[1]);
                        if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                            const mappedPct = 30 + Math.round((pct / 100) * 70);
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.send('burn-progress', { percent: Math.min(mappedPct, 100), status: 'bios_preparing' });
                            }
                        }
                    }
                });
            });

            child.stderr.on('data', (data) => {
                console.error('BIOS copy stderr:', data.toString());
            });

            await new Promise((res, rej) => {
                child.on('close', (code) => {
                    if (code <= 1) res();
                    else rej(new Error(`robocopy failed with code ${code}`));
                });
            });

            try {
                fs.unlinkSync(commandPath);
                fs.unlinkSync(kernelPath);
                fs.unlinkSync(bootPath);
                fs.rmdirSync(tmpDir);
            } catch (e) {}

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 100, status: 'bios_preparing' });
            }
            resolve({ success: true });
        } catch (error) {
            reject(error);
        }
    });
}


async function copyFolderRecursive(source, dest) {
    log(`بدء النسخ من "${source}" إلى "${dest}"`);
    try {
        const files = await fsp.readdir(source, { withFileTypes: true });
        log(`عدد العناصر في المجلد المصدر: ${files.length}`);
        let copied = 0;
        let total = files.length;

        for (const file of files) {
            const srcPath = path.join(source, file.name);
            const destPath = path.join(dest, file.name);
            if (file.isDirectory()) {
                await fsp.mkdir(destPath, { recursive: true });
                const subResult = await copyFolderRecursive(srcPath, destPath);
                copied += subResult.copied;
                total += subResult.total - 1;
            } else {
                await fsp.copyFile(srcPath, destPath);
                copied++;
            }
            const percent = total > 0 ? Math.round((copied / total) * 100) : 0;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent, status: 'burning' });
            }
        }
        log(`اكتمل النسخ - عدد الملفات المنسوخة: ${copied}`);
        return { copied, total };
    } catch (error) {
        log(`فشل النسخ: ${error.message}`);
        throw error;
    }
}


function isElevated() {
    try { execSync('net session', { stdio: 'ignore' }); return true; }
    catch (e) { return false; }
}
function elevate() {
    const exePath = app.getPath('exe');
    const args = process.argv.slice(1);
    exec(`powershell -Command "Start-Process '${exePath}' -ArgumentList '${args.join(' ')}' -Verb RunAs"`);
    app.quit();
}
if (!isElevated()) { elevate(); return; }

let mainWindow;
let downloadPath = app.getPath('downloads');
const isPackaged = app.isPackaged;

function getResourcePath(filename) {
    return isPackaged ? path.join(process.resourcesPath, filename) : path.join(__dirname, filename);
}

function createSplash() {
    let splashWindow = new BrowserWindow({
        width: 500, height: 350,
        frame: false, transparent: true,
        alwaysOnTop: true, resizable: false,
        skipTaskbar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    splashWindow.loadFile('splash.html');
    splashWindow.center();
    return splashWindow;
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 950, height: 700, resizable: false,
        title: 'FlashForge', backgroundColor: '#1a1a2e',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        show: false
    });
    mainWindow.loadFile('index.html');
    mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
    const splash = createSplash();
    setTimeout(() => {
        createMainWindow();
        if (splash && !splash.isDestroyed()) splash.close();
    }, 4000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


ipcMain.handle('select-download-dir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], title: 'اختر مجلد الحفظ'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        downloadPath = result.filePaths[0];
        return downloadPath;
    }
    return downloadPath;
});

ipcMain.handle('select-bios-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'اختر مجلد ملفات BIOS'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return { canceled: false, folderPath: result.filePaths[0] };
    }
    return { canceled: true, folderPath: '' };
});

ipcMain.handle('select-iso-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        title: 'اختر ملف ISO',
        filters: [{ name: 'ISO Files', extensions: ['iso', 'img'] }]
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return { canceled: false, filePath: result.filePaths[0] };
    }
    return { canceled: true, filePath: '' };
});

ipcMain.handle('open-external-link', async (event, url) => {
    await shell.openExternal(url);
});

ipcMain.handle('get-thumbnail', async (event, url) => {
    try {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return { success: true, thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` };
        const tkMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        if (tkMatch) {
            const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
            return new Promise(resolve => {
                const request = net.request(oembedUrl);
                request.on('response', (response) => {
                    let data = ''; response.on('data', (chunk) => { data += chunk; });
                    response.on('end', () => {
                        try { resolve({ success: true, thumbnail: JSON.parse(data).thumbnail_url }); }
                        catch (e) { resolve({ success: true, thumbnail: null }); }
                    });
                });
                request.end();
            });
        }
        const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
        if (igMatch) {
            const ytdlpPath = getResourcePath('yt-dlp.exe');
            return new Promise(resolve => {
                execFile(ytdlpPath, ['--get-thumbnail', url], { timeout: 10000 }, (err, stdout) => {
                    if (!err && stdout.trim()) resolve({ success: true, thumbnail: stdout.trim() });
                    else resolve({ success: true, thumbnail: null });
                });
            });
        }
        return { success: true, thumbnail: null };
    } catch (e) { return { success: true, thumbnail: null }; }
});


ipcMain.handle('burn-iso', async (event, { isoPath, diskNumber, fileSystem, partitionScheme, quickFormat, ddMode, badBlocks, repairMode, verifyBurn, bypassTPM, localAccount, windowsToGo, biosUpdate, biosFolder, silentInstall }) => {
    try {
        log(`بدء عملية الحرق - المسار: ${isoPath} - القرص: ${diskNumber}`);
        const isoCleanPath = isoPath;

       
        if (biosUpdate) {
            log('تجهيز USB لتحديث BIOS...');
            if (!biosFolder || !fs.existsSync(biosFolder)) {
                return { success: false, error: 'الرجاء اختيار مجلد ملفات BIOS' };
            }
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 0, status: 'bios_preparing' });
            }
            const biosResult = await createBIOSUpdateUSB(diskNumber, biosFolder);
            if (!biosResult.success) {
                return { success: false, error: biosResult.error || 'فشل تجهيز USB لتحديث BIOS' };
            }
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 100, status: 'completed' });
            }
            return { success: true };
        }

        
        if (repairMode) {
            log('بدء وضع الإصلاح...');
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'repairing' });
            const repairResult = await repairDisk(diskNumber);
            if (!repairResult.success) {
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'error', message: `فشل الإصلاح: ${repairResult.error}` });
                return { success: false, error: repairResult.error };
            }
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 100, status: 'repair_done' });
            if (!isoPath || !fs.existsSync(isoPath)) return { success: true, repaired: true };
            await new Promise(r => setTimeout(r, 2000));
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'burning' });
        }

        
        if (badBlocks) {
            log('بدء فحص القطاعات التالبة...');
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'scanning' });
            const scanResult = await scanBadBlocks(diskNumber);
            if (!scanResult.success) {
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'error', message: `فشل فحص القطاعات: ${scanResult.error}` });
                return { success: false, error: scanResult.error };
            }
            if (scanResult.badSectors > 0) {
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 100, status: 'scan_done', badSectors: scanResult.badSectors });
                await new Promise(r => setTimeout(r, 3000));
            }
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'burning' });
        }

        if (!isoPath || !fs.existsSync(isoPath)) {
            log('ملف ISO غير موجود.');
            return { success: false, error: 'لم يتم اختيار ملف ISO' };
        }

        
        const isoStat = fs.statSync(isoPath);
        const isoSize = isoStat.size;
        log(`حجم ISO: ${isoSize} بايت`);

        const diskSize = await getDiskSize(diskNumber);
        if (diskSize === null) {
            return { success: false, error: 'تعذر الحصول على حجم القرص. تأكد من توصيله بشكل صحيح.' };
        }

        let requiredSpace = isoSize;
        if (windowsToGo) {
            requiredSpace = isoSize + 1.2 * 1024 * 1024 * 1024;
            if (diskSize < 32 * 1024 * 1024 * 1024) {
                return {
                    success: false,
                    error: `Windows To Go يحتاج USB بسعة 32 جيجابايت على الأقل. حجم USB الحالي: ${(diskSize / (1024**3)).toFixed(1)} جيجابايت.`
                };
            }
        } else if (!ddMode) {
            requiredSpace = isoSize + 500 * 1024 * 1024;
        }

        if (diskSize < requiredSpace) {
            const sizeIsoGB = (isoSize / (1024**3)).toFixed(2);
            const sizeDiskGB = (diskSize / (1024**3)).toFixed(2);
            return {
                success: false,
                error: `حجم USB غير كافٍ. حجم ISO: ${sizeIsoGB} جيجابايت. حجم USB: ${sizeDiskGB} جيجابايت.`
            };
        }

        
        let unattendXML = '';
        if (bypassTPM || localAccount || silentInstall) {
            unattendXML = generateAutoUnattendXML({ bypassTPM, localAccount, silentInstall, username: 'User', password: '1234' });
        }

        
        if (ddMode) {
            
            log('بدء وضع DD (CopyTo)...');

            
            try {
                await execAsync(`powershell -Command "Clear-Disk -Number ${diskNumber} -RemoveData -Confirm:$false"`);
                log('تم مسح القرص بنجاح');
            } catch (e) {
                return { success: false, error: 'فشل مسح القرص قبل الحرق: ' + e.message };
            }

            
            await new Promise(r => setTimeout(r, 2000));

            
            let fullIsoPath;
            try {
                fullIsoPath = execSync(`powershell -Command "(Resolve-Path '${isoCleanPath}').Path"`, { encoding: 'utf8' }).trim();
                log(`المسار الكامل لـ ISO: ${fullIsoPath}`);
            } catch (e) {
                return { success: false, error: 'فشل تحديد مسار ISO' };
            }

            
            const tmpPsFile = path.join(os.tmpdir(), `flashforge_dd_${Date.now()}.ps1`);
            const psScript = `
$ErrorActionPreference = 'Stop'
$isoPath = '${fullIsoPath}'
$diskNumber = ${diskNumber}
$blockSize = 1MB
$drivePath = '\\.\PhysicalDrive' + $diskNumber

try {
    $isoStream = [System.IO.File]::OpenRead($isoPath)
    $driveStream = [System.IO.File]::Open($drivePath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::Write)
    try {
        $total = $isoStream.Length
        $isoStream.CopyTo($driveStream)
        $driveStream.Flush()
        Write-Output "BYTES_WRITTEN: $total"
        Write-Output "SUCCESS"
    } finally {
        $isoStream.Close()
        $driveStream.Close()
    }
} catch {
    Write-Output "ERROR $($_.Exception.Message)"
}
            `;
            fs.writeFileSync(tmpPsFile, '\uFEFF' + psScript, 'utf16le');
            log(`ملف PowerShell المؤقت (UTF-16 LE): ${tmpPsFile}`);

            
            let ddOutput;
            try {
                ddOutput = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPsFile}"`);
            } catch (err) {
                log(`فشل وضع DD: ${err.message}`);
                try { fs.unlinkSync(tmpPsFile); } catch (e) {}
                return { success: false, error: err.message };
            }

            log(`مخرجات DD: ${ddOutput}`);
            try { fs.unlinkSync(tmpPsFile); } catch (e) {}

            
            const bytesMatch = ddOutput.match(/BYTES_WRITTEN:\s*(\d+)/);
            if (bytesMatch) {
                const written = parseInt(bytesMatch[1]);
                log(`عدد البايتات المكتوبة: ${written}`);
                if (written === 0) {
                    return { success: false, error: 'لم تتم كتابة أي بيانات إلى USB.' };
                }
                if (written !== isoSize) {
                    return { success: false, error: `عدد البايتات المكتوبة (${written}) لا يتطابق مع حجم ISO (${isoSize}).` };
                }
            } else {
                return { success: false, error: 'لم يتم العثور على عدد البايتات المكتوبة في مخرجات DD.' };
            }

            if (ddOutput.includes('ERROR ')) {
                const errLine = ddOutput.split('\n').find(l => l.startsWith('ERROR '));
                const errMsg = errLine ? errLine.substring(6).trim() : 'Unknown DD error';
                return { success: false, error: errMsg };
            }

            if (!ddOutput.includes('SUCCESS')) {
                return { success: false, error: 'DD process did not complete successfully.' };
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 100, status: 'burning' });
            }
        } else {
            
            const prepareScript = `
$ErrorActionPreference = 'Stop'
try {
    $disk = Get-Disk -Number ${diskNumber}
    $currentStyle = $disk.PartitionStyle
    Get-Partition -DiskNumber ${diskNumber} -ErrorAction SilentlyContinue | Remove-Partition -Confirm:$false
    if ($currentStyle -eq 'RAW') {
        Initialize-Disk -Number ${diskNumber} -PartitionStyle ${partitionScheme}
    } else {
        if ($currentStyle -ne '${partitionScheme}') {
            Set-Disk -Number ${diskNumber} -PartitionStyle ${partitionScheme}
        }
    }
    $partition = New-Partition -DiskNumber ${diskNumber} -UseMaximumSize -AssignDriveLetter
    $dest = $partition.DriveLetter
    Format-Volume -DriveLetter $dest -FileSystem ${fileSystem} -NewFileSystemLabel "FlashForge" -Confirm:$false ${quickFormat ? '' : '-Full'}
    Write-Output "USB_DRIVE_LETTER: $dest"

    $isoPath = (Resolve-Path '${isoCleanPath}').Path
    $isoMount = Mount-DiskImage -ImagePath $isoPath -PassThru -ErrorAction Stop
    $isoDrive = ($isoMount | Get-Volume).DriveLetter
    Write-Output "ISO_DRIVE_LETTER: $isoDrive"
    Write-Output "PREPARE_SUCCESS"
} catch {
    Write-Output "ERROR $($_.Exception.Message)"
}
            `;

            log('تنفيذ سكريبت التحضير...');
            const prepareOutput = await runPowerShellScript(prepareScript);
            log(`مخرجات التحضير: ${prepareOutput}`);

            if (prepareOutput.includes('ERROR ')) {
                const errLine = prepareOutput.split('\n').find(l => l.startsWith('ERROR '));
                const errMsg = errLine ? errLine.substring(6).trim() : 'Unknown error';
                return { success: false, error: errMsg };
            }

            const usbMatch = prepareOutput.match(/USB_DRIVE_LETTER:\s*([A-Za-z])/);
            const isoMatch = prepareOutput.match(/ISO_DRIVE_LETTER:\s*([A-Za-z])/);
            if (!usbMatch || !isoMatch) {
                return { success: false, error: `تعذر تحديد أحرف محركات الأقراص. المخرجات:\n${prepareOutput}` };
            }

            const sourceRoot = `${isoMatch[1]}:\\`;
            const destRoot = `${usbMatch[1]}:\\`;
            log(`بدء النسخ من ${sourceRoot} إلى ${destRoot} باستخدام Node.js`);

            try {
                const result = await copyFolderRecursive(sourceRoot, destRoot);
                log(`نتيجة النسخ: ${JSON.stringify(result)}`);
                
                const destCheck = await fsp.readdir(destRoot);
                if (destCheck.length === 0) {
                    throw new Error("USB appears empty after copy. The ISO may use an incompatible filesystem. Please use DD mode for this ISO.");
                }
            } catch (copyErr) {
                log(`فشل النسخ: ${copyErr.message}`);
                try { execSync(`powershell -Command "Dismount-DiskImage -ImagePath '${isoCleanPath}'"`); } catch (e) {}
                return { success: false, error: copyErr.message };
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('burn-progress', { percent: 100, status: 'burning' });
            }

            try {
                execSync(`powershell -Command "Dismount-DiskImage -ImagePath '${isoCleanPath}'"`);
            } catch (e) {
                log(`تحذير: لم يتم فك تحميل ISO: ${e.message}`);
            }

            if (unattendXML) {
                try {
                    fs.writeFileSync(`${destRoot}autounattend.xml`, unattendXML, 'utf8');
                } catch (e) {
                    log(`فشل كتابة autounattend.xml: ${e.message}`);
                }
            }
        }

        
        if (verifyBurn) {
            log('بدء التحقق بعد الحرق...');
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'verifying' });
            const verifyResult = await verifyAfterBurn(isoPath, diskNumber, ddMode);
            if (!verifyResult.success) {
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 0, status: 'error', message: `فشل التحقق: ${verifyResult.error}` });
                return { success: false, error: verifyResult.error };
            }
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 100, status: 'verify_done' });
        }

        log('تمت عملية الحرق بنجاح');
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('burn-progress', { percent: 100, status: 'completed' });
        return { success: true };
    } catch (error) {
        log(`فشل الحرق: ${error.message}`);
        return { success: false, error: error.message };
    }
});


ipcMain.handle('download-windows', async (event, { version }) => {
    const url = version === 'win11' 
        ? 'https://www.microsoft.com/software-download/windows11'
        : 'https://www.microsoft.com/software-download/windows10';
    shell.openExternal(url);
    return { success: true };
});


ipcMain.handle('check-usb-health', async (event, diskNumber) => {
    try {
        const script = `
$diskNumber = ${diskNumber}
$output = @{ status = "error"; errorMessage = "Unknown error" }
try {
    $disk = Get-Disk -Number $diskNumber -ErrorAction Stop
    $physical = Get-PhysicalDisk | Where-Object { $_.SerialNumber -eq $disk.SerialNumber } -ErrorAction SilentlyContinue
    if (-not $physical) {
        $physical = Get-WmiObject -Class Win32_DiskDrive | Where-Object { $_.Index -eq $diskNumber }
    }
    if ($physical) {
        $output.status = "ok"
        $output.healthData = @{
            FriendlyName = $physical.FriendlyName
            HealthStatus = if ($physical.HealthStatus) { $physical.HealthStatus } else { $physical.Status }
            BusType = if ($physical.BusType) { $physical.BusType } else { $physical.InterfaceType }
            Size = $physical.Size
            MediaType = $physical.MediaType
        }
    } else {
        $output.status = "ok"
        $output.healthData = @{
            FriendlyName = $disk.FriendlyName
            HealthStatus = "غير متوفر"
            BusType = $disk.BusType
            Size = $disk.Size
            MediaType = "غير معروف"
        }
    }
} catch {
    $output.errorMessage = $_.Exception.Message
}
$output | ConvertTo-Json -Compress
        `;
        const stdout = await runPowerShellScript(script);
        if (!stdout) return { success: false, error: 'لم يتم إرجاع أي بيانات من PowerShell' };
        const result = JSON.parse(stdout);
        if (result.status === "ok") return { success: true, healthData: result.healthData };
        else return { success: false, error: result.errorMessage || 'خطأ غير معروف' };
    } catch (error) {
        return { success: false, error: error.message || 'حدث خطأ غير متوقع' };
    }
});


ipcMain.handle('calculate-hash', async (event, { filePath, algorithm }) => {
    try {
        const script = `powershell -Command "Get-FileHash -Path '${filePath}' -Algorithm ${algorithm} | Select-Object -ExpandProperty Hash"`;
        const stdout = execSync(script, { encoding: 'utf8' });
        return { success: true, hash: stdout.trim() };
    } catch (error) {
        return { success: false, error: error.message };
    }
});