# 北海道圖片景點行程整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依實際抵達時間與城市動線，把圖片景點整理進 2027 北海道十天行程頁。

**Architecture:** 保留單檔靜態頁架構，更新 `DEFAULT_DAYS` 並新增可渲染的 `IMAGE_ROUTE_DECISIONS` 區塊。以 Python QA 解析內嵌 JSON，驗證每日動線、冬季活動與排除項目。

**Tech Stack:** HTML、CSS、原生 JavaScript、Python 3 QA

**Spec:** `docs/superpowers/specs/2026-11-02-image-attraction-itinerary-design.md`

## Global Constraints

- 保留既有十天日期、拖曳、備份、匯出與詳情功能。
- 不改購物頁、473 筆商品、470 張 WebP 及其他旅遊資料。
- 活動時間以 2026–2027 官方資訊為準並保留天候／營運提醒。

## Review Focus

- 1/1 下午才到函館，不得把朝市當午餐主行程。
- 1 月札幌大通主燈區已結束，不得誤寫仍有大通主會場。
- 小樽動線不得從小樽站與南小樽來回折返。
- 1/7 團體停靠順序與企鵝散步不得寫成保證場次。
- 遠距離網走、釧路、登別必須標示此次不排。

---

### Task 1: 行程資料回歸測試

**Files:**
- Create: `scripts/qa_image_itinerary.py`
- Test: `scripts/qa_image_itinerary.py`

**Interfaces:**
- Consumes: `itinerary_2027.html` 的 `DEFAULT_DAYS` 與 `IMAGE_ROUTE_DECISIONS`
- Produces: 可重跑的行程內容與分類驗證

- [ ] **Step 1:** 寫入解析內嵌 JSON 並驗證 1/1、1/2、1/3、1/4、1/6、1/7、1/9 與排除城市。
- [ ] **Step 2:** 執行 `python3 scripts/qa_image_itinerary.py`，確認因資料尚未更新而失敗。

### Task 2: 更新每日時間軸與圖片景點取捨

**Files:**
- Modify: `itinerary_2027.html`
- Test: `scripts/qa_image_itinerary.py`

**Interfaces:**
- Consumes: 現有 `DEFAULT_DAYS` 卡片渲染模式
- Produces: 更新後 `DEFAULT_DAYS` 與 `IMAGE_ROUTE_DECISIONS`

- [ ] **Step 1:** 最小化更新六個相關日期，保留其他日期與欄位。
- [ ] **Step 2:** 新增取捨資料及對應卡片區塊，呈現固定／備選／不排。
- [ ] **Step 3:** 執行新 QA，確認通過。

### Task 3: 全站回歸、提交與發布

**Files:**
- Verify: `itinerary_2027.html`, `scripts/qa_image_itinerary.py`

**Interfaces:**
- Consumes: 完成的行程頁
- Produces: GitHub `main` 提交與部署狀態報告

- [ ] **Step 1:** 執行行程、購物、美食、JavaScript 語法與 diff 檢查。
- [ ] **Step 2:** 提交變更並更新 GitHub `main`。
- [ ] **Step 3:** 查核 Netlify 部署與正式頁面；若平台跳過，回報精確部署狀態。

