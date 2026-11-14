import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidDirectory = resolve(projectDirectory, 'android')
const gradleWrapper = resolve(androidDirectory, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
const apkPath = resolve(androidDirectory, 'app/build/outputs/apk/debug/app-debug.apk')

if (!existsSync(gradleWrapper)) {
  console.error('Android project not found. Run `npx cap add android` first.')
  process.exit(1)
}

const result = spawnSync(gradleWrapper, ['assembleDebug'], {
  cwd: androidDirectory,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error(`Could not start the Android Gradle build: ${result.error.message}`)
  process.exit(1)
}

if (result.status !== 0) process.exit(result.status ?? 1)

if (!existsSync(apkPath)) {
  console.error(`Gradle finished successfully, but the APK was not found at ${apkPath}`)
  process.exit(1)
}

console.log(`\nDebug APK created successfully:\n${apkPath}`)
