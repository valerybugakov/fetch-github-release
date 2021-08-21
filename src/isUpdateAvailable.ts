import { Octokit } from '@octokit/rest'
import { gt } from 'semver'

import { RepoInfo } from './types'

interface IsUpdateAvailableOptions extends RepoInfo {
  currentVersion: string
  accessToken?: string
}

export async function isUpdateAvailable(options: IsUpdateAvailableOptions): Promise<boolean> {
  const { repo, owner, currentVersion, accessToken } = options
  const {
    data: { tag_name: latestVersion },
  } = await new Octokit({ auth: accessToken }).repos.getLatestRelease({ owner, repo })

  return newerVersion(latestVersion, currentVersion)
}

export function newerVersion(latestVersion: string, currentVersion: string): boolean {
  if (!latestVersion) {
    return false
  }

  if (!currentVersion) {
    return true
  }

  const normalizedLatestVersion = latestVersion.replace(/^v/, '')
  const normalizedCurrentVersion = currentVersion.replace(/^v/, '')

  return gt(normalizedLatestVersion, normalizedCurrentVersion)
}
