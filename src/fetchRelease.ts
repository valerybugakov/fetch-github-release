import { writeFile, rm } from "yafs";
import path from 'path'

import { Octokit } from '@octokit/rest'
import decompress from 'decompress'
const bent = require("bent");

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

type AsyncFunction<T> = () => Promise<T>;
type AsyncVoidFunction = AsyncFunction<void>;
interface Dictionary<T> {
  [key: string]: T;
}

interface BentResponse {
  statusCode: number;
  json: AsyncFunction<any>;
  text: AsyncFunction<string>;
  arrayBuffer: AsyncFunction<Buffer>;
  headers: Dictionary<string>;
}

function determineFilenameFrom(response: BentResponse): string {
  const contentDisposition = response.headers["content-disposition"];
  if (!contentDisposition) {
    // guess? shouldn't get here from GH queries...
    return fallback();
  }
  const parts = contentDisposition.split(";").map(s => s.trim());
  for (const part of parts) {
    let match = part.match(/^filename=(?<filename>.+)/i);
    if (match && match.groups) {
      const filename = match.groups["filename"];
      if (filename) {
        return filename;
      }
    }
  }
  return fallback();

  function fallback() {
    console.warn(`Unable to determine filename from request, falling back on release.zip`);
    return "release.zip";
  }
}

async function download(url: string, destination: string): Promise<string> {
  const fetch = bent(url);
  try {
    const response = await fetch();
    const data = await response.arrayBuffer();
    const filename = determineFilenameFrom(response);
    await writeFile(path.join(destination, filename), data);
    return determineFilenameFrom(response);
  } catch (e) {
    const err = e as BentResponse;
    if (err.statusCode === undefined) {
      throw err;
    }
    if (err.statusCode === 301 || err.statusCode === 302) {
      const next = err.headers["location"];
      if (!next) {
        throw new Error(`No location provided for http response ${err.statusCode}`);
      }
      return download(next, destination);
    }
    throw err;
  }
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
  const filename = await download(downloadUrl, destination)
  const downloadPath = path.join(destination, filename)

  if (shouldExtract) {
    const files = await decompress(downloadPath, destination)
    await rm(downloadPath)

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
