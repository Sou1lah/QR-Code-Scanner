import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const isWindows = process.platform === 'win32'
const javaExecutable = process.env.JAVA_HOME
  ? resolve(process.env.JAVA_HOME, 'bin', isWindows ? 'java.exe' : 'java')
  : 'java'
const javaResult = spawnSync(javaExecutable, ['-version'], { encoding: 'utf8' })
const javaOutput = `${javaResult.stdout ?? ''}\n${javaResult.stderr ?? ''}`
const javaVersion = javaOutput.match(/version "(?:1\.)?(\d+)/)?.[1]
const issues = []

if (javaResult.error) {
  issues.push(`Java could not be started (${javaResult.error.message}). Install JDK 17 and set JAVA_HOME.`)
} else if (!javaVersion || Number(javaVersion) < 17) {
  const foundVersion = javaVersion ? `Java ${javaVersion}` : 'an unknown Java version'
  issues.push(`Android builds require JDK 17 or newer; found ${foundVersion}. Set JAVA_HOME to a JDK 17 installation.`)
}

const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  join(homedir(), 'Android', 'Sdk'),
  join(homedir(), 'Library', 'Android', 'sdk'),
  process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : undefined,
].filter((candidate) => candidate && existsSync(candidate))

const sdkPath = sdkCandidates[0]
if (!sdkPath) {
  issues.push('Android SDK not found. Install it with Android Studio and set ANDROID_HOME or ANDROID_SDK_ROOT.')
} else if (!existsSync(join(sdkPath, 'platforms', 'android-35', 'android.jar'))) {
  issues.push(`Android SDK Platform 35 is missing from ${sdkPath}. Install it from Android Studio's SDK Manager.`)
}

if (issues.length > 0) {
  console.error('Cannot build the Android APK:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}
