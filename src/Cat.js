import { rand, clamp } from './utils.js';

export const State = {
  IDLE:    'idle',
  WALK:    'walk',
  RUN:     'run',
  GROOM:   'groom',
  STRETCH: 'stretch',
  SLEEP:   'sleep',
  EAT:     'eat',
  SCRATCH: 'scratch',
  SIT:     'sit',
  PLAY:    'play',
  FIGHT:   'fight',
};

// Map furniture key → arrival state
const FURNITURE_STATE = {
  cat_tree:         State.SIT,
  plush_pet_bed:    State.SLEEP,
  scratching_post:  State.SCRATCH,
  food_water_stand: State.EAT,
  cat_house:        State.SLEEP,
  armchair:         State.SIT,
};

const FURNITURE_DURATION = {
  cat_tree:         [4000, 9000],
  plush_pet_bed:    [8000, 16000],
  scratching_post:  [3000, 5500],
  food_water_stand: [2500, 4000],
  cat_house:        [6000, 13000],
  armchair:         [5000, 11000],
};

export class Cat {
  constructor(data, x, y, image) {
    this.id           = data.id;
    this.type         = data.type;
    this.name_ko      = data.name_ko;
    this.traits       = data.traits;
    this.stats        = { ...data.stats };
    this.color_hint   = data.color_hint;
    this.image        = image;

    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.facing = Math.random() < 0.5 ? 1 : -1;

    this.state         = State.IDLE;
    this.stateTimer    = 0;
    this.stateDuration = rand(1500, 3500);

    // Per-cat phase offset so animations don't all sync up
    this.animTime = Math.random() * Math.PI * 2;

    this.targetFurniture  = null;
    this._arriveState     = null;
    this._arriveDuration  = 0;
    this.interactionPartner = null;

    this.hunger    = 65 + Math.random() * 35;
    this.happiness = 60 + Math.random() * 40;
    this.energy    = data.stats.energy;

    // Floating text particles { x, y, vy, text, life, maxLife, alpha, scale }
    this.particles = [];
  }

  get renderSize() { return 80; }

  // ─── Main update ───────────────────────────────────────────────
  update(dt, world) {
    this.animTime   += dt / 1000;
    this.stateTimer += dt;

    this.hunger = Math.max(0, this.hunger - dt * 0.0025);
    this.energy = Math.max(0, this.energy - dt * (this.state === State.SLEEP ? -0.008 : 0.0008));

    this._updateParticles(dt);
    this._spawnParticles(dt);

    switch (this.state) {
      case State.IDLE:    this._updateIdle(world);    break;
      case State.WALK:
      case State.RUN:     this._updateMove(dt, world); break;
      case State.SLEEP:   this._updateSleep(world);   break;
      case State.EAT:     this._updateEat(world);     break;
      case State.PLAY:    this._updatePlay(dt, world); break;
      case State.FIGHT:   this._updateFight(world);   break;
      default:            this._updateTimed(world);   break; // groom, stretch, scratch, sit
    }
  }

  // ─── State updaters ────────────────────────────────────────────
  _updateIdle(world) {
    if (this.stateTimer >= this.stateDuration) this._decide(world);
  }

  _updateMove(dt, world) {
    const dx   = this.targetX - this.x;
    const dy   = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.x = this.targetX;
      this.y = this.targetY;
      this._onArrival(world);
    } else {
      const spd = this.stats.speed * (this.state === State.RUN ? 110 : 62) * dt / 1000;
      const step = Math.min(spd, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.facing = dx > 0 ? 1 : -1;
    }
    // Safety: if walking forever, give up
    if (this.stateTimer > 14000) this._decide(world);
  }

  _updateTimed(world) {
    if (this.stateTimer >= this.stateDuration) {
      this._releaseFurniture();
      this._decide(world);
    }
  }

  _updateSleep(world) {
    if (this.stateTimer >= this.stateDuration) {
      this._releaseFurniture();
      this._setState(State.STRETCH, rand(1500, 2500));
    }
  }

  _updateEat(world) {
    this.hunger = Math.min(100, this.hunger + 0.025 * (this.stateTimer > 0 ? 16 : 0));
    if (this.stateTimer >= this.stateDuration) {
      this._releaseFurniture();
      this._decide(world);
    }
  }

  _updatePlay(dt, world) {
    const partner = this.interactionPartner;
    if (!partner || this.stateTimer >= this.stateDuration) {
      this.interactionPartner = null;
      this._decide(world);
      return;
    }
    // Gentle bounce toward partner then back
    const dx   = partner.x - this.x;
    const dist = Math.abs(dx);
    const spd  = 28 * dt / 1000;
    if (dist > 62)      { this.x += Math.sign(dx) * spd; this.facing = Math.sign(dx); }
    else if (dist < 36) { this.x -= Math.sign(dx) * spd; }
  }

  _updateFight(world) {
    const partner = this.interactionPartner;
    if (!partner || this.stateTimer >= this.stateDuration) {
      this.interactionPartner = null;
      this._decide(world);
    }
  }

  // ─── Arrival ───────────────────────────────────────────────────
  _onArrival(world) {
    if (this._arriveState) {
      this._setState(this._arriveState, this._arriveDuration);
      this._arriveState    = null;
      this._arriveDuration = 0;
    } else {
      this._decide(world);
    }
  }

  // ─── Decision making ───────────────────────────────────────────
  _decide(world) {
    // Needs-based: food
    if (this.hunger < 28) {
      const food = world.getFurnitureByKey('food_water_stand');
      if (food && food.canAccept(this)) {
        this._goToFurniture(food, world);
        return;
      }
    }
    // Needs-based: sleep
    if (this.energy < 22) {
      const bed = world.getSleepFurniture(this);
      if (bed) { this._goToFurniture(bed, world); return; }
    }

    // Cat-cat interaction (30% chance when nearby)
    const nearby = world.getNearbyIdleCat(this, 190);
    if (nearby && Math.random() < 0.30) {
      this._startInteraction(nearby, world);
      return;
    }

    const roll = Math.random();
    if (roll < 0.13) {
      this._setState(State.GROOM,   rand(3000, 6500));
    } else if (roll < 0.19) {
      this._setState(State.STRETCH, rand(1400, 2600));
    } else if (roll < 0.42) {
      const furni = world.getAvailableFurniture(this);
      if (furni) { this._goToFurniture(furni, world); return; }
      this._wander(world);
    } else if (roll < 0.52) {
      this._wander(world, true);   // run!
    } else {
      this._setState(State.IDLE, rand(1800, 4000));
    }
  }

  // ─── Furniture ─────────────────────────────────────────────────
  _goToFurniture(furni, world) {
    const slot = furni.occupySlot(this.id);
    if (!slot) { this._wander(world); return; }

    this.targetFurniture = furni;
    this.targetX = clamp(furni.x + slot.offset.x, 40, world.width - 40);
    this.targetY = clamp(furni.y + slot.offset.y, world.floorY + 10, world.height - 20);

    const key = furni.furnitureKey;
    this._arriveState    = FURNITURE_STATE[key]  || State.SIT;
    this._arriveDuration = rand(...(FURNITURE_DURATION[key] || [4000, 8000]));
    this._setState(State.WALK, 15000);
  }

  _releaseFurniture() {
    if (this.targetFurniture) {
      this.targetFurniture.releaseSlot(this.id);
      this.targetFurniture = null;
    }
  }

  // ─── Cat interaction ───────────────────────────────────────────
  _startInteraction(other, world) {
    const compatible = this.traits.some(t => other.traits.includes(t)) || Math.random() < 0.55;
    const type = compatible ? State.PLAY : State.FIGHT;
    const dur  = rand(4000, 8500);

    other._releaseFurniture();

    this.interactionPartner  = other;
    other.interactionPartner = this;

    // Walk to stand beside the other cat
    const side = this.x < other.x ? -58 : 58;
    this.targetX = clamp(other.x + side, 50, world.width - 50);
    this.targetY = other.y;
    this._arriveState    = type;
    this._arriveDuration = dur;
    this._setState(State.WALK, 10000);

    other._setState(type, dur);
    other.facing = this.x < other.x ? 1 : -1;
  }

  // ─── Wander ────────────────────────────────────────────────────
  _wander(world, run = false) {
    const margin = 70;
    const fl     = world ? world.floorY : 210;
    const W      = world ? world.width  : 800;
    const H      = world ? world.height : 560;
    this.targetX = rand(margin, W - margin);
    this.targetY = rand(fl + 30, H - 25);
    this._arriveState    = State.IDLE;
    this._arriveDuration = rand(1500, 3500);
    this._setState(run ? State.RUN : State.WALK, 14000);
  }

  // ─── State setter ──────────────────────────────────────────────
  _setState(state, duration) {
    this.state         = state;
    this.stateTimer    = 0;
    this.stateDuration = duration;
  }

  // ─── Particles ─────────────────────────────────────────────────
  _updateParticles(dt) {
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.y    -= p.vy * dt / 1000;
      p.alpha = p.life / p.maxLife;
      return p.life > 0;
    });
  }

  _spawnParticles(dt) {
    const add = (text, vy, life, scaleRange) => {
      if (Math.random() < dt * 0.001 * scaleRange[1]) return;
      this.particles.push({
        x: rand(-18, 18), y: 0,
        vy, text, life, maxLife: life, alpha: 1,
        scale: rand(scaleRange[0], scaleRange[1]),
      });
    };
    switch (this.state) {
      case State.SLEEP:   add('z',  14, 2200, [0.5, 1.0]); break;
      case State.PLAY:    add('♡',  20, 1600, [0.6, 1.0]); break;
      case State.FIGHT:   add('✦',  28, 900,  [0.5, 0.9]); break;
      case State.EAT:     add('♪',  15, 1300, [0.5, 0.8]); break;
      case State.GROOM:   add('✨', 12, 1100, [0.5, 0.7]); break;
    }
  }

  // ─── Animation transform ───────────────────────────────────────
  // Returns { scaleX, scaleY, dy, rot, dx } for the renderer to apply
  getTransform() {
    const t = this.animTime;
    switch (this.state) {
      case State.IDLE:
        return { sx: 1, sy: 1 + 0.016 * Math.sin(t * 1.6), dy: 0, rot: 0 };
      case State.WALK:
        return { sx: 1, sy: 1, dy: -3 * Math.abs(Math.sin(t * 6.5)), rot: 0 };
      case State.RUN:
        return { sx: 1, sy: 1, dy: -5 * Math.abs(Math.sin(t * 11)), rot: 0.07 * Math.sin(t * 11) };
      case State.GROOM:
        return { sx: 1 + 0.06 * Math.abs(Math.sin(t * 3)), sy: 1, dy: 0, rot: 0.14 * Math.sin(t * 2.8) };
      case State.STRETCH:
        return { sx: 1.28, sy: 0.80, dy: 5, rot: 0 };
      case State.SLEEP:
        return { sx: 1.10, sy: 0.86, dy: 8, rot: Math.PI / 2 };
      case State.EAT:
        return { sx: 1, sy: 1, dy: 7 * Math.abs(Math.sin(t * 4.2)), rot: 0 };
      case State.SCRATCH:
        return { sx: 1, sy: 1, dy: -2 * Math.abs(Math.sin(t * 5)), rot: 0.16 * Math.sin(t * 5.5) };
      case State.SIT:
        return { sx: 1, sy: 0.87, dy: 5, rot: 0 };
      case State.PLAY:
        return { sx: 1, sy: 1, dy: -9 * Math.abs(Math.sin(t * 6)), rot: 0.12 * Math.sin(t * 5) };
      case State.FIGHT:
        return { sx: 1, sy: 1, dy: 0, rot: 0.22 * Math.sin(t * 16), dx: 3 * Math.sin(t * 16) };
      default:
        return { sx: 1, sy: 1, dy: 0, rot: 0 };
    }
  }
}
