/** Original editorial draft. No model benchmark or personal test is claimed. */
export interface NewsletterLetter {
  title: string;
  date: string;
  sections: ReadonlyArray<{ label: string; text: string }>;
  source: { label: string; url: string };
  video?: { label: string; url: string; date: string };
}

export const sampleLetter: NewsletterLetter = {
  title: '先写验收，再让 AI 动手',
  date: '2026-10-05',
  sections: [
    {
      label: '一个结论',
      text: '把“帮我做个好用的工具”改成“完成后，我要怎样检查它”。先写一条可重复的验收，再让 AI 动手。漂亮的画面可以让你愿意继续试，但还不能替你判断工具是否完成了任务。',
    },
    {
      label: '一个原理',
      text: '一次演示通常只展示一个输入和一条顺利路径。真实使用还会遇到空输入、重复点击、刷新和网络故障。验收把模糊期待变成可以观察的行为，也让你知道下一次修改到底有没有解决问题。先留下输入和预期，再比较结果。',
    },
    {
      label: '一个判断',
      text: '探索想法时，可以先做能看见的原型；准备给别人使用时，先验证最关键的流程。没有验证的地方，就继续标为演示。不要把“页面出现了”写成“功能已经可用”，也不要拿一次结果概括所有任务。',
    },
    {
      label: '一个动手练习',
      text: '选一个你想做的小工具，写下三句话：正常输入应得到什么、无效输入应怎样提示、刷新后应保留或清空什么。让 AI 按这三句实现，再亲手走一遍。记下一个没通过的步骤，只改这一处，然后用同样输入再试。',
    },
  ],
  source: {
    label: 'MDN：Web 开发中的测试',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Testing',
  },
  video: {
    label: 'GPT-6 Sol 真来了？9分钟造出“死星”，身份却无法验证',
    url: 'https://www.youtube.com/watch?v=j1Z2Z967sX4',
    date: '2026-09-15',
  },
} as const;
