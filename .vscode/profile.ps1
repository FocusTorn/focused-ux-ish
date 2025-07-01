# . $PSScriptRoot/../../Microsoft.PowerShell_profile.ps1

# ======================================================================================================================
#  Focused UX :: Project-Specific PowerShell Profile
#  This script is automatically loaded by the VS Code integrated terminal for this workspace.
# ======================================================================================================================

# ┌────────────────────────────────────────────────────────────────────────────┐
# │                                DOT-SOURCES                                 │
# └────────────────────────────────────────────────────────────────────────────┘
. "./../_scripts/ps/custom_pnpm_aliases.ps1"




function prompt {
    $ProjectRoot = "D:\_dev\!Projects\focused-ux\focused-ux\"

    # ANSI COLOR CODES
    $ESC = [char]27
    $b="$ESC[38;5;"
    
    $Cyan = $PSStyle.ForegroundColor.Cyan
    $Reset = $PSStyle.Reset
    
    $Cyan2 = "${b}45m"
    $Reset2 = "$ESC[0m"

    $CurrentPath = $PWD.Path # Get the current working directory

    $NormalizedProjectRoot = $ProjectRoot.TrimEnd('\')
    $NormalizedCurrentPath = $CurrentPath.TrimEnd('\')
    
    Set-PSReadLineOption -Colors @{ Command = $PSStyle.Reset }

    if ($NormalizedCurrentPath -eq $NormalizedProjectRoot -or $NormalizedCurrentPath.StartsWith($NormalizedProjectRoot + "\")) {
        $RelativePath = if ($NormalizedCurrentPath -eq $NormalizedProjectRoot) { "" } else { $NormalizedCurrentPath.Substring($NormalizedProjectRoot.Length + 1) }
        $pathSegment = if ($RelativePath -eq "") { "" } else { " $RelativePath" }
        return "${Cyan2}f-ux${pathSegment} />${Reset2} "
    }
    else {
        $Host.UI.RawUI.WindowTitle = $CurrentPath
        return "PS $CurrentPath />${Reset} "
    }
}


try {
    $vscodeAppPath = (Get-Process -Name "Code", "Code - Insiders" -ErrorAction SilentlyContinue | Select-Object -First 1).Path
    if ($vscodeAppPath) {
        $vscodeDir = Split-Path $vscodeAppPath -Parent
        $integrationScript = Join-Path $vscodeDir "resources/app/out/vs/workbench/contrib/terminal/common/scripts/shellIntegration.ps1"
        if (Test-Path $integrationScript) {
            . $integrationScript
        }
    }
} catch {}






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


    # Write-Host -ForegroundColor Cyan "✅ Focused UX project profile loaded."