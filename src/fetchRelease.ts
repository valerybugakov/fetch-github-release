import fs from 'fs'
import path from 'path'

import { Octokit } from '@octokit/rest'
import decompress from 'decompress'
import download from 'download'

import { PACKAGE_DATA_DIR } from './constants'
import { OctokitRelease, OctokitReleaseAssets, RepoInfo } from './types'
import { ensureDirExist } from './util'
import { getAssetDefault } from './getAssetDefault'

export interface FetchReleaseOptions extends RepoInfo {
  getRelease: (owner: string, repo: string) => Promise<OctokitRelease>
  getAsset?: (
    version: string,
    assets: OctokitReleaseAssets,
  ) => OctokitReleaseAssets[number] | undefined
  accessToken?: string
  destination?: string
  shouldExtract?: boolean
}

async function fetchRelease(options: FetchReleaseOptions): Promise<string[]> {
  const {
    owner,
    repo,
    getRelease,
    getAsset = getAssetDefault,
    destination = PACKAGE_DATA_DIR,
    shouldExtract = true,
  } = options

  if (!owner) {
    throw new Error('Required "owner" option is missing')
  }

  if (!repo) {
    throw new Error('Required "repo" option is missing')
  }

  const {
    data: { assets, tag_name: version },
  } = await getRelease(owner, repo)
  const downloadUrl = getAsset(version, assets)?.browser_download_url

  if (!downloadUrl) {
    throw new Error('Unable to find download URL')
  }

  await ensureDirExist(destination)
  await download(downloadUrl, destination)
  const { base: filename } = path.parse(downloadUrl)
  const downloadPath = path.join(destination, filename)

  if (shouldExtract) {
    const files = await decompress(downloadPath, destination)
    fs.unlinkSync(downloadPath)

    return files.map((file) => path.join(destination, file.path))
  }

  return [downloadPath]
}

/**
 * Downloads and extract release for the specified tag from Github to the destination.
 *
 * await fetchLatestRelease({ owner: 'smallstep', repo: 'cli', tag: '1.0.0' })
 */
export async function fetchReleaseByTag(
  options: Omit<FetchReleaseOptions, 'getRelease'> & { tag: string },
): Promise<string[]> {
  return fetchRelease({
    ...options,
    getRelease: (owner, repo) =>
      new Octokit({ auth: options.accessToken }).repos.getReleaseByTag({
        owner,
        repo,
        tag: options.tag,
      }),
  })
}

/**
 * Downloads and extract latest release from Github to the destination.
 *
 * await fetchLatestRelease({ owner: 'smallstep', repo: 'cli' })
 */
export async function fetchLatestRelease(
  options: Omit<FetchReleaseOptions, 'getRelease'>,
): Promise<string[]> {
  return fetchRelease({
    ...options,
    getRelease: (owner, repo) =>
      new Octokit({ auth: options.accessToken }).repos.getLatestRelease({ owner, repo }),
  })
}
