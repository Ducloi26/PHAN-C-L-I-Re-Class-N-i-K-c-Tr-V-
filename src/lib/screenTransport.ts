export interface ScreenSignal {
  kind: 'ready' | 'offer' | 'answer' | 'ice' | 'leave';
  sessionId: string; toId: string; fromId?: string;
  description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit;
}
type Peer = { pc: RTCPeerConnection; queue: Promise<void>; candidates: RTCIceCandidateInit[]; createdAt: number };

export class ScreenTransport {
  private peers = new Map<string, Peer>();
  private closed = false;
  private retry: ReturnType<typeof setInterval> | undefined;
  constructor(private sessionId: string, private selfId: string, private ownerId: string,
    private stream: MediaStream | null, private config: RTCConfiguration,
    private send: (signal: ScreenSignal) => void,
    private receive: (stream: MediaStream | null) => void,
    private status: (text: string) => void) {
    if (selfId !== ownerId) {
      this.ready();
      this.retry = setInterval(() => {
        const peer = this.peers.get(ownerId);
        if (peer?.pc.connectionState !== 'connected') this.ready();
      }, 5000);
    }
  }
  private signal(toId: string, body: Partial<ScreenSignal>) {
    if (!this.closed) this.send({ sessionId: this.sessionId, toId, kind: 'ready', ...body });
  }
  private ready() { this.signal(this.ownerId, { kind: 'ready' }); }
  private drop(id: string) {
    const peer = this.peers.get(id);
    this.peers.delete(id);
    if (peer) { peer.pc.ontrack = null; peer.pc.onicecandidate = null; peer.pc.onconnectionstatechange = null; peer.pc.close(); }
  }
  private create(id: string): Peer {
    this.drop(id);
    const pc = new RTCPeerConnection(this.config);
    const peer: Peer = { pc, queue: Promise.resolve(), candidates: [], createdAt: Date.now() };
    this.peers.set(id, peer);
    pc.onicecandidate = (event) => { if (event.candidate) this.signal(id, { kind: 'ice', candidate: event.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => {
      if (this.closed || this.peers.get(id) !== peer) return;
      if (pc.connectionState === 'connected') this.status(this.selfId === this.ownerId ? 'Đang chia sẻ màn hình với lớp' : 'Đã kết nối màn hình trực tiếp');
      if (pc.connectionState === 'failed') {
        this.status('Không kết nối được màn hình. Đang thử lại; mạng này có thể cần máy chủ TURN.');
        this.drop(id);
        if (this.selfId !== this.ownerId) this.receive(null);
      }
    };
    const received = new MediaStream();
    pc.ontrack = ({ track, streams }) => {
      if (this.closed || this.peers.get(id) !== peer) return;
      if (streams[0]) this.receive(streams[0]);
      else { received.addTrack(track); this.receive(received); }
    };
    if (this.stream) for (const track of this.stream.getTracks()) pc.addTrack(track, this.stream);
    return peer;
  }
  async handle(input: ScreenSignal) {
    if (this.closed || input.sessionId !== this.sessionId || !input.fromId || input.toId !== this.selfId) return;
    const id = input.fromId;
    const owner = this.selfId === this.ownerId;
    if (owner ? !['ready', 'answer', 'ice', 'leave'].includes(input.kind) : id !== this.ownerId || !['offer', 'ice', 'leave'].includes(input.kind)) return;
    if (input.kind === 'leave') { this.drop(id); if (!owner) this.receive(null); return; }
    if (input.kind === 'ready') {
      if (!this.stream) return;
      const previous = this.peers.get(id);
      if (previous && (previous.pc.connectionState === 'connected' || (['new', 'connecting'].includes(previous.pc.connectionState) && Date.now() - previous.createdAt < 12000))) return;
      const peer = this.create(id);
      peer.queue = this.negotiate(peer, async () => {
        await peer.pc.setLocalDescription(await peer.pc.createOffer());
        this.signal(id, { kind: 'offer', description: peer.pc.localDescription!.toJSON() });
      });
      return peer.queue;
    }
    let peer = this.peers.get(id);
    if (!owner && input.kind === 'offer' && peer?.pc.remoteDescription) { this.drop(id); peer = undefined; }
    if (!peer) peer = this.create(id);
    const current = peer;
    current.queue = current.queue.then(() => this.negotiate(current, async () => {
      if (input.kind === 'ice' && input.candidate) {
        if (current.pc.remoteDescription) await current.pc.addIceCandidate(input.candidate);
        else if (current.candidates.length < 100) current.candidates.push(input.candidate);
      } else if ((input.kind === 'offer' || input.kind === 'answer') && input.description) {
        await current.pc.setRemoteDescription(input.description);
        for (const candidate of current.candidates.splice(0)) await current.pc.addIceCandidate(candidate);
        if (input.kind === 'offer') {
          await current.pc.setLocalDescription(await current.pc.createAnswer());
          this.signal(id, { kind: 'answer', description: current.pc.localDescription!.toJSON() });
        }
      }
    }));
    return current.queue;
  }
  private async negotiate(peer: Peer, action: () => Promise<void>) {
    if (this.closed || peer.pc.signalingState === 'closed') return;
    try { await action(); }
    catch { if (!this.closed && [...this.peers.values()].includes(peer)) { this.status('Kết nối màn hình bị gián đoạn. Đang thử lại…'); for (const [id, value] of this.peers) if (value === peer) this.drop(id); } }
  }
  close() {
    if (this.closed) return;
    for (const id of this.peers.keys()) this.signal(id, { kind: 'leave' });
    this.closed = true;
    clearInterval(this.retry);
    for (const id of this.peers.keys()) this.drop(id);
  }
  participantLeft(id: string) {
    this.drop(id);
    if (id === this.ownerId && this.selfId !== this.ownerId) this.receive(null);
  }
}
