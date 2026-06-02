; Tauri's APP_ASSOCIATE registers the .bbcode ProgID under
; Software\Classes\<association name> with DefaultIcon = BBCode Editor.exe,0.
; Override that DefaultIcon to the shipped document icon, and remove it
; on uninstall. SHELL_CONTEXT is HKCU (per-user) or HKLM (per-machine),
; set by Tauri's installer and in scope inside these hooks.

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr SHELL_CONTEXT "Software\Classes\BBCode Document\DefaultIcon" "" "$INSTDIR\bbcode-document.ico"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey SHELL_CONTEXT "Software\Classes\BBCode Document\DefaultIcon"
!macroend
