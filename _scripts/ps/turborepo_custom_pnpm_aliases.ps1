# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                  Custom PNPM Aliases for the Focused-UX Monorepo                                   │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
# ======================================================================================================================
# ===============================================================================
#  Alias to Package Name Mapping
# ===============================================================================
$packageAliases = @{
    "tbc"    = "@focused-ux/terminal-butler-core";
    "tb"     = "fux-terminal-butler";
    "ccc"    = "@focused-ux/chrono-copy-core";
    "cc"     = "fux-chrono-copy";
    "ccpc"   = "@focused-ux/context-cherry-picker-core";
    "ccp"    = "fux-context-cherry-picker";
    "dconc"  = "@focused-ux/dynamicons-core";
    "dcon"   = "fux-dynamicons";
    "gwc"    = "@focused-ux/ghost-writer-core";
    "gw"     = "fux-ghost-writer";
    "nhc"    = "@focused-ux/notes-hub-core";
    "nh"     = "fux-notes-hub";

    "esb"    = "@focused-ux/config-esbuild";
    "esl"    = "@focused-ux/config-eslint";
    "serv"   = "@focused-ux/shared-services";
}






# ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
# │ Private Helper Function to Execute Shell Commands                                              │
# │                                                                                                │
# │ This centralizes the display and execution logic for both pnpm and turbo commands.             │
# └────────────────────────────────────────────────────────────────────────────────────────────────┘
function _Invoke-Process { #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Executable,

        [Parameter(Mandatory=$true)]
        [string[]]$PreArgs,

        [string[]]$PostArgs,

        [Parameter(Mandatory=$true)]
        [switch]$ShowCommandSwitch
    )

    # Step 1: Build the display string from the provided arguments
    if ($ShowCommandSwitch.IsPresent) {
        $displayString = "$Executable $($PreArgs -join ' ')"
        if ($PostArgs.Count -gt 0) { $displayString += " -- $($PostArgs -join ' ')" }
        Write-Host "$($PSStyle.Dim)-> $displayString$($PSStyle.Reset)"
    }

    # Step 2: Execute the command safely using splatting.
    # By avoiding piping to another cmdlet (like Where-Object), ANSI color codes are preserved.
    $OutputEncoding = [System.Text.Encoding]::UTF8
    if ($PostArgs.Count -gt 0) {
        & $Executable @PreArgs -- @PostArgs
    } else {
        & $Executable @PreArgs
    }
} #<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                      Main Public Function                                      │
# └────────────────────────────────────────────────────────────────────────────────────────────────┘
function Invoke-TurboCommand { #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Alias,

        # Added 'show' as a user-friendly alias to avoid conflict with the common -Debug parameter.
        [Parameter()]
        [Alias('show')]
        [switch]$ShowCommand,

        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )

    # The parameter binder now handles removing --show/--showcommand, so manual filtering is no longer needed.

    if ($CommandArgs.Count -eq 0) { Write-Host "Please provide a command for '$Alias'."; return }
    $packageName = $packageAliases[$Alias]

    # --- add/remove block ---
    if ($CommandArgs[0] -in 'add', 'remove') {
        if ($CommandArgs.Count -lt 2) { Write-Host "Please provide a package to $($CommandArgs[0])."; return }

        # Logic specific to add/remove
        $pnpmArgs = @(
            $CommandArgs[0],
            $CommandArgs[1..($CommandArgs.Count - 1)],
            "--filter=$packageName"
        )

        # Call the helper to display and execute
        _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmArgs -ShowCommandSwitch:$ShowCommand

    # --- run/exec block ---
    } elseif ($CommandArgs[0] -in 'run', 'exec') {
        $subCommand = $CommandArgs[0]
        $subCommandArgs = $CommandArgs[1..($CommandArgs.Count - 1)]
        if ($subCommandArgs.Count -eq 0) { Write-Host "Please provide a script/command to '$subCommand'."; return }

        # Logic specific to run/exec (parsing for '--')
        $taskOrExecName, $pnpmFlags, $taskArgs = $null, @(), @()
        foreach ($arg in $subCommandArgs) {
            if ($arg -match '^-') { $pnpmFlags += $arg }
            elseif ($taskOrExecName -eq $null) { $taskOrExecName = $arg }
            else { $taskArgs += $arg }
        }
        if ($taskOrExecName -eq $null) { Write-Host "No script/command name specified after '$subCommand'."; return }

        $pnpmPreArgs = @($subCommand, $taskOrExecName) + $pnpmFlags + "--filter=$packageName"
        $pnpmPostArgs = $taskArgs

        # Call the helper to display and execute
        _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmPreArgs -PostArgs $pnpmPostArgs -ShowCommandSwitch:$ShowCommand

    # --- turbo block ---
    } else {
        # This block handles all other commands by passing them to Turbo.
        $task, $turboFlags, $taskArgs = $null, @(), @()
        foreach ($arg in $CommandArgs) {
            if ($arg.StartsWith("--")) { $turboFlags += $arg }
            elseif ($task -eq $null) { $task = $arg }
            else { $taskArgs += $arg }
        }
        if ($task -eq $null) { Write-Host "No task specified (e.g., 'build', 'lint')."; return }
        if (-not ($turboFlags -like "--output-logs*")) { $turboFlags += "--output-logs=new-only" }

        $turboPreArgs = @('run', $task) + $turboFlags + "--filter=$packageName" + $taskArgs

        # Call the helper to display and execute
        _Invoke-Process -Executable 'turbo' -PreArgs $turboPreArgs -ShowCommandSwitch:$ShowCommand
    }
} #<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                    Root Package Management                                     │
# │       Functions to add/remove packages from the monorepo root with the -w flag.                │
# └────────────────────────────────────────────────────────────────────────────────────────────────┘
function _Invoke-PnpmRootPackageAction {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet('add', 'remove')]
        [string]$Action,

        [Parameter(Mandatory=$true)]
        [string]$PackageName,

        [string[]]$RemainingArgs,
        [switch]$ShowCommand
    )
    # Build the base argument list by combining the action, package name, and all other arguments.
    $pnpmArgs = @($Action, $PackageName) + $RemainingArgs

    # --workspace-root and --global are mutually exclusive. Check the fully constructed
    # argument list for a global flag before adding the workspace-root flag.
    if ('-g' -notin $pnpmArgs -and '--global' -notin $pnpmArgs) {
        $pnpmArgs += '--workspace-root'
    }

    _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmArgs -ShowCommandSwitch:$ShowCommand
}

function Add-PackageToRoot {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$PackageName,

        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$RemainingArgs,

        [Parameter()]
        [Alias('show')]
        [switch]$ShowCommand
    )
    # Call the private helper, passing along all arguments
    _Invoke-PnpmRootPackageAction -Action 'add' -PackageName $PackageName -RemainingArgs $RemainingArgs -ShowCommand:$ShowCommand
}

function Remove-PackageFromRoot {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$PackageName,

        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$RemainingArgs,

        [Parameter()]
        [Alias('show')]
        [switch]$ShowCommand
    )
    # Call the private helper, passing along all arguments
    _Invoke-PnpmRootPackageAction -Action 'remove' -PackageName $PackageName -RemainingArgs $RemainingArgs -ShowCommand:$ShowCommand
}


# ===============================================================================
# Dynamic & Static Alias Registration
# ===============================================================================

# --- Package-specific aliases ---
$packageAliases.GetEnumerator() | ForEach-Object { #>
    $aliasName = $_.Name
    $functionName = "Invoke-$($aliasName)Command"
    $description = "Turbo alias for $($_.Value)"

    # This template creates an intelligent wrapper function that explicitly handles
    # the --showcommand/--show switch to avoid parameter binding conflicts.
    $functionTemplate = @'
function {0} {{
    param(
        [Parameter()]
        [Alias('show')]
        [switch]$ShowCommand,

        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )
    # Explicitly pass the ShowCommand switch and splat the remaining arguments.
    Invoke-TurboCommand -Alias '{1}' -ShowCommand:$ShowCommand @CommandArgs
}}
'@
    $functionScript = $functionTemplate -f $functionName, $aliasName

    # Execute the string to define the function in the current scope
    Invoke-Expression -Command $functionScript

    # Set the alias to point to the newly created function
    Set-Alias -Name $aliasName -Value $functionName -Description $description
} #<

# --- Root package management aliases ---
Set-Alias -Name 'add' -Value 'Add-PackageToRoot' -Description 'Adds a package to the monorepo root (pnpm add -w) or globally (pnpm add -g)'
Set-Alias -Name 'remove' -Value 'Remove-PackageFromRoot' -Description 'Removes a package from the monorepo root (pnpm remove -w) or globally (pnpm remove -g)'
# You can also use 'rm' as a common alias for remove
Set-Alias -Name 'rm' -Value 'Remove-PackageFromRoot' -Description 'Alias for remove'


# ======================================================================================================================
Write-Host "$($PSStyle.Dim)✅ Custom PNPM Aliases for the Focused-UX.$($PSStyle.Reset)" ""