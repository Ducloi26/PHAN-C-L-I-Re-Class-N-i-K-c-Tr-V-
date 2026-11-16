import React, { useMemo } from 'react';

export const ClassroomFurniture: React.FC = () => {
  // Student desks grid: 3 rows x 4 columns
  const desks = useMemo(() => {
    const list: { x: number; z: number; hasBook?: boolean; bookColor?: string }[] = [];
    const rows = [-0.5, 1.5, 3.5];
    const cols = [-4.0, -1.4, 1.4, 4.0];
    const colors = ['#1D4ED8', '#047857', '#B91C1C', '#D97706'];
    let idx = 0;
    for (const r of rows) {
      for (const c of cols) {
        list.push({ 
          x: c, 
          z: r,
          hasBook: idx % 3 === 0 || idx === 1,
          bookColor: colors[idx % colors.length]
        });
        idx++;
      }
    }
    return list;
  }, []);

  return (
    <group>
      {/* --------------------------------------------------------- */}
      {/* 1. ROOM SHELL & ARCHITECTURE (Enclosed 14.5 x 11 x 5m)    */}
      {/* --------------------------------------------------------- */}
      
      {/* Floor: Warm hardwood parquet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14.5, 11]} />
        <meshStandardMaterial color="#966A48" roughness={0.65} metalness={0.08} />
      </mesh>

      {/* Front Wall (z = -5.0) */}
      <mesh position={[0, 2.5, -5.0]} receiveShadow>
        <planeGeometry args={[14.5, 5.0]} />
        <meshStandardMaterial color="#FAF5EE" roughness={0.9} />
      </mesh>

      {/* Front Wall Wooden Wainscoting */}
      <mesh position={[0, 0.45, -4.97]}>
        <planeGeometry args={[14.5, 0.9]} />
        <meshStandardMaterial color="#6B4423" roughness={0.7} />
      </mesh>

      {/* Back Wall (z = +5.0) */}
      <mesh position={[0, 2.5, 5.0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[14.5, 5.0]} />
        <meshStandardMaterial color="#F3EBE1" roughness={0.9} />
      </mesh>

      {/* Left Wall (x = -7.0) with door */}
      <mesh position={[-7.0, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[11, 5.0]} />
        <meshStandardMaterial color="#F5EBE0" roughness={0.9} />
      </mesh>
      
      {/* Classroom Door on Left Wall (Height 2.1m, width 1.0m, standard human door) */}
      <mesh position={[-6.96, 1.05, 3.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.0, 2.1, 0.05]} />
        <meshStandardMaterial color="#582F0E" roughness={0.6} />
      </mesh>
      {/* Door Handle */}
      <mesh position={[-6.92, 1.0, 3.85]} rotation={[0, Math.PI / 2, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Classroom Clock above door */}
      <group position={[-6.95, 3.2, 3.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 20]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <ringGeometry args={[0.23, 0.26, 20]} />
          <meshStandardMaterial color="#92400E" roughness={0.5} />
        </mesh>
        {/* Clock hands */}
        <mesh position={[0, 0.05, 0.025]}>
          <boxGeometry args={[0.02, 0.12, 0.005]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0.04, 0, 0.025]} rotation={[0, 0, -1.2]}>
          <boxGeometry args={[0.015, 0.15, 0.005]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* Right Wall (x = 7.0) with Windows */}
      <mesh position={[7.0, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[11, 5.0]} />
        <meshStandardMaterial color="#F5EBE0" roughness={0.9} />
      </mesh>

      {/* 3 Large Windows on Right Wall with Campus Sky & Lush Trees Outside */}
      {[-2.5, 0.5, 3.5].map((wZ, i) => (
        <group key={i} position={[6.95, 2.4, wZ]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Window Frame */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.8, 2.2, 0.06]} />
            <meshStandardMaterial color="#582F0E" roughness={0.6} />
          </mesh>
          {/* Glass Pane */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.6, 2.0]} />
            <meshStandardMaterial
              color="#BAE6FD"
              transparent
              opacity={0.3}
              roughness={0.1}
            />
          </mesh>
          {/* Outside Backdrop: Blue Central Highlands Sky & Lush Green Canopies */}
          <mesh position={[0, 0, -0.6]}>
            <planeGeometry args={[2.2, 2.4]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
          <mesh position={[0, -0.4, -0.55]}>
            <sphereGeometry args={[0.9, 10, 8]} />
            <meshStandardMaterial color="#15803D" roughness={0.8} />
          </mesh>
          {/* Sunlight Shaft Effect */}
          <mesh position={[-0.8, -0.6, -0.2]} rotation={[0.4, -0.5, 0]}>
            <cylinderGeometry args={[0.9, 1.4, 3.0, 8]} />
            <meshBasicMaterial color="#FEF08A" transparent opacity={0.04} />
          </mesh>
        </group>
      ))}

      {/* --------------------------------------------------------- */}
      {/* 2. CELEBRATORY TRADITIONAL BANNERS (20/11 TRƯỜNG HỌC VN) */}
      {/* --------------------------------------------------------- */}
      
      {/* Top Main Banner: "NHIỆT LIỆT CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11" */}
      <group position={[0, 4.35, -4.92]}>
        <mesh>
          <boxGeometry args={[8.8, 0.6, 0.04]} />
          <meshStandardMaterial color="#991B1B" roughness={0.4} />
        </mesh>
        {/* Golden border */}
        <mesh position={[0, 0, 0.022]}>
          <boxGeometry args={[8.7, 0.52, 0.01]} />
          <meshStandardMaterial color="#B91C1C" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.28, 0.025]}>
          <boxGeometry args={[8.8, 0.03, 0.01]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.28, 0.025]}>
          <boxGeometry args={[8.8, 0.03, 0.01]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Traditional Vietnamese Slogan: "TIÊN HỌC LỄ — HẬU HỌC VĂN" */}
      <group position={[0, 3.75, -4.92]}>
        <mesh>
          <boxGeometry args={[5.2, 0.35, 0.03]} />
          <meshStandardMaterial color="#78350F" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[5.05, 0.28, 0.005]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.7} />
        </mesh>
      </group>

      {/* --------------------------------------------------------- */}
      {/* 3. TEACHER'S DESK, PODIUM & FLOWER VASE                   */}
      {/* --------------------------------------------------------- */}
      
      {/* Teacher's Podium (Bục giảng) */}
      <mesh position={[0, 0.08, -4.2]}>
        <boxGeometry args={[9.0, 0.16, 1.5]} />
        <meshStandardMaterial color="#6B4423" roughness={0.6} />
      </mesh>

      {/* Teacher's Main Table (Bàn giáo viên cao 0.75m) */}
      <group position={[-3.5, 0, -3.6]}>
        {/* Table Top */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.8, 0.06, 0.9]} />
          <meshStandardMaterial color="#4A2810" roughness={0.5} />
        </mesh>

        {/* Traditional Red Velvet Table Runner with Gold Trim */}
        <mesh position={[0, 0.785, 0]}>
          <boxGeometry args={[1.72, 0.01, 0.55]} />
          <meshStandardMaterial color="#991B1B" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.786, 0.27]}>
          <boxGeometry args={[1.72, 0.012, 0.02]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.786, -0.27]}>
          <boxGeometry args={[1.72, 0.012, 0.02]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Modesty panel */}
        <mesh position={[0, 0.42, 0.38]}>
          <boxGeometry args={[1.7, 0.60, 0.04]} />
          <meshStandardMaterial color="#6B4423" roughness={0.6} />
        </mesh>

        {/* Desk legs */}
        {[[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].map(([lx, lz], idx) => (
          <mesh key={idx} position={[lx, 0.36, lz]}>
            <cylinderGeometry args={[0.025, 0.025, 0.72, 8]} />
            <meshStandardMaterial color="#2A1B0E" roughness={0.7} />
          </mesh>
        ))}

        {/* Podium Microphone */}
        <group position={[-0.2, 0.80, -0.2]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.03, 10]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.12, 0.04]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
            <meshStandardMaterial color="#64748B" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.23, 0.07]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>

        {/* Laptop on desk */}
        <mesh position={[0.2, 0.80, 0]}>
          <boxGeometry args={[0.38, 0.015, 0.28]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.2, 0.94, -0.12]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.38, 0.26, 0.015]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} />
        </mesh>

        {/* Stack of Lesson Plan Books & Cup of Tea */}
        <mesh position={[-0.45, 0.81, 0.1]}>
          <boxGeometry args={[0.28, 0.06, 0.20]} />
          <meshStandardMaterial color="#B91C1C" roughness={0.8} />
        </mesh>
        <mesh position={[-0.45, 0.85, 0.09]}>
          <boxGeometry args={[0.26, 0.02, 0.18]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.8} />
        </mesh>
        {/* Tea cup */}
        <mesh position={[0.55, 0.82, -0.1]}>
          <cylinderGeometry args={[0.04, 0.035, 0.07, 10]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>

        {/* 20/11 Flower Vase */}
        <group position={[-0.6, 0.78, -0.15]}>
          <mesh position={[0, 0.10, 0]}>
            <cylinderGeometry args={[0.07, 0.05, 0.20, 12]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} metalness={0.1} />
          </mesh>
          {[
            [0, 0.24, 0, '#E11D48'],
            [0.04, 0.22, 0.03, '#F59E0B'],
            [-0.04, 0.23, -0.03, '#EC4899'],
            [0.02, 0.25, -0.03, '#DC2626'],
            [-0.03, 0.21, 0.03, '#FBBF24'],
          ].map(([fx, fy, fz, col], fIdx) => (
            <mesh key={fIdx} position={[Number(fx), Number(fy), Number(fz)]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={String(col)} roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* Teacher Chair */}
        <group position={[0, 0, -0.6]}>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[0.5, 0.05, 0.5]} />
            <meshStandardMaterial color="#6B4423" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.82, -0.22]}>
            <boxGeometry args={[0.48, 0.55, 0.04]} />
            <meshStandardMaterial color="#6B4423" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* --------------------------------------------------------- */}
      {/* 4. STUDENT DESKS & BENCHES (12 units)                     */}
      {/* --------------------------------------------------------- */}
      {desks.map((d, index) => (
        <group key={index} position={[d.x, 0, d.z]}>
          {/* Desk Top */}
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.5, 0.05, 0.60]} />
            <meshStandardMaterial color="#8C5835" roughness={0.6} />
          </mesh>
          {/* Shelf under desk */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.4, 0.02, 0.50]} />
            <meshStandardMaterial color="#6B4423" roughness={0.7} />
          </mesh>
          {/* Desk Legs */}
          {[[-0.68, -0.24], [0.68, -0.24], [-0.68, 0.24], [0.68, 0.24]].map(([dlx, dlz], lIdx) => (
            <mesh key={lIdx} position={[dlx, 0.36, dlz]}>
              <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}

          {/* Student Notebook & Pen on selected desks */}
          {d.hasBook && (
            <group position={[0.25, 0.78, 0]}>
              {/* Notebook */}
              <mesh>
                <boxGeometry args={[0.22, 0.015, 0.16]} />
                <meshStandardMaterial color={d.bookColor || '#1D4ED8'} roughness={0.6} />
              </mesh>
              {/* White notebook pages strip */}
              <mesh position={[0, 0.009, 0]}>
                <boxGeometry args={[0.20, 0.006, 0.14]} />
                <meshStandardMaterial color="#FFFBEB" roughness={0.9} />
              </mesh>
              {/* Ballpoint pen */}
              <mesh position={[0.15, 0.01, 0]} rotation={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
                <meshStandardMaterial color="#0284C7" metalness={0.5} />
              </mesh>
            </group>
          )}

          {/* Student Bench / Chair */}
          <group position={[0, 0, 0.53]}>
            {/* Seat board at 0.45m */}
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[1.4, 0.04, 0.30]} />
              <meshStandardMaterial color="#6B4423" roughness={0.7} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, 0.72, 0.13]}>
              <boxGeometry args={[1.4, 0.20, 0.03]} />
              <meshStandardMaterial color="#6B4423" roughness={0.7} />
            </mesh>
            {/* Bench legs */}
            {[[-0.6, -0.1], [0.6, -0.1], [-0.6, 0.1], [0.6, 0.1]].map(([clx, clz], cIdx) => (
              <mesh key={cIdx} position={[clx, 0.22, clz]}>
                <cylinderGeometry args={[0.018, 0.018, 0.44, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* --------------------------------------------------------- */}
      {/* 5. CEILING LIGHTS (Pendant Lamps)                         */}
      {/* --------------------------------------------------------- */}
      {[-2, 2].map((lx, i) => (
        <group key={i} position={[lx, 4.2, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.45, 0.18, 16]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
          </mesh>
          <pointLight color="#FEF3C7" intensity={0.65} distance={7} decay={2} />
        </group>
      ))}
    </group>
  );
};
