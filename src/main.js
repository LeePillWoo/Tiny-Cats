import { Cat }                    from './Cat.js';
import { Furniture, FURNITURE_META } from './Furniture.js';
import { World }                  from './World.js';
import { Renderer }               from './Renderer.js';

const W = 800, H = 560;

// Ordered list of file stems matching assets/sprites/cats/
const CAT_FILES = [
  '01_orange_tabby',
  '02_gray_tabby',
  '03_tuxedo',
  '04_calico',
  '05_tortoiseshell',
  '06_all_black',
  '07_all_white',
  '08_siamese',
  '09_russian_blue',
  '10_cream',
];

// Furniture placements [fileKey, x, y]  (y = foot/bottom anchor)
const FURNITURE_LAYOUT = [
  ['01_cat_tree_large',          128,  450],
  ['05_cat_house_medium',        250,  488],
  ['02_plush_pet_bed_medium',    390,  492],
  ['06_armchair_large',          520,  460],
  ['03_scratching_post_medium',  650,  438],
  ['04_food_water_stand_small',  720,  496],
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src}`));
    img.src = src;
  });
}

async function main() {
  const canvas  = document.getElementById('game');
  const infoEl  = document.getElementById('info');
  const btnAdd  = document.getElementById('btn-add');

  const renderer = new Renderer(canvas);
  const world    = new World(W, H);

  // ── Load assets in parallel ──────────────────────────────────
  infoEl.textContent = '리소스 로딩 중...';

  const [catsJson, catImgs, furniImgs] = await Promise.all([
    fetch('data/cats.json').then(r => r.json()),

    Promise.all(
      CAT_FILES.map(name =>
        loadImage(`assets/sprites/cats/${name}.png`)
      )
    ),

    Promise.all(
      Object.keys(FURNITURE_META).map(key =>
        loadImage(`assets/sprites/furniture/${key}.png`)
      )
    ),
  ]);

  // cat id (1-based) → image
  const catImageMap = {};
  CAT_FILES.forEach((_, i) => { catImageMap[i + 1] = catImgs[i]; });

  // furniture fileKey → image
  const furniImageMap = {};
  Object.keys(FURNITURE_META).forEach((key, i) => { furniImageMap[key] = furniImgs[i]; });

  // ── Place furniture ──────────────────────────────────────────
  for (const [key, x, y] of FURNITURE_LAYOUT) {
    world.addFurniture(new Furniture(key, x, y, furniImageMap[key]));
  }

  // ── Spawn initial 3 cats ─────────────────────────────────────
  const INITIAL_IDS = [1, 3, 7];   // 치즈태비, 턱시도, 올화이트
  for (const id of INITIAL_IDS) {
    spawnCat(id);
  }

  // Remaining cat IDs cycled on button press
  const remainingIds = catsJson.cats
    .map(c => c.id)
    .filter(id => !INITIAL_IDS.includes(id));
  let nextIdx = 0;

  btnAdd.addEventListener('click', () => {
    if (world.cats.length >= 10) return;
    const id = remainingIds[nextIdx++ % remainingIds.length];
    spawnCat(id);
    updateInfo();
    if (world.cats.length >= 10) btnAdd.disabled = true;
  });

  updateInfo();

  // ── Game loop ────────────────────────────────────────────────
  let lastTime = 0;
  function loop(ts) {
    const dt = Math.min(ts - lastTime, 100);   // cap delta at 100 ms
    lastTime = ts;
    world.update(dt);
    renderer.render(world);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ── Helpers ──────────────────────────────────────────────────
  function spawnCat(id) {
    const data = catsJson.cats.find(c => c.id === id);
    const x    = 120 + Math.random() * 560;
    const y    = world.floorY + 50 + Math.random() * 260;
    world.addCat(new Cat(data, x, y, catImageMap[id]));
  }

  function updateInfo() {
    infoEl.textContent = `고양이: ${world.cats.length} / 10마리`;
  }
}

main().catch(err => {
  console.error(err);
  document.getElementById('info').textContent = '로딩 실패: ' + err.message;
});
