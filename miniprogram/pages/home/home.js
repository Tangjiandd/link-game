const LEVELS = [
  { id: 1, title: "小动物找朋友", icon: "🐱", pairs: 6, columns: 4, pool: ["🐱", "🐶", "🐰", "🐘", "🦊", "🐷"] },
  { id: 2, title: "佩奇的泥坑派对", icon: "🐷", pairs: 8, columns: 4, pool: ["🐷", "🐽", "🌧️", "☂️", "👢", "💦", "🌈", "🍪"] },
  { id: 3, title: "汪汪队小小救援", icon: "🚒", pairs: 9, columns: 6, pool: ["🐶", "🚒", "🚓", "🚑", "🚁", "🦴", "🧯", "📣", "🛟"] },
  { id: 4, title: "皮普波西花园会", icon: "🌷", pairs: 12, columns: 6, pool: ["🐰", "🐭", "🌷", "🌼", "🦋", "🐞", "🌳", "🌱", "🪴", "🍓", "🧺", "🎨"] },
  { id: 5, title: "森林露营夜", icon: "⛺", pairs: 15, columns: 6, pool: ["🦊", "🐻", "🐿️", "🦉", "⛺", "🔥", "🌙", "⭐", "🍄", "🌲", "🍃", "🥪", "🧃", "🧭", "🔦"] },
  { id: 6, title: "海底寻宝", icon: "🐠", pairs: 18, columns: 6, pool: ["🐠", "🐟", "🐳", "🦈", "🐙", "🦑", "🐬", "🦀", "🐡", "🐚", "🦐", "🦞", "🪸", "⚓", "🛟", "💎", "🔱", "🫧"] },
  { id: 7, title: "恐龙大冒险", icon: "🦖", pairs: 20, columns: 8, pool: ["🦖", "🦕", "🥚", "🌋", "🦴", "🌴", "🌿", "🪨", "☀️", "🌈", "🐊", "🦎", "🐢", "🐍", "🐾", "🦟", "🍂", "🌾", "🏞️", "⛰️"] },
  { id: 8, title: "太空探险队", icon: "🚀", pairs: 24, columns: 8, pool: ["🚀", "🛸", "🪐", "🌍", "🌕", "⭐", "☄️", "👩‍🚀", "👨‍🚀", "🤖", "🛰️", "🔭", "🌌", "🌎", "🧑‍🚀", "📡", "🔋", "💫", "🌠", "☀️", "🌑", "🟣", "🔵", "🟡"] },
  { id: 9, title: "梦幻嘉年华", icon: "🎡", pairs: 28, columns: 8, pool: ["🎡", "🎠", "🎢", "🎪", "🎈", "🎉", "🎁", "🍭", "🍿", "🍦", "🧁", "🍩", "🎵", "🎺", "🥁", "🎨", "🪄", "👑", "🦄", "🐉", "🌟", "💖", "🧸", "🎲", "🪀", "🛼", "🎯", "🎳"] },
];

function shuffle(items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
  }
  return copy;
}

Page({
  data: {
    screen: "levels",
    levelCards: [],
    currentLevel: {},
    board: [],
    remaining: 0,
    progress: 0,
    hintText: "点两个一样的图案试一试",
    showComplete: false,
    completeText: "",
    nextLabel: "下一关",
  },

  onLoad() {
    this.unlocked = Number(wx.getStorageSync("littleLinkUnlocked") || 1);
    this.renderLevels();
  },

  renderLevels() {
    this.setData({
      levelCards: LEVELS.map((level) => ({ ...level, locked: level.id > this.unlocked })),
    });
  },

  chooseLevel(event) {
    const id = Number(event.currentTarget.dataset.id);
    if (id > this.unlocked) return;
    this.startLevel(id);
  },

  startLevel(id) {
    this.level = LEVELS.find((level) => level.id === id);
    this.selected = null;
    const symbols = this.level.pool.slice(0, this.level.pairs);
    this.board = shuffle(symbols.reduce((all, symbol, index) => all.concat([
      { id: `${index}-a`, symbol, removed: false, selected: false, hint: false },
      { id: `${index}-b`, symbol, removed: false, selected: false, hint: false },
    ]), []));
    this.remaining = this.level.pairs;
    this.updateView({ screen: "game", showComplete: false, hintText: "点两个一样的图案试一试" });
  },

  updateView(extra) {
    const progress = ((this.level.pairs - this.remaining) / this.level.pairs) * 100;
    this.setData(Object.assign({ currentLevel: this.level, board: this.board, remaining: this.remaining, progress }, extra || {}));
  },

  tapTile(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (this.board[index].removed) return;
    if (this.selected === null) {
      this.selected = index;
      this.updateSelection("再找一个一样的图案");
      return;
    }
    if (this.selected === index) {
      this.selected = null;
      this.updateSelection("点两个一样的图案试一试");
      return;
    }

    const first = this.selected;
    const sameSymbol = this.board[first].symbol === this.board[index].symbol;
    if (sameSymbol && this.canConnect(first, index)) {
      this.board[first].removed = true;
      this.board[index].removed = true;
      this.selected = null;
      this.remaining -= 1;
      if (this.remaining) this.ensurePlayable();
      this.updateView({ hintText: this.remaining ? "找到啦！再找一对。" : "全部找到啦！" });
      if (!this.remaining) setTimeout(() => this.completeLevel(), 400);
    } else {
      this.selected = index;
      this.updateSelection(sameSymbol ? "这两个朋友现在还不能见面，试试别的一对。" : "不是同一个朋友，换一个试试。");
    }
  },

  updateSelection(message) {
    this.board.forEach((tile, index) => { tile.selected = !tile.removed && index === this.selected; tile.hint = false; });
    this.updateView({ hintText: message });
  },

  // Search the padded grid for a route with at most two turns.
  canConnect(firstIndex, secondIndex) {
    const columns = this.level.columns;
    const rows = this.board.length / columns;
    const grid = Array.from({ length: rows + 2 }, () => Array(columns + 2).fill(false));
    this.board.forEach((tile, index) => { if (!tile.removed) grid[Math.floor(index / columns) + 1][(index % columns) + 1] = true; });
    const start = [Math.floor(firstIndex / columns) + 1, (firstIndex % columns) + 1];
    const end = [Math.floor(secondIndex / columns) + 1, (secondIndex % columns) + 1];
    grid[start[0]][start[1]] = false;
    grid[end[0]][end[1]] = false;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const visited = Array.from({ length: rows + 2 }, () => Array.from({ length: columns + 2 }, () => Array(4).fill(3)));
    const queue = [{ row: start[0], col: start[1], direction: -1, turns: 0 }];
    while (queue.length) {
      const current = queue.shift();
      for (let direction = 0; direction < 4; direction += 1) {
        const turns = current.direction === -1 || current.direction === direction ? current.turns : current.turns + 1;
        if (turns > 2) continue;
        const row = current.row + directions[direction][0];
        const col = current.col + directions[direction][1];
        if (row < 0 || row >= rows + 2 || col < 0 || col >= columns + 2 || grid[row][col]) continue;
        if (row === end[0] && col === end[1]) return true;
        if (visited[row][col][direction] <= turns) continue;
        visited[row][col][direction] = turns;
        queue.push({ row, col, direction, turns });
      }
    }
    return false;
  },

  findAvailablePair() {
    for (let first = 0; first < this.board.length; first += 1) {
      if (this.board[first].removed) continue;
      for (let second = first + 1; second < this.board.length; second += 1) {
        if (!this.board[second].removed && this.board[first].symbol === this.board[second].symbol && this.canConnect(first, second)) return [first, second];
      }
    }
    return null;
  },

  ensurePlayable() {
    if (this.findAvailablePair()) return;
    const positions = this.board.map((tile, index) => tile.removed ? -1 : index).filter((index) => index >= 0);
    const tiles = positions.map((index) => this.board[index]);
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const shuffled = shuffle(tiles);
      positions.forEach((position, index) => { this.board[position] = shuffled[index]; });
      if (this.findAvailablePair()) return;
    }
  },

  showHint() {
    const pair = this.findAvailablePair();
    if (!pair) return;
    this.selected = null;
    this.board.forEach((tile) => { tile.selected = false; tile.hint = false; });
    pair.forEach((index) => { this.board[index].hint = true; });
    this.updateView({ hintText: "这两个朋友可以碰面。" });
    setTimeout(() => { this.board.forEach((tile) => { tile.hint = false; }); this.updateView(); }, 1400);
  },

  restartLevel() { this.startLevel(this.level.id); },

  completeLevel() {
    if (this.level.id < LEVELS.length) {
      this.unlocked = Math.max(this.unlocked, this.level.id + 1);
      wx.setStorageSync("littleLinkUnlocked", this.unlocked);
    }
    this.renderLevels();
    this.setData({
      showComplete: true,
      completeText: this.level.id === LEVELS.length ? "三关全都完成了！" : "你帮所有朋友找到了伙伴。",
      nextLabel: this.level.id === LEVELS.length ? "再玩一次" : "下一关",
    });
  },

  nextLevel() { this.startLevel(this.level.id === LEVELS.length ? 1 : this.level.id + 1); },
  backToLevels() { this.setData({ screen: "levels", showComplete: false }); this.renderLevels(); },
});
