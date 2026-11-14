import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidDirectory = join(projectDirectory, 'android')
const isWindows = process.platform === 'win32'

function run(command, args, cwd = projectDirectory) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  })
  if (result.error) {
    console.error(`Could not start ${command}: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const javaCommand = process.env.JAVA_HOME
  ? join(process.env.JAVA_HOME, 'bin', isWindows ? 'java.exe' : 'java')
  : 'java'
const javaResult = spawnSync(javaCommand, ['-version'], { encoding: 'utf8' })
const javaVersion = `${javaResult.stdout ?? ''}\n${javaResult.stderr ?? ''}`.match(/version "(?:1\.)?(\d+)/)?.[1]
if (javaResult.error || !javaVersion || Number(javaVersion) < 17) {
  console.error('Android APK builds require JDK 17 or newer. Install JDK 17 and set JAVA_HOME.')
  process.exit(1)
}

const sdkPath = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  join(homedir(), 'Android', 'Sdk'),
].find((candidate) => candidate && existsSync(candidate))
if (!sdkPath) {
  console.error('Android SDK not found. Install it with Android Studio and set ANDROID_HOME.')
  process.exit(1)
}

const expoCli = join(projectDirectory, 'node_modules', 'expo', 'bin', 'cli')
run(process.execPath, [expoCli, 'prebuild', '--platform', 'android'])

const gradleWrapper = join(androidDirectory, isWindows ? 'gradlew.bat' : 'gradlew')
if (!existsSync(gradleWrapper)) {
  console.error('Expo prebuild did not create the Android Gradle wrapper.')
  process.exit(1)
}
run(gradleWrapper, ['assembleDebug'], androidDirectory)

const builtApk = join(androidDirectory, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
if (!existsSync(builtApk)) {
  console.error(`Gradle finished, but the APK was not found at ${builtApk}`)
  process.exit(1)
}
const outputDirectory = join(projectDirectory, 'dist')
const outputApk = join(outputDirectory, 'AMANE-DZ-debug.apk')
mkdirSync(outputDirectory, { recursive: true })
copyFileSync(builtApk, outputApk)
console.log(`\nDebug APK created:\n${outputApk}`)
