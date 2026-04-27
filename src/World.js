import { State } from './Cat.js';

export class World {
  constructor(width, height) {
    this.width   = width;
    this.height  = height;
    this.floorY  = Math.round(height * 0.36);  // wall/floor boundary
    this.cats      = [];
    this.furniture = [];
  }

  addCat(cat)       { this.cats.push(cat); }
  addFurniture(f)   { this.furniture.push(f); }

  update(dt) {
    for (const cat of this.cats) cat.update(dt, this);
  }

  // ─── Furniture queries ─────────────────────────────────────────
  getFurnitureByKey(key) {
    return this.furniture.find(f => f.furnitureKey === key) ?? null;
  }

  getSleepFurniture(cat) {
    const sleepKeys = new Set(['plush_pet_bed', 'cat_house', 'armchair']);
    return this.furniture.find(f => sleepKeys.has(f.furnitureKey) && f.canAccept(cat)) ?? null;
  }

  getAvailableFurniture(cat) {
    const skip = new Set(['food_water_stand']);
    const candidates = this.furniture.filter(f => !skip.has(f.furnitureKey) && f.canAccept(cat));
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // ─── Cat queries ───────────────────────────────────────────────
  getNearbyIdleCat(cat, radius) {
    const idleStates = new Set([State.IDLE, State.SIT, State.GROOM, State.STRETCH]);
    return (
      this.cats.find(other =>
        other !== cat &&
        other.interactionPartner === null &&
        idleStates.has(other.state) &&
        Math.hypot(other.x - cat.x, other.y - cat.y) < radius
      ) ?? null
    );
  }
}
