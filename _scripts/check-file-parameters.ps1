$filePath = "D:\_dev\!Projects\focused-ux\focused-ux\packages\dynamicons\core\src\scripts\build_dynamicon_assets.ts" # <-- IMPORTANT: Update this path
$output = [PSCustomObject]@{
    File            = $null
    Encoding_BOM    = "Error reading file or file too short"
    FirstBytes_Hex  = "Error reading file"
    EOL_Sample      = "Error reading file"
    Length_Bytes    = $null
    ReadOnly        = $null
    LastWriteTime   = $null
}

try {
    if (-not (Test-Path $filePath -PathType Leaf)) {
        $output.File = "File not found at: $filePath"
        $output | Format-List
        exit 1
    }

    $fileInfo = Get-Item $filePath
    $output.File = $fileInfo.FullName
    $output.Length_Bytes = $fileInfo.Length
    $output.ReadOnly = $fileInfo.IsReadOnly
    $output.LastWriteTime = $fileInfo.LastWriteTime

    # Read first 4 bytes for BOM
    $bytes = New-Object byte[] 4
    $readCount = 0
    try {
        $fs = New-Object System.IO.FileStream($filePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $readCount = $fs.Read($bytes, 0, 4)
    }
    catch {
        $output.Encoding_BOM = "Error reading initial bytes: $($_.Exception.Message)"
        $output.FirstBytes_Hex = "Error reading initial bytes"
    }
    finally {
        if ($fs) { $fs.Close(); $fs.Dispose() }
    }

    if ($readCount -gt 0) {
        $output.FirstBytes_Hex = ($bytes[0..($readCount-1)] | ForEach-Object { $_.ToString("X2") }) -join " "
        $bomType = "No BOM detected or non-Unicode"
        if ($readCount -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $bomType = "UTF-8 with BOM (EF BB BF)"
        } elseif ($readCount -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
            if ($readCount -ge 4 -and $bytes[2] -eq 0x00 -and $bytes[3] -eq 0x00) {
                $bomType = "UTF-16 LE (FF FE) - Potentially UTF-32 LE if followed by 00 00"
            } else {
                $bomType = "UTF-16 LE (FF FE)"
            }
        } elseif ($readCount -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
            $bomType = "UTF-16 BE (FE FF)"
        } elseif ($readCount -ge 4 -and $bytes[0] -eq 0x00 -and $bytes[1] -eq 0x00 -and $bytes[2] -eq 0xFE -and $bytes[3] -eq 0xFF) {
            $bomType = "UTF-32 BE (00 00 FE FF)"
        }
        $output.Encoding_BOM = $bomType
    } else {
         $output.Encoding_BOM = "File is empty or too short to read BOM."
         $output.FirstBytes_Hex = "N/A (file empty or too short)"
    }


    # EOL Sequence (sample from first ~256 bytes or less if file is smaller)
    $sampleSize = [System.Math]::Min($fileInfo.Length, 256)
    $contentBytes = New-Object byte[] $sampleSize
    $eolReadCount = 0
    try {
        $fsEOL = New-Object System.IO.FileStream($filePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $eolReadCount = $fsEOL.Read($contentBytes, 0, $sampleSize)
    }
    catch {
         $output.EOL_Sample = "Error reading content for EOL sample: $($_.Exception.Message)"
    }
    finally {
        if ($fsEOL) { $fsEOL.Close(); $fsEOL.Dispose() }
    }

    if ($eolReadCount -gt 0) {
        # Attempt to decode as UTF-8 (common default) to find EOL characters
        # This is a heuristic. If the file is truly UTF-16, this might not be perfect for EOL,
        # but the BOM detection is primary for the original issue.
        $contentSample = [System.Text.Encoding]::UTF8.GetString($contentBytes, 0, $eolReadCount)
        $eolType = "Unknown/Mixed or Single Line"
        if ($contentSample -match "\r\n") {
            $eolType = "CRLF (Windows)"
        } elseif ($contentSample -match "(?<!\r)\n") {
            $eolType = "LF (Unix/macOS)"
        } elseif ($contentSample -match "\r(?!\n)") {
            $eolType = "CR (Classic Mac)"
        }
        $output.EOL_Sample = $eolType
    } else {
        $output.EOL_Sample = "File is empty or too short for EOL sample."
    }

}
catch {
    $output.File = "Error processing file $filePath : $($_.Exception.Message)"
}

$output | Format-List