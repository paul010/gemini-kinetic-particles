import React from 'react';
import type {LocalizedText, VideoItem} from '../data/site';
import './video-project-note.css';

export const TV_EPISODE_ID = '1K3fVbbBeQg';
export const TV_REPOSITORY = 'https://github.com/paul010/dalei-tvhome';
export const tvProjectCopy = {
  title: {zh:'安卓电视视频的配套项目 · DaLei TV Home',en:'Project behind the Android TV video · DaLei TV Home'},
  summary: {
    zh:'Android 5 / API 21+ 的电视附加应用：遥控导航、应用与视频快捷入口，以及需自行配置的只读 Codex 用量。不刷机、不升级系统，也不替换系统桌面。',
    en:'An Android 5 / API 21+ TV companion: remote navigation, app/video shortcuts and optional read-only Codex stats that need your own configuration. No firmware upgrade or system-launcher replacement.',
  },
  scope: {
    zh:'视频展示个人定制版。公开仓库提供 MIT 源码，不含成品 APK、私人素材或默认数据地址；需自行构建、签名并在设备上验证。视频演示不代表公开版已完成兼容性验收。',
    en:'The video shows a personal build. The MIT repository provides source, not a ready-made APK, private artwork or a default data endpoint. Build, sign and test it on your device; the demo is not compatibility acceptance of the public build.',
  },
};

export default function VideoProjectNote({videos,t}: {
  videos: readonly Pick<VideoItem,'id'>[];
  t: (copy:LocalizedText)=>string;
}) {
  if (!videos.some(video=>video.id===TV_EPISODE_ID)) return null;
  return <aside id="video-project-dalei-tvhome" className="video-project-note" aria-labelledby="video-project-dalei-tvhome-title">
    <h3 id="video-project-dalei-tvhome-title" className="vp-title">{t(tvProjectCopy.title)}</h3>
    <p className="vp-copy">{t(tvProjectCopy.summary)}</p>
    <p className="vp-scope">{t(tvProjectCopy.scope)}</p>
    <div className="vp-links">
      <a className="vp-link" href={TV_REPOSITORY}>GitHub · paul010/dalei-tvhome <span aria-hidden="true">↗</span></a>
      <a className="vp-link" href={TV_REPOSITORY+'/blob/main/README.zh-CN.md'}>{t({zh:'中文说明与构建步骤',en:'Chinese README & build steps'})} <span aria-hidden="true">↗</span></a>
      <a className="vp-link" href={'https://www.youtube.com/watch?v='+TV_EPISODE_ID}>{t({zh:'看安卓电视这期视频',en:'Watch the Android TV episode'})} <span aria-hidden="true">↗</span></a>
    </div>
  </aside>;
}
