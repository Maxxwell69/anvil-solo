; Custom NSIS installer script for Anvil Solo
; This runs during installation to configure DNS automatically

!macro customInstall
  ; Display message
  DetailPrint "Configuring DNS for optimal performance..."
  
  ; Get the active network interface
  nsExec::ExecToStack 'netsh interface show interface'
  Pop $0 ; Return value
  Pop $1 ; Output
  
  ; Set DNS to Google DNS (8.8.8.8, 8.8.4.4)
  ; Note: This requires administrator privileges (already requested by installer)
  
  DetailPrint "Setting primary DNS to Google DNS (8.8.8.8)..."
  nsExec::ExecToLog 'netsh interface ip set dns name="Wi-Fi" static 8.8.8.8'
  nsExec::ExecToLog 'netsh interface ip set dns name="Ethernet" static 8.8.8.8'
  nsExec::ExecToLog 'netsh interface ip set dns name="Local Area Connection" static 8.8.8.8'
  
  DetailPrint "Setting secondary DNS to Google DNS (8.8.4.4)..."
  nsExec::ExecToLog 'netsh interface ip add dns name="Wi-Fi" 8.8.4.4 index=2'
  nsExec::ExecToLog 'netsh interface ip add dns name="Ethernet" 8.8.4.4 index=2'
  nsExec::ExecToLog 'netsh interface ip add dns name="Local Area Connection" 8.8.4.4 index=2'
  
  ; Flush DNS cache
  DetailPrint "Flushing DNS cache..."
  nsExec::ExecToLog 'ipconfig /flushdns'
  
  DetailPrint "DNS configuration complete!"
  DetailPrint ""
  DetailPrint "Note: If DNS configuration failed, please run FIX-DNS-FOR-ANVIL.bat manually after installation."
!macroend

!macro customUnInstall
  ; Optionally restore DNS to automatic on uninstall
  ; DetailPrint "Restoring DNS to automatic..."
  ; nsExec::ExecToLog 'netsh interface ip set dns name="Wi-Fi" dhcp'
  ; nsExec::ExecToLog 'netsh interface ip set dns name="Ethernet" dhcp'
!macroend

