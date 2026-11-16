import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

function fixture() {
  const slots = []; const images = []; const calls = [];
  let cursor = 0; let effects = [];
  const changed = (before, after) => !before || before.length !== after.length || before.some((value, index) => value !== after[index]);
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { state: initial };
      return [slots[index].state, (next) => { slots[index].state = typeof next === 'function' ? next(slots[index].state) : next; }];
    },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useEffect(callback, deps) { const index = cursor++; if (changed(slots[index]?.deps, deps)) effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; }); },
  };
  const context = new Proxy({}, {
    get(target, key) {
      if (key === 'measureText') return (text) => ({ width: text.length * 12 });
      if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
      return target[key] ?? ((...args) => { calls.push({ method: key, args }); });
    },
  });
  class Image {
    constructor() { images.push(this); }
    set src(value) { this.url = value; }
  }
  const { ProjectorScreen3D } = loadModule('src/components/classroom/ProjectorScreen3D.tsx', {
    react, '@react-three/drei': { Html: () => null },
  }, { document: { createElement: () => ({ width: 0, height: 0, getContext: () => context }) }, Image });
  function render(url = '/media/slide1_ngay_tro_ve.svg', title = 'Slide kiểm thử') {
    cursor = 0; effects = [];
    const tree = ProjectorScreen3D({ projector: { mode: 'presentation', media: { kind: 'image', title, payload: { url } } }, marks: [], onOpenOverlay() {} });
    effects.forEach((effect) => effect());
    const screen = tree.props.children.find((child) => child?.type === 'mesh' && child.props.onClick);
    const material = screen.props.children.find((child) => child?.type === 'meshBasicMaterial' || child?.type === 'meshStandardMaterial');
    return { tree, material, texture: material.props.map };
  }
  return { render, images, calls, unmount() { for (const slot of slots) slot?.cleanup?.(); } };
}

test('Async slide texture mounts a newly compiled, unlit material instead of retaining the white shader', () => {
  const f = fixture();
  const loading = f.render(); const ready = f.render();
  assert.notEqual(loading.material.key, ready.material.key, 'React must remount the material when the map first becomes available');
  assert.equal(ready.material.type, 'meshBasicMaterial');
  assert.equal(ready.material.props.toneMapped, false);
  assert.equal(ready.texture.isCanvasTexture, true);
  assert.equal(ready.texture.colorSpace, 'srgb');
  assert.equal(f.render().texture, ready.texture, 'Slide rerenders should keep the same GPU texture');
  f.unmount();
});

test('SVG slides and the JPG map draw their pixels and request a GPU upload', () => {
  const f = fixture(); f.render(); let surface = f.render();
  for (const url of ['/media/slide1_ngay_tro_ve.svg', '/media/slide2_hanh_trinh_tri_thuc.svg', '/media/slide3_loi_tri_an.svg', '/media/so-do-dai-hoc-tay-nguyen.jpg']) {
    surface = f.render(url); const image = f.images.at(-1);
    assert.equal(image.url, url); const version = surface.texture.version;
    image.onload();
    assert.ok(surface.texture.version > version);
    assert.ok(f.calls.some((call) => call.method === 'drawImage' && call.args[0] === image));
  }
  f.unmount();
});

test('A slow previous slide cannot overwrite the current selection, and a failed slide shows its real title', () => {
  const f = fixture(); f.render(); f.render();
  const oldImage = f.images.at(-1);
  const current = f.render('/media/so-do-dai-hoc-tay-nguyen.jpg', 'Sơ đồ khuôn viên');
  const newImage = f.images.at(-1); const version = current.texture.version;
  oldImage.onload(); assert.equal(current.texture.version, version);
  newImage.onerror();
  assert.ok(f.calls.some((call) => call.method === 'fillText' && call.args[0] === 'KHÔNG TẢI ĐƯỢC SLIDE'));
  assert.ok(f.calls.some((call) => call.method === 'fillText' && call.args[0] === 'Sơ đồ khuôn viên'));
  assert.ok(current.texture.version > version);
  f.unmount();
});
