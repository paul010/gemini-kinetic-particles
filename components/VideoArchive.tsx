import React,{useState} from 'react';
import type {LocalizedText,VideoItem} from '../data/site';
import episodes from '../data/video-archive.json';
import {episodeResource,EPISODE_INDEX,checkedOn} from '../data/video-resources';
import {videoTitle} from '../data/latest-videos';
import VideoResources from './VideoResources';
import './video-resources.css';
export const earlierEpisodes=(current:readonly Pick<VideoItem,'id'>[],filter='projects')=>episodes.filter(row=>!current.some(v=>v.id===row.id)&&(filter==='all'||(filter==='projects'?(row.id==='1K3fVbbBeQg'||!!episodeResource(row.id)?.project):(row.id!=='1K3fVbbBeQg'&&!episodeResource(row.id)?.project))));
export default function VideoArchive({videos,t}:{videos:readonly Pick<VideoItem,'id'>[];t:(copy:LocalizedText)=>string}){
 const [open,setOpen]=useState(false),[filter,setFilter]=useState('projects'),[limit,setLimit]=useState(6);
 const rows=earlierEpisodes(videos,filter);
 return <section id="video-archive" className="video-archive" aria-labelledby="video-archive-title">
  <h3 id="video-archive-title">{t({zh:'更早的视频与 GitHub 资料',en:'Earlier videos & GitHub resources'})}</h3>
  <p>{t({zh:'按节目找公开项目、练习材料与来源。未核验到公开源码的如实标注；最近补充核对：'+checkedOn+'。',en:'Find public projects, lesson materials and sources by episode. Unverified source is labeled explicitly. Last additions reviewed: '+checkedOn+'.'})}</p>
  <details onToggle={event=>setOpen(event.currentTarget.open)}><summary>{t({zh:'展开已核对的更早节目',en:'Browse checked earlier episodes'})}</summary>
   {open&&<><label className="video-archive-filter">{t({zh:'筛选资料',en:'Filter resources'})}<select value={filter} onChange={event=>{setFilter(event.target.value);setLimit(6);}}><option value="projects">{t({zh:'有项目或练习材料',en:'Projects or practice materials'})}</option><option value="notes">{t({zh:'未核验到公开源码',en:'Public source not verified'})}</option><option value="all">{t({zh:'全部已核对节目',en:'All checked episodes'})}</option></select></label>
   <p role="status">{t({zh:'显示 '+Math.min(limit,rows.length)+' / '+rows.length+' 期；按发布时间倒序。',en:'Showing '+Math.min(limit,rows.length)+' of '+rows.length+' episodes, newest first.'})}</p>
   <div className="video-archive-list">{rows.slice(0,limit).map(row=><article className="video-archive-item" key={row.id}>
    <h4><a className="hd-resource-link" href={'https://www.youtube.com/watch?v='+row.id}>{t(videoTitle(row.title))}</a></h4><p><time dateTime={row.date}>{row.date}</time> · {row.duration}</p>
    <VideoResources video={row} t={t}/>
   </article>)}</div>
   {rows.length===0&&<p>{t({zh:'这个筛选下没有更早的已核对节目。',en:'No checked earlier episodes match this filter.'})}</p>}
   {limit<rows.length&&<button type="button" onClick={()=>setLimit(n=>n+6)}>{t({zh:'再显示 6 期',en:'Show 6 more episodes'})}</button>}
   <a className="hd-resource-link" href={EPISODE_INDEX+'/blob/master/VIDEO-PROJECTS.md'}>{t({zh:'GitHub · 本批项目与来源',en:'GitHub · projects & sources in this selection'})} ↗</a><br/><a className="hd-resource-link" href={EPISODE_INDEX}>{t({zh:'GitHub · 完整节目索引',en:'GitHub · complete episode index'})} ↗</a></>}
  </details>
 </section>;
}
