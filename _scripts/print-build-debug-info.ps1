# ./scripts/print-build-debug-info.ps1

# Set error action preference to SilentlyContinue for this script
# so it attempts all parts even if one fails (e.g., turbo command error)
$ErrorActionPreference = 'SilentlyContinue'

# --- Get and Print hashOfInternalDependencies ---
$internalDepsHashOutput = "hashOfInternalDependencies: Error or not found." # Default message

# Execute turbo dry run and capture its output (both stdout and stderr)
$turboOutput = $(turbo run build --filter=@focused-ux/utilities-core --dry=json 2>&1)
$turboExitCode = $LASTEXITCODE

if ($turboExitCode -eq 0 -and $turboOutput) {
    # Join array of lines if turboOutput is multi-line
    $jsonStringToParse = if ($turboOutput -is [array]) { $turboOutput -join [System.Environment]::NewLine } else { $turboOutput }

    if ($jsonStringToParse.Trim() -ne "") {
        $dryRunObject = $jsonStringToParse | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($dryRunObject) {
            if ($dryRunObject.PSObject.Properties['globalCacheInputs'] -and $dryRunObject.globalCacheInputs.PSObject.Properties['hashOfInternalDependencies']) {
                $internalDepsHashOutput = "hashOfInternalDependencies: $($dryRunObject.globalCacheInputs.hashOfInternalDependencies)"
            } elseif ($dryRunObject.PSObject.Properties['tasks'] -and $dryRunObject.tasks[0].PSObject.Properties['globalCacheInputs'] -and $dryRunObject.tasks[0].globalCacheInputs.PSObject.Properties['hashOfInternalDependencies'] ) {
                 # Fallback for older turbo versions or different structures
                $internalDepsHashOutput = "hashOfInternalDependencies: $($dryRunObject.tasks[0].globalCacheInputs.hashOfInternalDependencies)"
            }
            else {
                $internalDepsHashOutput = "hashOfInternalDependencies: Key path not found in JSON structure."
            }
        } else {
            $internalDepsHashOutput = "hashOfInternalDependencies: Failed to parse JSON from turbo output."
        }
    } else {
        $internalDepsHashOutput = "hashOfInternalDependencies: Turbo dry run produced empty output."
    }
} else {
    $internalDepsHashOutput = "hashOfInternalDependencies: Turbo dry run command failed (Exit Code: $turboExitCode) or produced no output."
}
Write-Host $internalDepsHashOutput

# --- Get and Print Current Time in the desired format ---
$now = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# To print: $thresholdTime = Get-Date "YYYY-MM-DD HH:MM:SS"
# The string itself needs to contain a literal $ and literal "
$timestampOutputString = "`$thresholdTime = Get-Date `"$now`""
Write-Host $timestampOutputString

# --- Print a Blank Line ---
Write-Host ""