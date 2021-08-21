import fs from 'fs'
import path from 'path'

export const exists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.promises.access(filePath)
    return true
  } catch {
    return false
  }
}

export const mkdir = async (dirname: string): Promise<void> => {
  const isExist = await exists(dirname)

  if (!isExist) {
    await fs.promises.mkdir(dirname, { recursive: true })
  }
}

export const ensureDirExist = async (filePath: string): Promise<void> => {
  const dirname = path.dirname(filePath)
  await mkdir(dirname)
}
