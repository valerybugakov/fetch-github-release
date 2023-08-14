import { Octokit } from "@octokit/rest"
import { gt } from "semver"

import { RepoInfo } from "./types"

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

export interface FetchLatestReleaseOptions extends RepoInfo {
  accessToken?: string;
}

export interface FetchLatestReleaseResult {
  url: string;
  id: number;
  assets: any[];
  name: string | null;
  body?: string | null;
  assets_url: string;
  author: string;
  body_html: string;
  body_text: string;
  created_at: string;
  discussion_url: string;
  draft: boolean;
  html_url: string;
  mentions_count: number;
}

export async function fetchLatestReleaseInfo(
    opts: ListReleasesOptions
): Promise<ReleaseInfo> {
  const { repo, owner, accessToken } = opts;
  const result = await new Octokit({ auth: accessToken }).repos.getLatestRelease({ owner, repo });
  return result.data as ReleaseInfo;
}

export interface ListReleasesOptions extends RepoInfo {
  accessToken?: string;
}

export interface AuthorInfo {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface ReleaseAsset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string;
  uploader: AuthorInfo;
  content_type: string;
  state: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

export interface ReleaseReactions {
  url: string;
  total_count: number;
  "+1": number;
  "-1": number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

export interface ReleaseInfo {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  author: AuthorInfo;
  node_id: string;
  tag_name: string;
  tag_commitish?: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: ReleaseAsset[];
  tarball_url: string;
  zipball_url: string;
  body: string;
  reactions: ReleaseReactions
}

export async function listReleases(opts: ListReleasesOptions): Promise<ReleaseInfo[]> {
  const { repo, owner, accessToken } = opts;
  const result = await new Octokit({ auth: accessToken }).repos.listReleases({ owner, repo });
  return result.data as ReleaseInfo[];
}

export function newerVersion(latestVersion: string, currentVersion: string): boolean {
  if (!latestVersion) {
    return false
  }

  if (!currentVersion) {
    return true
  }

  const normalizedLatestVersion = latestVersion.replace(/^v/, "")
  const normalizedCurrentVersion = currentVersion.replace(/^v/, "")

  return gt(normalizedLatestVersion, normalizedCurrentVersion)
}
