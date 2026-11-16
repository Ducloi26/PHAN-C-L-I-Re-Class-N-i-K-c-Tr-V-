import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

function* nodes(tree) {
  if (Array.isArray(tree)) { for (const child of tree) yield* nodes(child); }
  else if (tree?.props) { yield tree; yield* nodes(tree.props.children); }
}
const text = (tree) => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join(' ') : tree?.props ? text(tree.props.children) : '';
const lazy = (loader) => ({ deferredComponent: true, loader });

test('The original cover remains for everyone; its immediate entry skips directly to the form or classroom', () => {
  let viewed = false, user = { id: 'returning' }; const events = [];
  const { App } = loadModule('src/app/App.tsx', {
    react: { lazy, Suspense: 'suspense', useState: () => [viewed, (next) => { viewed = next; }] },
    'react-router-dom': { BrowserRouter: 'router', Routes: 'routes', Route: 'route', Navigate: 'navigate' },
    '../hooks/useAuth': { useAuth: () => ({ user, loading: false }) },
    '../components/welcome/StoryIntro': { StoryIntro: 'intro' },
    '../components/BackgroundSoundtrack': { BackgroundSoundtrack: 'music' },
    '../components/SceneBoundary': { SceneBoundary: 'boundary' },
  }, { window: { scrollTo: () => events.push('scroll') } });
  const entrance = () => [...nodes(App())].find((n) => n.type === 'route' && n.props.path === '/').props.element;
  assert.equal(entrance().type, 'intro'); entrance().props.onFinish();
  assert.equal(entrance().type, 'navigate'); assert.equal(entrance().props.to, '/classroom');
  user = null; viewed = false;
  assert.equal(entrance().type, 'intro'); entrance().props.onFinish();
  assert.equal(entrance().props.quickEntry, true);
  assert.equal(entrance().type.deferredComponent, true);
  entrance().props.onReplayIntro(); assert.equal(entrance().type, 'intro');
});

test('The name form can submit before any 3D preview or customizer has loaded', async () => {
  const states = []; let cursor = 0; const events = [];
  const { WelcomePage } = loadModule('src/pages/WelcomePage.tsx', {
    react: { lazy, Suspense: 'suspense', useState: (initial) => {
      const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], (value) => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    } },
    'react-router-dom': { useNavigate: () => (path) => events.push(['navigate', path]) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '../components/map/CampusMapModal': { CampusMapModal: 'map' },
  });
  const render = () => { cursor = 0; return WelcomePage({ quickEntry: true, onEnter: async (...args) => events.push(['login', ...args]), onReplayIntro() {} }); };
  let tree = render();
  assert.equal([...nodes(tree)].filter((n) => n.type?.deferredComponent).length, 0);
  const input = [...nodes(tree)].find((n) => n.type === 'input');
  input.props.onChange({ target: { value: 'Khách vào nhanh' } }); tree = render();
  const form = [...nodes(tree)].find((n) => n.type === 'form');
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(events[0][0], 'login'); assert.equal(events[0][1], 'Khách vào nhanh');
  assert.deepEqual(events.at(-1), ['navigate', '/classroom']);
  const preview = [...nodes(tree)].find((n) => n.type === 'button' && text(n) === 'Xem trước nhân vật 3D');
  preview.props.onClick(); tree = render();
  assert.equal([...nodes(tree)].filter((n) => n.type?.deferredComponent).length, 1);
});
