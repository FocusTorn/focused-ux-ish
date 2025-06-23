# . $PSScriptRoot/../../Microsoft.PowerShell_profile.ps1

# ======================================================================================================================
#  Focused UX :: Project-Specific PowerShell Profile
#  This script is automatically loaded by the VS Code integrated terminal for this workspace.
# ======================================================================================================================

# ┌────────────────────────────────────────────────────────────────────────────┐
# │                            VS CODE INTEGRATION                             │
# └────────────────────────────────────────────────────────────────────────────┘
# This block is critical. It finds the active VS Code installation and sources its
# shell integration script. This allows tasks and debugging to function correctly.
# try {
#     $vscodeAppPath = (Get-Process -Name "Code", "Code - Insiders" -ErrorAction SilentlyContinue | Select-Object -First 1).Path
#     if ($vscodeAppPath) {
#         $vscodeDir = Split-Path $vscodeAppPath -Parent
#         $integrationScript = Join-Path $vscodeDir "resources/app/out/vs/workbench/contrib/terminal/common/scripts/shellIntegration.ps1"
#         Write-Host $integrationScript
#         if (Test-Path $integrationScript) {
#             . $integrationScript
#         }
#     }
# } catch {
#     # Silently fail if the script can't be found or loaded.
# }

# ┌────────────────────────────────────────────────────────────────────────────┐
# │                                DOT-SOURCES                                 │
# └────────────────────────────────────────────────────────────────────────────┘
. "./../_scripts/ps/custom_pnpm_aliases.ps1"






# ┌────────────────────────────────────────────────────────────────────────────┐
# │                                   ALIAS                                    │
# └────────────────────────────────────────────────────────────────────────────┘
# Example: A shortcut to run tests in this project
# Set-Alias -Name tt -Value "pnpm test"


# ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
# └───────────────────────────────────────────────────────────────────────────────────────────────────┘

if ([Environment]::GetCommandLineArgs().Contains('-NonInteractive')) {
  $Global:InteractiveMode = $false
} else {
  $Global:InteractiveMode = $true
}

# gci env: | Where-Object Name -like '*VSCODE*'


    Write-Host -ForegroundColor Cyan "✅ Focused UX project profile loaded."