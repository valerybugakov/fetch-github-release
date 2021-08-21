import os from 'os'
import path from 'path'

export const PACKAGE_NAME = 'fetch-github-release'
export const PACKAGE_DATA_DIR = path.join(os.homedir(), `.${PACKAGE_NAME}`)
