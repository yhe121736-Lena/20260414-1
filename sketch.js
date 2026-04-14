let stars = [];
let spaceObjects = []; // 存放隕石、外星人、太空人
let lasers = [];       // 存放發射中的雷射
let shakeAmount = 0;   // 畫面抖動強度
let isWarping = false; // 控制背景模式：false 為星空漂移，true 為前進噴發
let isAutoPilot = false; // 自動導航開關
let autoDodgeX = 0;    // 自動導航產生的偏移量
let autoDodgeY = 0;
let typewriterTimeout; // 用來儲存打字機計時器，避免重疊執行
let projects = [
  { name: "第一週：幾何練習", url: "https://yhe121736-lena.github.io/20260407-1/" },
  { name: "第二週：變數運用", url: "https://yhe121736-lena.github.io/20260414/" },
  { name: "第三週：迴圈造型", url: "week3/index.html" },
  { name: "第四週：互動開發", url: "week4/index.html" }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor(); // 隱藏原生游標，改用自定義 HUD
  
  // 背景星空初始化
  for (let i = 0; i < 200; i++) {
    stars.push(new Star());
  }

  // 初始化太空物件
  for (let i = 0; i < 3; i++) {
    spaceObjects.push(new SpaceObject());
  }

  // 使用 p5.dom createElement 動態生成按鈕選單
  let menuLabel = createElement('h4', '任務導覽選單');
  menuLabel.position(30, 20);
  menuLabel.style('color', '#00f2ff');
  menuLabel.style('font-family', "'Orbitron', sans-serif");

  for (let i = 0; i < projects.length; i++) {
    let btn = createButton(projects[i].name);
    btn.position(30, 60 + i * 40);
    btn.mousePressed(() => loadProject(projects[i].url));
    btn.style('background', 'rgba(0, 242, 255, 0.2)');
    btn.style('color', '#fff');
    btn.style('font-family', "'Share Tech Mono', monospace");
    btn.style('border', '1px solid #00f2ff');
    btn.style('padding', '5px 15px');
    btn.style('cursor', 'pointer');
  }

  // 新增：模式切換按鈕
  let warpBtn = createButton('切換飛行模式');
  warpBtn.position(30, height - 60);
  warpBtn.mousePressed(() => { isWarping = !isWarping; });
  warpBtn.style('background', 'rgba(255, 0, 85, 0.3)');
  warpBtn.style('color', '#fff');
  warpBtn.style('font-family', "'Orbitron', sans-serif");
  warpBtn.style('border', '1px solid #ff0055');
  warpBtn.style('padding', '5px 15px');
  warpBtn.style('cursor', 'pointer');

  // 新增：自動導航開關按鈕
  let autoBtn = createButton('自動導航系統');
  autoBtn.position(160, height - 60);
  autoBtn.mousePressed(() => { isAutoPilot = !isAutoPilot; });
  autoBtn.style('background', 'rgba(0, 255, 150, 0.3)');
  autoBtn.style('color', '#fff');
  autoBtn.style('font-family', "'Orbitron', sans-serif");
  autoBtn.style('border', '1px solid #00ff96');
  autoBtn.style('padding', '5px 15px');
  autoBtn.style('cursor', 'pointer');

  // 啟動打字機效果：系統日誌輸出
  const logText = "<b>> 核心架構：</b>採用 <span style='color: #fff;'>vertex()</span> 陣列實現多維度空間透視。<br><b>> 導航系統：</b>整合 <span style='color: #fff;'>map()</span> 映射函數與物理撞擊反饋邏輯。<br><b>> 資料鏈結：</b>支援透過遠端通訊窗 (iframe) 檢索程式演進數據。系統目前運行正常，穿越隕石帶中...";
  startTypewriter('log-content', logText, 30);

  // 新增：當滑鼠移入日誌區域時重頭播放
  select('#reflection-box').mouseOver(() => {
    startTypewriter('log-content', logText, 30);
  });

  // 初始化視窗拖動功能
  initDraggable();
}

function draw() {
  background(5, 5, 20); // 深邃太空色

  // 處理畫面抖動效果
  if (shakeAmount > 0) {
    push();
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; // 抖動逐漸減弱 (冷卻)
    if (shakeAmount < 0.1) shakeAmount = 0;
  }

  // 計算視差偏移量 (Parallax)
  let targetX = map(mouseX, 0, width, 20, -20);
  let targetY = map(mouseY, 0, height, 20, -20);

  if (isAutoPilot) {
    // 1. 尋找最危險的隕石 (距離近且靠近中心)
    let threat = null;
    let minDist = width;
    for (let obj of spaceObjects) {
      if (obj.type === 'asteroid' && obj.z < width * 0.6) {
        if (obj.z < minDist) {
          minDist = obj.z;
          threat = obj;
        }
      }
    }

    // 2. 如果有威脅，計算躲避向量
    if (threat) {
      // 向隕石的反方向偏移，z 越近偏移越強
      let dodgePower = map(threat.z, 0, width * 0.6, 80, 0);
      autoDodgeX = lerp(autoDodgeX, threat.x > 0 ? -dodgePower : dodgePower, 0.1);
      autoDodgeY = lerp(autoDodgeY, threat.y > 0 ? -dodgePower : dodgePower, 0.1);
    } else {
      autoDodgeX = lerp(autoDodgeX, 0, 0.05);
      autoDodgeY = lerp(autoDodgeY, 0, 0.05);
    }
  } else {
    autoDodgeX = lerp(autoDodgeX, 0, 0.1);
    autoDodgeY = lerp(autoDodgeY, 0, 0.1);
  }

  let moveX = targetX + autoDodgeX;
  let moveY = targetY + autoDodgeY;

  // 繪製背景星空
  for (let s of stars) {
    s.update();
    s.display(moveX, moveY);
  }

  // 繪製太空物件
  for (let obj of spaceObjects) {
    obj.update();
    obj.display();
  }

  // 繪製座艙主體
  drawSpaceCabin(moveX, moveY);
  
  // 繪製 HUD 與 儀表板數據
  drawShieldEffect();
  drawHUD(moveX, moveY);

  // 繪製雷射波
  drawLasers();

  // 新增：撞擊時的紅色警告邊框
  if (shakeAmount > 2) {
    noFill();
    stroke(255, 0, 0, map(shakeAmount, 0, 20, 0, 255)); // 透明度隨抖動強度變化
    strokeWeight(20);
    rectMode(CORNER);
    rect(0, 0, width, height);
  }

  if (shakeAmount > 0) {
    pop(); // 結束抖動位移
  }
}

// 新增：滑鼠點擊發射雷射
function mousePressed() {
  // 檢查是否點擊在左側選單區域，避免誤射
  if (mouseX < 250) return;

  // 加入新雷射 (壽命 5 幀)
  lasers.push({ x: mouseX, y: mouseY, life: 5 });

  // 檢查是否擊中太空物件
  for (let obj of spaceObjects) {
    if (obj.checkHit(mouseX, mouseY)) {
      obj.reset();
      shakeAmount = 8; // 擊碎物件時的小震動
    }
  }
}

// 運用 vertex 繪製太空艙透視結構
function drawSpaceCabin(ox, oy) {
  noFill();
  
  // 根據 shakeAmount 決定顏色：撞擊時變紅，平時為青色
  if (shakeAmount > 5) {
    stroke(255, 50, 50, 200); // 警告紅
  } else {
    stroke(0, 242, 255, 150); // 航行青
  }
  strokeWeight(2);

  // 太空艙框架 (透視效果)
  // 左側牆面
  beginShape();
  vertex(0, 0);
  vertex(width * 0.2 + ox, height * 0.2 + oy);
  vertex(width * 0.2 + ox, height * 0.8 + oy);
  vertex(0, height);
  endShape();

  // 右側牆面
  beginShape();
  vertex(width, 0);
  vertex(width * 0.8 + ox, height * 0.2 + oy);
  vertex(width * 0.8 + ox, height * 0.8 + oy);
  vertex(width, height);
  endShape();

  // 觀測窗中心框
  rectMode(CORNERS);
  rect(width * 0.2 + ox, height * 0.2 + oy, width * 0.8 + ox, height * 0.8 + oy);
  
  // 裝飾性的掃描線
  for (let i = 0; i < height; i += 20) {
    stroke(0, 242, 255, 15);
    let scanY = (i + frameCount) % height;
    line(0, scanY, width, scanY);
  }
}

// 新增：自定義 HUD 瞄準鏡與數據顯示
function drawHUD(ox, oy) {
  push();
  // 1. 右上角儀表數據
  fill(0, 242, 255, 200);
  textAlign(RIGHT);
  textFont('Share Tech Mono');
  textSize(16);
  let speed = isWarping ? "99,999 KM/S (WARP)" : "1,250 KM/S (CRUISE)";
  text(`VELOCITY: ${speed}`, width - 30, 40);
  
  let shieldStatus = shakeAmount > 5 ? "WARNING: IMPACT" : "SHIELD: STABLE";
  if (shakeAmount > 5 && frameCount % 10 < 5) fill(255, 0, 0); 
  text(shieldStatus, width - 30, 65);

  // 3. 自動導航狀態
  fill(isAutoPilot ? "#00ff96" : "#555");
  text(`AUTO-PILOT: ${isAutoPilot ? "ACTIVE" : "OFF"}`, width - 30, 90);

  // 2. 自定義滑鼠 HUD
  translate(mouseX, mouseY);
  rotate(frameCount * 0.02);
  noFill();
  stroke(0, 242, 255, 200);
  strokeWeight(2);
  ellipse(0, 0, 40, 40);
  line(-25, 0, -15, 0);
  line(25, 0, 15, 0);
  line(0, -25, 0, -15);
  line(0, 25, 0, 15);
  
  // 隨滑鼠移動的外圈
  rotate(-frameCount * 0.05);
  strokeWeight(1);
  arc(0, 0, 55, 55, 0, PI/2);
  arc(0, 0, 55, 55, PI, 3*PI/2);
  pop();
}

// 新增：護盾碰撞漣漪效果
function drawShieldEffect() {
  if (shakeAmount > 5) {
    push();
    noFill();
    // 使用 shakeAmount 控制漣漪的擴散
    let rippleSize = map(shakeAmount, 20, 0, 100, width * 1.5);
    let alpha = map(shakeAmount, 20, 0, 200, 0);
    stroke(0, 242, 255, alpha);
    strokeWeight(2);
    
    // 繪製多重圓環模擬護盾
    ellipse(width/2, height/2, rippleSize, rippleSize * 0.6);
    ellipse(width/2, height/2, rippleSize * 0.8, rippleSize * 0.5);
    
    pop();
  }
}

// 繪製雷射動畫
function drawLasers() {
  push();
  for (let i = lasers.length - 1; i >= 0; i--) {
    let l = lasers[i];
    // 雷射顏色隨生命週期變淡
    stroke(0, 255, 255, map(l.life, 0, 5, 0, 255));
    strokeWeight(l.life * 2);
    // 從太空艙底部兩側射向目標
    line(0, height, l.x, l.y);
    line(width, height, l.x, l.y);
    l.life--;
    if (l.life <= 0) lasers.splice(i, 1);
  }
  pop();
}

function loadProject(url) {
  let container = document.getElementById('gallery-container');
  let iframe = document.getElementById('project-frame');

  // 隨機產生視窗位置 (保持在螢幕可見範圍內)
  // 視窗寬度為 40%，高度為 60%，因此 left 最大 60%，top 最大 40%
  let randomX = random(5, 55); // 留一點邊距，範圍在 5% 到 55%
  let randomY = random(5, 35); // 範圍在 5% 到 35%
  
  container.style.left = randomX + '%';
  container.style.top = randomY + '%';

  container.style.display = 'block';
  iframe.src = url;
}

// 打字機效果函式：自動跳過 HTML 標籤以確保樣式正確
function startTypewriter(id, text, speed) {
  let i = 0;
  let elem = document.getElementById(id);
  if (!elem) return;
  
  // 每次開始前先清除舊的計時器並清空內容
  clearTimeout(typewriterTimeout);
  elem.innerHTML = "";

  function type() {
    if (i < text.length) {
      if (text.charAt(i) === '<') {
        // 如果遇到 HTML 標籤，一次性跳到標籤結束
        let tagEnd = text.indexOf('>', i);
        elem.innerHTML += text.substring(i, tagEnd + 1);
        i = tagEnd + 1;
      } else {
        elem.innerHTML += text.charAt(i);
        i++;
      }
      typewriterTimeout = setTimeout(type, speed);
    }
  }
  type();
}

// 實作視窗拖動邏輯
function initDraggable() {
  let container = document.getElementById('gallery-container');
  let header = document.getElementById('gallery-header');
  let iframe = document.getElementById('project-frame');
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  header.onmousedown = (e) => {
    e = e || window.event;
    e.preventDefault();
    // 記錄初始滑鼠位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 拖動時讓視窗半透明
    container.style.opacity = 0.7;
    // 拖動時關閉 iframe 的滑鼠事件，避免拖動中斷
    iframe.style.pointerEvents = 'none';

    document.onmouseup = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      // 放下時恢復不透明
      container.style.opacity = 1.0;
      iframe.style.pointerEvents = 'auto'; // 停止拖動後恢復
    };

    document.onmousemove = (e) => {
      e = e || window.event;
      e.preventDefault();
      // 計算滑鼠位移
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // 設定新的視窗位置
      container.style.top = (container.offsetTop - pos2) + "px";
      container.style.left = (container.offsetLeft - pos1) + "px";
    };
  };
}

class Star {
  constructor() {
    this.x = random(-width, width);
    this.y = random(-height, height);
    this.z = random(width);
    this.pz = this.z;
    this.size = random(1, 3);
    this.speed = random(10, 20); // 飛行模式的速度
  }
  update() {
    if (isWarping) {
      this.pz = this.z;
      this.z -= this.speed;
      if (this.z < 1) {
        this.z = width;
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.pz = this.z;
      }
    } else {
      // 一般模式：緩慢橫向移動
      this.x += 0.5;
      if (this.x > width) this.x = -width;
      this.z = width; // 保持固定深度
      this.pz = this.z;
    }
  }
  display(ox, oy) {
    let sx = map(this.x / this.z, 0, 1, 0, width) + width / 2;
    let sy = map(this.y / this.z, 0, 1, 0, height) + height / 2;

    if (isWarping) {
      stroke(255, 200);
      strokeWeight(this.size);
      let px = map(this.x / this.pz, 0, 1, 0, width) + width / 2;
      let py = map(this.y / this.pz, 0, 1, 0, height) + height / 2;
      line(px, py, sx, sy);
    } else {
      noStroke();
      fill(255, 200);
      ellipse(sx + ox, sy + oy, this.size);
    }
  }
}

// 新增：太空物件類別（隕石、外星人、太空人）
class SpaceObject {
  constructor() {
    this.reset();
  }

  reset() {
    this.z = width; // 從遠處產生
    this.type = random(['asteroid', 'alien', 'astronaut']);
    
    if (this.type === 'asteroid') {
      // 隕石設定：讓它們更有機率出現在畫面中心附近，產生直接撞擊感
      this.x = random(-width * 0.3, width * 0.3);
      this.y = random(-height * 0.3, height * 0.3);
      this.speed = random(5, 12); // 隕石通常比較快
    } else {
      this.x = random(-width, width);
      this.y = random(-height, height);
      this.speed = random(3, 8);
    }

    this.rot = random(TWO_PI);
    this.rotSpeed = random(-0.05, 0.05);
  }

  update() {
    // 飛行模式時速度加快
    let currentSpeed = isWarping ? this.speed * 5 : this.speed;
    this.z -= currentSpeed;
    this.rot += this.rotSpeed;

    // 如果飛出螢幕或到達前方，重置位置
    if (this.z < 1) {
      // 如果是隕石，加入隨機機率觸發撞擊抖動，避免過於頻繁
      if (this.type === 'asteroid' && random(1) < 0.3) { 
        // 提高撞擊感，只要隕石飛到鏡頭前就有機會抖動
        shakeAmount = 20; 
      }
      this.reset();
    }
  }

  // 新增：檢查是否被雷射擊中
  checkHit(mx, my) {
    let sx = map(this.x / this.z, 0, 1, 0, width) + width / 2;
    let sy = map(this.y / this.z, 0, 1, 0, height) + height / 2;
    let r = map(this.z, 0, width, 50, 2);
    
    // 判斷滑鼠點擊是否在物件投影範圍內
    return dist(mx, my, sx, sy) < r;
  }

  display() {
    let sx = map(this.x / this.z, 0, 1, 0, width) + width / 2;
    let sy = map(this.y / this.z, 0, 1, 0, height) + height / 2;
    let r = map(this.z, 0, width, 50, 2); // 越近越大

    push();
    translate(sx, sy);
    rotate(this.rot);
    noStroke();

    if (this.type === 'asteroid') {
      // 繪製隕石 (不規則圓形)
      fill(100, 80, 70);
      beginShape();
      for(let a=0; a<TWO_PI; a+=0.5) {
        let offset = random(r*0.8, r*1.2);
        vertex(cos(a)*offset, sin(a)*offset);
      }
      endShape(CLOSE);
    } 
    else if (this.type === 'alien') {
      // 繪製外星人 (綠色頭部)
      fill(0, 255, 100);
      ellipse(0, 0, r, r * 1.2);
      fill(0);
      ellipse(-r/4, -r/10, r/3, r/5); // 左眼
      ellipse(r/4, -r/10, r/3, r/5);  // 右眼
    } 
    else if (this.type === 'astronaut') {
      // 繪製太空人 (簡化版：頭盔與身體)
      fill(255);
      noStroke();
      rectMode(CENTER);
      rect(0, r/2, r, r); // 身體
      fill(200, 230, 255);
      ellipse(0, 0, r*0.8, r*0.7); // 頭盔鏡面

      stroke(255);
      strokeWeight(r/10);
      noFill();
      arc(0, r/2, r*1.5, r, 0, PI); // 氧氣管線
    }

    pop();
  }
}
