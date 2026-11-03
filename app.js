// 天空之心：漚汪 SEL 探索群島 — 互動介面與課程展示邏輯
(function () {
  const DATA = window.OWSEL_DATA;
  const SCENE = window.OWSEL_SCENE;

  // UI 狀態
  const state = {
    activeIsland: null,
    activeCourseId: null,
    selectedGrade: "all",
    searchQuery: "",
    foundMascots: new Set(),
    tourTimer: null,
    tourIndex: 0
  };

  // DOM 參照
  const islandNavEl = document.getElementById("islandNav");
  const leftSidebarEl = document.getElementById("leftSidebar");
  const sidebarListEl = document.getElementById("sidebarList");
  const sidebarSearchEl = document.getElementById("sidebarSearch");
  const gradeFilterBarEl = document.getElementById("gradeFilterBar");
  const sidebarCountEl = document.getElementById("sidebarCount");
  const detailPanelEl = document.getElementById("detailPanel");
  const panelTagEl = document.getElementById("panelTag");
  const panelTitleEl = document.getElementById("panelTitle");
  const panelSubEl = document.getElementById("panelSub");
  const panelBodyEl = document.getElementById("panelBody");
  const toastEl = document.getElementById("toast");

  // 課程全螢幕互動視窗 DOM
  const courseModalEl = document.getElementById("courseModal");
  const cmDomainPillEl = document.getElementById("cmDomainPill");
  const cmTitleEl = document.getElementById("cmTitle");
  const cmSubTitleEl = document.getElementById("cmSubTitle");
  const cmGradeSwitcherEl = document.getElementById("cmGradeSwitcher");
  const cmInfoDrawerEl = document.getElementById("cmInfoDrawer");
  const cmIframeEl = document.getElementById("cmIframe");
  const cmNewTabBtn = document.getElementById("cmNewTabBtn");
  const cmOrigSiteBtn = document.getElementById("cmOrigSiteBtn");

  // Toast 訊息提示
  let toastTimeout = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 3200);
  }

  // =========================================================
  // 1. 頂部「上方各島導覽鈕」渲染與互動
  // =========================================================
  function renderTopIslandNav() {
    let html =
      '<button class="island-nav-btn active" data-island="overview" title="拉遠俯瞰整座天空之心浮空群島">' +
      '<span>🌏 群島全景</span></button>';

    DATA.islandOrder.forEach(function (key) {
      const isl = DATA.islands[key];
      html +=
        '<button class="island-nav-btn" data-island="' +
        key +
        '" title="點擊拉近鏡頭細看：' +
        isl.name +
        "（" +
        isl.domain +
        '）">' +
        '<span class="nav-dot" style="background:' +
        isl.color +
        '"></span>' +
        "<span>" +
        isl.icon +
        " " +
        isl.name +
        "</span>" +
        '<span class="nav-domain">（' +
        isl.domain +
        "）</span>" +
        "</button>";
    });

    islandNavEl.innerHTML = html;

    islandNavEl.querySelectorAll(".island-nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const key = btn.dataset.island;
        stopTour();
        if (key === "overview") {
          resetToOverview();
        } else {
          selectIsland(key, true);
        }
      });
    });
  }

  function updateTopNavHighlight(activeKey) {
    islandNavEl.querySelectorAll(".island-nav-btn").forEach(function (btn) {
      const k = btn.dataset.island;
      const isAct = k === (activeKey || "overview");
      btn.classList.toggle("active", isAct);
      if (isAct && btn.scrollIntoView) {
        btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
    if (SCENE) {
      SCENE.setActiveNameplate(activeKey);
    }
  }

  // =========================================================
  // 2. 左側課程清單 (Left Course List) 渲染與篩選
  // =========================================================
  function renderGradeFilterBar() {
    const grades = [
      { id: "all", label: "全部 30 堂" },
      { id: "1", label: "一年級" },
      { id: "2", label: "二年級" },
      { id: "3", label: "三年級" },
      { id: "4", label: "四年級" },
      { id: "5", label: "五年級" },
      { id: "6", label: "六年級" }
    ];
    gradeFilterBarEl.innerHTML = grades
      .map(function (g) {
        return (
          '<button class="grade-chip' +
          (state.selectedGrade === g.id ? " active" : "") +
          '" data-grade="' +
          g.id +
          '">' +
          g.label +
          "</button>"
        );
      })
      .join("");

    gradeFilterBarEl.querySelectorAll(".grade-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.selectedGrade = chip.dataset.grade;
        renderGradeFilterBar();
        renderLeftCourseList();
      });
    });
  }

  function renderLeftCourseList() {
    const q = state.searchQuery.trim().toLowerCase();
    let totalMatched = 0;
    let html = "";

    // 天空之心（課程總覽）置頂入口
    const heart = DATA.islands.heart;
    const showHeart =
      state.selectedGrade === "all" &&
      (!q ||
        heart.name.toLowerCase().includes(q) ||
        heart.domain.toLowerCase().includes(q) ||
        heart.tagline.toLowerCase().includes(q));

    if (showHeart) {
      html +=
        '<div class="course-group">' +
        '<div class="course-group-header" data-island="heart">' +
        '<div class="cg-left">' +
        '<span class="cg-dot" style="background:' +
        heart.color +
        '"></span>' +
        '<span class="cg-title">' +
        heart.icon +
        " " +
        heart.name +
        "</span>" +
        '<span class="cg-sub">・' +
        heart.domain +
        "</span>" +
        "</div>" +
        '<span class="cg-zoom-tag">🔍 拉近看島</span>' +
        "</div>" +
        '<div class="course-group-items">' +
        '<div class="sidebar-course-item' +
        (state.activeIsland === "heart" ? " active" : "") +
        '" data-island-only="heart">' +
        '<div class="sci-main">' +
        '<div class="sci-top">' +
        '<span class="sci-grade" style="background:' +
        heart.color +
        '">總覽</span>' +
        '<span class="sci-title">課程學習架構</span>' +
        "</div>" +
        "</div>" +
        '<div class="sci-actions">' +
        '<button class="sci-btn-zoom" data-zoom-island="heart">鏡頭特寫</button>' +
        '<button class="sci-btn-open" data-open-matrix="1">架構表</button>' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";
    }

    // 五大 SEL 領域浮空島與各島 1~6 年級課程
    ["awareness", "management", "social", "relationship", "decision"].forEach(function (islandKey) {
      const isl = DATA.islands[islandKey];
      const matchedCourses = isl.courses.filter(function (c) {
        const gradeOk =
          state.selectedGrade === "all" || String(c.gradeNum) === state.selectedGrade;
        if (!gradeOk) return false;
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.subTitle.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          isl.name.toLowerCase().includes(q) ||
          isl.domain.toLowerCase().includes(q) ||
          c.keywords.join(" ").toLowerCase().includes(q)
        );
      });

      if (matchedCourses.length === 0) return;
      totalMatched += matchedCourses.length;

      html +=
        '<div class="course-group">' +
        '<div class="course-group-header" data-island="' +
        islandKey +
        '" title="點擊拉近鏡頭細看：' +
        isl.landmarkTitle +
        '">' +
        '<div class="cg-left">' +
        '<span class="cg-dot" style="background:' +
        isl.color +
        '"></span>' +
        '<span class="cg-title">' +
        isl.icon +
        " " +
        isl.name +
        "</span>" +
        '<span class="cg-sub">（' +
        isl.domain +
        "）</span>" +
        "</div>" +
        '<span class="cg-zoom-tag">🔍 拉近鏡頭</span>' +
        "</div>" +
        '<div class="course-group-items">';

      matchedCourses.forEach(function (c) {
        const isActive = state.activeCourseId === c.id;
        html +=
          '<div class="sidebar-course-item' +
          (isActive ? " active" : "") +
          '" data-course-id="' +
          c.id +
          '" data-island-id="' +
          islandKey +
          '">' +
          '<div class="sci-main">' +
          '<div class="sci-top">' +
          '<span class="sci-grade" style="background:' +
          isl.color +
          '">' +
          c.grade +
          "</span>" +
          '<span class="sci-title">' +
          c.title.replace(/^.+級－/, "") +
          "</span>" +
          "</div>" +
          "</div>" +
          '<div class="sci-actions">' +
          '<button class="sci-btn-zoom" data-zoom-course="' +
          c.id +
          '" data-island-id="' +
          islandKey +
          '" title="拉近鏡頭細看浮空島主題造景">看島</button>' +
          '<button class="sci-btn-open" data-launch-course="' +
          c.id +
          '" data-island-id="' +
          islandKey +
          '" title="立即開啟互動課程網頁">互動網頁</button>' +
          "</div>" +
          "</div>";
      });

      html += "</div></div>";
    });

    sidebarCountEl.textContent = "共 " + totalMatched + " 堂課";
    sidebarListEl.innerHTML =
      html ||
      '<div style="padding:28px 14px;text-align:center;color:var(--ink-soft);font-size:13px;">找不到符合條件的課程，請嘗試其他關鍵字或切換年級。</div>';

    // 綁定點擊事件
    sidebarListEl.querySelectorAll(".course-group-header").forEach(function (hdr) {
      hdr.addEventListener("click", function () {
        const key = hdr.dataset.island;
        stopTour();
        selectIsland(key, true);
      });
    });

    sidebarListEl.querySelectorAll("[data-island-only]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest("[data-open-matrix]")) {
          openMatrixModal();
          return;
        }
        selectIsland("heart", true);
      });
    });

    sidebarListEl.querySelectorAll(".sidebar-course-item[data-course-id]").forEach(function (row) {
      row.addEventListener("click", function (e) {
        const cId = row.dataset.courseId;
        const islKey = row.dataset.islandId;
        stopTour();

        // 若點擊「互動網頁」按鈕，同時拉近浮空島並開啟互動網頁視窗
        if (e.target.closest("[data-launch-course]")) {
          selectIsland(islKey, true, cId);
          openCourseModal(islKey, cId);
          return;
        }

        // 點擊課程列或「看島」按鈕：拉近鏡頭細看該座浮空島的主題造景與植物，並在右側面板高亮該課程
        state.activeCourseId = cId;
        selectIsland(islKey, true, cId);
        renderLeftCourseList();
      });
    });
  }

  // =========================================================
  // 3. 選擇浮空島 & 渲染右側深度資訊面板 (Right Detail Panel)
  // =========================================================
  function selectIsland(islandKey, moveCamera, highlightCourseId) {
    const isl = DATA.islands[islandKey];
    if (!isl) return;

    state.activeIsland = islandKey;
    if (highlightCourseId) {
      state.activeCourseId = highlightCourseId;
    }

    updateTopNavHighlight(islandKey);

    if (moveCamera && SCENE) {
      // 若指定了特定課程，可依據年級微調特寫至該島的不同地標角度，讓鏡頭更生動
      if (highlightCourseId && isl.landmarks && isl.landmarks.length > 0) {
        const cIdx = isl.courses.findIndex(function (c) {
          return c.id === highlightCourseId;
        });
        const lm = isl.landmarks[Math.max(0, cIdx) % isl.landmarks.length];
        SCENE.focusLandmark(lm.focus, lm.target);
        showToast("🎥 鏡頭已拉近至「" + isl.name + "」：" + lm.name);
      } else {
        SCENE.focusIsland(islandKey);
        showToast("🏝️ 飛抵「" + isl.name + "（" + isl.domain + "）」— 可點擊右側地標鈕細看造景與植物");
      }
    }

    renderRightPanel(isl, highlightCourseId);
    detailPanelEl.classList.add("open");
    // 響應式面板協調：在平板與手機尺寸下，開啟右側/底部島嶼面板時自動收合左側課程清單，避免互相遮擋 3D 浮空島
    if (window.innerWidth <= 1024) {
      leftSidebarEl.classList.add("collapsed");
    }
  }

  function renderRightPanel(isl, highlightCourseId) {
    panelTagEl.innerHTML =
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' +
      isl.color +
      '"></span> ' +
      isl.badge;
    panelTitleEl.textContent = isl.icon + " " + isl.name + "（" + isl.domain + "）";
    panelSubEl.textContent = isl.tagline;

    let html = "";

    // 1. 浮空島 3D 主題造景與隨風搖曳植物配置盒
    html +=
      '<div class="diorama-box">' +
      '<div class="diorama-row"><span>🏛️</span><div><strong>主題造景：</strong>' +
      isl.landmarkTitle +
      "</div></div>" +
      '<div class="diorama-row"><span>🌿</span><div><strong>植物細節：</strong>' +
      isl.botanyTitle +
      "</div></div>" +
      '<div class="diorama-row"><span>🚶</span><div><strong>動態場景：</strong>' +
      isl.sceneDesc +
      "</div></div>" +
      "</div>";

    // 2. 數據指標卡
    if (isl.stats && isl.stats.length) {
      html += '<div class="stat-grid">';
      isl.stats.forEach(function (st) {
        html +=
          '<div class="stat-card">' +
          '<div class="num">' +
          st.value +
          '<span class="unit">' +
          st.unit +
          "</span></div>" +
          '<div class="lbl">' +
          st.label +
          "</div>" +
          "</div>";
      });
      html += "</div>";
    }

    // 3. 3D 鏡頭特寫導覽鈕（點擊直接拉近鏡頭細看島上各項造景與植物）
    if (isl.landmarks && isl.landmarks.length) {
      html += '<div class="sec-title">🎥 點擊拉近鏡頭細看 3D 造景與植物細節</div>';
      html += '<div class="landmark-zoom-list">';
      isl.landmarks.forEach(function (lm, idx) {
        html +=
          '<div class="landmark-zoom-card" data-lm-idx="' +
          idx +
          '">' +
          '<div class="lzc-info">' +
          "<strong>🔭 " +
          lm.name +
          "</strong>" +
          "<span>" +
          lm.desc +
          "</span>" +
          "</div>" +
          '<span class="lzc-btn">拉近細看</span>' +
          "</div>";
      });
      html += "</div>";
    }

    // 4. 若為五大領域浮空島，顯示一至六年級共 6 堂互動課程卡片
    if (isl.courses && isl.courses.length > 0) {
      html +=
        '<div class="sec-title">📚 ' +
        isl.domain +
        "：一至六年級互動課程網頁（點擊立即體驗）</div>";
      html += '<div class="panel-course-grid">';
      isl.courses.forEach(function (c) {
        const isHighlighted = c.id === highlightCourseId;
        html +=
          '<div class="panel-course-card" id="pcc-' +
          c.id +
          '" data-open-course="' +
          c.id +
          '" style="' +
          (isHighlighted
            ? "border-color:" + isl.color + ";background:#fffaf0;box-shadow:0 0 0 2px " + isl.color + "33;"
            : "") +
          '">' +
          '<div class="pcc-head">' +
          '<span class="pcc-badge" style="background:' +
          isl.color +
          '">' +
          c.grade +
          "</span>" +
          '<button class="pcc-launch" data-launch-btn="' +
          c.id +
          '">▶ 開啟互動網頁</button>' +
          "</div>" +
          '<div class="pcc-title">' +
          c.title +
          "｜" +
          c.subTitle +
          "</div>" +
          '<div class="pcc-summary">' +
          c.summary +
          "</div>" +
          '<div class="pcc-tags">' +
          c.activities
            .map(function (act) {
              return '<span class="pcc-tag">' + act + "</span>";
            })
            .join("") +
          "</div>" +
          "</div>";
      });
      html += "</div>";
    }

    // 5. 若為「天空之心（課程總覽）」，顯示低中高年級螺旋發展脈絡與 5 大領域快速傳送門
    if (isl.stageProgression) {
      html += '<div class="sec-title">🧭 漚汪國小 1~6 年級 SEL 螺旋式課程發展藍圖</div>';
      html += '<ul class="feature-list">';
      isl.stageProgression.forEach(function (sp) {
        html +=
          "<li><strong>" +
          sp.stage +
          "｜" +
          sp.focus +
          "</strong><br>" +
          sp.desc +
          "</li>";
      });
      html += "</ul>";

      html +=
        '<div style="margin-top:12px;">' +
        '<button id="btnOpenFullMatrix" style="width:100%;padding:11px;border-radius:12px;border:0;background:var(--ink);color:#fff;font-weight:800;font-size:13px;cursor:pointer;">📊 開啟「五大領域 × 六個年級」30 堂互動課程總覽表</button>' +
        "</div>";
    }

    // 6. 領域核心理念與教學重點
    html += '<div class="sec-title">💡 領域核心理念與教學策略</div>';
    isl.intro.forEach(function (p) {
      html += '<p class="panel-p">' + p + "</p>";
    });

    if (isl.features && isl.features.length) {
      html += '<ul class="feature-list">';
      isl.features.forEach(function (f) {
        html += "<li>✦ " + f + "</li>";
      });
      html += "</ul>";
    }

    // 7. 領域前導教學簡報影片
    if (isl.videoEmbed) {
      html += '<div class="sec-title">🎬 ' + isl.videoTitle + "</div>";
      html +=
        '<div class="video-box">' +
        '<iframe src="' +
        isl.videoEmbed +
        '" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>' +
        "</div>";
    }

    panelBodyEl.innerHTML = html;

    // 綁定地標特寫點擊
    panelBodyEl.querySelectorAll(".landmark-zoom-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const idx = Number(card.dataset.lmIdx);
        const lm = isl.landmarks[idx];
        if (lm && SCENE) {
          SCENE.focusLandmark(lm.focus, lm.target);
          showToast("🔭 鏡頭特寫：" + lm.name);
        }
      });
    });

    // 綁定課程卡片點擊開啟全螢幕互動網頁
    panelBodyEl.querySelectorAll(".panel-course-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const cId = card.dataset.openCourse;
        openCourseModal(isl.id, cId);
      });
    });

    const matrixBtn = panelBodyEl.querySelector("#btnOpenFullMatrix");
    if (matrixBtn) {
      matrixBtn.addEventListener("click", openMatrixModal);
    }

    // 若有指定高亮課程，捲動至該課程卡片
    if (highlightCourseId) {
      setTimeout(function () {
        const targetEl = document.getElementById("pcc-" + highlightCourseId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 120);
    } else {
      panelBodyEl.scrollTop = 0;
    }
  }

  function resetToOverview() {
    state.activeIsland = null;
    state.activeCourseId = null;
    detailPanelEl.classList.remove("open");
    updateTopNavHighlight(null);
    renderLeftCourseList();
    if (SCENE) {
      SCENE.resetOverview();
    }
  }

  // =========================================================
  // 4. 互動課程網頁全螢幕展示視窗 (Course Interactive Modal)
  // =========================================================
  function openCourseModal(islandKey, courseId) {
    const isl = DATA.islands[islandKey];
    if (!isl || !isl.courses) return;
    const course = isl.courses.find(function (c) {
      return c.id === courseId;
    });
    if (!course) return;

    state.activeCourseId = course.id;
    renderLeftCourseList();

    cmDomainPillEl.style.background = isl.color;
    cmDomainPillEl.textContent = isl.icon + " " + isl.name + "・" + isl.domain;
    cmTitleEl.textContent = course.title;
    cmSubTitleEl.textContent = course.subTitle;

    // 渲染同領域 1~6 年級快速切換鈕
    cmGradeSwitcherEl.innerHTML = isl.courses
      .map(function (c) {
        return (
          '<button class="cm-grade-btn' +
          (c.id === course.id ? " active" : "") +
          '" data-switch-course="' +
          c.id +
          '">' +
          c.grade +
          "</button>"
        );
      })
      .join("");

    cmGradeSwitcherEl.querySelectorAll(".cm-grade-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        openCourseModal(islandKey, b.dataset.switchCourse);
      });
    });

    // 渲染左側課程教學指引抽屜
    cmInfoDrawerEl.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:' +
      isl.color +
      ';margin-bottom:4px;">' +
      isl.domain +
      " / " +
      course.grade +
      "</div>" +
      '<h4 style="font-size:16px;font-weight:800;margin-bottom:8px;">' +
      course.title +
      "</h4>" +
      '<p style="font-size:12.5px;line-height:1.6;color:var(--ink-soft);margin-bottom:14px;">' +
      course.summary +
      "</p>" +
      '<div style="font-size:12px;font-weight:800;margin-bottom:6px;">🎯 學習目標</div>' +
      '<ul style="padding-left:16px;font-size:12px;line-height:1.65;color:var(--ink);margin-bottom:14px;">' +
      course.objectives
        .map(function (o) {
          return "<li>" + o + "</li>";
        })
        .join("") +
      "</ul>" +
      '<div style="font-size:12px;font-weight:800;margin-bottom:6px;">🕹️ 互動學習活動</div>' +
      '<ul style="padding-left:16px;font-size:12px;line-height:1.65;color:var(--ink);margin-bottom:14px;">' +
      course.activities
        .map(function (a) {
          return "<li>" + a + "</li>";
        })
        .join("") +
      "</ul>" +
      '<div style="padding:10px;border-radius:12px;background:var(--paper-2);border:1px solid var(--line);font-size:11.5px;color:var(--ink-soft);line-height:1.5;">' +
      "💡 右側為完整內嵌的互動課程網頁，可直接點擊操作所有按鈕、溫度計、呼吸計時器與闖關遊戲！" +
      "</div>";

    // 響應式抽屜：在窄螢幕或行動裝置下預設收合左側教學指引抽屜，讓互動課程網頁擁有 100% 滿版操作空間
    if (window.innerWidth <= 1024) {
      cmInfoDrawerEl.classList.add("hidden");
    } else {
      cmInfoDrawerEl.classList.remove("hidden");
    }

    cmIframeEl.src = course.localFile;
    cmNewTabBtn.href = course.localFile;
    cmOrigSiteBtn.href = course.originalUrl;

    courseModalEl.classList.add("open");
  }

  function closeCourseModal() {
    courseModalEl.classList.remove("open");
    cmIframeEl.src = "about:blank";
  }

  // =========================================================
  // 5. 30 堂課程全景矩陣表 (5 大領域 × 1~6 年級)
  // =========================================================
  const matrixModalEl = document.getElementById("matrixModal");
  const matrixBodyEl = document.getElementById("matrixBody");

  function openMatrixModal() {
    const domains = ["awareness", "management", "social", "relationship", "decision"];
    let html =
      '<p style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">' +
      DATA.siteInfo.frameworkSummary +
      "</p>";

    html += '<table class="matrix-table"><thead><tr><th>年級 \\ 領域浮空島</th>';
    domains.forEach(function (dKey) {
      const isl = DATA.islands[dKey];
      html +=
        '<th style="border-top:3px solid ' +
        isl.color +
        '">' +
        isl.icon +
        " " +
        isl.name +
        "<br><span style=\"font-size:11px;color:var(--ink-soft)\">（" +
        isl.domain +
        "）</span></th>";
    });
    html += "</tr></thead><tbody>";

    for (let g = 1; g <= 6; g++) {
      html += "<tr><th>" + g + " 年級</th>";
      domains.forEach(function (dKey) {
        const isl = DATA.islands[dKey];
        const c = isl.courses.find(function (item) {
          return item.gradeNum === g;
        });
        if (c) {
          html +=
            '<td class="matrix-cell" data-m-island="' +
            dKey +
            '" data-m-course="' +
            c.id +
            '">' +
            '<div class="mc-title" style="color:' +
            isl.color +
            '">' +
            c.title.replace(/^.+級－/, "") +
            "</div>" +
            '<div class="mc-sub">' +
            c.subTitle +
            "</div>" +
            "</td>";
        } else {
          html += "<td>-</td>";
        }
      });
      html += "</tr>";
    }
    html += "</tbody></table>";
    matrixBodyEl.innerHTML = html;

    matrixBodyEl.querySelectorAll(".matrix-cell").forEach(function (cell) {
      cell.addEventListener("click", function () {
        const dKey = cell.dataset.mIsland;
        const cId = cell.dataset.mCourse;
        matrixModalEl.classList.remove("open");
        selectIsland(dKey, true, cId);
        openCourseModal(dKey, cId);
      });
    });

    matrixModalEl.classList.add("open");
  }

  // =========================================================
  // 6. SEL 心靈浮空島適性小測驗
  // =========================================================
  const quizModalEl = document.getElementById("quizModal");
  const quizContentEl = document.getElementById("quizContent");
  let quizStep = 0;
  let quizScores = {};

  function openQuizModal() {
    quizStep = 0;
    quizScores = { awareness: 0, management: 0, social: 0, relationship: 0, decision: 0 };
    renderQuizStep();
    quizModalEl.classList.add("open");
  }

  function renderQuizStep() {
    if (quizStep < DATA.quiz.length) {
      const item = DATA.quiz[quizStep];
      quizContentEl.innerHTML =
        '<div class="quiz-q">Q' +
        (quizStep + 1) +
        ". " +
        item.q +
        "</div>" +
        '<div class="quiz-opts">' +
        item.a
          .map(function (opt, idx) {
            return (
              '<button class="quiz-opt" data-opt="' +
              idx +
              '">' +
              opt[0] +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="quiz-prog">第 ' +
        (quizStep + 1) +
        " / " +
        DATA.quiz.length +
        " 題</div>";

      quizContentEl.querySelectorAll(".quiz-opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const weights = item.a[Number(btn.dataset.opt)][1];
          Object.keys(weights).forEach(function (k) {
            if (quizScores[k] !== undefined) quizScores[k] += weights[k];
          });
          quizStep++;
          renderQuizStep();
        });
      });
    } else {
      let bestKey = "awareness";
      let bestVal = -1;
      Object.keys(quizScores).forEach(function (k) {
        if (quizScores[k] > bestVal) {
          bestVal = quizScores[k];
          bestKey = k;
        }
      });
      const isl = DATA.islands[bestKey];
      quizContentEl.innerHTML =
        '<div style="text-align:center;padding:10px 0;">' +
        '<div style="font-size:44px;margin-bottom:8px;">' +
        isl.icon +
        "</div>" +
        '<div style="font-size:12px;font-weight:800;color:' +
        isl.color +
        '">你的今日心靈共鳴島嶼</div>' +
        '<h4 style="font-size:22px;font-weight:900;margin:4px 0 8px;">' +
        isl.name +
        "（" +
        isl.domain +
        "）</h4>" +
        '<p style="font-size:13px;color:var(--ink-soft);line-height:1.6;margin-bottom:16px;">' +
        isl.tagline +
        "<br>島上主題造景：<strong>" +
        isl.landmarkTitle +
        "</strong></p>" +
        '<button id="quizFlyBtn" style="padding:11px 24px;border-radius:999px;border:0;background:var(--ink);color:#fff;font-weight:800;cursor:pointer;">✈️ 立即拉近鏡頭飛往「' +
        isl.name +
        "」</button>" +
        "</div>";

      document.getElementById("quizFlyBtn").addEventListener("click", function () {
        quizModalEl.classList.remove("open");
        selectIsland(bestKey, true);
      });
    }
  }

  // =========================================================
  // 7. 自動巡航導覽模式 (Guided Archipelago Tour)
  // =========================================================
  const tourBannerEl = document.getElementById("tourBanner");
  const tourTextEl = document.getElementById("tourText");
  const btnTourToggle = document.getElementById("btnTour");

  function startTour() {
    state.tourIndex = 0;
    tourBannerEl.classList.add("on");
    btnTourToggle.classList.add("active");
    runTourStep();
    state.tourTimer = setInterval(function () {
      state.tourIndex = (state.tourIndex + 1) % DATA.islandOrder.length;
      runTourStep();
    }, 6500);
  }

  function runTourStep() {
    const key = DATA.islandOrder[state.tourIndex];
    const isl = DATA.islands[key];
    selectIsland(key, true);
    tourTextEl.textContent =
      "🎬 空中巡航導覽 (" +
      (state.tourIndex + 1) +
      "/" +
      DATA.islandOrder.length +
      ")：" +
      isl.name +
      " — " +
      isl.landmarkTitle;
  }

  function stopTour() {
    if (state.tourTimer) {
      clearInterval(state.tourTimer);
      state.tourTimer = null;
    }
    tourBannerEl.classList.remove("on");
    if (btnTourToggle) btnTourToggle.classList.remove("active");
  }

  // =========================================================
  // 8. 事件綁定與初始化
  // =========================================================
  function initEvents() {
    // 左側課程清單收合與展開（響應式：小螢幕展開左側清單時自動收起島嶼詳情面板）
    const btnCollapseSidebar = document.getElementById("btnCollapseSidebar");
    const btnOpenSidebarTab = document.getElementById("btnOpenSidebarTab");
    if (window.innerWidth <= 960) {
      leftSidebarEl.classList.add("collapsed");
    }
    btnCollapseSidebar.addEventListener("click", function () {
      leftSidebarEl.classList.add("collapsed");
    });
    btnOpenSidebarTab.addEventListener("click", function () {
      leftSidebarEl.classList.remove("collapsed");
      if (window.innerWidth <= 960) {
        detailPanelEl.classList.remove("open");
      }
    });

    // 左側搜尋框
    sidebarSearchEl.addEventListener("input", function () {
      state.searchQuery = sidebarSearchEl.value;
      renderLeftCourseList();
    });

    // 右側面板關閉
    document.getElementById("panelClose").addEventListener("click", function () {
      detailPanelEl.classList.remove("open");
    });

    // 品牌點擊回全景
    document.getElementById("brandHome").addEventListener("click", function () {
      stopTour();
      resetToOverview();
    });

    // 底部工具列按鈕
    document.getElementById("btnOverview").addEventListener("click", function () {
      stopTour();
      resetToOverview();
    });

    document.getElementById("btnTopView").addEventListener("click", function () {
      stopTour();
      if (SCENE) SCENE.setTopView();
      showToast("🦅 已切換至雲海高空俯瞰視角");
    });

    btnTourToggle.addEventListener("click", function () {
      if (state.tourTimer) stopTour();
      else startTour();
    });

    document.getElementById("btnStopTour").addEventListener("click", stopTour);

    document.getElementById("btnMatrix").addEventListener("click", openMatrixModal);
    document.getElementById("matrixClose").addEventListener("click", function () {
      matrixModalEl.classList.remove("open");
    });

    document.getElementById("btnQuiz").addEventListener("click", openQuizModal);
    document.getElementById("quizClose").addEventListener("click", function () {
      quizModalEl.classList.remove("open");
    });

    const btnLinks = document.getElementById("btnLinks");
    btnLinks.addEventListener("click", function () {
      if (!SCENE) return;
      const visible = SCENE.toggleLinks();
      btnLinks.classList.toggle("active", visible);
      showToast(visible ? "🔗 已顯示五大 SEL 浮空島跨域共鳴能量線" : "🔗 已隱藏跨域能量線");
    });

    const btnTime = document.getElementById("btnTime");
    const weatherTextEl = document.getElementById("weatherText");
    function handleCycleTime() {
      if (!SCENE) return;
      const mode = SCENE.cycleTimeOfDay();
      const labels = ["☀️ 晨曦雲海", "🌇 暖金夕暮", "🌙 星夜微光"];
      btnTime.textContent = labels[mode];
      if (weatherTextEl) weatherTextEl.textContent = labels[mode] + "・微風搖曳";
      showToast("已切換天空之心天色：" + labels[mode]);
    }
    btnTime.addEventListener("click", handleCycleTime);
    document.getElementById("weatherPill").addEventListener("click", handleCycleTime);

    // 課程互動視窗按鈕
    document.getElementById("cmCloseBtn").addEventListener("click", closeCourseModal);
    document.getElementById("cmToggleInfoBtn").addEventListener("click", function () {
      cmInfoDrawerEl.classList.toggle("hidden");
    });

    // ESC 鍵關閉彈窗
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (courseModalEl.classList.contains("open")) closeCourseModal();
        else if (matrixModalEl.classList.contains("open")) matrixModalEl.classList.remove("open");
        else if (quizModalEl.classList.contains("open")) quizModalEl.classList.remove("open");
        else if (detailPanelEl.classList.contains("open")) resetToOverview();
      }
    });

    // 開場畫面進入按鈕
    const introScreen = document.getElementById("introScreen");
    document.getElementById("introEnterBtn").addEventListener("click", function () {
      introScreen.classList.add("hide");
      showToast("✨ 歡迎來到天空之心！點擊上方各島導覽鈕或左側課程清單即可拉近鏡頭探索");
    });
    setTimeout(function () {
      introScreen.classList.add("hide");
    }, 1800);
  }

  // 雲端心靈小松鼠收集回呼
  function onMascotFound(islandId) {
    state.foundMascots.add(islandId);
    const el = document.getElementById("mascotCounter");
    if (el) {
      el.textContent = "🐿️ 精靈 " + state.foundMascots.size + "/6";
    }
    if (state.foundMascots.size === 6) {
      showToast("🎉 恭喜！你找齊了六座浮空島上所有的雲端心靈小松鼠！");
    }
  }

  // 啟動渲染
  renderTopIslandNav();
  renderGradeFilterBar();
  renderLeftCourseList();
  initEvents();

  window.OWSEL_APP = {
    selectIsland: selectIsland,
    openCourseModal: openCourseModal,
    onMascotFound: onMascotFound
  };
})();
