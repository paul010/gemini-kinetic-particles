import React, { useEffect, useMemo, useState } from 'react';
import './ttt-hour-of-code.css';

interface TTTHourOfCodeProps {
  onHome: () => void;
}

const phases = [
  { time: '05', title: '先让孩子开口', note: '一个问题破冰：游戏人物为什么会动？' },
  { time: '10', title: '把概念变成动作', note: '指令、顺序、调试，不先讲语法。' },
  { time: '35', title: '全场一起闯关', note: '台上操作，台下做参谋、找 Bug。' },
  { time: '10', title: '把失败重新命名', note: '没成功不是错，是下一次调试的线索。' },
];

const aiTasks = [
  { name: '课程结构', manual: 120, ai: 18 },
  { name: 'PPT 初稿', manual: 240, ai: 35 },
  { name: '任务卡与讲稿', manual: 150, ai: 22 },
  { name: '场控与备用方案', manual: 90, ai: 16 },
];

const skillSteps = [
  ['01', '确认现场', '年龄、人数、设备、时间先锁死。'],
  ['02', '只选一个目标', '一小时只点亮一次完整体验。'],
  ['03', '设计参与', '不是谁上机，而是谁在思考。'],
  ['04', '生成物料', 'PPT、任务卡、讲稿、fallback 一次成型。'],
  ['05', '现场验证', '真正的答案永远在孩子的反应里。'],
];

const TTTHourOfCode: React.FC<TTTHourOfCodeProps> = ({ onHome }) => {
  const [aiMix, setAiMix] = useState(75);
  const [activeSkill, setActiveSkill] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const totals = useMemo(() => {
    const manual = aiTasks.reduce((sum, task) => sum + task.manual, 0);
    const fastest = aiTasks.reduce((sum, task) => sum + task.ai, 0);
    const current = Math.round(manual - (manual - fastest) * (aiMix / 100));
    return { manual, fastest, current, saved: manual - current };
  }, [aiMix]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'n') setShowNotes((value) => !value);
      if (event.key === 'Escape') onHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHome]);

  return (
    <main className="ttt-page">
      <header className="ttt-nav" aria-label="Workshop navigation">
        <button type="button" onClick={onHome} className="ttt-home">大雷 / LAB</button>
        <div className="ttt-nav-meta">
          <span>TTT WORKSHOP</span>
          <span>2026.07.15</span>
        </div>
        <button type="button" className="ttt-notes-toggle" onClick={() => setShowNotes((value) => !value)} aria-pressed={showNotes}>
          {showNotes ? '关闭讲者提示' : '讲者提示'}
        </button>
      </header>

      <section className="ttt-hero" id="opening">
        <div className="ttt-hero-copy">
          <p className="ttt-kicker">从一次培训，到一间真实教室</p>
          <h1>会讲，<br />不等于<span>会设计。</span></h1>
          <p className="ttt-lead">我把 TTT 学到的方法，带进中山区解放小学的一小时。</p>
          <a href="#shift" className="ttt-primary">开始这段故事 <span aria-hidden="true">↓</span></a>
        </div>

        <div className="ttt-classroom" aria-label="六十名学生共同参与代码课堂的抽象示意图">
          <div className="ttt-board">
            <span className="ttt-board-label">给电脑的清楚指令</span>
            <div className="ttt-code-line"><i />向前 2 步</div>
            <div className="ttt-code-line"><i />向右转</div>
            <div className="ttt-code-line is-bug"><i />发现 Bug，再试一次</div>
            <div className="ttt-route" aria-hidden="true"><b /><b /><b /><strong>终点</strong></div>
          </div>
          <div className="ttt-students" aria-hidden="true">
            {Array.from({ length: 60 }).map((_, index) => <i key={index} style={{ '--delay': `${(index % 10) * 70}ms` } as React.CSSProperties} />)}
          </div>
          <p><strong>60</strong> 个孩子，不需要 60 台电脑。<br />需要的是 60 个脑子一起想指令。</p>
        </div>
      </section>

      {showNotes && (
        <aside className="ttt-speaker-note" role="note">
          <strong>开场口播</strong>
          <p>“站上讲台之前，我以为最难的是把代码讲明白。真正面对几十个孩子，我才发现：PPT 做完了，不等于课堂设计完了。”</p>
          <span>快捷键 N 显示/隐藏 · Esc 返回首页</span>
        </aside>
      )}

      <section className="ttt-shift" id="shift">
        <div className="ttt-section-number">01</div>
        <div className="ttt-shift-main">
          <h2>第一刀，砍掉<br />“教会写代码”。</h2>
          <p>一小时不够学会一门语言，但足够建立一次正确的技术体验。</p>
        </div>
        <div className="ttt-before-after">
          <div className="is-before">
            <span>原来的目标</span>
            <del>让孩子学会写代码</del>
          </div>
          <div className="is-after">
            <span>改写后的目标</span>
            <strong>指令要清楚</strong>
            <strong>顺序影响结果</strong>
            <strong>出错可以调试</strong>
          </div>
        </div>
      </section>

      <section className="ttt-method">
        <div className="ttt-section-number">02</div>
        <h2>TTT 留下的，不是笔记。<br />是三个判断。</h2>
        <div className="ttt-method-track">
          <article><span>目标</span><h3>最后带走什么？</h3><p>先写学习结果，再决定讲什么。</p></article>
          <article><span>学员</span><h3>什么时候轮到他？</h3><p>不是“我讲完”，而是“他走一遍”。</p></article>
          <article><span>反馈</span><h3>卡住之后怎么办？</h3><p>让错误立刻变成可见的调试线索。</p></article>
        </div>
      </section>

      <section className="ttt-hour" id="hour">
        <div className="ttt-hour-heading">
          <div className="ttt-section-number">03</div>
          <h2>把 60 分钟，<br />设计成四次参与。</h2>
          <p>孩子的注意力不是靠提醒维持的，是靠下一步行动接住的。</p>
        </div>
        <div className="ttt-timeline">
          {phases.map((phase, index) => (
            <article key={phase.time + phase.title}>
              <div className="ttt-time"><strong>{phase.time}</strong><span>MIN</span></div>
              <div><span>0{index + 1}</span><h3>{phase.title}</h3><p>{phase.note}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="ttt-ai" id="ai-time">
        <div className="ttt-ai-copy">
          <div className="ttt-section-number">04</div>
          <h2>AI 没替我上课。<br />它替我买回了时间。</h2>
          <p>把滑杆拖一拖。AI 参与越深，重复制作越快；省下来的时间，重新投到目标、现场和孩子身上。</p>
          <label htmlFor="ai-mix">AI 参与度 <output>{aiMix}%</output></label>
          <input id="ai-mix" type="range" min="0" max="100" value={aiMix} onChange={(event) => setAiMix(Number(event.target.value))} />
          <div className="ttt-ai-result" aria-live="polite">
            <div><span>传统准备</span><strong>{totals.manual}<small> min</small></strong></div>
            <div><span>当前估算</span><strong>{totals.current}<small> min</small></strong></div>
            <div className="is-saved"><span>买回时间</span><strong>{totals.saved}<small> min</small></strong></div>
          </div>
          <small className="ttt-estimate">演示估算，基于本次课程物料制作过程，不代表通用效率承诺。</small>
        </div>
        <div className="ttt-ai-bars">
          {aiTasks.map((task) => {
            const current = Math.round(task.manual - (task.manual - task.ai) * (aiMix / 100));
            return (
              <div key={task.name}>
                <p><span>{task.name}</span><strong>{current} min</strong></p>
                <div><i style={{ width: `${Math.max(4, (current / task.manual) * 100)}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ttt-skill" id="skill">
        <div className="ttt-skill-title">
          <div className="ttt-section-number">05</div>
          <h2>把一次经验，<br />封装成下一次的起点。</h2>
          <p><code>dalei-hour-of-code</code> 不是一份静态文档，而是一条可以重复调用的课程设计路径。</p>
        </div>
        <div className="ttt-skill-console">
          <nav aria-label="Skill workflow">
            {skillSteps.map(([number, title], index) => (
              <button key={number} type="button" className={activeSkill === index ? 'is-active' : ''} onClick={() => setActiveSkill(index)} aria-pressed={activeSkill === index}>
                <span>{number}</span>{title}
              </button>
            ))}
          </nav>
          <div className="ttt-skill-output" aria-live="polite">
            <span>STEP {skillSteps[activeSkill][0]} / 05</span>
            <h3>{skillSteps[activeSkill][1]}</h3>
            <p>{skillSteps[activeSkill][2]}</p>
            <div className="ttt-terminal-line"><i /> READY FOR NEXT RUN</div>
          </div>
        </div>
      </section>

      <section className="ttt-close">
        <p>TTT 给方法 · AI 给速度 · 代码给交付 · 现场给答案</p>
        <blockquote>“代码一小时真正点亮的，不是代码，<br />是孩子心里那句：原来我也可以试试。”</blockquote>
        <a href="#opening">再讲一遍 <span aria-hidden="true">↑</span></a>
      </section>

      <footer className="ttt-footer"><span>DA LEI · AI PRACTITIONER / ENGINEER / VOLUNTEER</span><span>TTT → HOUR OF CODE</span></footer>
    </main>
  );
};

export default TTTHourOfCode;
