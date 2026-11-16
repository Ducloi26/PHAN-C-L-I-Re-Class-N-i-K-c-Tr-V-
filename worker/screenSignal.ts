import type { ProjectorState } from '../src/types';

// Only the current presenter can offer media. Viewers can negotiate with that
// presenter, never relay messages to arbitrary classroom members.
export function authorizeScreenSignal(state: ProjectorState, fromId: string, role: string, input: any) {
  const media = state.mode !== 'retrospective' ? state.media : null;
  const owner = media?.payload.presenter_id;
  if (media?.kind !== 'screen' || !owner || input?.sessionId !== media.payload.screen_session_id) return null;
  const presenting = fromId === owner && (role === 'teacher' || role === 'admin');
  const { kind, toId } = input;
  if (typeof toId !== 'string' || toId === fromId || toId.length > 100) return null;
  if (presenting ? !['offer', 'ice', 'leave'].includes(kind) : toId !== owner || !['ready', 'answer', 'ice', 'leave'].includes(kind)) return null;
  const result: Record<string, unknown> = { kind, toId, fromId, sessionId: input.sessionId };
  if (kind === 'offer' || kind === 'answer') {
    if (input.description?.type !== kind || typeof input.description.sdp !== 'string' || input.description.sdp.length > 12000) return null;
    result.description = { type: kind, sdp: input.description.sdp };
  }
  if (kind === 'ice') {
    const c = input.candidate;
    if (!c || typeof c.candidate !== 'string' || c.candidate.length > 2048) return null;
    result.candidate = { candidate: c.candidate, sdpMid: typeof c.sdpMid === 'string' ? c.sdpMid.slice(0, 100) : null, sdpMLineIndex: Number.isInteger(c.sdpMLineIndex) && c.sdpMLineIndex >= 0 ? c.sdpMLineIndex : null, usernameFragment: typeof c.usernameFragment === 'string' ? c.usernameFragment.slice(0, 256) : undefined };
  }
  return result;
}
