import {createHash} from 'node:crypto'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const compilePromises = new Map()

// Compiles a single-file Swift helper on first use and caches the binary in
// the temp directory keyed by source digest, so edits never run stale code.
export function compileSwiftTool({sourcePath, frameworks, prefix}) {
    if (!compilePromises.has(sourcePath)) {
        const promise = (async() => {
            const source = await fs.promises.readFile(sourcePath)
            const digest = createHash('sha256').update(source).digest('hex').slice(0, 16)
            const binary = path.join(os.tmpdir(), `${prefix}-${digest}`)
            try {
                await fs.promises.access(binary, fs.constants.X_OK)
                return binary
            }
            catch {
                const temporary = `${binary}.${process.pid}.${Date.now()}`
                const moduleCache = path.join(os.tmpdir(), 'mercury-swift-module-cache')
                try {
                    await fs.promises.mkdir(moduleCache, {recursive: true})
                    await execFileAsync('xcrun', [
                        'swiftc', '-O', '-module-cache-path', moduleCache, sourcePath,
                        ...frameworks.flatMap(framework => ['-framework', framework]),
                        '-o', temporary
                    ], {timeout: 120000, maxBuffer: 1024 * 1024})
                    await fs.promises.rename(temporary, binary).catch(async(error) => {
                        if (error.code !== 'EEXIST') {
                            throw error
                        }
                    })
                    return binary
                }
                finally {
                    await fs.promises.rm(temporary, {force: true}).catch(() => {})
                }
            }
        })().catch(error => {
            compilePromises.delete(sourcePath)
            throw error
        })
        compilePromises.set(sourcePath, promise)
    }
    return compilePromises.get(sourcePath)
}
