import React from 'react';
import type {LocalizedText, VideoItem} from '../data/site';
import VideoProjectNote, {TV_EPISODE_ID} from './VideoProjectNote';
import {COPILOT_REFERENCE,episodeNotes,episodeResource} from '../data/video-resources';
import './video-resources.css';

export default function VideoResources({video,t}: {video:Pick<VideoItem,'id'>;t:(copy:LocalizedText)=>string}) {
  if(video.id===TV_EPISODE_ID) return <VideoProjectNote videos={[video]} t={t}/>;
  const resource=episodeResource(video.id);
  const project=resource?.project;
  const label=project ? project.kind==='materials'?{zh:'GitHub · 课程练习材料',en:'GitHub · lesson materials'}:project.kind==='reference'?{zh:'GitHub · 相关参考资料',en:'GitHub · related reference'}:{zh:'GitHub · 公开项目源码',en:'GitHub · public project source'} : resource?{zh:'GitHub · 本期资料',en:'GitHub · episode notes'}:{zh:'GitHub · 节目资料索引',en:'GitHub · episode index'};
  return <div className="hd-video-resources" data-video-resource={video.id}>
    <a className="hd-resource-link" href={project?.url??episodeNotes(video.id)}>{t(label)}{project&&' · '+project.name} <span aria-hidden="true">↗</span></a>
    <p>{t(resource?.summary??{zh:'这期的项目链接与说明尚未整理；可先查看公开节目索引。',en:'Project links and notes for this episode are not yet curated. Browse the public episode index.'})}</p>
    {resource&&<details><summary>{t({zh:'用途与资料范围',en:'Purpose & resource scope'})}</summary>
      <p>{t(resource.scope)}</p>
      {!project&&<p>{t({zh:'尚未核验到本期演示的公开源码；节目资料页不等于可运行项目。',en:'Public source for this episode’s demonstration has not been verified. Episode notes are not a runnable project.'})}</p>}
      {project?.kind==='materials'&&<p>{t({zh:'公开材料含虚构练习文件、Agent 说明和搭建步骤；不是可直接导入的 Flow / Agent 解决方案，需按自己的许可和环境跟练。',en:'Public materials include fictional inputs, agent instructions and build steps, not an importable Flow/Agent solution. Follow them in your own licensed environment.'})}</p>}
      {project&&<a className="hd-resource-link" href={episodeNotes(video.id)}>{t({zh:'GitHub · 本期笔记与来源',en:'GitHub · episode notes & sources'})} <span aria-hidden="true">↗</span></a>}
      {resource.reference&&<><a className="hd-resource-link" href={COPILOT_REFERENCE}>{t({zh:'GitHub · 微软官方参考示例',en:'GitHub · Microsoft reference samples'})} <span aria-hidden="true">↗</span></a><p>{t({zh:'通用 Copilot Studio 样例，供进一步研究；不是本课配套源码，仍需配置自己的环境、连接和权限。',en:'General Copilot Studio samples for further study, not this lesson’s source. Configure your own environment, connections and permissions.'})}</p></>}
    </details>}
  </div>;
}
