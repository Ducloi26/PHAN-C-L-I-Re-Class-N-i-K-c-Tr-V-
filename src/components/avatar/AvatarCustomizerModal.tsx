import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  RotateCcw, 
  User, 
  Palette, 
  Scissors 
} from 'lucide-react';
import { AvatarCustomization } from '../../types';
import { 
  AVATAR_PRESETS, 
  HAIR_STYLES, 
  OUTFIT_COLORS, 
  HAIR_COLORS, 
  ACCESSORIES,
  getDefaultAvatar
} from '../../lib/avatarPresets';
import { AvatarPreview3D } from './AvatarPreview3D';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: AvatarCustomization;
  onSave: (avatar: AvatarCustomization) => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSave,
}) => {
  const [avatar, setAvatar] = useState<AvatarCustomization>(() => currentAvatar || getDefaultAvatar());
  const [activeTab, setActiveTab] = useState<'presets' | 'hair' | 'colors'>('presets');

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const preset = AVATAR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setAvatar({ ...preset.defaultConfig });
    }
  };

  const handleSave = () => {
    onSave(avatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-[#1C140E] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-emerald-950/90 to-amber-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-amber-100">
                Tùy Chỉnh Avatar • Lớp Học Ký Ức 20/11
              </h2>
              <p className="text-[11px] text-emerald-300">
                Đại học Tây Nguyên — Thiết kế nhân vật đại diện của riêng bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: 3D Live Interactive Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
            <AvatarPreview3D avatar={avatar} height="h-72 sm:h-96" />
            
            <div className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-center">
              <div className="text-xs font-semibold text-amber-200">
                {AVATAR_PRESETS.find(p => p.id === avatar.presetId)?.name || 'Tùy biến riêng'}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-center gap-2">
                <span>Tóc: {HAIR_STYLES.find(h => h.id === avatar.hairStyle)?.name}</span>
                <span>•</span>
                <span>Áo: {OUTFIT_COLORS.find(c => c.hex.toLowerCase() === avatar.outfitColor.toLowerCase())?.name || 'Tùy chỉnh'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'presets'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>4 Avatar Mẫu</span>
              </button>
              <button
                onClick={() => setActiveTab('hair')}
                className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'hair'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Kiểu Tóc</span>
              </button>
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'colors'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Màu Sắc</span>
              </button>
            </div>

            {/* TAB 1: 4 AVATAR PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Chọn nhân vật yêu thích:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatar.presetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-lg ring-1 ring-amber-400'
                            : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
                            {preset.gender === 'male' ? '👦' : '👧'} {preset.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          {preset.description}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 text-[10px] text-gray-300">
                          <span 
                            className="w-3 h-3 rounded-full border border-white/30" 
                            style={{ backgroundColor: preset.defaultConfig.outfitColor }} 
                          />
                          <span>Áo</span>
                          <span 
                            className="w-3 h-3 rounded-full border border-white/30 ml-2" 
                            style={{ backgroundColor: preset.defaultConfig.hairColor }} 
                          />
                          <span>Tóc</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: HAIRSTYLES & ACCESSORIES */}
            {activeTab === 'hair' && (
              <div className="space-y-4">
                {/* Hairstyle Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    Kiểu tóc:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {HAIR_STYLES.map((hs) => {
                      const isSelected = avatar.hairStyle === hs.id;
                      return (
                        <button
                          key={hs.id}
                          type="button"
                          onClick={() => setAvatar((prev) => ({ ...prev, hairStyle: hs.id }))}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-amber-950/50 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                              : 'bg-slate-900/60 border-white/10 text-gray-300 hover:border-white/30'
                          }`}
                        >
                          <span className="text-xl">{hs.icon}</span>
                          <span className="text-xs font-semibold">{hs.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accessories Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    Phụ kiện trang trí:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ACCESSORIES.map((acc) => {
                      const isSelected = (avatar.accessory || 'none') === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setAvatar((prev) => ({ ...prev, accessory: acc.id }))}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-950/50 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400'
                              : 'bg-slate-900/60 border-white/10 text-gray-300 hover:border-white/30'
                          }`}
                        >
                          <span className="text-lg">{acc.icon}</span>
                          <span className="text-[11px] font-medium">{acc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COLOR PALETTES */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                {/* Outfit Colors */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    Màu áo / Trang phục:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {OUTFIT_COLORS.map((col) => {
                      const isSelected = avatar.outfitColor.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setAvatar((prev) => ({ ...prev, outfitColor: col.hex }))}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                              : 'bg-slate-900/60 border-white/10 text-gray-300 hover:border-white/30'
                          }`}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-white/40 shrink-0 shadow-sm"
                            style={{ backgroundColor: col.hex }} 
                          />
                          <span className="text-xs truncate">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hair Colors */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    Màu tóc:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {HAIR_COLORS.map((col) => {
                      const isSelected = avatar.hairColor.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setAvatar((prev) => ({ ...prev, hairColor: col.hex }))}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                              : 'bg-slate-900/60 border-white/10 text-gray-300 hover:border-white/30'
                          }`}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-white/40 shrink-0 shadow-sm"
                            style={{ backgroundColor: col.hex }} 
                          />
                          <span className="text-xs truncate">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-amber-500/20 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSelectPreset(avatar.presetId || 'student-male-1')}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/20 text-gray-300 hover:text-white text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Lưu &amp; Áp dụng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

