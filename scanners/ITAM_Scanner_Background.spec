# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['itam_scanner_background.py'],
    pathex=[],
    binaries=[],
    datas=[('hardware.py', '.'), ('software.py', '.'), ('telemetry.py', '.'), ('utils.py', '.'), ('patch.py', '.'), ('wi-blu.py', '.'), ('latest_version.py', '.'), ('compatibility_test.py', '.'), ('test_mac.py', '.'), ('generate_test_data.py', '.')],
    hiddenimports=['schedule', 'requests', 'psutil', 'GPUtil'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ITAM_Scanner_Background',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
