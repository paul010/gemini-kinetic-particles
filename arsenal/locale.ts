import { useSiteLanguage } from '../newsletter/site-language';

const english: Record<string, string> = {
  "未验证": "Unverified",
  "验收方案（待验证，非实测结果）": "Acceptance plan (unverified; no measured results)",
  "来源可信度不代表实测通过；本项目尚未验证，以下仅为演示与验收方案。": "Source credibility does not establish tested performance. This project is unverified; the following is a demo and acceptance plan.",
  "正常完成：在允许访问的公开测试页搜索已知关键词，返回匹配条目的标题与来源链接；逐项对照页面核验，不补造结果。": "Normal completion: search an allowed public test page for a known keyword. Return matching titles and source links; verify each against the page without inventing results.",
  "无匹配结果：使用预设不存在的关键词，明确报告“无匹配结果”及搜索词，不编造条目或继续无限重试。": "No matches: use a predetermined absent keyword. Report “no matches” and the search term; do not invent entries or retry indefinitely.",
  "访问受限：遇到登录要求、验证码、403 或站点禁止自动访问时停止；报告限制、最后完成步骤及未完成部分，不绕过限制。": "Access restricted: stop at login requirements, CAPTCHA, HTTP 403, or a ban on automated access. Report the restriction, last completed step and unfinished work; do not bypass it.",
  "待验证演示：让 AI 搜索网页并核对结果": "Unverified demo: let AI search the web and check results",
  "Browser Use 演示方案待验证：先测试搜索、无结果与访问受限三个场景。": "Unverified Browser Use demo plan: test search, no matches, and access restrictions.",
  "待验证方案：让 Agent 完成一次公开网页搜索": "Unverified plan: one public web search with an agent",
  "会上网的 AI：浏览器智能体演示方案（待验证）": "Browser agents: an unverified demo plan",
  "待验证：搜索并核对来源": "Planned: search and check sources",
  "待验证：无匹配结果": "Planned: no matches",
  "待验证：访问受限时停止并报告": "Planned: stop and report access restrictions"
};

/** Localize this review scope without rewriting existing Arsenal content. */
export function useArsenalReviewLanguage() {
  const locale = useSiteLanguage({ documentLanguage: false });
  return (text: string) => locale.t({ zh: text, en: english[text] ?? text });
}
