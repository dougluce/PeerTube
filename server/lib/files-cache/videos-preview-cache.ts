import { join } from 'path'
import { FILES_CACHE, STATIC_PATHS } from '../../initializers/constants'
import { VideoModel } from '../../models/video/video'
import { AbstractVideoStaticFileCache } from './abstract-video-static-file-cache'
import { CONFIG } from '../../initializers/config'

class VideosPreviewCache extends AbstractVideoStaticFileCache <string> {

  private static instance: VideosPreviewCache

  private constructor () {
    super()
  }

  static get Instance () {
    return this.instance || (this.instance = new this())
  }

  async getFilePathImpl (videoUUID: string) {
    const video = await VideoModel.loadByUUIDWithFile(videoUUID)
    if (!video) return undefined

    if (video.isOwned()) return { isOwned: true, path: join(CONFIG.STORAGE.PREVIEWS_DIR, video.getPreview().filename) }

    return this.loadRemoteFile(videoUUID)
  }

  protected async loadRemoteFile (key: string) {
    const video = await VideoModel.loadAndPopulateAccountAndServerAndTags(key)
    if (!video) return undefined

    if (video.isOwned()) throw new Error('Cannot load remote preview of owned video.')

    // FIXME: use URL
    const remoteStaticPath = join(STATIC_PATHS.PREVIEWS, video.getPreview().filename)
    const destPath = join(FILES_CACHE.PREVIEWS.DIRECTORY, video.getPreview().filename)

    const path = await this.saveRemoteVideoFileAndReturnPath(video, remoteStaticPath, destPath)

    return { isOwned: false, path }
  }
}

export {
  VideosPreviewCache
}
