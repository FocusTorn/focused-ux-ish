import fs from 'fs/promises'
import path from 'path'

async function moveStatsFile() {
    const sourcePath = 'stats.html'
    const targetPath = path.join('dist', 'EsbuildAnalysis.html') // Construct the full destination path

    try {
        await fs.rename(sourcePath, targetPath)
        console.log(`Moved ${sourcePath} to ${targetPath}`)
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            console.error('Source file not found:', sourcePath)
        }
        else {
            console.error('Error moving file:', err)
        }
    }
}

moveStatsFile()
