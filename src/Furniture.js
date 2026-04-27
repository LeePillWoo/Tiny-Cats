// Static config keyed by the file name (without .png)
export const FURNITURE_META = {
  '01_cat_tree_large': {
    key: 'cat_tree', name_ko: '캣타워',
    renderW: 112, renderH: 132,
    slots: [
      { slot_id: 0, offset: { x:  5, y: -118 } },  // top platform
      { slot_id: 1, offset: { x:  5, y:  -58 } },  // mid shelf
    ],
    allowed_traits: ['playful', 'energetic', 'agile', 'curious'],
    max_cats: 2,
  },
  '02_plush_pet_bed_medium': {
    key: 'plush_pet_bed', name_ko: '방석',
    renderW: 92, renderH: 58,
    slots: [
      { slot_id: 0, offset: { x: 0, y: -8 } },
    ],
    allowed_traits: ['lazy', 'sweet', 'calm', 'gentle', 'affectionate'],
    max_cats: 1,
  },
  '03_scratching_post_medium': {
    key: 'scratching_post', name_ko: '스크래처',
    renderW: 72, renderH: 102,
    slots: [
      { slot_id: 0, offset: { x: 0, y: -76 } },   // top perch
    ],
    allowed_traits: ['playful', 'energetic', 'curious', 'agile', 'independent'],
    max_cats: 1,
  },
  '04_food_water_stand_small': {
    key: 'food_water_stand', name_ko: '밥그릇',
    renderW: 80, renderH: 44,
    slots: [
      { slot_id: 0, offset: { x: 0, y: 2 } },
    ],
    allowed_traits: null,   // any cat can eat
    max_cats: 1,
  },
  '05_cat_house_medium': {
    key: 'cat_house', name_ko: '고양이집',
    renderW: 96, renderH: 96,
    slots: [
      { slot_id: 0, offset: { x: 2, y: -8 } },
    ],
    allowed_traits: ['shy', 'mysterious', 'independent', 'reserved'],
    max_cats: 1,
  },
  '06_armchair_large': {
    key: 'armchair', name_ko: '안락의자',
    renderW: 112, renderH: 102,
    slots: [
      { slot_id: 0, offset: { x: -24, y: -58 } },
      { slot_id: 1, offset: { x:  24, y: -58 } },
    ],
    allowed_traits: ['elegant', 'gentle', 'calm', 'loyal', 'social', 'vocal', 'affectionate'],
    max_cats: 2,
  },
};

export class Furniture {
  constructor(fileKey, x, y, image) {
    const meta = FURNITURE_META[fileKey];
    if (!meta) throw new Error(`Unknown furniture: ${fileKey}`);

    this.fileKey       = fileKey;
    this.furnitureKey  = meta.key;
    this.name_ko       = meta.name_ko;
    this.x             = x;
    this.y             = y;
    this.renderWidth   = meta.renderW;
    this.renderHeight  = meta.renderH;
    this.slots         = meta.slots.map(s => ({ ...s, offset: { ...s.offset } }));
    this.allowedTraits = meta.allowed_traits;
    this.maxCats       = meta.max_cats;
    this.image         = image;

    // slot_id → cat_id
    this._occupancy = new Map();
  }

  hasSlot() {
    return this._occupancy.size < this.maxCats;
  }

  // Returns the slot object if successful, null otherwise
  occupySlot(catId) {
    if (!this.hasSlot()) return null;
    const slot = this.slots.find(s => !this._occupancy.has(s.slot_id));
    if (!slot) return null;
    this._occupancy.set(slot.slot_id, catId);
    return slot;
  }

  releaseSlot(catId) {
    for (const [slotId, id] of this._occupancy) {
      if (id === catId) { this._occupancy.delete(slotId); return; }
    }
  }

  canAccept(cat) {
    if (!this.hasSlot()) return false;
    if (!this.allowedTraits) return true;        // food bowl → anyone
    return cat.traits.some(t => this.allowedTraits.includes(t));
  }
}
