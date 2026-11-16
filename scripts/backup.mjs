/**
 * Backup Script for "Lớp học Ký Ức 20/11"
 * Trích xuất toàn bộ dữ liệu (Lời chúc, Hoa tri ân, Dấu ấn kỷ niệm) thành file JSON backup
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function runBackup() {
  console.log('--- KHỞI ĐỘNG SAO LƯU DỮ LIỆU DỰ ÁN 20/11 ---');

  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project')) {
    console.log('[INFO] Không tìm thấy cấu hình Supabase production. Đang tạo file backup mẫu cấu trúc...');
    const mockBackup = {
      timestamp: new Date().toISOString(),
      note: 'Backup du phong truoc ngay Gala 20/11',
      wishes: [],
      flowers: [],
      memory_marks: [],
    };
    const backupPath = path.resolve(__dirname, `../backup_20_11_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(mockBackup, null, 2), 'utf-8');
    console.log(`[DONE] Đã lưu file backup tại: ${backupPath}`);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const [wishesRes, flowersRes, marksRes] = await Promise.all([
      supabase.from('wishes').select('*'),
      supabase.from('flowers').select('*'),
      supabase.from('memory_marks').select('*'),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      wishes: wishesRes.data || [],
      flowers: flowersRes.data || [],
      memory_marks: marksRes.data || [],
    };

    const filename = `backup_lop_hoc_ky_uc_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const outputPath = path.resolve(__dirname, `../${filename}`);
    fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`[PASS] Sao lưu thành công!`);
    console.log(`- Lời chúc: ${backupData.wishes.length}`);
    console.log(`- Lượt tặng hoa: ${backupData.flowers.length}`);
    console.log(`- Dấu ấn kỷ niệm: ${backupData.memory_marks.length}`);
    console.log(`- Đường dẫn file: ${outputPath}`);
  } catch (err) {
    console.error('[ERROR] Lỗi trong quá trình sao lưu:', err);
  }
}

runBackup();
