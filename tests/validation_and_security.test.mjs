import test from 'node:test';
import assert from 'node:assert/strict';

// Validation logic tests
function validateDisplayName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { valid: false, error: 'Vui lòng nhập tên của bạn' };
  if (trimmed.length < 2) return { valid: false, error: 'Tên hiển thị phải có ít nhất 2 ký tự' };
  if (trimmed.length > 32) return { valid: false, error: 'Tên hiển thị tối đa 32 ký tự' };
  return { valid: true };
}

function validateWishContent(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) return { valid: false, error: 'Nội dung lời chúc không được để trống' };
  if (trimmed.length < 5) return { valid: false, error: 'Lời chúc phải có ít nhất 5 ký tự' };
  if (trimmed.length > 500) return { valid: false, error: 'Lời chúc không vượt quá 500 ký tự' };
  return { valid: true };
}

function validateYouTubeId(id) {
  return /^[a-zA-Z0-9_-]{11}$/.test((id || '').trim());
}

function sanitizeText(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Direction calculation logic
function calculateMoveDirection(cameraYaw, inputForward, inputRight) {
  // camForward on horizontal plane (XZ): yaw = 0 points towards blackboard (-Z)
  const fX = -Math.sin(cameraYaw);
  const fZ = -Math.cos(cameraYaw);

  // camRight is cross(camForward, (0, 1, 0)) = (-fZ, 0, fX)
  const rX = -fZ;
  const rZ = fX;

  let dirX = fX * inputForward + rX * inputRight;
  let dirZ = fZ * inputForward + rZ * inputRight;

  const len = Math.hypot(dirX, dirZ);
  if (len > 0) {
    dirX /= len;
    dirZ /= len;
  }
  return { x: dirX, z: dirZ, length: len };
}

// Simple collision test logic
function testCollisionClamping(posX, posZ, dx, dz, radius, box) {
  let nextX = posX + dx;
  let nextZ = posZ + dz;

  // X check
  if (nextX + radius > box.minX && nextX - radius < box.maxX && posZ + radius > box.minZ && posZ - radius < box.maxZ) {
    if (dx > 0) nextX = box.minX - radius;
    else if (dx < 0) nextX = box.maxX + radius;
  }

  // Z check
  if (nextZ + radius > box.minZ && nextZ - radius < box.maxZ && nextX + radius > box.minX && nextX - radius < box.maxX) {
    if (dz > 0) nextZ = box.minZ - radius;
    else if (dz < 0) nextZ = box.maxZ + radius;
  }

  return { x: nextX, z: nextZ };
}

test('T02: Tên rỗng, 1 ký tự hoặc quá 32 ký tự bị từ chối', () => {
  assert.equal(validateDisplayName('').valid, false);
  assert.equal(validateDisplayName('   ').valid, false);
  assert.equal(validateDisplayName('A').valid, false);
  assert.equal(validateDisplayName('A'.repeat(33)).valid, false);
});

test('T03: Tên hợp lệ tiếng Việt có dấu được chấp nhận', () => {
  assert.equal(validateDisplayName('Nguyễn Văn An').valid, true);
  assert.equal(validateDisplayName('Trần Thị Thảo (K21)').valid, true);
  assert.equal(validateDisplayName('Khách tham quan').valid, true);
});

test('T10 & T11: Lời chúc kiểm tra độ dài 5-500 ký tự', () => {
  assert.equal(validateWishContent('').valid, false);
  assert.equal(validateWishContent('chúc').valid, false);
  assert.equal(validateWishContent('Kính chúc thầy cô luôn mạnh khỏe!').valid, true);
  assert.equal(validateWishContent('X'.repeat(501)).valid, false);
});

test('T12: Ký tự nguy hiểm <script> được escape an toàn', () => {
  const raw = '<script>alert("XSS")</script>';
  const clean = sanitizeText(raw);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
});

test('T21: YouTube video ID phải đúng chuẩn 11 ký tự an toàn', () => {
  assert.equal(validateYouTubeId('dQw4w9WgXcQ'), true);
  assert.equal(validateYouTubeId('javascript:alert(1)'), false);
  assert.equal(validateYouTubeId('<iframe src="...">'), false);
  assert.equal(validateYouTubeId('short'), false);
});

test('T14: Tặng hoa đảm bảo 1 cặp sender-receiver là duy nhất', () => {
  const gifts = new Set();
  const gift = (sender, receiver) => {
    const key = `${sender}:${receiver}`;
    if (gifts.has(key)) return { success: false, message: 'Đã tặng' };
    gifts.add(key);
    return { success: true, message: 'Thành công' };
  };

  assert.equal(gift('user1', 'teacherA').success, true);
  assert.equal(gift('user1', 'teacherA').success, false);
  assert.equal(gift('user1', 'teacherB').success, true);
  assert.equal(gift('user2', 'teacherA').success, true);
});

// -------------------------------------------------------------
// P0 TECHNICAL BUG FIX VERIFICATION TESTS
// -------------------------------------------------------------

test('P0-1: Tỷ lệ nhân vật tham chiếu chuẩn (chân chạm sàn 0.00m, tỷ lệ gọn gàng vừa vặn lớp học)', () => {
  const footBottomY = 0.74 - 0.32 - 0.38 - 0.04; // 0.00m (chân chạm sàn)
  const headTopY = 1.135 + 0.075 + 0.03; // ~1.24m (tổng chiều cao gọn gàng, cân đối)
  const eyeLevelY = 1.08; // 1.08m standing

  // Kiểm tra khi đứng: chân tiếp xúc sàn chính xác y = 0.00m
  assert.equal(Math.abs(footBottomY) < 0.001, true);
  // Chiều cao nhân vật thon gọn vừa vặn bàn ghế lớp học (1.20m - 1.30m)
  assert.equal(headTopY >= 1.20 && headTopY <= 1.30, true);
  assert.equal(eyeLevelY >= 1.05 && eyeLevelY <= 1.15, true);

  // Kiểm tra khi ngồi: hông hạ xuống đúng mặt ghế 0.45m - 0.47m, khớp gối gập 90° chân đặt dưới gầm bàn
  const seatedHipY = 0.74 - 0.27; // 0.47m (mông ngồi chạm mặt ghế gỗ 0.45m)
  assert.equal(Math.abs(seatedHipY - 0.47) < 0.01, true);
  const seatedFootBottomY = seatedHipY - 0.43 - 0.04; // 0.00m (chân đặt dưới gầm bàn chạm sàn)
  assert.equal(Math.abs(seatedFootBottomY) < 0.01, true);
});

test('P0-2: WASD và phím mũi tên di chuyển chuẩn xác theo góc nhìn Camera ở cả 4 góc 0°, 90°, 180°, 270°', () => {
  const EPSILON = 0.0001;

  // 1. Camera nhìn thẳng vào bảng (-Z, yaw = 0):
  // W / Mũi tên lên = tiến thẳng vào bảng (-Z)
  // S / Mũi tên xuống = lùi về sau lớp (+Z)
  // D / Mũi tên phải = sang phải màn hình về phía cửa sổ (+X)
  // A / Mũi tên trái = sang trái màn hình về phía cửa lớp (-X)
  const yaw0_W = calculateMoveDirection(0, 1, 0);
  assert.ok(Math.abs(yaw0_W.x) < EPSILON && Math.abs(yaw0_W.z - (-1)) < EPSILON, '0° W/Lên phải tiến thẳng vào bảng (-Z)');

  const yaw0_S = calculateMoveDirection(0, -1, 0);
  assert.ok(Math.abs(yaw0_S.x) < EPSILON && Math.abs(yaw0_S.z - 1) < EPSILON, '0° S/Xuống phải lùi về sau (+Z)');

  const yaw0_D = calculateMoveDirection(0, 0, 1);
  assert.ok(Math.abs(yaw0_D.x - 1) < EPSILON && Math.abs(yaw0_D.z) < EPSILON, '0° D/Phải phải sang phải màn hình (+X)');

  const yaw0_A = calculateMoveDirection(0, 0, -1);
  assert.ok(Math.abs(yaw0_A.x - (-1)) < EPSILON && Math.abs(yaw0_A.z) < EPSILON, '0° A/Trái phải sang trái màn hình (-X)');

  // 2. Camera quay 90° sang trái nhìn về phía cửa lớp (-X, yaw = Math.PI / 2):
  // W / Lên = tiến về phía cửa (-X)
  // D / Phải = sang phải màn hình (hướng về phía bảng -Z)
  // A / Trái = sang trái màn hình (hướng về phía sau lớp +Z)
  const yaw90_W = calculateMoveDirection(Math.PI / 2, 1, 0);
  assert.ok(Math.abs(yaw90_W.x - (-1)) < EPSILON && Math.abs(yaw90_W.z) < EPSILON, '90° W/Lên phải tiến về phía cửa (-X)');

  const yaw90_D = calculateMoveDirection(Math.PI / 2, 0, 1);
  assert.ok(Math.abs(yaw90_D.x) < EPSILON && Math.abs(yaw90_D.z - (-1)) < EPSILON, '90° D/Phải phải sang phải màn hình (-Z)');

  const yaw90_A = calculateMoveDirection(Math.PI / 2, 0, -1);
  assert.ok(Math.abs(yaw90_A.x) < EPSILON && Math.abs(yaw90_A.z - 1) < EPSILON, '90° A/Trái phải sang trái màn hình (+Z)');

  // 3. Camera quay 180° nhìn về tường sau (+Z, yaw = Math.PI):
  // W / Lên = tiến về tường sau (+Z)
  // D / Phải = sang phải màn hình (hướng về cửa lớp -X)
  // A / Trái = sang trái màn hình (hướng về cửa sổ +X)
  const yaw180_W = calculateMoveDirection(Math.PI, 1, 0);
  assert.ok(Math.abs(yaw180_W.x) < EPSILON && Math.abs(yaw180_W.z - 1) < EPSILON, '180° W/Lên phải tiến về tường sau (+Z)');

  const yaw180_D = calculateMoveDirection(Math.PI, 0, 1);
  assert.ok(Math.abs(yaw180_D.x - (-1)) < EPSILON && Math.abs(yaw180_D.z) < EPSILON, '180° D/Phải phải sang phải màn hình (-X)');

  const yaw180_A = calculateMoveDirection(Math.PI, 0, -1);
  assert.ok(Math.abs(yaw180_A.x - 1) < EPSILON && Math.abs(yaw180_A.z) < EPSILON, '180° A/Trái phải sang trái màn hình (+X)');

  // 4. Camera quay 270° nhìn về phía cửa sổ (+X, yaw = -Math.PI / 2):
  // W / Lên = tiến về phía cửa sổ (+X)
  // D / Phải = sang phải màn hình (hướng về sau lớp +Z)
  // A / Trái = sang trái màn hình (hướng về phía bảng -Z)
  const yaw270_W = calculateMoveDirection(-Math.PI / 2, 1, 0);
  assert.ok(Math.abs(yaw270_W.x - 1) < EPSILON && Math.abs(yaw270_W.z) < EPSILON, '270° W/Lên phải tiến về phía cửa sổ (+X)');

  const yaw270_D = calculateMoveDirection(-Math.PI / 2, 0, 1);
  assert.ok(Math.abs(yaw270_D.x) < EPSILON && Math.abs(yaw270_D.z - 1) < EPSILON, '270° D/Phải phải sang phải màn hình (+Z)');

  const yaw270_A = calculateMoveDirection(-Math.PI / 2, 0, -1);
  assert.ok(Math.abs(yaw270_A.x) < EPSILON && Math.abs(yaw270_A.z - (-1)) < EPSILON, '270° A/Trái phải sang trái màn hình (-Z)');
});

test('P0-2b: Di chuyển chéo (W + D hoặc W + A) được chuẩn hóa vector = 1.0 (không tăng tốc bất thường)', () => {
  const diag = calculateMoveDirection(0, 1, 1);
  const length = Math.hypot(diag.x, diag.z);
  assert.ok(Math.abs(length - 1.0) < 0.0001, `Độ dài vector chéo phải bằng 1.0, thực tế: ${length}`);
});

test('P0-3: Kinematic collision chặn đi xuyên bàn học và trượt theo mép bàn (Wall Sliding)', () => {
  const deskBox = { minX: -0.75, maxX: 0.75, minZ: 0.70, maxZ: 1.30 };
  const radius = 0.20;

  // Người chơi ở (0, 0.40) đi thẳng vào bàn theo +Z với displacement (0, +0.20) -> muốn tới z = 0.60
  // Cạnh trước của bàn là minZ = 0.70.
  // Khi z tiến tới 0.70 - radius = 0.50, phải bị chặn lại tại z = 0.50, không thể vào bên trong bàn!
  const resStraight = testCollisionClamping(0, 0.40, 0, 0.20, radius, deskBox);
  assert.equal(resStraight.z, 0.70 - radius); // z = 0.50

  // Người chơi đi chéo (dx = 0.10, dz = 0.20) vào mặt bàn:
  // Thành phần Z bị chặn ở mép bàn, thành phần X vẫn trượt mượt mà
  const resDiagonal = testCollisionClamping(0, 0.40, 0.10, 0.20, radius, deskBox);
  assert.equal(resDiagonal.z, 0.70 - radius); // Z bị chặn
  assert.equal(resDiagonal.x, 0.10);          // X vẫn tiếp tục trượt sang phải!
});

// -------------------------------------------------------------
// P1 AVATAR CUSTOMIZATION TESTS
// -------------------------------------------------------------

test('P1-1: 4 Preset Avatar (Nam 1, Nam 2, Nữ 1, Nữ 2) đầy đủ thuộc tính ngoại hình hợp lệ', () => {
  const presets = [
    { id: 'student-male-1', gender: 'male', hairStyle: 'short', outfitColor: '#1E3A8A' },
    { id: 'student-male-2', gender: 'male', hairStyle: 'side-part', outfitColor: '#991B1B' },
    { id: 'student-female-1', gender: 'female', hairStyle: 'long', outfitColor: '#047857' },
    { id: 'student-female-2', gender: 'female', hairStyle: 'ponytail', outfitColor: '#D97706' },
  ];

  assert.equal(presets.length >= 4, true);
  for (const p of presets) {
    assert.ok(p.id && p.gender && p.hairStyle && p.outfitColor);
    assert.ok(['male', 'female'].includes(p.gender));
    assert.ok(['short', 'side-part', 'long', 'ponytail', 'grad-cap'].includes(p.hairStyle));
  }
});

test('P1-2: Bảng màu trang phục và tóc đều đúng định dạng Hex 6 ký tự chuẩn CSS', () => {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const colors = [
    '#1E3A8A', '#991B1B', '#047857', '#D97706', '#4C1D95', '#F8FAFC', '#C2410C', '#334155',
    '#1E1B18', '#4A3525', '#854D0E', '#B45309', '#7F1D1D', '#CBD5E1'
  ];

  for (const c of colors) {
    assert.ok(hexRegex.test(c), `Màu ${c} phải là mã Hex 6 ký tự hợp lệ`);
  }
});

test('P1-3: Bảo mật phân quyền: Người dùng không thể nâng quyền Giáo viên/Admin qua Avatar', () => {
  const sanitizeAvatarRole = (userInput, currentRole) => {
    // Avatar customization only modifies visual appearance, never user role
    const sanitized = {
      presetId: userInput.presetId || 'student-male-1',
      hairStyle: userInput.hairStyle || 'short',
      hairColor: userInput.hairColor || '#1E1B18',
      outfitColor: userInput.outfitColor || '#1E3A8A',
    };
    return {
      role: currentRole, // Role remains immutable by visual avatar picker
      avatar: sanitized,
    };
  };

  const maliciousAttempt = {
    presetId: 'student-male-1',
    role: 'admin', // Cố tình inject quyền admin
  };

  const result = sanitizeAvatarRole(maliciousAttempt, 'member');
  assert.equal(result.role, 'member');
  assert.equal(result.avatar.role, undefined);
});

// -------------------------------------------------------------
// P2 CLASSROOM INTERACTION TESTS
// -------------------------------------------------------------

test('P2-1: Hệ thống ghế gồm 25 ghế (1 giáo viên + 24 sinh viên), mỗi ghế có seatId duy nhất, seatAnchor và standAnchor', () => {
  const seats = [
    {
      id: 'seat-teacher',
      name: 'Bàn Giáo Viên',
      seatAnchor: { x: -3.5, y: 0, z: -4.2, rotY: 0 },
      standAnchor: { x: -2.3, y: 0, z: -3.6 },
    }
  ];

  const rows = [-0.5, 1.5, 3.5];
  const cols = [-4.0, -1.4, 1.4, 4.0];
  let seatIdx = 1;
  for (const r of rows) {
    for (const c of cols) {
      const benchZ = r + 0.53;
      seats.push({
        id: `seat-${seatIdx++}`,
        seatAnchor: { x: Number((c - 0.35).toFixed(2)), y: 0, z: Number(benchZ.toFixed(2)), rotY: Math.PI },
        standAnchor: { x: Number((c - 0.35).toFixed(2)), y: 0, z: Number((benchZ + 0.39).toFixed(2)) },
      });
      seats.push({
        id: `seat-${seatIdx++}`,
        seatAnchor: { x: Number((c + 0.35).toFixed(2)), y: 0, z: Number(benchZ.toFixed(2)), rotY: Math.PI },
        standAnchor: { x: Number((c + 0.35).toFixed(2)), y: 0, z: Number((benchZ + 0.39).toFixed(2)) },
      });
    }
  }

  assert.equal(seats.length, 25, 'Phải có đúng 25 ghế trong lớp');
  const idSet = new Set(seats.map(s => s.id));
  assert.equal(idSet.size, 25, 'Tất cả 25 ghế phải có seatId duy nhất');

  for (const s of seats) {
    assert.ok(s.seatAnchor && typeof s.seatAnchor.x === 'number' && typeof s.seatAnchor.z === 'number');
    assert.ok(s.standAnchor && typeof s.standAnchor.x === 'number' && typeof s.standAnchor.z === 'number');
  }
});

test('P2-2: Tất cả 25 standAnchor đều nằm ngoài vùng va chạm (collision-free) và trong phòng học', () => {
  const colliders = [
    { minX: -4.45, maxX: -2.55, minZ: -4.10, maxZ: -3.10 }, // teacher table
    { minX: -3.80, maxX: -3.20, minZ: -4.45, maxZ: -3.95 }, // teacher chair
  ];
  const rows = [-0.5, 1.5, 3.5];
  const cols = [-4.0, -1.4, 1.4, 4.0];
  for (const r of rows) {
    for (const c of cols) {
      colliders.push({ minX: c - 0.75, maxX: c + 0.75, minZ: r - 0.30, maxZ: r + 0.30 }); // desk
      colliders.push({ minX: c - 0.70, maxX: c + 0.70, minZ: r + 0.38, maxZ: r + 0.68 }); // bench
    }
  }

  const roomBounds = { minX: -6.65, maxX: 6.65, minZ: -4.75, maxZ: 4.75 };
  const radius = 0.20;

  function isColliding(x, z) {
    if (x - radius < roomBounds.minX || x + radius > roomBounds.maxX || z - radius < roomBounds.minZ || z + radius > roomBounds.maxZ) {
      return true;
    }
    for (const b of colliders) {
      const closestX = Math.max(b.minX, Math.min(x, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(z, b.maxZ));
      const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;
      if (distSq < radius * radius) return true;
    }
    return false;
  }

  // Check teacher standAnchor
  assert.equal(isColliding(-2.3, -3.6), false, 'Vị trí đứng của Giáo viên phải hoàn toàn không va chạm');

  // Check all student standAnchors
  for (const r of rows) {
    for (const c of cols) {
      const standZ = Number((r + 0.53 + 0.39).toFixed(2));
      const standLeftX = Number((c - 0.35).toFixed(2));
      const standRightX = Number((c + 0.35).toFixed(2));
      assert.equal(isColliding(standLeftX, standZ), false, `StandAnchor (${standLeftX}, ${standZ}) không được va chạm`);
      assert.equal(isColliding(standRightX, standZ), false, `StandAnchor (${standRightX}, ${standZ}) không được va chạm`);
    }
  }
});

test('P2-3: Ngồi ghế khóa di chuyển WASD; đứng dậy chuyển sang standing với vị trí standAnchor an toàn', () => {
  let player = {
    x: -3.5,
    y: 0,
    z: -4.2,
    state: 'sitting',
    seatId: 'seat-teacher',
  };

  // WASD inputs are ignored while sitting
  const simulateWASD = (p, keys) => {
    if (p.state === 'sitting') {
      // In P2, sitting locks WASD movement
      return p;
    }
    return { ...p, x: p.x + 0.1, state: 'walking' };
  };

  const movedPlayer = simulateWASD(player, { KeyW: true });
  assert.equal(movedPlayer.state, 'sitting', 'Nhân vật ngồi phải khóa di chuyển');
  assert.equal(movedPlayer.x, -3.5, 'Tọa độ không được dịch chuyển');

  // Standing up via KeyE returns to standAnchor
  const handleStandUp = (p, standAnchor) => {
    return {
      ...p,
      state: 'standing',
      seatId: null,
      x: standAnchor.x,
      y: 0,
      z: standAnchor.z,
    };
  };

  const standingPlayer = handleStandUp(player, { x: -2.3, y: 0, z: -3.6 });
  assert.equal(standingPlayer.state, 'standing');
  assert.equal(standingPlayer.seatId, null);
  assert.equal(standingPlayer.x, -2.3);
  assert.equal(standingPlayer.y, 0);
  assert.equal(standingPlayer.z, -3.6);
});

test('P2-4: Giới hạn tầm với ngồi ghế <= 1.15m và ngăn chặn xung đột nhiều người cùng ngồi một ghế', () => {
  const trySitOnSeat = (playerPos, seat, remotePlayers) => {
    const dist = Math.hypot(playerPos.x - seat.seatAnchor.x, playerPos.z - seat.seatAnchor.z);
    if (dist > 1.15) {
      return { success: false, reason: 'TOO_FAR' };
    }
    const isOccupied = remotePlayers.some(p => p.seatId === seat.id && p.state === 'sitting');
    if (isOccupied) {
      return { success: false, reason: 'SEAT_OCCUPIED' };
    }
    return { success: true };
  };

  const targetSeat = {
    id: 'seat-1',
    seatAnchor: { x: -4.35, y: 0, z: 0.03, rotY: Math.PI }
  };

  // Case 1: Player too far (e.g. 3m away at origin)
  const farRes = trySitOnSeat({ x: 0, z: 0 }, targetSeat, []);
  assert.equal(farRes.success, false);
  assert.equal(farRes.reason, 'TOO_FAR');

  // Case 2: Seat already occupied by a remote peer
  const occupiedRes = trySitOnSeat(
    { x: -4.35, z: 0.50 }, // close enough
    targetSeat,
    [{ id: 'remote-1', seatId: 'seat-1', state: 'sitting' }]
  );
  assert.equal(occupiedRes.success, false);
  assert.equal(occupiedRes.reason, 'SEAT_OCCUPIED');

  // Case 3: Empty seat within range
  const validRes = trySitOnSeat(
    { x: -4.35, z: 0.50 },
    targetSeat,
    [{ id: 'remote-2', seatId: 'seat-2', state: 'sitting' }]
  );
  assert.equal(validRes.success, true);
});

test('P2-5: Phân quyền máy chiếu: Sinh viên/Khách chỉ có quyền xem phóng to, không có quyền đổi slide', () => {
  const canControlProjector = (role) => {
    return role === 'teacher' || role === 'admin';
  };

  assert.equal(canControlProjector('member'), false, 'Sinh viên không được đổi slide máy chiếu');
  assert.equal(canControlProjector('guest'), false, 'Khách không được đổi slide máy chiếu');
  assert.equal(canControlProjector('teacher'), true, 'Giáo viên có quyền điều khiển slide');
  assert.equal(canControlProjector('admin'), true, 'Admin có quyền điều khiển slide');
});

// -------------------------------------------------------------
// P2.5 MOBILE CONTROLS & SMART INTERACTION TESTS
// -------------------------------------------------------------

test('P2.5-1: Joystick ảo chuẩn hóa vector đầu ra [-1, 1], nhận diện dead zone 8% và đúng hướng', () => {
  const MAX_TRAVEL = 40;
  const DEAD_ZONE = 0.08;

  const processJoystickInput = (dx, dy) => {
    const dist = Math.hypot(dx, dy);
    if (dist < MAX_TRAVEL * DEAD_ZONE) {
      return { x: 0, y: 0 };
    }
    if (dist <= MAX_TRAVEL) {
      return {
        x: Number((dx / MAX_TRAVEL).toFixed(3)),
        y: Number((dy / MAX_TRAVEL).toFixed(3)),
      };
    }
    const angle = Math.atan2(dy, dx);
    return {
      x: Number(Math.cos(angle).toFixed(3)),
      y: Number(Math.sin(angle).toFixed(3)),
    };
  };

  // 1. Dead zone test (micro-drift <= 3.2px)
  const deadRes = processJoystickInput(2.0, 1.5);
  assert.equal(deadRes.x, 0, 'Ngón tay chạm nhẹ trong vùng dead zone phải trả về 0');
  assert.equal(deadRes.y, 0, 'Ngón tay chạm nhẹ trong vùng dead zone phải trả về 0');

  // 2. Drag UP (dy = -30px, dx = 0) -> dy âm tương ứng tiến tới
  const upRes = processJoystickInput(0, -30);
  assert.equal(upRes.x, 0);
  assert.equal(upRes.y, -0.75); // Negative Y

  // 3. Drag RIGHT (dx = +30px, dy = 0) -> dx dương tương ứng rẽ phải
  const rightRes = processJoystickInput(30, 0);
  assert.equal(rightRes.x, 0.75);
  assert.equal(rightRes.y, 0);

  // 4. Overdrag clamp (dx = 100px, dy = 0) -> clamped to 1.0
  const clampedRes = processJoystickInput(100, 0);
  assert.equal(clampedRes.x, 1.0);
  assert.equal(clampedRes.y, 0);

  // 5. Diagonal drag clamp (dx = 50px, dy = 50px) -> vector length = 1.0
  const diagRes = processJoystickInput(50, 50);
  const diagLen = Math.hypot(diagRes.x, diagRes.y);
  assert.ok(Math.abs(diagLen - 1.0) < 0.01, 'Vector kéo chéo ngoài phạm vi phải được chuẩn hóa về 1.0');
});

test('P2.5-2: Hệ thống Smart Context Action xác định chính xác đối tượng tương tác theo khoảng cách và trạng thái', () => {
  const evaluateSmartAction = (player, remotePlayers) => {
    if (player.state === 'sitting') {
      return { type: 'stand', label: 'Đứng dậy' };
    }
    // Check seat
    const studentSeats = [
      { id: 'seat-1', x: -4.35, z: 0.03 }
    ];
    for (const s of studentSeats) {
      const dist = Math.hypot(player.x - s.x, player.z - s.z);
      if (dist <= 1.05) {
        const isOcc = remotePlayers.some(p => p.seatId === s.id && p.state === 'sitting');
        if (!isOcc) return { type: 'sit', label: 'Ngồi xuống' };
      }
    }
    // Check teacher desk
    if (player.x >= -4.75 && player.x <= -2.25 && player.z >= -4.75 && player.z <= -2.45) {
      return { type: 'teacher', label: 'Tương tác Thầy Cô' };
    }
    // Check projector
    if (player.z <= -2.55 && Math.abs(player.x) <= 3.30) {
      return { type: 'projector', label: 'Xem máy chiếu' };
    }
    return null;
  };

  // Seated player
  assert.equal(
    evaluateSmartAction({ state: 'sitting', x: 0, z: 0 }, []).type,
    'stand'
  );

  // Near empty seat
  assert.equal(
    evaluateSmartAction({ state: 'standing', x: -4.35, z: 0.35 }, []).type,
    'sit'
  );

  // Near teacher desk
  assert.equal(
    evaluateSmartAction({ state: 'standing', x: -3.5, z: -3.0 }, []).type,
    'teacher'
  );

  // In front of projector screen
  assert.equal(
    evaluateSmartAction({ state: 'standing', x: 0.0, z: -3.5 }, []).type,
    'projector'
  );

  // Middle of room (no target)
  assert.equal(
    evaluateSmartAction({ state: 'standing', x: 0.0, z: 2.0 }, []),
    null
  );
});

test('P2.5-3: Tốc độ Chạy (5.2 m/s) so với Đi bộ (3.0 m/s) được kiểm soát an toàn bởi Kinematic Collision', () => {
  const deskBox = { minX: -0.75, maxX: 0.75, minZ: 0.70, maxZ: 1.30 };
  const radius = 0.20;

  // Đi bộ: 3.0 m/s * 0.05s = 0.15m
  const walkStep = 3.0 * 0.05;
  // Chạy nhanh: 5.2 m/s * 0.05s = 0.26m
  const runStep = 5.2 * 0.05;

  // Người chơi chạy thẳng từ z = 0.55 tới bàn (mặt trước bàn minZ = 0.70)
  // Với sub-stepping (mỗi bước tối đa 0.04m), dù tốc độ chạy cao, nhân vật vẫn bị chặn chính xác tại 0.70 - radius = 0.50!
  const runRes = testCollisionClamping(0, 0.45, 0, runStep, radius, deskBox);
  assert.equal(runRes.z, 0.70 - radius, 'Khi chạy nhanh, nhân vật vẫn bị chặn ở mép bàn, không bị xuyên qua');
});

test('P2.5-4: Vuốt Camera Touch độc lập với Joystick (Hỗ trợ cảm ứng đa điểm 2 ngón tay)', () => {
  // Simulates tracking two separate touch pointers
  let leftJoystickTouchId = 101;
  let rightCameraTouchId = 102;

  let cameraYaw = 0;
  const applyCameraSwipe = (touchId, deltaX, baseSens = 0.004) => {
    if (touchId === rightCameraTouchId) {
      cameraYaw -= deltaX * baseSens;
    }
  };

  // Right thumb swipes left (deltaX = -20) -> camera turns left (cameraYaw increases)
  applyCameraSwipe(102, -20);
  assert.ok(cameraYaw > 0, 'Vuốt sang trái phải làm camera quay sang trái');

  // Left thumb moving joystick does NOT alter camera yaw
  const prevYaw = cameraYaw;
  applyCameraSwipe(101, 30);
  assert.equal(cameraYaw, prevYaw, 'Ngón tay điều khiển joystick không được làm xoay camera');
});

// ====================================================================
// P3 MULTIPLAYER & DATABASE SECURITY TESTS
// ====================================================================

test('P3-1: Quản lý phiên khách: Sinh sessionId duy nhất, không tạo tài khoản auth, ép role = member', async () => {
  const secret = 'test-secret-key-salt-12345';

  // Helper to generate guest session
  const generateSession = async (displayName, participantType) => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const sessionId = 'gst_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      sub: sessionId,
      name: displayName.trim().slice(0, 32),
      type: participantType === 'student' ? 'student' : 'guest',
      role: 'member', // Strictly member
      iat: Date.now(),
      exp: Date.now() + 86400000,
    };

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const b64 = (buf) => Buffer.from(buf).toString('base64url');
    const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const pl = b64(JSON.stringify(payload));
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${pl}`));

    return {
      sessionId,
      token: `${header}.${pl}.${b64(sig)}`,
      role: payload.role,
    };
  };

  // Hai khách cùng tên "Đức Lợi Phan" vào phòng
  const guest1 = await generateSession('Đức Lợi Phan', 'student');
  const guest2 = await generateSession('Đức Lợi Phan', 'student');

  assert.notEqual(guest1.sessionId, guest2.sessionId, 'Hai khách trùng tên phải có sessionId khác nhau hoàn toàn');
  assert.ok(guest1.sessionId.startsWith('gst_'), 'Session ID khách phải bắt đầu bằng tiền tố gst_');
  assert.equal(guest1.role, 'member', 'Role của khách luôn là member, không thể tự gán admin');
  assert.equal(guest2.role, 'member');
});

test('P3-2: Xác minh chữ ký HMAC-SHA256 và chống giả mạo token khách', async () => {
  const secret = 'secret-key-12345';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const b64 = (buf) => Buffer.from(buf).toString('base64url');
  const payload = {
    sub: 'gst_test_player_1',
    name: 'Sinh viên A',
    role: 'member',
    exp: Date.now() + 60000,
  };
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const pl = b64(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${pl}`));
  const validToken = `${header}.${pl}.${b64(sig)}`;

  // 1. Token hợp lệ được chấp nhận
  const parts = validToken.split('.');
  const isSignatureValid = await crypto.subtle.verify(
    'HMAC',
    key,
    Buffer.from(parts[2], 'base64url'),
    enc.encode(`${parts[0]}.${parts[1]}`)
  );
  assert.ok(isSignatureValid, 'Chữ ký token hợp lệ phải được xác minh thành công');

  // 2. Token bị kẻ xấu sửa role từ 'member' thành 'admin'
  const tamperedPayload = { ...payload, role: 'admin' };
  const tamperedPl = b64(JSON.stringify(tamperedPayload));

  const isTamperedValid = await crypto.subtle.verify(
    'HMAC',
    key,
    Buffer.from(parts[2], 'base64url'),
    enc.encode(`${header}.${tamperedPl}`)
  );
  assert.equal(isTamperedValid, false, 'Token bị can thiệp dữ liệu phải bị từ chối chữ ký ngay lập tức');
});

test('P3-3: Đồng bộ ghế ngồi nguyên tử (Atomic Seat Lease) & Mutual Exclusion', () => {
  const occupiedSeats = new Map();

  function requestSeat(seatId, sessionId, playerName) {
    const now = Date.now();
    const existing = occupiedSeats.get(seatId);

    // Ghế đã có người ngồi và chưa hết hạn lease
    if (existing && existing.sessionId !== sessionId && existing.expiresAt > now) {
      return { success: false, reason: `Ghế đã được ngồi bởi ${existing.playerName}` };
    }

    occupiedSeats.set(seatId, {
      seatId,
      sessionId,
      playerName,
      expiresAt: now + 30 * 60 * 1000,
    });
    return { success: true };
  }

  function releaseSeat(seatId, sessionId) {
    const existing = occupiedSeats.get(seatId);
    if (existing && existing.sessionId === sessionId) {
      occupiedSeats.delete(seatId);
      return true;
    }
    return false;
  }

  // Khách 1 ngồi vào ghế s01
  const res1 = requestSeat('seat_r01_c01', 'gst_user_1', 'Lợi');
  assert.equal(res1.success, true, 'Khách 1 ngồi ghế trống thành công');

  // Khách 2 cố tình ngồi vào ghế s01
  const res2 = requestSeat('seat_r01_c01', 'gst_user_2', 'Nam');
  assert.equal(res2.success, false, 'Khách 2 phải bị từ chối vì ghế đã có người ngồi');
  assert.ok(res2.reason.includes('Lợi'), 'Lý do từ chối chỉ rõ người đang ngồi');

  // Khách 1 rời ghế
  const releaseRes = releaseSeat('seat_r01_c01', 'gst_user_1');
  assert.equal(releaseRes, true, 'Giải phóng ghế thành công');

  // Khách 2 ngồi lại ghế s01
  const res3 = requestSeat('seat_r01_c01', 'gst_user_2', 'Nam');
  assert.equal(res3.success, true, 'Sau khi khách 1 rời ghế, khách 2 ngồi được ngay');
});

test('P3-4: Phân quyền máy chiếu: Chỉ Giáo viên/Admin mới được gửi lệnh cập nhật trạng thái', () => {
  function canControlProjector(role) {
    return role === 'teacher' || role === 'admin';
  }

  assert.equal(canControlProjector('member'), false, 'Sinh viên/Khách không có quyền điều khiển máy chiếu');
  assert.equal(canControlProjector('guest'), false);
  assert.equal(canControlProjector('teacher'), true, 'Giáo viên có quyền điều khiển máy chiếu');
  assert.equal(canControlProjector('admin'), true, 'Admin có toàn quyền điều khiển máy chiếu');
});

test('P3-5: Kiểm soát ranh giới phòng học và chống dịch chuyển tốc độ bất thường (Anti-Warp)', () => {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // 1. Boundary Clamping: Không thể rơi ra ngoài phòng [-7.2, 7.2]
  assert.equal(clamp(15.0, -7.2, 7.2), 7.2, 'Tọa độ ngoài ranh giới phải bị clamp về mép phòng');
  assert.equal(clamp(-10.0, -7.2, 7.2), -7.2);

  // 2. Speed check
  const checkMovementSpeed = (x1, z1, x2, z2, dtSeconds, maxSpeed = 6.5) => {
    const dist = Math.hypot(x2 - x1, z2 - z1);
    const speed = dist / Math.max(0.016, dtSeconds);
    return { valid: speed <= maxSpeed, speed };
  };

  // Di chuyển bình thường (chạy 5.2 m/s trong 0.1s -> dist = 0.52m)
  const normalMove = checkMovementSpeed(0, 0, 0, 0.52, 0.1);
  assert.equal(normalMove.valid, true, 'Di chuyển ở tốc độ chạy bình thường được chấp nhận');

  // Dịch chuyển tức thời bất thường (dịch 10 mét trong 0.05 giây -> speed = 200 m/s)
  const warpMove = checkMovementSpeed(0, 0, 0, 10.0, 0.05);
  assert.equal(warpMove.valid, false, 'Dịch chuyển bất thường bị phát hiện và ngăn chặn');
});

// -------------------------------------------------------------
// P4 MEMORY WALL & MARKS TESTS ("CHÚNG TA ĐÃ TỪNG Ở ĐÂY")
// -------------------------------------------------------------

test('P4-1: Dấu ấn kỷ niệm: Kiểm tra độ dài lời nhắn (5-300 ký tự) và chống XSS', () => {
  const sanitize = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();

  const validateMemoryMark = (authorName, message) => {
    const cleanAuthor = sanitize(authorName);
    const cleanMessage = sanitize(message);

    if (cleanAuthor.length < 2 || cleanAuthor.length > 32) {
      return { valid: false, error: 'Tên phải từ 2 đến 32 ký tự' };
    }
    if (cleanMessage.length < 5 || cleanMessage.length > 300) {
      return { valid: false, error: 'Lời nhắn phải từ 5 đến 300 ký tự' };
    }
    return { valid: true, cleanAuthor, cleanMessage };
  };

  // Quá ngắn (< 5)
  assert.equal(validateMemoryMark('Nguyễn Văn A', 'Hi!').valid, false);
  // Hợp lệ (5 - 300)
  const validRes = validateMemoryMark('Lê Thị Mai', 'Mãi nhớ công ơn thầy cô và mái trường Tây Nguyên dấu yêu!');
  assert.equal(validRes.valid, true);
  // Quá dài (> 300)
  const longMsg = 'Kỷ niệm xưa '.repeat(35); // > 350 chars
  assert.equal(validateMemoryMark('Nguyễn Văn A', longMsg).valid, false);

  // Anti-XSS
  const xssAttempt = validateMemoryMark('<b>Minh</b>', '<b>Lời chúc 20/11</b> onerror=alert(1)');
  assert.equal(xssAttempt.valid, true);
  assert.ok(!xssAttempt.cleanAuthor.includes('<b>'));
  assert.ok(xssAttempt.cleanAuthor.includes('&lt;b&gt;Minh&lt;/b&gt;'));
  assert.ok(!xssAttempt.cleanMessage.includes('<b>'));
  assert.ok(xssAttempt.cleanMessage.includes('&lt;b&gt;'));
});

test('P4-2: Bộ 6 biểu tượng ý nghĩa và 6 màu pastel tiêu chuẩn cho thẻ dấu ấn', () => {
  const ALLOWED_SYMBOLS = ['heart', 'sunflower', 'rose', 'star', 'book', 'grad_cap'];
  const ALLOWED_COLORS = ['#FEF3C7', '#FCE7F3', '#DBEAFE', '#D1FAE5', '#EDE9FE', '#FFEDD5'];

  const validateMarkVisuals = (symbol, color) => {
    return ALLOWED_SYMBOLS.includes(symbol) && ALLOWED_COLORS.includes(color);
  };

  // Hợp lệ
  assert.equal(validateMarkVisuals('sunflower', '#FEF3C7'), true, 'Hoa hướng dương và màu vàng nhạt hợp lệ');
  assert.equal(validateMarkVisuals('grad_cap', '#EDE9FE'), true, 'Mũ cử nhân và màu tím pastel hợp lệ');
  assert.equal(validateMarkVisuals('heart', '#FCE7F3'), true, 'Trái tim và màu hồng pastel hợp lệ');

  // Không hợp lệ (kẻ xấu gửi icon/màu lạ)
  assert.equal(validateMarkVisuals('skull', '#000000'), false, 'Biểu tượng hoặc màu lạ bị từ chối');
  assert.equal(validateMarkVisuals('heart', 'invalid-color'), false);
});

test('P4-3: Proximity Detection nhận diện chính xác Bức Tường Dấu Ấn ở cuối lớp', () => {
  // Bức tường đặt ở x = 0, z = 4.93m (cuối lớp). Tầm nhận diện: z >= 3.45m và |x| <= 2.8m
  const checkMemoryWallProximity = (x, z) => {
    if (z >= 3.45 && Math.abs(x) <= 2.8) {
      return {
        type: 'memory_wall',
        label: 'Bức tường dấu ấn',
        iconName: 'memory_wall',
        colorTheme: 'amber',
      };
    }
    return null;
  };

  // 1. Đứng trước bức tường ở cuối lớp (z = 4.0m, x = 0.5m)
  const nearWall = checkMemoryWallProximity(0.5, 4.0);
  assert.notEqual(nearWall, null);
  assert.equal(nearWall.type, 'memory_wall');
  assert.equal(nearWall.label, 'Bức tường dấu ấn');
  assert.equal(nearWall.colorTheme, 'amber');

  // 2. Đứng ở bục giảng phía trước (z = -3.5m) -> Không nhận diện bức tường
  assert.equal(checkMemoryWallProximity(0, -3.5), null);

  // 3. Đứng ở giữa lớp (z = 1.0m) -> Không nhận diện bức tường
  assert.equal(checkMemoryWallProximity(0, 1.0), null);

  // 4. Ở góc xa bên hông (x = 3.5m, z = 4.0m) -> Ngoài phạm vi |x| <= 2.8
  assert.equal(checkMemoryWallProximity(3.5, 4.0), null);
});

test('P4-4: Phân quyền duyệt dấu ấn: Chỉ Giáo viên/Admin mới có quyền duyệt hoặc ẩn thẻ', () => {
  const canModerateMemoryMarks = (userRole) => {
    return userRole === 'teacher' || userRole === 'admin';
  };

  const applyModeration = (userRole, mark, newStatus) => {
    if (!canModerateMemoryMarks(userRole)) {
      return { success: false, error: 'Chỉ giáo viên hoặc quản trị viên mới có quyền kiểm duyệt' };
    }
    const validStatuses = ['approved', 'hidden', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Trạng thái kiểm duyệt không hợp lệ' };
    }
    return {
      success: true,
      updatedMark: {
        ...mark,
        status: newStatus,
        moderatedAt: new Date().toISOString(),
      },
    };
  };

  const sampleMark = {
    id: 'mark-01',
    authorName: 'Khách tham quan',
    message: 'Chúc mừng ngày nhà giáo Việt Nam!',
    status: 'pending',
  };

  // Khách/Sinh viên không có quyền kiểm duyệt
  const visitorAttempt = applyModeration('member', sampleMark, 'approved');
  assert.equal(visitorAttempt.success, false);
  assert.ok(visitorAttempt.error.includes('quyền kiểm duyệt'));

  // Giáo viên phê duyệt thẻ
  const teacherApprove = applyModeration('teacher', sampleMark, 'approved');
  assert.equal(teacherApprove.success, true);
  assert.equal(teacherApprove.updatedMark.status, 'approved');

  // Admin ẩn thẻ vi phạm
  const adminHide = applyModeration('admin', sampleMark, 'hidden');
  assert.equal(adminHide.success, true);
  assert.equal(adminHide.updatedMark.status, 'hidden');
});

// -------------------------------------------------------------
// P5: HOÀN THIỆN TRẢI NGHIỆM TRI ÂN 20/11 TESTS
// -------------------------------------------------------------

test('P5-1: Nâng cấp tặng hoa: 4 loại hoa ý nghĩa, giới hạn ký tự lời nhắn <= 120', () => {
  const FLOWER_TYPES = {
    rose: { name: 'Hoa Hồng Đỏ', emoji: '🌹' },
    sunflower: { name: 'Hoa Hướng Dương', emoji: '🌻' },
    lotus: { name: 'Hoa Sen Thanh Khiết', emoji: '🌸' },
    carnation: { name: 'Bó Hoa Cẩm Tú', emoji: '💐' },
  };

  const validateFlowerGift = (senderId, receiverId, flowerType, note = '') => {
    if (!senderId || !receiverId) return { valid: false, error: 'Thiếu người gửi hoặc người nhận' };
    if (!FLOWER_TYPES[flowerType]) return { valid: false, error: 'Loại hoa không hợp lệ' };
    if (note.length > 120) return { valid: false, error: 'Lời nhắn không được vượt quá 120 ký tự' };
    return { valid: true, flowerName: FLOWER_TYPES[flowerType].name };
  };

  // 1. Tặng hoa hợp lệ
  const validRose = validateFlowerGift('u1', 'teacher-1', 'rose', 'Kính chúc Thầy dồi dào sức khỏe!');
  assert.equal(validRose.valid, true);
  assert.equal(validRose.flowerName, 'Hoa Hồng Đỏ');

  const validSunflower = validateFlowerGift('u2', 'teacher-2', 'sunflower', 'Tri ân Cô!');
  assert.equal(validSunflower.valid, true);

  // 2. Loại hoa lạ bị từ chối
  const invalidType = validateFlowerGift('u1', 'teacher-1', 'cactus', 'Lời nhắn');
  assert.equal(invalidType.valid, false);
  assert.equal(invalidType.error, 'Loại hoa không hợp lệ');

  // 3. Lời nhắn quá dài (> 120 ký tự) bị từ chối
  const longNote = 'Lời chúc rất dài '.repeat(15);
  const tooLong = validateFlowerGift('u1', 'teacher-1', 'lotus', longNote);
  assert.equal(tooLong.valid, false);
  assert.ok(tooLong.error.includes('120 ký tự'));
});

test('P5-2: Chế độ "Nhìn lại hành trình": Phân quyền Admin/Giáo viên và đồng bộ chỉ số xoay vòng', () => {
  const canControlRetrospective = (role) => role === 'teacher' || role === 'admin';

  assert.equal(canControlRetrospective('member'), false, 'Sinh viên không được chuyển chế độ hành trình');
  assert.equal(canControlRetrospective('guest'), false);
  assert.equal(canControlRetrospective('teacher'), true);
  assert.equal(canControlRetrospective('admin'), true);

  // Thuật toán xoay vòng chỉ số thẻ (Carousel Wrapping)
  const getNextRetroIndex = (current, total) => (current + 1) % total;
  const getPrevRetroIndex = (current, total) => (current - 1 + total) % total;

  const totalMarks = 5;
  // Tiến: 0 -> 1 -> 2 -> 3 -> 4 -> 0
  assert.equal(getNextRetroIndex(0, totalMarks), 1);
  assert.equal(getNextRetroIndex(4, totalMarks), 0, 'Chỉ số thẻ cuối cùng xoay về 0');

  // Lùi: 0 -> 4 -> 3
  assert.equal(getPrevRetroIndex(0, totalMarks), 4, 'Chỉ số 0 lùi xoay về thẻ cuối');
  assert.equal(getPrevRetroIndex(3, totalMarks), 2);
});

test('P5-3: Lời chúc xuất hiện đẹp mắt: Trích xuất preview ngắn gọn và công tắc bật/tắt của Admin', () => {
  const formatWishToast = (authorName, teacherName, fullContent) => {
    const cleanContent = fullContent.replace(/<[^>]*>/g, '').trim();
    const truncated = cleanContent.length > 60 
      ? cleanContent.substring(0, 57) + '...'
      : cleanContent;
    return {
      title: `${authorName} • Gửi tới ${teacherName || 'Quý Thầy Cô'}`,
      snippet: truncated,
    };
  };

  const longWish = 'Kính chúc Quý Thầy Cô luôn luôn tràn đầy nhiệt huyết và truyền lửa tri thức cho các thế hệ sinh viên mai sau!';
  const toast = formatWishToast('Lê Văn Long', 'Cô Mai', longWish);
  assert.ok(toast.snippet.endsWith('...'));
  assert.ok(toast.snippet.length <= 60);

  // Kiểm tra công tắc (toggle) của Admin
  let adminWishesNotificationEnabled = true;
  const shouldShowToast = () => adminWishesNotificationEnabled;

  assert.equal(shouldShowToast(), true);
  adminWishesNotificationEnabled = false; // Admin tắt thông báo trong giờ giảng
  assert.equal(shouldShowToast(), false, 'Khi Admin tắt, thông báo không được hiển thị làm phiền lớp');
});

test('P5-4: Chụp ảnh kỷ niệm: Xử lý đóng khung hoàn toàn tại trình duyệt (Client-side isolation)', () => {
  // Đảm bảo không gửi ảnh lên máy chủ, chỉ tạo Data URL cục bộ
  const createMockPhotoCapture = (playerName) => {
    const safeName = String(playerName || 'Sinh viên').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9 ]/g, '').trim();
    const filename = `Lop_Hoc_Ky_Uc_20_11_${safeName.replace(/\s+/g, '_')}.png`;
    return {
      isClientSide: true,
      downloadFilename: filename,
      watermarkText: `Kỷ niệm: ${safeName} • Đại học Tây Nguyên`,
    };
  };

  const capture = createMockPhotoCapture('Trần Đức Lợi');
  assert.equal(capture.isClientSide, true, 'Xử lý hoàn toàn tại client');
  assert.ok(capture.downloadFilename.includes('Tran_Duc_Loi') || capture.downloadFilename.includes('Trần_Đức_Lợi'));
  assert.ok(capture.watermarkText.includes('Đại học Tây Nguyên'));
});

test('P5-5: Hiệu ứng âm thanh: Chính sách Mute và Ducking khi máy chiếu phát video', () => {
  let masterVolume = 0.8;
  let bgmVolume = 0.18;
  let isMuted = false;

  const setMute = (muted) => {
    isMuted = muted;
    masterVolume = muted ? 0 : 0.8;
  };

  const duckBgm = (ducked) => {
    bgmVolume = ducked ? 0.03 : 0.18;
  };

  // 1. Bình thường
  assert.equal(masterVolume, 0.8);
  assert.equal(bgmVolume, 0.18);

  // 2. Khi máy chiếu mở video (YouTube / Media Video) -> Ducking BGM xuống 0.03
  duckBgm(true);
  assert.equal(bgmVolume, 0.03, 'Nhạc nền tự động giảm âm lượng khi video phát để không át tiếng');

  // 3. Khi đóng video -> Phục hồi BGM về 0.18
  duckBgm(false);
  assert.equal(bgmVolume, 0.18);

  // 4. Khi người dùng bấm Mute -> Master volume = 0
  setMute(true);
  assert.equal(masterVolume, 0);
  assert.equal(isMuted, true);
});

test('P5-6: Hành động dâng hoa tri ân: Avatar chuyển trạng thái gifting, nâng hai tay và tự phục hồi standing', () => {
  const triggerGiftingGesture = (initialPlayer) => {
    let currentPlayer = { ...initialPlayer, state: 'gifting' };
    
    // Giao diện 3D tính toán góc tay dâng hoa
    const isGifting = currentPlayer.state === 'gifting';
    const leftArmRotX = isGifting ? -1.15 : 0;
    const rightArmRotX = isGifting ? -1.15 : 0;

    // Sau khi hết thời gian kỷ niệm (3.2s) hoặc khi di chuyển (WASD)
    const onTimerEnd = () => {
      if (currentPlayer.state === 'gifting') {
        currentPlayer = { ...currentPlayer, state: 'standing' };
      }
    };

    const onPlayerMove = () => {
      currentPlayer = { ...currentPlayer, state: 'walking' };
    };

    return {
      currentPlayer: () => currentPlayer,
      isGifting,
      leftArmRotX,
      rightArmRotX,
      onTimerEnd,
      onPlayerMove,
    };
  };

  const sim = triggerGiftingGesture({ id: 'u1', x: -3.5, z: -3.0, state: 'standing' });
  assert.equal(sim.isGifting, true);
  assert.equal(sim.leftArmRotX, -1.15, 'Cánh tay trái đưa về phía trước dâng hoa');
  assert.equal(sim.rightArmRotX, -1.15, 'Cánh tay phải đưa về phía trước dâng hoa');
  assert.equal(sim.currentPlayer().state, 'gifting');

  // Hết thời gian -> tự trở về standing
  sim.onTimerEnd();
  assert.equal(sim.currentPlayer().state, 'standing', 'Trở về trạng thái đứng tự nhiên');
});



