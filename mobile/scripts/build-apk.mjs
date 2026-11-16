import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

const appGradle = join(androidDirectory, 'app', 'build.gradle')
const appGradleContent = readFileSync(appGradle, 'utf8')
const reactBlock = 'react {\n'
if (!appGradleContent.includes(reactBlock)) {
  console.error(`Could not configure a standalone debug APK in ${appGradle}`)
  process.exit(1)
}
writeFileSync(appGradle, appGradleContent.replace(reactBlock, `${reactBlock}    debuggableVariants = []\n`))

const gradleWrapper = join(androidDirectory, isWindows ? 'gradlew.bat' : 'gradlew')
if (!existsSync(gradleWrapper)) {
  console.error('Expo prebuild did not create the Android Gradle wrapper.')
  process.exit(1)
}
mkdirSync(join(androidDirectory, 'app', 'build', 'intermediates', 'sourcemaps', 'react', 'debug'), {
  recursive: true,
})
run(
  gradleWrapper,
  [
    'assembleDebug',
    '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64',
    '--max-workers=1',
    '--no-parallel',
  ],
  androidDirectory,
)

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

// Auto-install onto connected emulator or device if available
const adbPath = join(sdkPath, 'platform-tools', isWindows ? 'adb.exe' : 'adb')
if (existsSync(adbPath)) {
  const adbDevices = spawnSync(adbPath, ['devices'], { encoding: 'utf8' })
  const hasDevice = (adbDevices.stdout ?? '')
    .split('\n')
    .slice(1)
    .some((line) => line.trim().endsWith('device'))
  if (hasDevice) {
    console.log('\nInstalling updated APK to connected device/emulator...')
    const installResult = spawnSync(adbPath, ['install', '-r', outputApk], { stdio: 'inherit' })
    if (installResult.error || installResult.status !== 0) {
      console.error(`Could not install the APK: ${installResult.error?.message ?? 'adb install failed'}`)
      process.exit(installResult.status ?? 1)
    }
    console.log('AMANE DZ launcher icon is now up-to-date on your device/emulator.')
  }
}
