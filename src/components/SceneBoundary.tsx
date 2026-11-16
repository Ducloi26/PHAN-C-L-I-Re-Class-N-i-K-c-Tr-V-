import React from 'react';

export class SceneBoundary extends React.Component<{ children: React.ReactNode; onFailure?: () => void; fallback?: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() {
    return this.state.failed
      ? this.props.fallback || <div className="h-full flex items-center justify-center text-amber-100 text-sm p-4">Thiết bị không hỗ trợ xem trước 3D. Bạn vẫn có thể vào lớp bằng chế độ 2D.</div>
      : this.props.children;
  }
}
