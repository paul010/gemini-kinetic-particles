- **download youtube video / 下載 YouTube 影片** → *yt-dlp-downloader*
  - Intent: 保存單支影音或音訊檔供離線使用。
  - Steps:
    1. 收集來源網址與格式需求（如僅音訊或指定 `format`）。
    2. 執行 `python3 01-system/tools/ops/yt-dlp-downloader/tool.py --url <URL> [其他參數]`，必要時在 `--extra-args` 前加 `--`。
    3. 檢查 `metadata.json` 與 `yt-dlp.log`，確認輸出檔案位置。
    4. 完成後使用工具自動產出的 `<slug>-avc.mp4`（影音預覽）與 `<slug>-preview.mp3`（純音訊預覽）；若 ffmpeg 不存在則僅保留原始檔與日誌。
  - Expected output: `03-outputs/yt-dlp-downloader/<run-id>/`
  - Notes: 使用 `--simulate` 可先驗證設定；`--audio-only` 會輸出 mp3（仍會另建 `*-preview.mp3` 供預覽）。
