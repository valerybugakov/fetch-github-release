import { RestEndpointMethodTypes } from '@octokit/rest'

export type OctokitRelease = RestEndpointMethodTypes['repos']['getLatestRelease']['response']
export type OctokitReleaseAssets = OctokitRelease['data']['assets']

export interface Release {
  repository: string
  package: string
  destination: string
  version: string
  extract: boolean
}

export interface RepoInfo {
  owner: string
  repo: string
}
