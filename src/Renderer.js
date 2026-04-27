import { State } from './Cat.js';

const STATE_ICON = {
  [State.SLEEP]:   '💤',
  [State.EAT]:     '🍖',
  [State.PLAY]:    '🎾',
  [State.FIGHT]:   '⚡',
  [State.GROOM]:   '✨',
  [State.SCRATCH]: '💅',
};

// Warm room palette
const COL = {
  wall:      '#EDE0C6',
  wallShade: '#E0D0B0',
  baseboard: '#C4A878',
  floor:     '#FDF6E3',
  floorLine: '#E8D9C0',
  rug:       'rgba(180,120,80,0.12)',
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  render(world) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    this._drawRoom(W, H, world.floorY);
    this._drawScene(world);
  }

  // ─── Background ────────────────────────────────────────────────
  _drawRoom(W, H, floorY) {
    const ctx = this.ctx;

    // Wall
    ctx.fillStyle = COL.wall;
    ctx.fillRect(0, 0, W, floorY);

    // Wall lower shading
    ctx.fillStyle = COL.wallShade;
    ctx.fillRect(0, floorY - 18, W, 18);

    // Subtle wallpaper stripe
    ctx.strokeStyle = 'rgba(200,175,130,0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, floorY - 18); ctx.stroke();
    }

    // Baseboard
    ctx.fillStyle = COL.baseboard;
    ctx.fillRect(0, floorY - 4, W, 8);

    // Floor
    ctx.fillStyle = COL.floor;
    ctx.fillRect(0, floorY + 4, W, H - floorY);

    // Floor tile grid
    ctx.strokeStyle = COL.floorLine;
    ctx.lineWidth = 0.8;
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, floorY + 4); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = floorY + 4; y < H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Decorative rug hint in the center
    ctx.fillStyle = COL.rug;
    ctx.beginPath();
    ctx.ellipse(W / 2, floorY + (H - floorY) * 0.65, 220, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    // Window on wall
    this._drawWindow(120, 28, 90, 72);
  }

  _drawWindow(x, y, w, h) {
    const ctx = this.ctx;
    // Sky
    ctx.fillStyle = '#B8D8F0';
    ctx.fillRect(x, y, w, h);
    // Clouds (simple pixel blobs)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x + 8,  y + 12, 22, 8);
    ctx.fillRect(x + 14, y + 8,  14, 6);
    ctx.fillRect(x + 44, y + 18, 28, 8);
    ctx.fillRect(x + 50, y + 14, 18, 6);
    // Frame
    ctx.strokeStyle = '#C4A878';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    // Cross
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w,    y + h / 2);
    ctx.stroke();
  }

  // ─── Scene objects (depth-sorted by Y) ─────────────────────────
  _drawScene(world) {
    const items = [
      ...world.furniture.map(f => ({ type: 'furniture', obj: f, sortY: f.y })),
      ...world.cats.map(c =>      ({ type: 'cat',       obj: c, sortY: c.y })),
    ].sort((a, b) => a.sortY - b.sortY);

    for (const item of items) {
      if (item.type === 'furniture') this._drawFurniture(item.obj);
      else                           this._drawCat(item.obj);
    }
  }

  // ─── Furniture ─────────────────────────────────────────────────
  _drawFurniture(f) {
    if (!f.image) return;
    const ctx = this.ctx;
    // Draw centered-X, bottom-anchored at f.y
    ctx.drawImage(f.image,
      Math.round(f.x - f.renderWidth / 2),
      Math.round(f.y - f.renderHeight),
      f.renderWidth, f.renderHeight
    );

    // Name tag (small, subtle)
    ctx.save();
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(100,70,30,0.55)';
    ctx.fillText(f.name_ko, f.x, f.y + 8);
    ctx.restore();
  }

  // ─── Cat ───────────────────────────────────────────────────────
  _drawCat(cat) {
    if (!cat.image) return;
    const ctx  = this.ctx;
    const size = cat.renderSize;
    const tf   = cat.getTransform();
    const dx   = tf.dx ?? 0;

    ctx.save();
    ctx.translate(Math.round(cat.x + dx), Math.round(cat.y + (tf.dy ?? 0)));
    ctx.scale(cat.facing * (tf.sx ?? 1), tf.sy ?? 1);
    if (tf.rot) ctx.rotate(tf.rot);
    ctx.drawImage(cat.image, -size / 2, -size, size, size);
    ctx.restore();

    // Name label
    ctx.save();
    ctx.font      = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(60,35,10,0.70)';
    ctx.fillText(cat.name_ko, cat.x, cat.y - size - 5);
    ctx.restore();

    // State icon (top-right of cat)
    const icon = STATE_ICON[cat.state];
    if (icon) {
      ctx.save();
      ctx.font      = '13px serif';
      ctx.textAlign = 'left';
      ctx.fillText(icon, cat.x + size * 0.42, cat.y - size + 8);
      ctx.restore();
    }

    // Floating particles
    if (cat.particles.length) this._drawParticles(cat);
  }

  _drawParticles(cat) {
    const ctx  = this.ctx;
    const size = cat.renderSize;
    for (const p of cat.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.font        = `${Math.round(14 * p.scale)}px serif`;
      ctx.textAlign   = 'center';
      ctx.fillText(p.text, cat.x + p.x, cat.y - size * 0.75 + p.y);
      ctx.restore();
    }
  }
}
