import React from 'react';
import { PlayerState } from '../../types';
import { Users, X, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface OnlineUsersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  localPlayer: PlayerState;
  remotePlayers: PlayerState[];
  connectionStatus?: string;
}

export const OnlineUsersPanel: React.FC<OnlineUsersPanelProps> = ({
  isOpen,
  onClose,
  localPlayer,
  remotePlayers,
  connectionStatus = 'connected',
}) => {
  if (!isOpen) return null;

  const allPlayers = [localPlayer, ...remotePlayers];

  const statusConfig = {
    connected: { label: 'Đã kết nối', dot: 'bg-emerald-400' },
    reconnecting: { label: 'Đang kết nối lại...', dot: 'bg-amber-400 animate-ping' },
    connecting: { label: 'Đang kết nối...', dot: 'bg-amber-400 animate-pulse' },
    disconnected: { label: 'Mất kết nối', dot: 'bg-red-400' },
  }[connectionStatus] || { label: 'Ngoại tuyến', dot: 'bg-gray-400' };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-l border-amber-500/40 text-white shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-amber-200">Thành Viên Trong Lớp</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-400">
                Online: <strong className="text-emerald-400">{allPlayers.length} người</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-300 bg-white/5 px-1.5 py-0.5 rounded">
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Đóng danh sách người trong lớp"
          className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allPlayers.map((player) => {
          const isLocal = player.id === localPlayer.id;
          const roleBadge = {
            admin: { label: 'Admin', color: 'bg-purple-900 text-amber-300 border-purple-500' },
            teacher: { label: 'Giáo viên', color: 'bg-emerald-900 text-emerald-200 border-emerald-500' },
            member: {
              label: player.participantType === 'student' ? 'Sinh viên' : 'Khách',
              color: 'bg-slate-800 text-gray-300 border-gray-600',
            },
          }[player.role];

          return (
            <div
              key={player.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                isLocal
                  ? 'bg-amber-500/10 border-amber-500/50'
                  : 'bg-slate-800/60 border-white/5 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 border border-white/10">
                  {player.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white truncate max-w-[120px]">
                      {player.displayName}
                    </span>
                    {isLocal && (
                      <span className="text-[10px] text-amber-400 font-bold">(Bạn)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {player.state === 'sitting' ? '🪑 Đang ngồi' : player.state === 'walking' ? '🚶 Đang đi' : '🧍 Đang đứng'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Online pulse dot */}
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-white/10 bg-slate-950 text-center">
        <p className="text-[11px] text-gray-400">
          Di chuyển bằng <strong>WASD</strong> hoặc phím mũi tên. Bấm <strong>E</strong> để ngồi ghế.
        </p>
      </div>
    </div>
  );
};

