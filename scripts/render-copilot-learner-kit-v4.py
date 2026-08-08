#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import html
import json
import shutil
import zipfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "copilotdemo" / "course-data-v4.json"
SOURCE_MATERIALS = ROOT / "copilotdemo" / "materials-v4"
PUBLIC_ROOT = ROOT / "public" / "copilot-demo"
PUBLIC_V4 = PUBLIC_ROOT / "v4"
OUTPUT_PDF = ROOT / "output" / "pdf" / "CN-Print-Copilot-学员速查与行动卡-v4.pdf"
KIT_ROOT = ROOT / "output" / "learner-kit-v5" / "CN-Print-Copilot-Demo-Kit-v5-Simple"

INK = colors.HexColor("#201E1A")
MUTED = colors.HexColor("#6D655A")
GOLD = colors.HexColor("#9A6C21")
PAPER = colors.HexColor("#F7F3EA")
SURFACE = colors.HexColor("#FFFDF8")
LINE = colors.HexColor("#D9D0C1")
PALE_GOLD = colors.HexColor("#EEE2C8")


def ensure_dirs() -> None:
    if KIT_ROOT.exists():
        shutil.rmtree(KIT_ROOT)
    for path in (PUBLIC_ROOT, PUBLIC_V4, OUTPUT_PDF.parent, KIT_ROOT):
        path.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def copy_materials() -> None:
    mapping = {
        "Demo-2-M365-Copilot": "Demo-2-M365-Copilot",
        "Demo-3-SharePoint-Agent": "Demo-3-SharePoint-Agent",
    }
    for source_name, destination_name in mapping.items():
        destination = PUBLIC_V4 / destination_name
        destination.mkdir(parents=True, exist_ok=True)
        for source in (SOURCE_MATERIALS / source_name).iterdir():
            if source.is_file():
                shutil.copy2(source, destination / source.name)


def all_prompts_text(data: dict) -> str:
    lines = [
        "让 Copilot 真正上岗｜CN Print 提示词全集 V4",
        f"课程日期：{data['meta']['courseDate']}",
        f"公开页面：{data['meta']['publicUrl']}",
        "",
        "提醒：全部材料均为课程虚构数据。请不要粘贴真实客户、员工、账号或项目内容。",
    ]
    for index, demo in enumerate(data["demos"], 1):
        lines.extend(["", "=" * 72, f"Demo {index}｜{demo['title']}｜{demo['product']}", "=" * 72])
        for prompt in demo["prompts"]:
            lines.extend(["", f"[{prompt['label']}]", prompt["text"]])
    return "\n".join(lines)


def task_text(demo: dict) -> str:
    lines = [
        f"{demo['title']}｜学员任务卡 V4",
        f"对应：{demo['slide']}｜{demo['product']}｜{demo['duration']}",
        f"权限前提：{demo['access']}",
        "",
        "你收到的任务",
        demo["story"],
        "",
        "开始前先想一想",
        demo["question"],
        "",
        "跟着完成",
    ]
    lines.extend([f"{index}. {step}" for index, step in enumerate(demo["steps"], 1)])
    lines.extend(["", "全部提示词"])
    for prompt in demo["prompts"]:
        lines.extend(["", f"[{prompt['label']}]", prompt["text"]])
    lines.extend(["", "观察路径"])
    lines.extend([f"- {item}" for item in demo["observe"]])
    lines.extend(["", "完成后自检"])
    lines.extend([f"[ ] {item}" for item in demo["checks"]])
    lines.extend(["", "失败兜底"])
    lines.extend([f"- {item}" for item in demo["fallbacks"]])
    lines.extend(["", f"带走一句话：{demo['takeaway']}"])
    return "\n".join(lines)


def run_demo_text(demo: dict, index: int) -> str:
    lines = [
        f"Demo {index}｜{demo['title']}",
        f"工具：{demo['product']}｜建议时间：{demo['duration']}",
        "",
        "怎么演示",
    ]
    lines.extend([f"{step_index}. {step}" for step_index, step in enumerate(demo["steps"], 1)])
    lines.extend(["", "现场提示词（按顺序复制）"])
    for prompt_index, prompt in enumerate(demo["prompts"], 1):
        lines.extend(["", f"【{prompt_index}｜{prompt['label']}】", prompt["text"]])
    lines.extend(["", "最后只检查这三件事"])
    lines.extend([f"- {item}" for item in demo["checks"][:3]])
    lines.extend([
        "",
        "隐私提醒：全部材料均为课程虚构数据，不要替换成真实客户、员工、账号或项目资料。",
    ])
    return "\n".join(lines)


def simple_kit_start_html(data: dict) -> str:
    cards = []
    demo_folders = ["Demo-1-Copilot-Chat", "Demo-2-M365-Copilot", "Demo-3-Agent-Builder"]
    labels = ["任务说清", "事实查准", "方法复用"]
    for index, (demo, folder, label) in enumerate(zip(data["demos"], demo_folders, labels), 1):
        cards.append(
            f"<a class='card' href='./{folder}/00-RUN-DEMO.txt'>"
            f"<span>DEMO {index}</span><h2>{html.escape(label)}</h2>"
            f"<p>{html.escape(demo['title'])}</p><b>打开演示步骤与提示词 →</b></a>"
        )
    return f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CN Print Copilot｜精简演示包</title>
<style>
body{{margin:0;background:#f7f3ea;color:#201e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif}}
main{{max-width:980px;margin:auto;padding:48px 24px 80px}}h1{{font:700 52px/1.08 Georgia,'Songti SC',serif;margin:10px 0}}.lead{{font-size:20px;color:#6d655a}}.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:34px 0}}.card{{display:block;color:inherit;text-decoration:none;background:#fffdf8;border:1px solid #d9d0c1;border-radius:18px;padding:24px;min-height:190px}}.card:hover{{border-color:#9a6c21;transform:translateY(-2px)}}.card span,.eyebrow{{color:#9a6c21;font-size:12px;font-weight:700;letter-spacing:.12em}}.card h2{{font-size:28px;margin:14px 0 6px}}.card p{{color:#6d655a;min-height:44px}}.card b{{color:#7c5318}}.note{{border-left:4px solid #9a6c21;background:#fffdf8;padding:18px 20px;margin-top:28px}}.actions a{{color:#7c5318;font-weight:700}}@media(max-width:720px){{h1{{font-size:40px}}.grid{{grid-template-columns:1fr}}.card{{min-height:auto}}}}
</style></head><body><main>
<p class="eyebrow">CN PRINT · COPILOT SHARE · SIMPLE KIT</p>
<h1>打开一个 Demo，照着演示</h1>
<p class="lead">不需要先读整套课件。进入对应文件夹，先打开 <strong>00-RUN-DEMO.txt</strong>，再使用同文件夹里的虚构材料。</p>
<div class="grid">{''.join(cards)}</div>
<p class="actions"><a href="./01-ALL-PROMPTS.txt">只看全部提示词 →</a>　·　<a href="{html.escape(data['meta']['publicUrl'])}">打开线上学员页 →</a></p>
<div class="note"><strong>课上建议：</strong>跟着讲师只做一段也可以。没有权限就观察输入、输出变化和人工停止点。全部材料均为虚构，请勿放入真实业务数据。</div>
</main></body></html>"""


def start_html(data: dict, demo: dict | None = None) -> str:
    title = demo["title"] if demo else data["meta"]["title"]
    if demo:
        sections = [
            f"<p class='eyebrow'>{html.escape(demo['slide'])} · {html.escape(demo['product'])} · {html.escape(demo['duration'])}</p>",
            f"<h1>{html.escape(demo['title'])}</h1>",
            f"<p class='lead'>{html.escape(demo['story'])}</p>",
            f"<div class='callout'><strong>权限前提</strong><br>{html.escape(demo['access'])}</div>",
            "<h2>跟着完成</h2><ol>" + "".join(f"<li>{html.escape(item)}</li>" for item in demo["steps"]) + "</ol>",
            "<h2>全部提示词</h2>" + "".join(
                f"<article><strong>{html.escape(prompt['label'])}</strong><pre>{html.escape(prompt['text'])}</pre></article>"
                for prompt in demo["prompts"]
            ),
            "<h2>观察路径</h2><ul>" + "".join(f"<li>{html.escape(item)}</li>" for item in demo["observe"]) + "</ul>",
            f"<p class='callout'>{html.escape(demo['reference'])}</p>",
            "<h2>完成后自检</h2><ul class='check'>" + "".join(f"<li>□ {html.escape(item)}</li>" for item in demo["checks"]) + "</ul>",
            "<h2>遇到问题怎么办</h2><ul>" + "".join(f"<li>{html.escape(item)}</li>" for item in demo["fallbacks"]) + "</ul>",
        ]
    else:
        sections = [
            f"<p class='eyebrow'>CN PRINT · COPILOT SHARE · {html.escape(data['meta']['version'])}</p>",
            f"<h1>{html.escape(data['meta']['title'])}</h1>",
            f"<p class='lead'>{html.escape(data['meta']['subtitle'])}</p>",
            f"<div class='callout'><strong>隐私提醒</strong><br>{html.escape(data['meta']['privacy'])}</div>",
            "<h2>三段练习</h2><div class='grid'>" + "".join(
                f"<article><span>{html.escape(item['slide'])}</span><h3>{html.escape(item['title'])}</h3><p>{html.escape(item['status'])}</p></article>"
                for item in data["demos"]
            ) + "</div>",
            "<h2>建议顺序</h2><ol><li>先选择跟练或观察路径。</li><li>进入对应 Demo，复制提示词或阅读参考变化。</li><li>完成本地自检。</li><li>七天内把其中一个方法放进真实低风险任务。</li></ol>",
            f"<p><a href='{html.escape(data['meta']['publicUrl'])}'>打开最新学员页面</a></p>",
        ]
    return f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}｜CN Print 学员课件 V4</title>
<style>
body{{margin:0;background:#f7f3ea;color:#201e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;line-height:1.7}}
main{{max-width:900px;margin:auto;padding:48px 24px 80px}}h1{{font-family:Georgia,'Songti SC',serif;font-size:52px;line-height:1.08;margin:12px 0;color:#201e1a}}h2{{margin-top:42px;border-top:1px solid #d9d0c1;padding-top:22px}}h3{{font-size:22px;margin:8px 0}}.eyebrow{{color:#9a6c21;font-size:12px;font-weight:700;letter-spacing:.12em}}.lead{{font-size:21px;color:#6d655a}}.callout,article{{border:1px solid #d9d0c1;background:#fffdf8;border-radius:18px;padding:20px;margin:18px 0}}.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}pre{{white-space:pre-wrap;background:#f2ece0;border-radius:12px;padding:16px;overflow:auto}}a{{color:#7c5318;font-weight:700}}li{{margin:8px 0}}@media(max-width:700px){{h1{{font-size:40px}}.grid{{grid-template-columns:1fr}}main{{padding-top:28px}}}}
</style></head><body><main>{''.join(sections)}<footer><p>版本 {html.escape(data['meta']['version'])} · 更新 {html.escape(data['meta']['updated'])} · Project Lighthouse 为课程虚构案例</p></footer></main></body></html>"""


def build_text_and_html(data: dict) -> None:
    demo_dirs = [
        PUBLIC_V4 / "Demo-1-Copilot-Chat",
        PUBLIC_V4 / "Demo-2-M365-Copilot",
        PUBLIC_V4 / "Demo-3-SharePoint-Agent",
    ]
    for directory in demo_dirs:
        directory.mkdir(parents=True, exist_ok=True)

    demo1_background = """Project Lighthouse｜项目背景材料（课程虚构）
材料日期：2026-08-10

1. 8 月 18 日是内部试运行目标，不是外部发布日期。
2. Min 负责繁中截图，原计划 8 月 12 日，当前预计 8 月 13 日交付。
3. FAQ 保修期限存在 12 个月与 24 个月两个版本，当前未批准。
4. China Social 在批准前只保留 Draft，不排期、不发布。
5. 8 月 16 日来自旧计划，不能与 8 月 18 日合并。
6. 外部推广日期未确认。
7. 未知日期找 Project Lead Jia；保修冲突找 Policy Owner Alex。
8. 任何未知信息都不能由 AI 自行补齐。
"""
    write_text(demo_dirs[0] / "01-PROJECT-BACKGROUND.txt", demo1_background)

    for demo, directory in zip(data["demos"], demo_dirs):
        write_text(directory / "00-TASK-CARD.txt", task_text(demo))
        write_text(directory / "00-START-HERE.html", start_html(data, demo))
        write_text(directory / "ALL-PROMPTS.txt", "\n\n".join(f"[{p['label']}]\n{p['text']}" for p in demo["prompts"]))
        write_text(directory / "OBSERVATION-AND-FALLBACK.txt", "观察路径\n" + "\n".join(f"- {item}" for item in demo["observe"]) + "\n\n失败兜底\n" + "\n".join(f"- {item}" for item in demo["fallbacks"]))

    prompts = all_prompts_text(data)
    write_text(PUBLIC_ROOT / "CN-Print-Copilot-提示词全集-v4.txt", prompts)
    write_text(PUBLIC_ROOT / "CN-Print-Copilot-All-Prompts-v5.txt", prompts)
    write_text(KIT_ROOT / "01-ALL-PROMPTS.txt", prompts)
    write_text(KIT_ROOT / "00-START-HERE.html", simple_kit_start_html(data))


def make_styles():
    font_path = Path("/Library/Fonts/Arial Unicode.ttf")
    pdfmetrics.registerFont(TTFont("CourseCN", str(font_path)))
    styles = getSampleStyleSheet()
    return {
        "cover": ParagraphStyle("cover", parent=styles["Title"], fontName="CourseCN", fontSize=32, leading=39, textColor=INK, alignment=TA_LEFT, spaceAfter=8),
        "subtitle": ParagraphStyle("subtitle", parent=styles["BodyText"], fontName="CourseCN", fontSize=15, leading=23, textColor=GOLD, spaceAfter=12),
        "h1": ParagraphStyle("h1", parent=styles["Heading1"], fontName="CourseCN", fontSize=23, leading=30, textColor=INK, spaceAfter=12),
        "h2": ParagraphStyle("h2", parent=styles["Heading2"], fontName="CourseCN", fontSize=14, leading=20, textColor=GOLD, spaceBefore=7, spaceAfter=6),
        "body": ParagraphStyle("body", parent=styles["BodyText"], fontName="CourseCN", fontSize=9.5, leading=15, textColor=INK, spaceAfter=5),
        "small": ParagraphStyle("small", parent=styles["BodyText"], fontName="CourseCN", fontSize=8, leading=12, textColor=MUTED),
        "center": ParagraphStyle("center", parent=styles["BodyText"], fontName="CourseCN", fontSize=10, leading=15, textColor=INK, alignment=TA_CENTER),
        "cardTitle": ParagraphStyle("cardTitle", parent=styles["Heading2"], fontName="CourseCN", fontSize=14, leading=19, textColor=INK, alignment=TA_CENTER),
    }


def page_background(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFont("CourseCN", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9.5 * mm, "让 Copilot 真正上岗｜CN Print 学员课件 V4")
    canvas.drawRightString(width - 18 * mm, 9.5 * mm, f"{doc.page} / 8  ·  dailycosmos.net/copilot-demo")
    canvas.restoreState()


def bullet_rows(items: list[str], styles, marker: str = "□"):
    rows = []
    for item in items:
        rows.append([Paragraph(marker, styles["body"]), Paragraph(item, styles["body"])])
    table = Table(rows, colWidths=[8 * mm, 160 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def card_table(cards, styles):
    cells = []
    for title, body in cards:
        cells.append([Paragraph(title, styles["cardTitle"]), Spacer(1, 3 * mm), Paragraph(body, styles["small"])])
    table = Table([cells], colWidths=[55 * mm] * len(cells), hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.7, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return table


def build_pdf(data: dict) -> None:
    styles = make_styles()
    doc = SimpleDocTemplate(str(OUTPUT_PDF), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=21 * mm, title="让 Copilot 真正上岗｜CN Print 学员速查与行动卡 V4", author="Da Lei")
    story = []

    story += [Spacer(1, 18 * mm), Paragraph("CN PRINT · COPILOT SHARE · LEARNER KIT V4", styles["subtitle"]), Paragraph(data["meta"]["title"], styles["cover"]), Paragraph(data["meta"]["subtitle"], styles["subtitle"]), Spacer(1, 9 * mm)]
    story += [card_table([
        ("01 任务说清", "把模糊请求补成 Goal、Context、Expectations、Source。"),
        ("02 事实查准", "先分开已确认、冲突、缺失和行动项，再形成表达。"),
        ("03 方法复用", "用批准知识、明确指令和停止条件做小范围 Agent。"),
    ], styles), Spacer(1, 11 * mm)]
    story += [Paragraph("今晚不要求你记住所有产品名字。选一段最贴近自己的练习，完整走一遍，留下输入、结果、人工修改和一个仍待解决的问题。", styles["body"]), Spacer(1, 5 * mm), Paragraph("课程日期：2026-08-11　公开页面：dailycosmos.net/copilot-demo", styles["small"]), PageBreak()]

    story += [Paragraph("先选路径：跟练，还是观察？", styles["h1"]), card_table([
        ("我有对应权限", "用电脑下载材料、复制提示词、上传虚构文件并完成本地自检。跟不上不影响整体课程。"),
        ("我暂时没有入口", "阅读前后变化、参考事实结构和四类边界响应。手机端优先使用这条路径。"),
        ("我负责团队落地", "额外记录 Owner、批准来源、质量标准、人工停止点和复盘证据。"),
    ], styles), Spacer(1, 8 * mm), Paragraph("隐私与数据边界", styles["h2"]), Paragraph(data["meta"]["privacy"], styles["body"]), Spacer(1, 4 * mm), Paragraph("为什么我看不到同样的按钮？", styles["h2"]), bullet_rows(data["accessChecks"], styles, marker="•"), PageBreak()]

    for index, demo in enumerate(data["demos"], 1):
        story += [Paragraph(f"Demo {index}｜{demo['title']}", styles["h1"]), Paragraph(f"{demo['slide']} · {demo['product']} · {demo['duration']} · {demo['status']}", styles["subtitle"]), Paragraph(demo["story"], styles["body"]), Paragraph("核心问题", styles["h2"]), Paragraph(demo["question"], styles["body"]), Paragraph("现场顺序", styles["h2"]), bullet_rows(demo["steps"], styles, marker="→"), Paragraph("观察路径", styles["h2"]), bullet_rows(demo["observe"], styles, marker="•"), Paragraph("完成后自检", styles["h2"]), bullet_rows(demo["checks"], styles), Spacer(1, 3 * mm), Paragraph(f"带走一句话：{demo['takeaway']}", styles["subtitle"]), PageBreak()]

    story += [Paragraph("无权限观察卡｜我应该记录什么？", styles["h1"]), Paragraph("没有对应入口时，不需要停在账号问题上。用这张卡记录三段 Demo 的输入、变化、证据和人工停止点。", styles["body"]), Spacer(1, 4 * mm)]
    observation_rows = [[Paragraph("Demo", styles["body"]), Paragraph("输入是什么", styles["body"]), Paragraph("前后变化", styles["body"]), Paragraph("证据在哪里", styles["body"]), Paragraph("人在哪里判断", styles["body"])]]
    for number, demo in enumerate(data["demos"], 1):
        observation_rows.append([Paragraph(str(number), styles["body"]), Paragraph("　\n　\n　", styles["body"]), Paragraph("　\n　\n　", styles["body"]), Paragraph("　\n　\n　", styles["body"]), Paragraph("　\n　\n　", styles["body"])])
    observation = Table(observation_rows, colWidths=[14 * mm, 38 * mm, 42 * mm, 38 * mm, 40 * mm], rowHeights=[12 * mm] + [33 * mm] * 3)
    observation.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PALE_GOLD), ("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5), ("TOPPADDING", (0, 0), (-1, -1), 5)]))
    story += [observation, Spacer(1, 6 * mm), Paragraph("仍然看不懂时，回到三个问题：任务有没有说清？事实能不能回查？未知、冲突和越界时谁负责？", styles["subtitle"]), PageBreak()]

    story += [Paragraph("7 天 Copilot 行动卡", styles["h1"]), Paragraph("只选一个低风险、每周会出现、结果能够检查的小任务。", styles["body"]), Spacer(1, 5 * mm)]
    action_fields = [
        ("1. 我要改善的真实任务", 23),
        ("2. 当前基线：现在要多久、最容易返工在哪里", 23),
        ("3. 我会给 Copilot 哪些材料与边界", 26),
        ("4. 什么证据说明结果可用", 23),
        ("5. 哪一步必须由人判断", 23),
        ("6. 七天后：节省多少时间、返工是否减少、下次能否重复", 30),
    ]
    action_rows = []
    for label, height in action_fields:
        action_rows.append([Paragraph(label, styles["body"]), Paragraph("　", styles["body"])])
    action = Table(action_rows, colWidths=[62 * mm, 110 * mm], rowHeights=[h * mm for _, h in action_fields])
    action.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), PALE_GOLD), ("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 7)]))
    story += [action, PageBreak()]

    story += [Paragraph("Leader 落地卡 + 能力状态卡", styles["h1"]), Paragraph("先定责任与证据，再决定是否扩大范围。", styles["body"]), Paragraph("Leader 需要决定的五件事", styles["h2"]), bullet_rows(data["leaderChecks"], styles), Spacer(1, 5 * mm), Paragraph("三个新信号的状态", styles["h2"])]
    trend_rows = [[Paragraph("能力", styles["body"]), Paragraph("当前课堂状态", styles["body"]), Paragraph("必须说明的边界", styles["body"])]]
    for trend in data["trends"]:
        trend_rows.append([Paragraph(trend["title"], styles["body"]), Paragraph(trend["status"], styles["small"]), Paragraph(trend["caution"], styles["small"])])
    trend_table = Table(trend_rows, colWidths=[30 * mm, 60 * mm, 82 * mm])
    trend_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PALE_GOLD), ("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story += [trend_table, Spacer(1, 5 * mm), Paragraph("来源与状态核对日期：2026-08-08。最新链接请打开 dailycosmos.net/copilot-demo。", styles["small"])]

    doc.build(story, onFirstPage=page_background, onLaterPages=page_background)


def extract_pdf_pages(source: Path, destination: Path, page_indexes: list[int]) -> None:
    reader = PdfReader(str(source))
    writer = PdfWriter()
    for index in page_indexes:
        writer.add_page(reader.pages[index])
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as handle:
        writer.write(handle)


def build_kit(data: dict) -> None:
    demo_destinations = [
        KIT_ROOT / "Demo-1-Copilot-Chat",
        KIT_ROOT / "Demo-2-M365-Copilot",
        KIT_ROOT / "Demo-3-Agent-Builder",
    ]
    public_demo_sources = [
        PUBLIC_V4 / "Demo-1-Copilot-Chat",
        PUBLIC_V4 / "Demo-2-M365-Copilot",
        PUBLIC_V4 / "Demo-3-SharePoint-Agent",
    ]
    material_names = [
        ["01-PROJECT-BACKGROUND.txt"],
        ["01-PROJECT-EMAIL-THREAD.docx", "02-PROJECT-MEETING-NOTES.docx", "03-TEAMS-CHAT.txt", "04-PROJECT-STATUS.xlsx"],
        ["01-PROJECT-OVERVIEW.docx", "02-ROLES-AND-ESCALATION.docx", "03-COLLABORATION-PROCESS.docx", "04-FAQ.docx"],
    ]
    for index, (demo, source, destination, names) in enumerate(zip(data["demos"], public_demo_sources, demo_destinations, material_names), 1):
        destination.mkdir(parents=True, exist_ok=True)
        write_text(destination / "00-RUN-DEMO.txt", run_demo_text(demo, index))
        for name in names:
            shutil.copy2(source / name, destination / name)

    manifest = {
        "version": data["meta"]["version"],
        "updated": data["meta"]["updated"],
        "courseDate": data["meta"]["courseDate"],
        "publicUrl": data["meta"]["publicUrl"],
        "source": "copilotdemo/course-data-v4.json",
        "demoIds": [demo["id"] for demo in data["demos"]],
        "facts": {
            "oldPlan": "2026-08-16",
            "internalPilotTarget": "2026-08-18",
            "externalLaunch": "unconfirmed",
            "warranty": "12 vs 24 months conflict",
            "chinaSocial": "Draft until approval",
            "unknownDateOwner": "Jia",
            "warrantyConflictOwner": "Alex",
            "traditionalChineseScreenshotsOwner": "Min",
        },
    }
    zip_targets = [
        (PUBLIC_ROOT / "CN-Print-Copilot-Demo1-v5-Simple.zip", demo_destinations[0]),
        (PUBLIC_ROOT / "CN-Print-Copilot-Demo2-v5-Simple.zip", demo_destinations[1]),
        (PUBLIC_ROOT / "CN-Print-Copilot-Demo3-v5-Simple.zip", demo_destinations[2]),
    ]
    for zip_path, source_dir in zip_targets:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(source_dir.rglob("*")):
                if path.is_file():
                    archive.write(path, f"{source_dir.name}/{path.relative_to(source_dir).as_posix()}")

    full_zip = PUBLIC_ROOT / "CN-Print-Copilot-Demo-Kit-v5-Simple.zip"
    with zipfile.ZipFile(full_zip, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(KIT_ROOT.rglob("*")):
            if path.is_file():
                archive.write(path, f"{KIT_ROOT.name}/{path.relative_to(KIT_ROOT).as_posix()}")

    legacy_targets = [
        PUBLIC_ROOT / "CN-Print-Copilot-Demo1-Learner-Kit-v4.zip",
        PUBLIC_ROOT / "CN-Print-Copilot-Demo2-Learner-Kit-v4.zip",
        PUBLIC_ROOT / "CN-Print-Copilot-Demo3-Learner-Kit-v4.zip",
    ]
    for (zip_path, _), legacy_path in zip(zip_targets, legacy_targets):
        shutil.copy2(zip_path, legacy_path)
    shutil.copy2(full_zip, PUBLIC_ROOT / "CN-Print-Copilot-Learner-Kit-v4-20260811.zip")

    shutil.copy2(OUTPUT_PDF, PUBLIC_ROOT / OUTPUT_PDF.name)
    write_text(PUBLIC_ROOT / "course-manifest-v4.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    public_files = ["CN-Print-Copilot-All-Prompts-v5.txt"] + [path.name for path, _ in zip_targets] + [full_zip.name]
    write_text(PUBLIC_ROOT / "SHA256SUMS-v5.txt", "\n".join(f"{sha256(PUBLIC_ROOT / name)}  {name}" for name in public_files))


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    ensure_dirs()
    copy_materials()
    build_text_and_html(data)
    build_pdf(data)
    build_kit(data)
    print(json.dumps({
        "pdf": str(OUTPUT_PDF),
        "kit": str(PUBLIC_ROOT / "CN-Print-Copilot-Demo-Kit-v5-Simple.zip"),
        "pages": len(PdfReader(str(OUTPUT_PDF)).pages),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
