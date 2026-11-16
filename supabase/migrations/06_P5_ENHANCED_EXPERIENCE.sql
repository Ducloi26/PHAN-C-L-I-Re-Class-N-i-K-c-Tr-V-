-- ============================================================================
-- P5: HOÀN THIỆN TRẢI NGHIỆM TRI ÂN 20/11
-- Migration: 06_P5_ENHANCED_EXPERIENCE.sql
-- Thêm các trường hỗ trợ 4 loại hoa biểu tượng & Chế độ "Nhìn lại hành trình"
-- ============================================================================

-- 1. Nâng cấp bảng flower_gifts
ALTER TABLE IF EXISTS public.flower_gifts 
  ADD COLUMN IF NOT EXISTS flower_type VARCHAR(32) DEFAULT 'rose',
  ADD COLUMN IF NOT EXISTS flower_name VARCHAR(64) DEFAULT 'Hoa Hồng Đỏ';

COMMENT ON COLUMN public.flower_gifts.flower_type IS 'Loại hoa: rose, sunflower, lotus, carnation';
COMMENT ON COLUMN public.flower_gifts.flower_name IS 'Tên hiển thị tiếng Việt của đóa hoa biểu tượng';

-- 2. Nâng cấp bảng projector_state cho Chế độ "Nhìn lại hành trình" (Retrospective Mode)
ALTER TABLE IF EXISTS public.projector_state 
  ADD COLUMN IF NOT EXISTS mode VARCHAR(32) DEFAULT 'presentation',
  ADD COLUMN IF NOT EXISTS retrospective_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retrospective_mark_id UUID REFERENCES public.memory_marks(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.projector_state.mode IS 'Chế độ máy chiếu: presentation (bài giảng) hoặc retrospective (nhìn lại hành trình)';
COMMENT ON COLUMN public.projector_state.retrospective_index IS 'Chỉ số thẻ kỷ niệm đang được đồng bộ trình chiếu';

-- 3. Cập nhật record projector_state id=1 mặc định
UPDATE public.projector_state
SET 
  mode = COALESCE(mode, 'presentation'),
  retrospective_index = COALESCE(retrospective_index, 0),
  updated_at = NOW()
WHERE id = 1;

-- 4. Bổ sung vào Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'flower_gifts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.flower_gifts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'projector_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projector_state;
  END IF;
END $$;

