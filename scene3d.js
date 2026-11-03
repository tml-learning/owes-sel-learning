// 天空之心：漚汪 SEL 探索群島 — 3D 微縮模型浮空島場景引擎 (Three.js r128)
// 致敬「南大附中探索群島」手作微縮模型質感，打造六大浮空島、主題造景、隨微風搖曳植物與走動人物

(function () {
  const DATA = window.OWSEL_DATA;
  const THREE = window.THREE;

  const canvas = document.getElementById("stage");
  const labelsRoot = document.getElementById("labels");

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb5dff8);
  scene.fog = new THREE.Fog(0xb5dff8, 120, 260);

  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.5,
    320
  );

  // =========================================================
  // 1. 燈光系統（支援 晨曦雲海 / 暖金夕暮 / 星夜微光）
  // =========================================================
  const hemiLight = new THREE.HemisphereLight(0xfffaf0, 0x6e9c75, 0.62);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff1d0, 1.08);
  sunLight.position.set(34, 52, 28);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 8;
  sunLight.shadow.camera.far = 140;
  const shadowRange = 46;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x9bd3ff, 0.34);
  fillLight.position.set(-32, 22, -26);
  scene.add(fillLight);

  // =========================================================
  // 2. 材質快取與共用小工具
  // =========================================================
  const matCache = new Map();
  function getMat(color, opts) {
    opts = opts || {};
    const key = color + "_" + JSON.stringify(opts);
    if (!matCache.has(key)) {
      matCache.set(
        key,
        new THREE.MeshStandardMaterial(
          Object.assign(
            {
              color: color,
              roughness: 0.78,
              metalness: 0.06,
              flatShading: true
            },
            opts
          )
        )
      );
    }
    return matCache.get(key);
  }

  function enableShadow(obj, cast, receive) {
    if (cast === undefined) cast = true;
    if (receive === undefined) receive = true;
    obj.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = cast;
        child.receiveShadow = receive;
      }
    });
    return obj;
  }

  // 隨高空微風輕柔搖曳註冊器
  const windSwayItems = [];
  function registerWindSway(obj, amp, speed, phase) {
    windSwayItems.push({
      obj: obj,
      baseRx: obj.rotation.x,
      baseRz: obj.rotation.z,
      amp: amp !== undefined ? amp : 0.055,
      speed: speed !== undefined ? speed : 1.6,
      phase:
        phase !== undefined
          ? phase
          : (obj.position.x * 0.7 + obj.position.z * 0.9) % (Math.PI * 2)
    });
    return obj;
  }

  // =========================================================
  // 3. 浮空島底座（多層手作為縮模型斷崖 + 底部垂根 + 漂浮碎岩）
  // =========================================================
  function createFloatingIslandBase(radius, grassColor, cliffColor, stripeColor) {
    const group = new THREE.Group();

    // 頂部翠綠草皮層（微斜切八角圓盤）
    const topGeo = new THREE.CylinderGeometry(radius, radius * 1.03, 0.56, 12);
    const topMesh = new THREE.Mesh(topGeo, getMat(grassColor, { roughness: 0.85 }));
    topMesh.position.y = -0.28;
    group.add(topMesh);

    // 島嶼領域主題色腰帶環
    const stripeGeo = new THREE.CylinderGeometry(radius * 1.025, radius * 1.01, 0.24, 12);
    const stripeMesh = new THREE.Mesh(stripeGeo, getMat(stripeColor, { roughness: 0.6 }));
    stripeMesh.position.y = -0.66;
    group.add(stripeMesh);

    // 中層暖土岩壁
    const midGeo = new THREE.CylinderGeometry(radius * 1.0, radius * 0.78, 1.35, 10);
    const midMesh = new THREE.Mesh(midGeo, getMat(cliffColor, { roughness: 0.9 }));
    midMesh.position.y = -1.42;
    group.add(midMesh);

    // 下層收束浮空岩錐
    const lowGeo = new THREE.CylinderGeometry(radius * 0.76, radius * 0.34, 1.9, 9);
    const lowMesh = new THREE.Mesh(lowGeo, getMat(0x8c6d53, { roughness: 0.92 }));
    lowMesh.position.y = -2.95;
    lowMesh.rotation.y = 0.3;
    group.add(lowMesh);

    // 底部尖端與奇幻能量晶石
    const tipGeo = new THREE.ConeGeometry(radius * 0.34, 1.5, 7);
    const tipMesh = new THREE.Mesh(tipGeo, getMat(0x6e5540, { roughness: 0.95 }));
    tipMesh.rotation.x = Math.PI;
    tipMesh.position.y = -4.6;
    group.add(tipMesh);

    // 島底懸垂鐘乳岩柱與氣根
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + 0.2;
      const dist = radius * (0.42 + (i % 3) * 0.14);
      const h = 0.9 + (i % 3) * 0.55;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.32 + (i % 2) * 0.12, h, 6),
        getMat(i % 2 === 0 ? 0x7c6049 : cliffColor)
      );
      spire.rotation.x = Math.PI;
      spire.position.set(
        Math.cos(ang) * dist,
        -2.7 - (i % 2) * 0.6,
        Math.sin(ang) * dist
      );
      group.add(spire);
    }

    // 環繞島底的小漂浮伴生碎石
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + 0.5;
      const dist = radius * 1.16 + (i % 2) * 0.5;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32 + (i % 2) * 0.14, 0),
        getMat(cliffColor)
      );
      rock.position.set(
        Math.cos(ang) * dist,
        -1.2 - (i % 3) * 0.65,
        Math.sin(ang) * dist
      );
      rock.scale.set(1.2, 0.75, 1.0);
      group.add(rock);
    }

    return enableShadow(group, true, true);
  }

  // =========================================================
  // 4. 各島專屬植物與花叢模型（皆具備隨高空微風輕柔搖曳動態）
  // =========================================================

  // (A) 澄鏡浮島：水岸翠柳 (Weeping Willow)
  function createWeepingWillow(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * scale, 0.18 * scale, 1.15 * scale, 6),
      getMat(0x7c583a)
    );
    trunk.position.y = 0.57 * scale;
    trunk.rotation.z = 0.08;
    g.add(trunk);

    const crown = new THREE.Group();
    crown.position.y = 1.15 * scale;
    const mainCap = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.62 * scale, 0),
      getMat(0x5ebc7d)
    );
    mainCap.scale.set(1.15, 0.78, 1.15);
    crown.add(mainCap);

    // 垂柳枝條（隨微風雙重擺動）
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const frond = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03 * scale, 0.08 * scale, 0.95 * scale, 5),
        getMat(i % 2 === 0 ? 0x74d18e : 0x52ad72)
      );
      frond.position.set(
        Math.cos(ang) * 0.48 * scale,
        -0.36 * scale,
        Math.sin(ang) * 0.48 * scale
      );
      crown.add(frond);
      registerWindSway(frond, 0.09, 2.2, i * 0.9);
    }

    g.add(crown);
    enableShadow(g);
    return registerWindSway(g, 0.065, 1.7);
  }

  // (B) 澄鏡浮島：湖心藍蓮花 (Blue Lotus on Lily Pad)
  function createBlueLotus(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 0.04 * scale, 9),
      getMat(0x4ca86c)
    );
    pad.position.y = 0.02 * scale;
    g.add(pad);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.ConeGeometry(0.09 * scale, 0.22 * scale, 5),
        getMat(i % 2 === 0 ? 0x7fd4ff : 0x45aef5, { roughness: 0.45 })
      );
      petal.position.set(Math.cos(a) * 0.09 * scale, 0.11 * scale, Math.sin(a) * 0.09 * scale);
      petal.rotation.z = -Math.cos(a) * 0.45;
      petal.rotation.x = Math.sin(a) * 0.45;
      g.add(petal);
    }

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.065 * scale, 6, 5),
      getMat(0xffdf6b, { emissive: 0xffb830, emissiveIntensity: 0.25 })
    );
    core.position.y = 0.12 * scale;
    g.add(core);
    return registerWindSway(g, 0.04, 1.5);
  }

  // (C) 澄鏡浮島：冰藍花叢 (Ice-Blue Flower Bush)
  function createIceBlueBush(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const leaf = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.32 * scale, 0),
      getMat(0x4fa685)
    );
    leaf.scale.set(1.2, 0.75, 1.1);
    leaf.position.y = 0.22 * scale;
    g.add(leaf);

    const colors = [0x8ee2ff, 0x4fc3f7, 0xd4f5ff];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const fl = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.085 * scale, 0),
        getMat(colors[i % colors.length], { emissive: 0x38a3d8, emissiveIntensity: 0.15 })
      );
      fl.position.set(
        Math.cos(a) * 0.2 * scale,
        (0.34 + (i % 2) * 0.06) * scale,
        Math.sin(a) * 0.2 * scale
      );
      g.add(fl);
    }
    enableShadow(g);
    return registerWindSway(g, 0.06, 2.0);
  }

  // (D) 定心浮島：三層蒼翠松柏 (Three-Tiered Lush Pine/Cypress)
  function createThreeTierPine(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09 * scale, 0.14 * scale, 0.65 * scale, 6),
      getMat(0x6e4b30)
    );
    trunk.position.y = 0.32 * scale;
    g.add(trunk);

    const tierColors = [0x246e48, 0x2e8558, 0x3da16c];
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry((0.62 - i * 0.13) * scale, (0.72 - i * 0.08) * scale, 7),
        getMat(tierColors[i])
      );
      cone.position.y = (0.75 + i * 0.42) * scale;
      g.add(cone);
    }
    enableShadow(g);
    return registerWindSway(g, 0.055, 1.6);
  }

  // (E) 定心浮島：修剪整齊的圓球綠籬 (Spherical Topiary Hedge)
  function createSphericalTopiary(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.14 * scale, 0.22 * scale, 8),
      getMat(0xc99668)
    );
    pot.position.y = 0.11 * scale;
    g.add(pot);

    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34 * scale, 1),
      getMat(0x47a85b)
    );
    sphere.position.y = 0.48 * scale;
    g.add(sphere);

    const topBall = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.19 * scale, 1),
      getMat(0x5bc26e)
    );
    topBall.position.y = 0.88 * scale;
    g.add(topBall);

    enableShadow(g);
    return registerWindSway(g, 0.045, 1.9);
  }

  // (F) 共鳴浮島：粉紅櫻花樹 (Pink Cherry Blossom Tree)
  function createSakuraTree(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * scale, 0.16 * scale, 0.88 * scale, 6),
      getMat(0x5c382c)
    );
    trunk.position.y = 0.44 * scale;
    g.add(trunk);

    const pinks = [0xf26498, 0xe04882, 0xff82b0];
    const offsets = [
      [0, 1.05, 0, 0.56],
      [-0.32, 0.95, 0.2, 0.42],
      [0.34, 0.98, -0.15, 0.44],
      [0.1, 1.28, 0.22, 0.38]
    ];
    offsets.forEach(function (o, idx) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(o[3] * scale, 0),
        getMat(pinks[idx % pinks.length])
      );
      puff.position.set(o[0] * scale, o[1] * scale, o[2] * scale);
      g.add(puff);
    });
    enableShadow(g);
    return registerWindSway(g, 0.065, 1.75);
  }

  // (G) 共鳴浮島：暖杏玫瑰花圃 (Warm Apricot Rose Flowerbed)
  function createRoseFlowerbed(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(0.95 * scale, 0.16 * scale, 0.56 * scale),
      getMat(0xb88458)
    );
    border.position.y = 0.08 * scale;
    g.add(border);

    const foliage = new THREE.Mesh(
      new THREE.BoxGeometry(0.84 * scale, 0.14 * scale, 0.46 * scale),
      getMat(0x52a358)
    );
    foliage.position.y = 0.18 * scale;
    g.add(foliage);

    const roseColors = [0xffab84, 0xf77e88, 0xffcba4, 0xf26b8a];
    for (let i = 0; i < 6; i++) {
      const rx = ((i % 3) - 1) * 0.25 * scale;
      const rz = (Math.floor(i / 3) - 0.5) * 0.18 * scale;
      const rose = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.085 * scale, 0),
        getMat(roseColors[i % roseColors.length])
      );
      rose.position.set(rx, 0.29 * scale, rz);
      g.add(rose);
    }
    enableShadow(g);
    return registerWindSway(g, 0.05, 2.1);
  }

  // (H) 共鳴浮島：島緣垂崖長春藤 (Cliff-Hanging Ivy Vine)
  function createHangingIvy(length) {
    length = length || 1.8;
    const g = new THREE.Group();
    const count = 6;
    for (let i = 0; i < count; i++) {
      const leaf = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.16 - i * 0.015, 0),
        getMat(i % 2 === 0 ? 0x4ca65b : 0x68c474)
      );
      leaf.position.set(
        Math.sin(i * 1.2) * 0.06,
        -i * (length / count),
        Math.cos(i * 1.2) * 0.05
      );
      g.add(leaf);
    }
    return registerWindSway(g, 0.095, 2.2);
  }

  // (I) 築橋浮島：暖橘秋楓樹 (Warm Orange Autumn Maple Tree)
  function createAutumnMapleTree(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * scale, 0.16 * scale, 0.92 * scale, 6),
      getMat(0x69432c)
    );
    trunk.position.y = 0.46 * scale;
    g.add(trunk);

    const mapleColors = [0xe86830, 0xf59038, 0xd6492c, 0xffad42];
    const blobs = [
      [0, 1.12, 0, 0.55],
      [-0.3, 0.96, 0.18, 0.42],
      [0.32, 1.0, -0.16, 0.42],
      [0, 1.42, 0.1, 0.38]
    ];
    blobs.forEach(function (b, i) {
      const m = new THREE.Mesh(
        new THREE.DodecahedronGeometry(b[3] * scale, 0),
        getMat(mapleColors[i % mapleColors.length])
      );
      m.position.set(b[0] * scale, b[1] * scale, b[2] * scale);
      g.add(m);
    });
    enableShadow(g);
    return registerWindSway(g, 0.065, 1.7);
  }

  // (J) 築橋浮島：向日葵花叢 (Sunflower Patch)
  function createSunflowerPatch(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 0.24 * scale;
      const oz = (i % 2 === 0 ? 0.08 : -0.08) * scale;
      const h = (0.55 + (i % 2) * 0.12) * scale;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03 * scale, 0.04 * scale, h, 5),
        getMat(0x4e9c48)
      );
      stem.position.set(ox, h * 0.5, oz);
      g.add(stem);

      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16 * scale, 0.16 * scale, 0.05 * scale, 9),
        getMat(0xffc82e)
      );
      head.rotation.x = Math.PI * 0.32;
      head.position.set(ox, h + 0.04 * scale, oz + 0.03 * scale);
      g.add(head);

      const center = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.06 * scale, 8),
        getMat(0x54351e)
      );
      center.rotation.x = Math.PI * 0.32;
      center.position.set(ox, h + 0.045 * scale, oz + 0.04 * scale);
      g.add(center);
    }
    enableShadow(g);
    return registerWindSway(g, 0.075, 2.1);
  }

  // (K) 航標浮島：黃金銀杏樹 (Golden Ginkgo Tree)
  function createGoldenGinkgoTree(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * scale, 0.16 * scale, 0.95 * scale, 6),
      getMat(0x6e4e32)
    );
    trunk.position.y = 0.47 * scale;
    g.add(trunk);

    const golds = [0xf7c531, 0xffd954, 0xeba81e];
    const parts = [
      [0, 1.18, 0, 0.56],
      [-0.28, 1.0, 0.16, 0.4],
      [0.28, 1.04, -0.16, 0.4],
      [0, 1.52, 0, 0.42]
    ];
    parts.forEach(function (p, i) {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(p[3] * scale, 1),
        getMat(golds[i % golds.length])
      );
      m.position.set(p[0] * scale, p[1] * scale, p[2] * scale);
      g.add(m);
    });
    enableShadow(g);
    return registerWindSway(g, 0.06, 1.65);
  }

  // (L) 航標浮島：星光藍紫薰衣草叢 (Starlight Blue-Purple Lavender Bush)
  function createLavenderBush(scale) {
    scale = scale || 1;
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.26 * scale, 0),
      getMat(0x5e8f66)
    );
    base.scale.set(1.3, 0.65, 1.0);
    base.position.y = 0.16 * scale;
    g.add(base);

    const lavColors = [0x8b6bd6, 0xa584f5, 0x6f52b8];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.055 * scale, 0.34 * scale, 5),
        getMat(lavColors[i % lavColors.length], { emissive: 0x5c3da8, emissiveIntensity: 0.12 })
      );
      spike.position.set(
        Math.cos(ang) * 0.16 * scale,
        0.36 * scale,
        Math.sin(ang) * 0.14 * scale
      );
      spike.rotation.z = -Math.cos(ang) * 0.18;
      g.add(spike);
    }
    enableShadow(g);
    return registerWindSway(g, 0.075, 2.2);
  }

  // =========================================================
  // 5. 六座浮空島主題造景建造器
  // =========================================================
  const animatedLandmarks = {};
  const islandGroups = {};
  const islandPickables = [];
  const landmarkTargets = [];

  // ---------------------------------------------------------
  // 島嶼 0：天空之心（課程總覽）— 雲頂星芒聖殿・五色共鳴水晶塔
  // ---------------------------------------------------------
  function populateHeartIsland(group) {
    // 聖殿雙層圓形石階廣場
    const plaza1 = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.4, 0.18, 16),
      getMat(0xe5cfa8)
    );
    plaza1.position.y = 0.09;
    group.add(plaza1);

    const plaza2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.8, 0.22, 12),
      getMat(0xf2dfc0)
    );
    plaza2.position.y = 0.28;
    group.add(plaza2);

    // 六根古典暖白石柱與金色環形天穹
    const colRadius = 2.05;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.17, 2.2, 8),
        getMat(0xf5e6cc)
      );
      col.position.set(Math.cos(a) * colRadius, 1.48, Math.sin(a) * colRadius);
      group.add(col);
    }

    const ringRoof = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.18, 8, 24),
      getMat(0xd98a16, { metalness: 0.3, roughness: 0.4 })
    );
    ringRoof.rotation.x = Math.PI / 2;
    ringRoof.position.y = 2.62;
    group.add(ringRoof);

    // 中央懸浮五色共鳴主水晶 + 五顆環繞領域晶石
    const spireGroup = new THREE.Group();
    spireGroup.position.set(0, 2.35, 0);

    const coreCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.78, 0),
      getMat(0xf5a623, {
        emissive: 0xc47100,
        emissiveIntensity: 0.28,
        roughness: 0.25,
        metalness: 0.2
      })
    );
    coreCrystal.scale.set(0.85, 1.45, 0.85);
    spireGroup.add(coreCrystal);

    const domainColors = [0x2b95c9, 0x2e9d68, 0xd9628f, 0xe06d3b, 0x7b5cc4];
    const orbitGroup = new THREE.Group();
    domainColors.forEach(function (dc, idx) {
      const a = (idx / 5) * Math.PI * 2;
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        getMat(dc, { emissive: dc, emissiveIntensity: 0.3, roughness: 0.3 })
      );
      gem.position.set(Math.cos(a) * 1.25, Math.sin(idx * 1.3) * 0.2, Math.sin(a) * 1.25);
      orbitGroup.add(gem);
    });
    spireGroup.add(orbitGroup);
    group.add(spireGroup);
    animatedLandmarks.heartSpire = { spireGroup: spireGroup, orbitGroup: orbitGroup };

    // SEL 課程架構紀念黑板與講台（移至廣場外緣，保留淨空環形步道）
    const boardGroup = new THREE.Group();
    boardGroup.position.set(-3.85, 0.18, -2.15);
    boardGroup.rotation.y = 0.85;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.12), getMat(0x8c5832));
    frame.position.y = 0.85;
    boardGroup.add(frame);
    const slate = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.82, 0.14), getMat(0x2c5240));
    slate.position.y = 0.85;
    boardGroup.add(slate);
    group.add(boardGroup);

    // 雲端黃金菩提樹與五色花圃（隨風搖曳）
    const treePositions = [
      [-4.6, -2.5, 1.15],
      [4.6, -2.5, 1.1],
      [-4.2, 3.2, 1.0],
      [4.3, 3.0, 1.05]
    ];
    treePositions.forEach(function (tp, idx) {
      const t = idx % 2 === 0 ? createGoldenGinkgoTree(tp[2]) : createSakuraTree(tp[2]);
      t.position.set(tp[0], 0, tp[1]);
      group.add(t);
    });

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.35;
      const fb = i % 2 === 0 ? createRoseFlowerbed(0.75) : createIceBlueBush(0.95);
      fb.position.set(Math.cos(a) * 5.2, 0, Math.sin(a) * 5.2);
      fb.rotation.y = -a + Math.PI / 2;
      group.add(fb);
    }
  }

  // ---------------------------------------------------------
  // 島嶼 1：澄鏡浮島（自我覺察）
  // 「心靈澄鏡湖與懸浮自轉折射水晶稜鏡塔」，周圍環繞水岸翠柳、湖心藍蓮花與冰藍花叢
  // ---------------------------------------------------------
  function populateAwarenessIsland(group) {
    // 心靈澄鏡湖（雙層清澈鏡面湖水 + 岸邊鵝卵石 + 觀景木棧道）
    const lakeRim = new THREE.Mesh(
      new THREE.CylinderGeometry(3.35, 3.45, 0.14, 20),
      getMat(0x9ec5db)
    );
    lakeRim.position.set(0, 0.05, 0);
    group.add(lakeRim);

    const lakeSurface = new THREE.Mesh(
      new THREE.CylinderGeometry(3.15, 3.15, 0.16, 24),
      getMat(0x1688c9, {
        roughness: 0.18,
        metalness: 0.2,
        emissive: 0x0d5c8c,
        emissiveIntensity: 0.22
      })
    );
    lakeSurface.position.set(0, 0.08, 0);
    group.add(lakeSurface);

    // 湖面動態水波紋環
    const ripple1 = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.15, 24),
      new THREE.MeshBasicMaterial({
        color: 0x99e2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      })
    );
    ripple1.rotation.x = -Math.PI / 2;
    ripple1.position.y = 0.18;
    group.add(ripple1);

    const ripple2 = new THREE.Mesh(
      new THREE.RingGeometry(1.85, 1.94, 24),
      new THREE.MeshBasicMaterial({
        color: 0x73d4ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      })
    );
    ripple2.rotation.x = -Math.PI / 2;
    ripple2.position.y = 0.18;
    group.add(ripple2);

    // 懸浮自轉折射水晶稜鏡塔
    const prismBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.95, 0.42, 8),
      getMat(0x7fbce0)
    );
    prismBase.position.y = 0.28;
    group.add(prismBase);

    const prismTower = new THREE.Group();
    prismTower.position.set(0, 2.35, 0);

    const mainPrism = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.95, 0),
      getMat(0x28a8f0, {
        roughness: 0.15,
        metalness: 0.3,
        emissive: 0x126ca6,
        emissiveIntensity: 0.35
      })
    );
    mainPrism.scale.set(0.82, 1.85, 0.82);
    prismTower.add(mainPrism);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.38, 0.05, 8, 28),
      getMat(0xd4f6ff, { emissive: 0x67d1ff, emissiveIntensity: 0.35 })
    );
    prismTower.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(1.68, 0.04, 8, 28),
      getMat(0x9ce5ff, { emissive: 0x2b95c9, emissiveIntensity: 0.25 })
    );
    ringB.rotation.x = Math.PI / 3;
    prismTower.add(ringB);

    // 環繞小折射稜鏡
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        getMat(0xc7f2ff, { emissive: 0x45aef5, emissiveIntensity: 0.3 })
      );
      shard.scale.set(0.7, 1.5, 0.7);
      shard.position.set(Math.cos(a) * 1.45, (i % 2 === 0 ? 0.3 : -0.3), Math.sin(a) * 1.45);
      prismTower.add(shard);
    }
    group.add(prismTower);

    animatedLandmarks.awarenessPrism = {
      tower: prismTower,
      ringA: ringA,
      ringB: ringB,
      ripple1: ripple1,
      ripple2: ripple2
    };

    // 湖畔木棧道（置於湖內側邊緣，不阻擋環湖步道）
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.14, 1.4),
      getMat(0xb88456)
    );
    pier.position.set(0, 0.22, 2.55);
    group.add(pier);

    // 湖心藍蓮花（6朵盛開在澄鏡湖面）
    const lotusCoords = [
      [-1.5, 1.2, 1.1],
      [1.6, 1.1, 1.0],
      [-2.1, -0.8, 0.95],
      [2.0, -1.1, 1.15],
      [-0.8, -2.0, 1.0],
      [1.1, -2.1, 0.9]
    ];
    lotusCoords.forEach(function (lc) {
      const lotus = createBlueLotus(lc[2]);
      lotus.position.set(lc[0], 0.16, lc[1]);
      group.add(lotus);
    });

    // 水岸翠柳（6棵環繞島嶼外圈隨微風搖曳，留出寬敞環湖步道）
    const willowCoords = [
      [-4.4, -2.0, 1.2],
      [4.4, -1.9, 1.15],
      [-4.2, 2.4, 1.1],
      [4.2, 2.4, 1.2],
      [0, -4.85, 1.25],
      [-2.6, -4.1, 1.0]
    ];
    willowCoords.forEach(function (wc) {
      const w = createWeepingWillow(wc[2]);
      w.position.set(wc[0], 0, wc[1]);
      group.add(w);
    });

    // 冰藍花叢（環繞島嶼外圈）
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.2;
      const dist = 4.85 + (i % 2) * 0.45;
      const bush = createIceBlueBush(0.95 + (i % 3) * 0.18);
      bush.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
      group.add(bush);
    }
  }

  // ---------------------------------------------------------
  // 島嶼 2：定心浮島（自我管理）
  // 「巨型荷蘭呼吸大風車磨坊與 90 秒定心黃金大沙漏」，搭配三層蒼翠松柏林與修剪整齊的圓球綠籬
  // ---------------------------------------------------------
  function populateManagementIsland(group) {
    // 1. 巨型荷蘭呼吸大風車磨坊 (Giant Dutch Breathing Windmill)
    const millGroup = new THREE.Group();
    millGroup.position.set(-1.1, 0, -0.85);
    millGroup.rotation.y = 0.25;

    const millBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.38, 0.9, 8),
      getMat(0xb54b30)
    );
    millBase.position.y = 0.45;
    millGroup.add(millBase);

    const millBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 1.15, 2.35, 8),
      getMat(0xebd2b0)
    );
    millBody.position.y = 2.05;
    millGroup.add(millBody);

    // 荷蘭風車木造環形外廊
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.42, 0.12, 12),
      getMat(0x96633c)
    );
    deck.position.y = 1.05;
    millGroup.add(deck);

    const millCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      getMat(0x523a28)
    );
    millCap.position.y = 3.2;
    millGroup.add(millCap);

    // 四片呼吸大帆翼
    const bladesHub = new THREE.Group();
    bladesHub.position.set(0, 2.95, 0.92);

    const hubKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.35, 8),
      getMat(0x5c3c24)
    );
    hubKnob.rotation.x = Math.PI / 2;
    bladesHub.add(hubKnob);

    for (let i = 0; i < 4; i++) {
      const armGroup = new THREE.Group();
      armGroup.rotation.z = (i * Math.PI) / 2;

      const spar = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 2.65, 0.08),
        getMat(0x7c5032)
      );
      spar.position.y = 1.32;
      armGroup.add(spar);

      const sail = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 2.15, 0.04),
        getMat(0xfffaf0)
      );
      sail.position.set(0.24, 1.45, 0.03);
      armGroup.add(sail);

      bladesHub.add(armGroup);
    }
    millGroup.add(bladesHub);
    group.add(millGroup);

    // 2. 90 秒定心黃金大沙漏 (90-Second Golden Giant Hourglass)
    const hgGroup = new THREE.Group();
    hgGroup.position.set(1.25, 0, 0.45);

    const hgBottomPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.24, 12),
      getMat(0xe8a82e, { metalness: 0.45, roughness: 0.32 })
    );
    hgBottomPlate.position.y = 0.12;
    hgGroup.add(hgBottomPlate);

    const hgTopPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.22, 12),
      getMat(0xe8a82e, { metalness: 0.45, roughness: 0.32 })
    );
    hgTopPlate.position.y = 2.68;
    hgGroup.add(hgTopPlate);

    // 四根黃金立柱
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 2.55, 8),
        getMat(0xf5bd42, { metalness: 0.5, roughness: 0.3 })
      );
      rod.position.set(Math.cos(a) * 0.78, 1.4, Math.sin(a) * 0.78);
      hgGroup.add(rod);
    }

    // 上下透明玻璃沙漏罩與流動黃金沙
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xdff6ff,
      transparent: true,
      opacity: 0.52,
      roughness: 0.15,
      metalness: 0.2
    });
    const lowerBulb = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.18, 12), glassMat);
    lowerBulb.position.y = 0.82;
    hgGroup.add(lowerBulb);

    const upperBulb = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.18, 12), glassMat);
    upperBulb.rotation.x = Math.PI;
    upperBulb.position.y = 2.0;
    hgGroup.add(upperBulb);

    const sandMat = getMat(0xffc93c, {
      emissive: 0xe89b1e,
      emissiveIntensity: 0.28,
      roughness: 0.4
    });
    const lowerSand = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.72, 12), sandMat);
    lowerSand.position.y = 0.6;
    hgGroup.add(lowerSand);

    const upperSand = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.62, 12), sandMat);
    upperSand.rotation.x = Math.PI;
    upperSand.position.y = 1.82;
    hgGroup.add(upperSand);

    const sandStream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 1.15, 8),
      getMat(0xffdf6b, { emissive: 0xffb830, emissiveIntensity: 0.55 })
    );
    sandStream.position.y = 1.15;
    hgGroup.add(sandStream);

    group.add(hgGroup);

    animatedLandmarks.management = {
      bladesHub: bladesHub,
      sandStream: sandStream,
      upperSand: upperSand,
      lowerSand: lowerSand
    };

    // 3. 三層蒼翠松柏林（隨風搖曳，配置於外環避免阻擋人物走動）
    const pineCoords = [
      [-4.6, -2.0, 1.2],
      [-3.9, -3.7, 1.05],
      [-1.5, -4.8, 1.15],
      [1.8, -4.6, 1.1],
      [4.5, -2.2, 1.25],
      [4.6, 1.8, 1.05],
      [-4.5, 2.3, 1.1]
    ];
    pineCoords.forEach(function (pc) {
      const p = createThreeTierPine(pc[2]);
      p.position.set(pc[0], 0, pc[1]);
      group.add(p);
    });

    // 4. 修剪整齊的圓球綠籬（排列於外圈大道，保留淨空環形步道）
    const topiaryCoords = [
      [-3.2, 3.1, 1.0],
      [-1.5, 4.1, 0.95],
      [0.4, 4.3, 0.95],
      [2.2, 3.8, 1.0],
      [3.7, 2.6, 1.0],
      [-4.2, 0.6, 0.9],
      [0.4, -4.3, 0.95],
      [4.2, -0.7, 0.95]
    ];
    topiaryCoords.forEach(function (tc) {
      const topiary = createSphericalTopiary(tc[2]);
      topiary.position.set(tc[0], 0, tc[1]);
      group.add(topiary);
    });
  }

  // ---------------------------------------------------------
  // 島嶼 3：共鳴浮島（社會覺察）
  // 「百年共鳴粉櫻神木樹屋」為核心，四周盛開粉紅櫻花樹、暖杏玫瑰花圃與島緣垂崖長春藤
  // ---------------------------------------------------------
  function populateSocialIsland(group) {
    // 1. 百年共鳴粉櫻神木樹屋 (Centennial Pink Sakura Sacred Giant Treehouse)
    const treehouseGroup = new THREE.Group();
    treehouseGroup.position.set(0, 0, -0.4);

    // 巨大盤根與粗壯神木樹幹
    const mainTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 1.25, 2.8, 8),
      getMat(0x6e4736)
    );
    mainTrunk.position.y = 1.4;
    treehouseGroup.add(mainTrunk);

    // 環繞木造觀景平台
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(2.15, 2.15, 0.16, 12),
      getMat(0xb8804f)
    );
    deck.position.y = 1.85;
    treehouseGroup.add(deck);

    // 雙層溫馨樹屋木屋與發光暖窗
    const cabin1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 1.25, 1.55),
      getMat(0xe8c396)
    );
    cabin1.position.set(0.25, 2.52, 0.15);
    treehouseGroup.add(cabin1);

    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.55, 0.85, 4),
      getMat(0xc9597a)
    );
    roof1.position.set(0.25, 3.55, 0.15);
    roof1.rotation.y = Math.PI / 4;
    treehouseGroup.add(roof1);

    const winGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.06),
      getMat(0xffe58f, { emissive: 0xffb830, emissiveIntensity: 0.65 })
    );
    winGlow.position.set(0.25, 2.55, 0.94);
    treehouseGroup.add(winGlow);

    // 巨型百年粉櫻神木花冠（隨高空微風搖曳）
    const giantCanopy = new THREE.Group();
    giantCanopy.position.y = 3.95;
    const canopyPuffs = [
      [0, 0.35, 0, 1.75, 0xf06292],
      [-1.35, 0.0, 0.55, 1.25, 0xe0487e],
      [1.4, 0.1, 0.45, 1.28, 0xf778a4],
      [-0.85, 0.15, -1.1, 1.2, 0xd93b73],
      [0.95, 0.2, -1.05, 1.22, 0xed588b],
      [0, 1.15, 0.1, 1.25, 0xff85b0]
    ];
    canopyPuffs.forEach(function (cp) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(cp[3], 0),
        getMat(cp[4])
      );
      puff.position.set(cp[0], cp[1], cp[2]);
      giantCanopy.add(puff);
    });
    registerWindSway(giantCanopy, 0.045, 1.45);
    treehouseGroup.add(giantCanopy);

    // 飄落粉櫻花瓣粒子群
    const petalsGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const petal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08, 0),
        getMat(0xffb8d2, { emissive: 0xf78fb3, emissiveIntensity: 0.2 })
      );
      petal.scale.set(1.2, 0.35, 0.8);
      const a = (i / 18) * Math.PI * 2;
      const r = 1.2 + (i % 4) * 0.85;
      petal.position.set(Math.cos(a) * r, 0.6 + (i % 6) * 0.55, Math.sin(a) * r);
      petal.userData = { baseAngle: a, radius: r, speed: 0.5 + (i % 3) * 0.2, yOffset: i * 0.35 };
      petalsGroup.add(petal);
    }
    treehouseGroup.add(petalsGroup);
    animatedLandmarks.socialPetals = petalsGroup;

    group.add(treehouseGroup);

    // 2. 四周盛開粉紅櫻花樹（外圈環繞，不遮擋人物步道）
    const sakuraCoords = [
      [-4.5, -1.8, 1.15],
      [4.5, -1.7, 1.1],
      [-3.9, 2.9, 1.05],
      [4.0, 2.8, 1.12],
      [-1.7, -4.6, 1.0],
      [2.0, -4.5, 1.08]
    ];
    sakuraCoords.forEach(function (sc) {
      const st = createSakuraTree(sc[2]);
      st.position.set(sc[0], 0, sc[1]);
      group.add(st);
    });

    // 3. 暖杏玫瑰花圃（配置於外圈花園，保留中央環樹屋淨空步道）
    const roseCoords = [
      [-2.6, 3.6, 0.4],
      [2.6, 3.6, -0.4],
      [-4.2, 0.6, 1.2],
      [4.2, 0.6, -1.2],
      [0, 4.4, 0]
    ];
    roseCoords.forEach(function (rc) {
      const rb = createRoseFlowerbed(1.0);
      rb.position.set(rc[0], 0, rc[1]);
      rb.rotation.y = rc[2];
      group.add(rb);
    });

    // 4. 島緣垂崖長春藤（14 串沿著浮島崖邊垂掛隨風搖曳）
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const ivy = createHangingIvy(1.6 + (i % 3) * 0.45);
      ivy.position.set(Math.cos(a) * 6.05, -0.15, Math.sin(a) * 6.05);
      group.add(ivy);
    }
  }

  // ---------------------------------------------------------
  // 島嶼 4：築橋浮島（人際關係）
  // 橫跨溪流的「雙心彩虹木拱大橋與和平圈營火廣場」，襯以暖橘秋楓樹林與向日葵花田
  // ---------------------------------------------------------
  function populateRelationshipIsland(group) {
    // 1. 貫穿浮島的清澈溪流
    const stream = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 0.12, 11.2),
      getMat(0x4fc3f7, {
        roughness: 0.18,
        metalness: 0.2,
        emissive: 0x1e88e5,
        emissiveIntensity: 0.15
      })
    );
    stream.position.set(-0.55, 0.05, 0);
    stream.rotation.y = 0.22;
    group.add(stream);

    // 2. 橫跨溪流的「雙心彩虹木拱大橋」
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-0.55, 0.1, -0.35);
    bridgeGroup.rotation.y = 0.22;

    // 拱橋木棧橋面（13段加密平滑弧形木板，方便人物穩定從彩虹橋上走過）
    for (let i = -6; i <= 6; i++) {
      const norm = i / 6;
      const y = (1 - norm * norm) * 0.88 + 0.12;
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.11, 1.58),
        getMat(i % 2 === 0 ? 0xb87b48 : 0xa66b38)
      );
      plank.position.set(i * 0.31, y, 0);
      plank.rotation.z = -norm * 0.28;
      bridgeGroup.add(plank);
    }

    // 在雙心彩虹木拱大橋上新增 2 位直接從橋面走過的學生（全程貼合橋拱頂面，絕不穿模或消失）
    const rbQuotes = [
      "我們正從雙心彩虹木拱大橋上走過去，橋頂風景好美喔！",
      "走過彩虹橋，搭起友誼與合作的橋樑！"
    ];
    for (let rbIdx = 0; rbIdx < 2; rbIdx++) {
      const rbPerson = createPersonMesh(rbIdx + 35, rbQuotes[rbIdx]);
      const laneZ = rbIdx === 0 ? -0.28 : 0.28;
      rbPerson.position.set(0, 1.08, laneZ);
      bridgeGroup.add(rbPerson);
      walkers.push({
        type: "rainbowBridge",
        mesh: rbPerson,
        laneZ: laneZ,
        speed: 0.52,
        phase: rbIdx * Math.PI
      });
    }

    // 七彩彩虹橋拱護欄
    const rainbowCols = [0xff5e6c, 0xff9a44, 0xffd43b, 0x51cf66, 0x339af0, 0x845ef7];
    [-0.78, 0.78].forEach(function (zSide) {
      rainbowCols.forEach(function (rc, idx) {
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(1.95 - idx * 0.09, 0.045, 6, 20, Math.PI),
          getMat(rc, { emissive: rc, emissiveIntensity: 0.18 })
        );
        arch.position.set(0, 0.1, zSide);
        bridgeGroup.add(arch);
      });
    });

    // 橋頂中央「雙心標誌 (Twin Hearts Crest)」
    const twinHearts = new THREE.Group();
    twinHearts.position.set(0, 2.25, 0);
    [-0.26, 0.26].forEach(function (hx, idx) {
      const heart = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 1),
        getMat(idx === 0 ? 0xff5e7e : 0xff9248, {
          emissive: idx === 0 ? 0xd9385a : 0xd96b27,
          emissiveIntensity: 0.35
        })
      );
      heart.scale.set(1.1, 1.25, 0.55);
      heart.position.x = hx;
      twinHearts.add(heart);
    });
    bridgeGroup.add(twinHearts);
    group.add(bridgeGroup);

    // 3. 和平圈營火廣場 (Peace Circle Campfire Plaza)
    const campGroup = new THREE.Group();
    campGroup.position.set(2.15, 0.08, 1.35);

    const hearthPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.85, 0.1, 14),
      getMat(0xead6ba)
    );
    campGroup.add(hearthPad);

    // 營火石頭圈与原木座位圈
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.14, 0),
        getMat(0x8c827a)
      );
      stone.position.set(Math.cos(a) * 0.45, 0.12, Math.sin(a) * 0.45);
      campGroup.add(stone);
    }

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bench = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.78, 7),
        getMat(0x8c5a36)
      );
      bench.rotation.z = Math.PI / 2;
      bench.rotation.y = -a + Math.PI / 2;
      bench.position.set(Math.cos(a) * 1.32, 0.18, Math.sin(a) * 1.32);
      campGroup.add(bench);
    }

    // 動態躍動營火火焰
    const fireMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.82, 7),
      getMat(0xff7b29, { emissive: 0xff5500, emissiveIntensity: 0.85 })
    );
    fireMesh.position.y = 0.48;
    campGroup.add(fireMesh);

    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.55, 6),
      getMat(0xffe055, { emissive: 0xffc400, emissiveIntensity: 0.9 })
    );
    innerFlame.position.y = 0.42;
    campGroup.add(innerFlame);

    group.add(campGroup);
    animatedLandmarks.relationship = {
      fireMesh: fireMesh,
      innerFlame: innerFlame,
      twinHearts: twinHearts
    };

    // 4. 暖橘秋楓樹林（隨風搖曳）
    const mapleCoords = [
      [-4.1, -1.9, 1.2],
      [-3.5, 2.5, 1.15],
      [3.8, -2.4, 1.2],
      [1.8, -4.1, 1.1],
      [-1.8, -4.2, 1.05],
      [4.2, 0.2, 1.1]
    ];
    mapleCoords.forEach(function (mc) {
      const mt = createAutumnMapleTree(mc[2]);
      mt.position.set(mc[0], 0, mc[1]);
      group.add(mt);
    });

    // 5. 向日葵花田（隨高空微風搖曳）
    const sunCoords = [
      [-3.2, -0.2, 1.1],
      [-2.6, 3.8, 1.05],
      [0.8, 3.9, 1.15],
      [3.4, 3.1, 1.0],
      [3.1, -3.5, 1.1],
      [-3.9, 0.9, 1.0]
    ];
    sunCoords.forEach(function (sc) {
      const sf = createSunflowerPatch(sc[2]);
      sf.position.set(sc[0], 0, sc[1]);
      group.add(sf);
    });
  }

  // ---------------------------------------------------------
  // 島嶼 5：航標浮島（負責任的決策）
  // 配置「三環旋轉渾天儀星盤鐘樓與擺動黃金正義天平」，點綴黃金銀杏樹林與星光藍紫薰衣草叢
  // ---------------------------------------------------------
  function populateDecisionIsland(group) {
    // 1. 三環旋轉渾天儀星盤鐘樓 (Three-Ring Armillary Sphere Astrolabe Clock Tower)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-1.1, 0, -0.85);

    const towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 1.1, 1.65),
      getMat(0xb89f7d)
    );
    towerBase.position.y = 0.55;
    towerGroup.add(towerBase);

    const towerMid = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 1.85, 1.28),
      getMat(0xd9c3a3)
    );
    towerMid.position.y = 2.02;
    towerGroup.add(towerMid);

    // 鐘樓四面黃金鐘面
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12),
        getMat(0xfffaf0, { emissive: 0xffe49e, emissiveIntensity: 0.2 })
      );
      face.rotation.x = Math.PI / 2;
      face.rotation.z = a;
      face.position.set(Math.sin(a) * 0.65, 2.25, Math.cos(a) * 0.65);
      towerGroup.add(face);
    }

    // 鐘樓頂端：三環旋轉渾天儀星盤
    const astrolabeCenter = new THREE.Group();
    astrolabeCenter.position.y = 4.15;

    const ringMat = getMat(0xf0b436, {
      metalness: 0.55,
      roughness: 0.25,
      emissive: 0xc98a18,
      emissiveIntensity: 0.2
    });
    const astroRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.06, 8, 28), ringMat);
    const astroRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.055, 8, 24), ringMat);
    const astroRing3 = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.05, 8, 20), ringMat);
    const northStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      getMat(0xffe875, { emissive: 0xffc400, emissiveIntensity: 0.75 })
    );

    astrolabeCenter.add(astroRing1);
    astrolabeCenter.add(astroRing2);
    astrolabeCenter.add(astroRing3);
    astrolabeCenter.add(northStar);
    towerGroup.add(astrolabeCenter);
    group.add(towerGroup);

    // 2. 擺動黃金正義天平 (Swinging Golden Scales of Justice)
    const scaleGroup = new THREE.Group();
    scaleGroup.position.set(1.25, 0, 0.55);

    const scalePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.98, 0.32, 10),
      getMat(0xebe3d5)
    );
    scalePedestal.position.y = 0.16;
    scaleGroup.add(scalePedestal);

    const goldMat = getMat(0xf5bd38, { metalness: 0.55, roughness: 0.28 });
    const scalePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.16, 2.25, 8),
      goldMat
    );
    scalePillar.position.y = 1.42;
    scaleGroup.add(scalePillar);

    const beamPivot = new THREE.Group();
    beamPivot.position.y = 2.48;

    const beamBar = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.1, 0.1), goldMat);
    beamPivot.add(beamBar);

    const leftPanGroup = new THREE.Group();
    leftPanGroup.position.set(-1.08, 0, 0);
    const leftChain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), goldMat);
    leftChain.position.y = -0.38;
    leftPanGroup.add(leftChain);
    const leftDish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.12, 10), goldMat);
    leftDish.position.y = -0.78;
    leftPanGroup.add(leftDish);
    beamPivot.add(leftPanGroup);

    const rightPanGroup = new THREE.Group();
    rightPanGroup.position.set(1.08, 0, 0);
    const rightChain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), goldMat);
    rightChain.position.y = -0.38;
    rightPanGroup.add(rightChain);
    const rightDish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.12, 10), goldMat);
    rightDish.position.y = -0.78;
    rightPanGroup.add(rightDish);
    beamPivot.add(rightPanGroup);

    scaleGroup.add(beamPivot);
    group.add(scaleGroup);

    animatedLandmarks.decision = {
      ring1: astroRing1,
      ring2: astroRing2,
      ring3: astroRing3,
      northStar: northStar,
      beamPivot: beamPivot,
      leftPan: leftPanGroup,
      rightPan: rightPanGroup
    };

    // 3. 黃金銀杏樹林（隨高空微風搖曳，配置於外圈）
    const ginkgoCoords = [
      [-4.6, -1.9, 1.2],
      [-3.9, 2.9, 1.15],
      [4.3, -2.4, 1.22],
      [1.6, -4.6, 1.1],
      [-1.7, -4.6, 1.08],
      [4.5, 2.0, 1.1]
    ];
    ginkgoCoords.forEach(function (gc) {
      const gt = createGoldenGinkgoTree(gc[2]);
      gt.position.set(gc[0], 0, gc[1]);
      group.add(gt);
    });

    // 4. 星光藍紫薰衣草叢（隨高空微風搖曳，配置於外圈保留淨空步道）
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.4;
      const r = 4.25 + (i % 2) * 0.65;
      const lav = createLavenderBush(1.05 + (i % 2) * 0.15);
      lav.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      group.add(lav);
    }
  }

  // =========================================================
  // 6. 人物模型與走動系統（島上師生、空橋行人、雲端小精靈）
  // =========================================================
  const walkers = [];
  const personPickables = [];
  const mascotPickables = [];

  const SHIRT_COLORS = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0xec4899, 0x8b5cf6, 0x14b8a6];
  const HAIR_COLORS = [0x2b211a, 0x4a3325, 0x63412c, 0x1f1916];

  function createPersonMesh(seed, roleText) {
    const g = new THREE.Group();
    const shirt = SHIRT_COLORS[seed % SHIRT_COLORS.length];
    const hair = HAIR_COLORS[seed % HAIR_COLORS.length];

    const legL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.28, 6),
      getMat(0x374151)
    );
    legL.position.set(-0.07, 0.14, 0);
    g.add(legL);

    const legR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.28, 6),
      getMat(0x374151)
    );
    legR.position.set(0.07, 0.14, 0);
    g.add(legR);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.38, 8),
      getMat(shirt)
    );
    body.position.y = 0.44;
    g.add(body);

    const armL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.28, 6),
      getMat(shirt)
    );
    armL.position.set(-0.18, 0.44, 0);
    g.add(armL);

    const armR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.28, 6),
      getMat(shirt)
    );
    armR.position.set(0.18, 0.44, 0);
    g.add(armR);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 10, 8),
      getMat(0xffdfc4)
    );
    head.position.y = 0.76;
    g.add(head);

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.58),
      getMat(hair)
    );
    hairCap.position.y = 0.77;
    g.add(hairCap);

    // 隨機小背包或遮陽帽
    if (seed % 2 === 0) {
      const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.1),
        getMat(0xfbbf24)
      );
      pack.position.set(0, 0.44, -0.14);
      g.add(pack);
    }

    g.scale.setScalar(0.88);
    enableShadow(g);
    g.traverse(function (c) {
      c.frustumCulled = false;
    });
    g.userData = {
      legL: legL,
      legR: legR,
      armL: armL,
      armR: armR,
      quote: roleText
    };
    personPickables.push(g);
    return g;
  }

  function addIslandWalkers(islandGroup, islandKey, radius) {
    const islandDialogs = {
      heart: [
        "歡迎來到天空之心！點擊上方導覽鈕或左側清單可飛往各浮空島喔！",
        "我們正準備走過彩虹空橋，去探索 30 堂 SEL 互動課程！",
        "認識情緒、學會合作，每一座浮空島都有專屬的魔法工具！"
      ],
      awareness: [
        "你看！心靈澄鏡湖上的水晶稜鏡塔正在自轉折射光芒呢！",
        "我今天在一年級「情緒報到」認識了身體訊號，還用了情緒溫度計！",
        "岸邊的翠柳和藍蓮花隨微風輕輕搖曳，看著湖面心就靜下來了。"
      ],
      management: [
        "跟著荷蘭呼吸大風車：吸氣 4 秒、屏氣 4 秒、吐氣 4 秒！",
        "90 秒黃金大沙漏提醒我們：生氣的生理衝動只會持續 90 秒喔！",
        "我在「三欄情緒計畫表」收集了好多 5 顆星的冷靜好招數！"
      ],
      social: [
        "百年粉櫻神木樹屋好美喔！櫻花花瓣一直隨風飄下來～",
        "戴上社會小偵探放大鏡，先收集證據再體諒同學不是故意的！",
        "開啟社交小雷達，我能讀懂朋友沒說出口的感受與潛台詞！"
      ],
      relationship: [
        "我們在雙心彩虹木拱大橋旁散步，準備去和平圈營火廣場開會！",
        "拿起『如果我是他』視角放大鏡，藍色跟紅色也能找出雙贏配色！",
        "在小組合作魔法島，每個人都有專屬徽章，缺一不可！"
      ],
      decision: [
        "抬頭看！三環旋轉渾天儀星盤鐘樓指出了我們心中的北極星價值觀！",
        "把兩個選擇放上黃金正義天平，遇到問題停看聽，想出兩招好聰明！",
        "黃金銀杏與藍紫薰衣草在微風中搖曳，陪我們一起理性思辨。"
      ]
    };

    const quotes = islandDialogs[islandKey] || islandDialogs.heart;

    // 各島專屬 100% 淨空無障礙連續圓形步道參數，確保人物永遠平穩連續走動、絕不穿模消失
    const orbitConfigs = {
      heart: [
        { cx: 0, cz: 0, r: 3.35, y: 0.19, dir: 1, speed: 0.28 },
        { cx: 0, cz: 0, r: 3.65, y: 0.19, dir: -1, speed: 0.24 },
        { cx: 0, cz: 0, r: 3.35, y: 0.19, dir: 1, speed: 0.28 },
        { cx: 0, cz: 0, r: 3.65, y: 0.19, dir: -1, speed: 0.24 }
      ],
      awareness: [
        { cx: 0, cz: 0, r: 3.85, y: 0.04, dir: 1, speed: 0.26 },
        { cx: 0, cz: 0, r: 4.08, y: 0.04, dir: -1, speed: 0.22 },
        { cx: 0, cz: 0, r: 3.85, y: 0.04, dir: 1, speed: 0.26 },
        { cx: 0, cz: 0, r: 4.08, y: 0.04, dir: -1, speed: 0.22 }
      ],
      management: [
        { cx: 0, cz: 0, r: 3.25, y: 0.04, dir: 1, speed: 0.27 },
        { cx: 0, cz: 0, r: 3.55, y: 0.04, dir: -1, speed: 0.23 },
        { cx: 0, cz: 0, r: 3.25, y: 0.04, dir: 1, speed: 0.27 },
        { cx: 0, cz: 0, r: 3.55, y: 0.04, dir: -1, speed: 0.23 }
      ],
      social: [
        { cx: 0, cz: 0, r: 3.05, y: 0.04, dir: 1, speed: 0.26 },
        { cx: 0, cz: 0, r: 3.38, y: 0.04, dir: -1, speed: 0.22 },
        { cx: 0, cz: 0, r: 3.05, y: 0.04, dir: 1, speed: 0.26 },
        { cx: 0, cz: 0, r: 3.38, y: 0.04, dir: -1, speed: 0.22 }
      ],
      relationship: [
        { cx: 2.15, cz: 1.35, r: 1.58, y: 0.13, dir: 1, speed: 0.38 },
        { cx: 2.15, cz: 1.35, r: 1.58, y: 0.13, dir: 1, speed: 0.38 }
      ],
      decision: [
        { cx: 0, cz: 0, r: 3.22, y: 0.04, dir: 1, speed: 0.27 },
        { cx: 0, cz: 0, r: 3.52, y: 0.04, dir: -1, speed: 0.23 },
        { cx: 0, cz: 0, r: 3.22, y: 0.04, dir: 1, speed: 0.27 },
        { cx: 0, cz: 0, r: 3.52, y: 0.04, dir: -1, speed: 0.23 }
      ]
    };

    const orbits = orbitConfigs[islandKey] || orbitConfigs.heart;

    for (let i = 0; i < orbits.length; i++) {
      const person = createPersonMesh(
        i + islandKey.charCodeAt(0),
        quotes[i % quotes.length]
      );
      const ob = orbits[i];
      const startAngle = (i / orbits.length) * Math.PI * 2 + 0.35;
      person.position.set(
        ob.cx + Math.cos(startAngle) * ob.r,
        ob.y,
        ob.cz + Math.sin(startAngle) * ob.r
      );
      person.rotation.set(0, 0, 0);
      islandGroup.add(person);
      walkers.push({
        type: "circle",
        mesh: person,
        cx: ob.cx,
        cz: ob.cz,
        r: ob.r,
        y: ob.y,
        dir: ob.dir,
        speed: ob.speed,
        startAngle: startAngle,
        phase: i * 1.7
      });
    }

    // 每座島配置 1 隻可點擊收集的「雲端心靈小松鼠精靈」
    const squirrel = new THREE.Group();
    const sqBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 7),
      getMat(0xd97724)
    );
    sqBody.position.y = 0.16;
    squirrel.add(sqBody);
    const sqHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 7),
      getMat(0xe68a38)
    );
    sqHead.position.set(0, 0.32, 0.08);
    squirrel.add(sqHead);
    const sqTail = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.15, 0),
      getMat(0xb85d14)
    );
    sqTail.scale.set(0.8, 1.4, 1.1);
    sqTail.position.set(0, 0.26, -0.16);
    squirrel.add(sqTail);

    squirrel.position.set(radius * 0.52, 0.08, radius * 0.42);
    squirrel.userData = { islandId: islandKey, isMascot: true };
    enableShadow(squirrel);
    islandGroup.add(squirrel);
    mascotPickables.push(squirrel);
  }

  // =========================================================
  // 7. 建造全部 6 座浮空島、連接空橋、雲海與飛船
  // =========================================================
  const worldRoot = new THREE.Group();
  scene.add(worldRoot);

  const nameplateElements = {};

  DATA.islandOrder.forEach(function (key, idx) {
    const cfg = DATA.islands[key];
    const islandGroup = new THREE.Group();
    islandGroup.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);
    islandGroup.userData = {
      islandId: key,
      baseY: cfg.position[1],
      floatPhase: idx * 1.15
    };

    const baseMesh = createFloatingIslandBase(
      cfg.radius,
      cfg.grass,
      cfg.cliffColor,
      cfg.stripeColor
    );
    baseMesh.userData = { islandId: key };
    islandGroup.add(baseMesh);
    islandPickables.push(baseMesh);

    if (key === "heart") populateHeartIsland(islandGroup);
    else if (key === "awareness") populateAwarenessIsland(islandGroup);
    else if (key === "management") populateManagementIsland(islandGroup);
    else if (key === "social") populateSocialIsland(islandGroup);
    else if (key === "relationship") populateRelationshipIsland(islandGroup);
    else if (key === "decision") populateDecisionIsland(islandGroup);

    addIslandWalkers(islandGroup, key, cfg.radius);

    worldRoot.add(islandGroup);
    islandGroups[key] = islandGroup;

    // 建立浮空島 HTML 懸浮名牌
    const np = document.createElement("div");
    np.className = "nameplate";
    np.dataset.island = key;
    np.innerHTML =
      '<span class="dot" style="background:' +
      cfg.color +
      '"></span>' +
      '<div class="np-text">' +
      '<span class="np-title">' +
      cfg.icon +
      " " +
      cfg.name +
      "</span>" +
      '<span class="np-sub">' +
      cfg.domain +
      "</span>" +
      "</div>";
    np.addEventListener("click", function (e) {
      e.stopPropagation();
      if (window.OWSEL_APP && window.OWSEL_APP.selectIsland) {
        window.OWSEL_APP.selectIsland(key, true);
      }
    });
    labelsRoot.appendChild(np);
    nameplateElements[key] = {
      el: np,
      worldPos: new THREE.Vector3(cfg.position[0], cfg.position[1] + 5.3, cfg.position[2])
    };
  });

  // ---------------------------------------------------------
  // 連接「天空之心」與五大浮空島的 5 座雲端彩虹木拱橋 + 橋上走動人物
  // ---------------------------------------------------------
  const skyBridgesGroup = new THREE.Group();
  worldRoot.add(skyBridgesGroup);

  ["awareness", "management", "social", "relationship", "decision"].forEach(function (targetKey, bIdx) {
    const startCfg = DATA.islands.heart;
    const endCfg = DATA.islands[targetKey];
    const p0 = new THREE.Vector3(startCfg.position[0], startCfg.position[1], startCfg.position[2]);
    const p1 = new THREE.Vector3(endCfg.position[0], endCfg.position[1], endCfg.position[2]);
    const dir = new THREE.Vector3().subVectors(p1, p0).normalize();

    const bridgeStart = p0.clone().addScaledVector(dir, startCfg.radius * 0.92);
    const bridgeEnd = p1.clone().addScaledVector(dir, -endCfg.radius * 0.92);
    const mid = new THREE.Vector3().addVectors(bridgeStart, bridgeEnd).multiplyScalar(0.5);
    mid.y += 2.6;

    const curve = new THREE.QuadraticBezierCurve3(bridgeStart, mid, bridgeEnd);
    const plankCount = 18;
    const bridgePathPoints = [];

    for (let i = 0; i <= plankCount; i++) {
      const t = i / plankCount;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      bridgePathPoints.push(pt.clone().add(new THREE.Vector3(0, 0.08, 0)));

      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.1, 0.42),
        getMat(i % 2 === 0 ? 0xc88d58 : 0xb57945)
      );
      plank.position.copy(pt);
      plank.lookAt(pt.clone().add(tangent));
      skyBridgesGroup.add(plank);
    }

    // 空橋上平穩往返走動的探索學生（沿貝茲曲線中央拱段平滑行進，不與浮空島邊緣穿模）
    const bridgeWalker = createPersonMesh(
      bIdx + 20,
      "我正走過雲端木橋前往「" + endCfg.name + "（" + endCfg.domain + "）」上課！"
    );
    bridgeWalker.position.copy(curve.getPoint(0.5)).add(new THREE.Vector3(0, 0.08, 0));
    skyBridgesGroup.add(bridgeWalker);
    walkers.push({
      type: "curve",
      mesh: bridgeWalker,
      curve: curve,
      speed: 0.35,
      phase: bIdx * 1.3
    });
  });

  // ---------------------------------------------------------
  // 跨域能量連結弧線 (Cross-Domain Links)
  // ---------------------------------------------------------
  const linkLinesGroup = new THREE.Group();
  linkLinesGroup.visible = false;
  scene.add(linkLinesGroup);

  DATA.links.forEach(function (lk) {
    const a = DATA.islands[lk.from].position;
    const b = DATA.islands[lk.to].position;
    const pA = new THREE.Vector3(a[0], a[1] + 2.2, a[2]);
    const pB = new THREE.Vector3(b[0], b[1] + 2.2, b[2]);
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    mid.y += 6.5;
    const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
    const mat = new THREE.LineDashedMaterial({
      color: 0xe06d3b,
      dashSize: 0.8,
      gapSize: 0.45
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    linkLinesGroup.add(line);
  });

  // ---------------------------------------------------------
  // 8. 天空之心雲海 (Sea of Clouds) 與巡航飛船 / 白鴿
  // ---------------------------------------------------------
  const clouds = [];
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);

  function createFluffyCloud(scale) {
    const g = new THREE.Group();
    const mat = getMat(0xffffff, { roughness: 0.92, metalness: 0.0 });
    const puffs = [
      [0, 0, 0, 1.35],
      [-1.1, -0.15, 0.2, 0.95],
      [1.15, -0.1, -0.15, 1.0],
      [0.3, 0.45, 0.35, 0.85],
      [-0.45, 0.35, -0.35, 0.8]
    ];
    puffs.forEach(function (p) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(p[3] * scale, 1), mat);
      m.position.set(p[0] * scale, p[1] * scale, p[2] * scale);
      m.scale.y = 0.68;
      g.add(m);
    });
    return g;
  }

  // 僅於群島外圍遠處與雲海下層配置 16 朵雲朵，不在天空之心或島嶼上方遮擋視線
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + (i % 2) * 0.18;
    const dist = 36 + (i % 4) * 6.5;
    const y = -8.5 - (i % 3) * 2.0;
    const cl = createFluffyCloud(1.05 + (i % 3) * 0.35);
    cl.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
    cl.rotation.y = angle;
    cloudGroup.add(cl);
    clouds.push({
      mesh: cl,
      speed: 0.25 + (i % 4) * 0.08,
      baseX: cl.position.x,
      phase: i * 0.8
    });
  }

  // 天空之心巡航熱氣球飛船
  const airship = new THREE.Group();
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 12, 10),
    getMat(0xf59e0b)
  );
  balloon.scale.set(1.35, 0.92, 0.92);
  balloon.position.y = 1.2;
  airship.add(balloon);

  const gondola = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.38, 0.48),
    getMat(0x8c5832)
  );
  airship.add(gondola);
  scene.add(airship);

  // =========================================================
  // 9. 相機控制系統（支援響應式螢幕比例縮放、點擊平滑拉近鏡頭、雙指觸控縮放與滑鼠拖曳）
  // =========================================================
  function getResponsiveRadiusScale() {
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    return aspect < 1.15
      ? THREE.MathUtils.clamp(Math.pow(1.15 / aspect, 0.55), 1.0, 1.65)
      : 1.0;
  }

  const initScale = getResponsiveRadiusScale();
  const cameraState = {
    target: new THREE.Vector3(0, 1.0, 2.0),
    desiredTarget: new THREE.Vector3(0, 1.0, 2.0),
    spherical: new THREE.Spherical(52 * initScale, 0.98, 0.0),
    desiredSpherical: new THREE.Spherical(52 * initScale, 0.98, 0.0),
    isDragging: false,
    isPanning: false,
    isPinching: false,
    pinchStartDist: 0,
    pinchStartRadius: 52,
    prevMouse: { x: 0, y: 0 },
    pointerDownPos: { x: 0, y: 0 },
    autoRotate: false
  };

  function flyToPositionAndTarget(camPosArr, targetArr) {
    const camVec = new THREE.Vector3(camPosArr[0], camPosArr[1], camPosArr[2]);
    const tgtVec = new THREE.Vector3(targetArr[0], targetArr[1], targetArr[2]);
    const offset = new THREE.Vector3().subVectors(camVec, tgtVec);
    const sph = new THREE.Spherical().setFromVector3(offset);
    const rScale = getResponsiveRadiusScale();

    // 在手機/直向窄螢幕下，考量底部資訊抽屜高度，將視覺中心稍微往下偏移，讓 3D 浮空島完整呈現在上半部畫面
    if (window.innerWidth <= 820 && window.innerHeight > 540) {
      tgtVec.y -= 1.25;
    }

    cameraState.desiredTarget.copy(tgtVec);
    cameraState.desiredSpherical.radius = THREE.MathUtils.clamp(
      sph.radius * rScale,
      7,
      98
    );
    cameraState.desiredSpherical.phi = THREE.MathUtils.clamp(sph.phi, 0.25, 1.42);
    cameraState.desiredSpherical.theta = sph.theta;
  }

  function focusIsland(islandKey) {
    const cfg = DATA.islands[islandKey];
    if (!cfg) return;
    flyToPositionAndTarget(cfg.cameraOffset, cfg.cameraTarget);
  }

  function focusLandmark(focusArr, targetArr) {
    flyToPositionAndTarget(focusArr, targetArr);
  }

  function resetOverview() {
    const rScale = getResponsiveRadiusScale();
    cameraState.desiredTarget.set(0, 1.0, 2.0);
    cameraState.desiredSpherical.set(52 * rScale, 0.98, 0.0);
  }

  function setTopView() {
    const rScale = getResponsiveRadiusScale();
    cameraState.desiredTarget.set(0, 0, 0);
    cameraState.desiredSpherical.set(62 * rScale, 0.32, 0.0);
  }

  // 滑鼠與單指/雙指觸控互動
  canvas.addEventListener("pointerdown", function (e) {
    if (cameraState.isPinching) return;
    cameraState.isDragging = true;
    cameraState.isPanning = e.button === 2 || e.shiftKey;
    cameraState.prevMouse.x = e.clientX;
    cameraState.prevMouse.y = e.clientY;
    cameraState.pointerDownPos.x = e.clientX;
    cameraState.pointerDownPos.y = e.clientY;
  });

  window.addEventListener("pointermove", function (e) {
    if (!cameraState.isDragging || cameraState.isPinching) return;
    const dx = e.clientX - cameraState.prevMouse.x;
    const dy = e.clientY - cameraState.prevMouse.y;
    cameraState.prevMouse.x = e.clientX;
    cameraState.prevMouse.y = e.clientY;

    if (cameraState.isPanning) {
      const panScale = cameraState.spherical.radius * 0.0015;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      cameraState.desiredTarget.addScaledVector(right, -dx * panScale);
      cameraState.desiredTarget.addScaledVector(forward, dy * panScale);
    } else {
      cameraState.desiredSpherical.theta -= dx * 0.0055;
      cameraState.desiredSpherical.phi = THREE.MathUtils.clamp(
        cameraState.desiredSpherical.phi - dy * 0.0045,
        0.25,
        1.42
      );
    }
  });

  window.addEventListener("pointerup", function (e) {
    if (!cameraState.isDragging) return;
    cameraState.isDragging = false;
    if (cameraState.isPinching) return;
    const moveDist = Math.hypot(
      e.clientX - cameraState.pointerDownPos.x,
      e.clientY - cameraState.pointerDownPos.y
    );
    if (moveDist < 6) {
      handleStageClick(e);
    }
  });

  // 行動裝置與平板雙指縮放 (Pinch-to-Zoom)
  canvas.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length === 2) {
        cameraState.isPinching = true;
        cameraState.isDragging = false;
        cameraState.pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        cameraState.pinchStartRadius = cameraState.desiredSpherical.radius;
      }
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    function (e) {
      if (cameraState.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (cameraState.pinchStartDist > 10) {
          const ratio = cameraState.pinchStartDist / Math.max(dist, 10);
          cameraState.desiredSpherical.radius = THREE.MathUtils.clamp(
            cameraState.pinchStartRadius * ratio,
            7.5,
            98
          );
        }
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    function (e) {
      if (e.touches.length < 2) {
        cameraState.isPinching = false;
      }
    },
    { passive: true }
  );

  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  canvas.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      cameraState.desiredSpherical.radius = THREE.MathUtils.clamp(
        cameraState.desiredSpherical.radius + e.deltaY * 0.028,
        7.5,
        98
      );
    },
    { passive: false }
  );

  // Raycaster 點擊島嶼、人物對話氣泡、雲端小精靈
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();

  function showBubbleAtWorldPos(worldVec, text) {
    const screen = worldVec.clone().project(camera);
    if (screen.z > 1) return;
    const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screen.y * 0.5 + 0.5) * window.innerHeight;
    const b = document.createElement("div");
    b.className = "bubble";
    b.style.left = x + "px";
    b.style.top = y - 16 + "px";
    b.textContent = text;
    labelsRoot.appendChild(b);
    setTimeout(function () {
      b.remove();
    }, 3400);
  }

  function handleStageClick(e) {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);

    // 1. 檢查是否點擊雲端小精靈
    const mascotHits = raycaster.intersectObjects(mascotPickables, true);
    if (mascotHits.length > 0) {
      let obj = mascotHits[0].object;
      while (obj && !obj.userData.isMascot) obj = obj.parent;
      if (obj && window.OWSEL_APP && window.OWSEL_APP.onMascotFound) {
        const wp = new THREE.Vector3();
        obj.getWorldPosition(wp);
        showBubbleAtWorldPos(wp.add(new THREE.Vector3(0, 0.8, 0)), "🐿️ 啾啾！你找到雲端心靈小松鼠了！");
        window.OWSEL_APP.onMascotFound(obj.userData.islandId);
        return;
      }
    }

    // 2. 檢查是否點擊走動人物
    const personHits = raycaster.intersectObjects(personPickables, true);
    if (personHits.length > 0) {
      let pObj = personHits[0].object;
      while (pObj && !pObj.userData.quote) pObj = pObj.parent;
      if (pObj) {
        const wp = new THREE.Vector3();
        pObj.getWorldPosition(wp);
        showBubbleAtWorldPos(wp.add(new THREE.Vector3(0, 1.1, 0)), pObj.userData.quote);
        return;
      }
    }

    // 3. 檢查是否點擊浮空島
    const allIslandObjs = Object.keys(islandGroups).map(function (k) {
      return islandGroups[k];
    });
    const islandHits = raycaster.intersectObjects(allIslandObjs, true);
    if (islandHits.length > 0) {
      let node = islandHits[0].object;
      while (node && (!node.userData || !node.userData.islandId)) {
        node = node.parent;
      }
      if (node && node.userData.islandId && window.OWSEL_APP) {
        window.OWSEL_APP.selectIsland(node.userData.islandId, true);
      }
    }
  }

  // 天色切換（晨曦 / 夕暮 / 星夜）
  let timeMode = 0; // 0: day, 1: dusk, 2: night
  function cycleTimeOfDay() {
    timeMode = (timeMode + 1) % 3;
    if (timeMode === 0) {
      scene.background.setHex(0xb5dff8);
      scene.fog.color.setHex(0xb5dff8);
      hemiLight.color.setHex(0xfffaf0);
      hemiLight.intensity = 0.62;
      sunLight.color.setHex(0xfff1d0);
      sunLight.intensity = 1.08;
    } else if (timeMode === 1) {
      scene.background.setHex(0xf7c59f);
      scene.fog.color.setHex(0xfad4b8);
      hemiLight.color.setHex(0xffd6b0);
      hemiLight.intensity = 0.68;
      sunLight.color.setHex(0xff9b54);
      sunLight.intensity = 1.05;
    } else {
      scene.background.setHex(0x1b2942);
      scene.fog.color.setHex(0x1f304d);
      hemiLight.color.setHex(0x6b8cff);
      hemiLight.intensity = 0.48;
      sunLight.color.setHex(0xa8c5ff);
      sunLight.intensity = 0.62;
    }
    return timeMode;
  }

  // =========================================================
  // 10. 主動畫迴圈 (Render Loop)
  // =========================================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    // 1. 浮空島輕柔上下漂浮律動
    Object.keys(islandGroups).forEach(function (k) {
      const grp = islandGroups[k];
      const bob = Math.sin(elapsed * 1.15 + grp.userData.floatPhase) * 0.16;
      grp.position.y = grp.userData.baseY + bob;
    });

    // 2. 所有樹木與花叢隨高空微風輕柔搖曳
    for (let i = 0; i < windSwayItems.length; i++) {
      const w = windSwayItems[i];
      w.obj.rotation.z = w.baseRz + Math.sin(elapsed * w.speed + w.phase) * w.amp;
      w.obj.rotation.x =
        w.baseRx + Math.cos(elapsed * (w.speed * 0.82) + w.phase) * (w.amp * 0.65);
    }

    // 3. 六大浮空島主題造景即時動態
    // (a) 天空之心：五色共鳴水晶塔自轉
    if (animatedLandmarks.heartSpire) {
      animatedLandmarks.heartSpire.spireGroup.rotation.y = elapsed * 0.55;
      animatedLandmarks.heartSpire.spireGroup.position.y =
        2.35 + Math.sin(elapsed * 1.8) * 0.14;
      animatedLandmarks.heartSpire.orbitGroup.rotation.y = -elapsed * 1.1;
    }

    // (b) 澄鏡浮島：懸浮自轉折射水晶稜鏡塔 + 澄鏡湖水波紋
    if (animatedLandmarks.awarenessPrism) {
      const ap = animatedLandmarks.awarenessPrism;
      ap.tower.rotation.y = elapsed * 0.72;
      ap.tower.position.y = 2.35 + Math.sin(elapsed * 2.0) * 0.18;
      ap.ringA.rotation.x = elapsed * 0.9;
      ap.ringB.rotation.y = -elapsed * 0.8;
      const rScale1 = 1 + ((elapsed * 0.45) % 1) * 0.55;
      ap.ripple1.scale.set(rScale1, rScale1, 1);
      ap.ripple1.material.opacity = 0.65 * (1 - ((elapsed * 0.45) % 1));
    }

    // (c) 定心浮島：巨型荷蘭呼吸大風車磨坊 + 90秒定心黃金大沙漏
    if (animatedLandmarks.management) {
      const mg = animatedLandmarks.management;
      mg.bladesHub.rotation.z = -elapsed * 0.65;
      mg.sandStream.scale.x = 0.85 + Math.sin(elapsed * 8) * 0.2;
      mg.sandStream.scale.z = 0.85 + Math.cos(elapsed * 8) * 0.2;
    }

    // (d) 共鳴浮島：百年共鳴粉櫻神木樹屋飄落櫻花瓣
    if (animatedLandmarks.socialPetals) {
      animatedLandmarks.socialPetals.children.forEach(function (p) {
        const u = p.userData;
        const a = u.baseAngle + elapsed * u.speed;
        p.position.x = Math.cos(a) * u.radius;
        p.position.z = Math.sin(a) * u.radius;
        p.position.y = 3.2 - (((elapsed * 0.55 + u.yOffset) % 2.8));
        p.rotation.x = elapsed * 1.5;
        p.rotation.z = elapsed * 1.2;
      });
    }

    // (e) 築橋浮島：和平圈營火躍動 + 雙心拱橋微光
    if (animatedLandmarks.relationship) {
      const rl = animatedLandmarks.relationship;
      rl.fireMesh.scale.y = 0.9 + Math.sin(elapsed * 9.5) * 0.18;
      rl.fireMesh.rotation.y = elapsed * 2.5;
      rl.innerFlame.scale.y = 0.88 + Math.cos(elapsed * 11) * 0.2;
      rl.twinHearts.position.y = 2.25 + Math.sin(elapsed * 2.2) * 0.08;
    }

    // (f) 航標浮島：三環旋轉渾天儀星盤鐘樓 + 擺動黃金正義天平
    if (animatedLandmarks.decision) {
      const dc = animatedLandmarks.decision;
      dc.ring1.rotation.y = elapsed * 0.65;
      dc.ring2.rotation.x = elapsed * 0.82;
      dc.ring2.rotation.z = elapsed * 0.35;
      dc.ring3.rotation.y = -elapsed * 1.05;
      dc.ring3.rotation.x = elapsed * 0.5;
      dc.northStar.rotation.y = elapsed * 1.4;

      const tilt = Math.sin(elapsed * 1.35) * 0.22;
      dc.beamPivot.rotation.z = tilt;
      dc.leftPan.rotation.z = -tilt;
      dc.rightPan.rotation.z = -tilt;
    }

    // 4. 更新島上與空橋上所有走動的人物（連續無縫軌跡 + 水平 Y 軸朝向，絕不閃爍、穿模或傾斜）
    for (let i = 0; i < walkers.length; i++) {
      const w = walkers[i];
      if (w.type === "circle") {
        const angle = w.startAngle + elapsed * w.speed * w.dir;
        const x = w.cx + Math.cos(angle) * w.r;
        const z = w.cz + Math.sin(angle) * w.r;
        w.mesh.position.set(x, w.y, z);
        const tx = -Math.sin(angle) * w.dir;
        const tz = Math.cos(angle) * w.dir;
        w.mesh.rotation.set(0, Math.atan2(tx, tz), 0);
      } else if (w.type === "curve") {
        const s = Math.sin(elapsed * w.speed + w.phase);
        const c = Math.cos(elapsed * w.speed + w.phase);
        const u = 0.5 + 0.34 * s;
        const pt = w.curve.getPoint(u);
        const tan = w.curve.getTangent(u);
        const dirSign = c >= 0 ? 1 : -1;
        w.mesh.position.set(pt.x, pt.y + 0.08, pt.z);
        w.mesh.rotation.set(0, Math.atan2(tan.x * dirSign, tan.z * dirSign), 0);
      } else if (w.type === "rainbowBridge") {
        const s = Math.sin(elapsed * w.speed + w.phase);
        const c = Math.cos(elapsed * w.speed + w.phase);
        const localX = s * 1.98;
        const norm = localX / 1.86;
        const archY = Math.max(0, 1 - norm * norm) * 0.88 + 0.18;
        w.mesh.position.set(localX, archY, w.laneZ);
        w.mesh.rotation.set(0, c >= 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      }

      const swing = Math.sin(elapsed * 7.5 + w.phase) * 0.48;
      w.mesh.userData.legL.rotation.x = swing;
      w.mesh.userData.legR.rotation.x = -swing;
      w.mesh.userData.armL.rotation.x = -swing * 0.75;
      w.mesh.userData.armR.rotation.x = swing * 0.75;
    }

    // 5. 雲海緩慢漂流与巡航熱氣球飛船
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.mesh.position.x = c.baseX + Math.sin(elapsed * 0.08 * c.speed + c.phase) * 3.5;
    }
    const shipAngle = elapsed * 0.11;
    airship.position.set(
      Math.cos(shipAngle) * 28,
      11.5 + Math.sin(elapsed * 0.9) * 0.6,
      Math.sin(shipAngle) * 28
    );
    airship.rotation.y = -shipAngle;

    // 6. 相機阻尼平滑追蹤
    if (cameraState.autoRotate && !cameraState.isDragging) {
      cameraState.desiredSpherical.theta += dt * 0.14;
    }
    cameraState.target.lerp(cameraState.desiredTarget, 0.08);
    cameraState.spherical.radius +=
      (cameraState.desiredSpherical.radius - cameraState.spherical.radius) * 0.08;
    cameraState.spherical.phi +=
      (cameraState.desiredSpherical.phi - cameraState.spherical.phi) * 0.08;
    cameraState.spherical.theta +=
      (cameraState.desiredSpherical.theta - cameraState.spherical.theta) * 0.08;

    const camOffset = new THREE.Vector3().setFromSpherical(cameraState.spherical);
    camera.position.copy(cameraState.target).add(camOffset);
    camera.lookAt(cameraState.target);

    // 7. 同步更新 3D 浮空島名牌螢幕座標
    Object.keys(nameplateElements).forEach(function (k) {
      const item = nameplateElements[k];
      const grp = islandGroups[k];
      const wp = item.worldPos.clone();
      wp.y = grp.position.y + 5.1;
      wp.project(camera);
      if (wp.z > 1) {
        item.el.style.opacity = "0";
      } else {
        const x = (wp.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-wp.y * 0.5 + 0.5) * window.innerHeight;
        item.el.style.opacity = "1";
        item.el.style.transform =
          "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0) translate(-50%, -100%)";
      }
    });

    renderer.render(scene, camera);
  }

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

  // 匯出 3D 場景控制介面供 UI 呼叫
  window.OWSEL_SCENE = {
    focusIsland: focusIsland,
    focusLandmark: focusLandmark,
    resetOverview: resetOverview,
    setTopView: setTopView,
    cycleTimeOfDay: cycleTimeOfDay,
    toggleLinks: function () {
      linkLinesGroup.visible = !linkLinesGroup.visible;
      return linkLinesGroup.visible;
    },
    setAutoRotate: function (flag) {
      cameraState.autoRotate = !!flag;
    },
    setActiveNameplate: function (islandKey) {
      Object.keys(nameplateElements).forEach(function (k) {
        nameplateElements[k].el.classList.toggle("active", k === islandKey);
      });
    }
  };
})();
