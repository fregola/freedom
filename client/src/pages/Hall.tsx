import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

type TableStatus = 'libero' | 'occupato' | 'in_attesa' | 'conto';
type TableType = 'rect' | 'round';

interface TableItem {
  id: number;
  type: TableType;
  x: number;
  y: number;
  w: number;
  h: number;
  capacity: number;
  status: TableStatus;
  label?: string;
}

interface Room {
  id: number;
  name: string;
  width: number;
  height: number;
  tables: TableItem[];
}

const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const CanvasWrapper = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 12px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const CanvasArea = styled.div`
  position: relative;
  border-radius: 8px;
  background-size: 24px 24px;
  background-image: linear-gradient(to right, #eef2f7 1px, transparent 1px), linear-gradient(to bottom, #eef2f7 1px, transparent 1px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60vh;
  max-height: 70vh;
  overflow: hidden;
`;

const SidePanel = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  background: white;
  color: #111827;
  outline: none;
  transition: all 0.2s ease-in-out;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ToolGroup = styled.div`
  display: inline-flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const ToolToggle = styled.button.withConfig({
  shouldForwardProp: (prop) => !['isActive'].includes(prop),
})<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${({ isActive }) => (isActive ? '#ffffff' : 'transparent')};
  color: #1f2937;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s ease-in-out;
  border-right: 1px solid #e5e7eb;
  &:last-child { border-right: none; }
`;

const ToolIcon = styled.span`
  font-size: 16px;
`;

const PanelTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #374151;
`;

const PanelDivider = styled.hr`
  border: none;
  border-top: 1px solid #eef2f7;
  margin: 8px 0;
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ConfirmModal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const FieldLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 6px;
`;


const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

const Hall: React.FC = () => {
  const STORAGE_KEY = 'hall_layouts';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [tool, setTool] = useState<'select' | 'add_rect' | 'add_round'>('select');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lastDraggedId, setLastDraggedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | 'delete'>('edit');
  const [newRoomName, setNewRoomName] = useState('');
  const [roomNameEditing, setRoomNameEditing] = useState(false);
  const [roomNameDraft, setRoomNameDraft] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmOk = useRef<(() => void) | null>(null);
  const dragInfo = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    confirmOk.current = onConfirm;
    setConfirmOpen(true);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Room[] = JSON.parse(raw);
        setRooms(parsed);
        setCurrentRoomId(parsed[0]?.id ?? null);
      } else {
        const initial: Room = {
          id: 1,
          name: 'Sala 1',
          width: 1000,
          height: 600,
          tables: [],
        };
        setRooms([initial]);
        setCurrentRoomId(1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([initial]));
      }
    } catch {}
  }, []);

  const currentRoom = useMemo(() => rooms.find(r => r.id === currentRoomId) || null, [rooms, currentRoomId]);

  const saveRooms = (next: Room[]) => {
    setRooms(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addRoom = () => {
    const maxId = rooms.reduce((m, r) => Math.max(m, r.id), 0);
    const name = (newRoomName || `Sala ${maxId + 1}`).trim();
    const r: Room = { id: maxId + 1, name, width: 1000, height: 600, tables: [] };
    const next = [...rooms, r];
    saveRooms(next);
    setCurrentRoomId(r.id);
    setNewRoomName('');
    setMode('edit');
  };

  const renameRoom = (name: string) => {
    if (!currentRoom) return;
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, name } : r);
    saveRooms(next);
  };

  const deleteRoom = () => {
    if (!currentRoom) return;
    if (rooms.length <= 1) return;
    requestConfirm('Elimina sala', `Eliminare "${currentRoom.name}"?`, () => {
      const next = rooms.filter(r => r.id !== currentRoom.id);
      saveRooms(next);
      setCurrentRoomId(next[0]?.id ?? null);
      setSelectedId(null);
    });
  };

  const addTableAt = (x: number, y: number, type: TableType) => {
    if (!currentRoom) return;
    const maxId = currentRoom.tables.reduce((m, t) => Math.max(m, t.id), 0);
    const table: TableItem = {
      id: maxId + 1,
      type,
      x: Math.max(0, Math.min(x - 40, currentRoom.width - 80)),
      y: Math.max(0, Math.min(y - 40, currentRoom.height - 80)),
      w: type === 'rect' ? 120 : 80,
      h: type === 'rect' ? 80 : 80,
      capacity: type === 'rect' ? 4 : 4,
      status: 'libero',
      label: `Tavolo ${maxId + 1}`,
    };
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, tables: [...r.tables, table] } : r);
    saveRooms(next);
    setSelectedId(table.id);
  };

  const setTable = (id: number, patch: Partial<TableItem>) => {
    if (!currentRoom) return;
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, tables: r.tables.map(t => t.id === id ? { ...t, ...patch } : t) } : r);
    saveRooms(next);
  };

  const renumberCurrentRoom = () => {
    if (!currentRoom) return;
    const sorted = [...currentRoom.tables].sort((a, b) => a.id - b.id);
    const remapped = sorted.map((t, i) => ({ ...t, id: i + 1, label: `Tavolo ${i + 1}` }));
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, tables: remapped } : r);
    saveRooms(next);
  };

  const removeTable = (id: number) => {
    if (!currentRoom) return;
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, tables: r.tables.filter(t => t.id !== id) } : r);
    saveRooms(next);
    renumberCurrentRoom();
    if (selectedId === id) setSelectedId(null);
  };

  const onCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!currentRoom) return;
    const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
    const scaleX = currentRoom.width / rect.width;
    const scaleY = currentRoom.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    if (tool === 'add_rect') addTableAt(x, y, 'rect');
    if (tool === 'add_round') addTableAt(x, y, 'round');
  };

  const colorForStatus = (s: TableStatus) => {
    if (s === 'libero') return '#10b981';
    if (s === 'in_attesa') return '#3b82f6';
    if (s === 'occupato') return '#ef4444';
    return '#6b7280';
  };

  const onTableMouseDown = (id: number, e: React.MouseEvent) => {
    if (!currentRoom) return;
    const table = currentRoom.tables.find(t => t.id === id);
    if (!table) return;
    const svgRect = (e.currentTarget as SVGElement).closest('svg')!.getBoundingClientRect();
    const scaleX = currentRoom.width / svgRect.width;
    const scaleY = currentRoom.height / svgRect.height;
    const offsetX = (e.clientX - svgRect.left) * scaleX - table.x;
    const offsetY = (e.clientY - svgRect.top) * scaleY - table.y;
    dragInfo.current = { id, offsetX, offsetY };
    setSelectedId(id);
    setLastDraggedId(id);
  };

  const onCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragInfo.current || !currentRoom) return;
    const svgRect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const scaleX = currentRoom.width / svgRect.width;
    const scaleY = currentRoom.height / svgRect.height;
    const nx = (e.clientX - svgRect.left) * scaleX - dragInfo.current.offsetX;
    const ny = (e.clientY - svgRect.top) * scaleY - dragInfo.current.offsetY;
    const table = currentRoom.tables.find(t => t.id === dragInfo.current!.id);
    if (!table) return;
    const clampedX = Math.max(0, Math.min(nx, currentRoom.width - table.w));
    const clampedY = Math.max(0, Math.min(ny, currentRoom.height - table.h));
    setTable(table.id, { x: Math.round(clampedX), y: Math.round(clampedY) });
  };

  const rectsOverlap = (a: TableItem, b: TableItem) => {
    const ax2 = a.x + a.w;
    const ay2 = a.y + a.h;
    const bx2 = b.x + b.w;
    const by2 = b.y + b.h;
    return a.x < bx2 && ax2 > b.x && a.y < by2 && ay2 > b.y;
  };

  const statusMerge = (items: TableItem[]): TableStatus => {
    if (items.some(i => i.status === 'occupato')) return 'occupato';
    if (items.some(i => i.status === 'in_attesa')) return 'in_attesa';
    if (items.some(i => i.status === 'conto')) return 'conto';
    return 'libero';
  };


  const mergeOverlapsIfAny = () => {
    if (!currentRoom || lastDraggedId == null) return;
    const dragged = currentRoom.tables.find(t => t.id === lastDraggedId);
    if (!dragged) return;
    const others = currentRoom.tables.filter(t => t.id !== dragged.id);
    const overlapped = others.filter(o => rectsOverlap(dragged, o));
    if (overlapped.length === 0) return;
    const baseDragged = (dragged as any).mergedFrom ? (dragged as any).mergedFrom : [dragged];
    const group = [...baseDragged, ...overlapped.flatMap(o => (o as any).mergedFrom ? (o as any).mergedFrom : [o])];
    const minX = Math.min(...group.map(t => t.x));
    const minY = Math.min(...group.map(t => t.y));
    const maxX = Math.max(...group.map(t => t.x + t.w));
    const maxY = Math.max(...group.map(t => t.y + t.h));
    const minId = Math.min(...group.map(t => t.id));
    const merged: TableItem = {
      id: minId,
      type: 'rect',
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      capacity: group.reduce((s, t) => s + (t.capacity || 0), 0),
      status: statusMerge(group),
      label: `Tavolo ${minId}`,
    } as any;
    (merged as any).mergedFrom = group.map(t => ({ ...t }));
    const removeIds = new Set(group.map(t => t.id));
    const keep = currentRoom.tables.filter(t => !removeIds.has(t.id));
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, tables: [...keep, merged] } : r);
    saveRooms(next);
    setSelectedId(merged.id);
  };

  const splitSelected = () => {
    if (!currentRoom || selectedId == null) return;
    const table = currentRoom.tables.find(t => t.id === selectedId);
    if (!table) return;
    const origin = (table as any).mergedFrom as TableItem[] | undefined;
    if (!origin || origin.length === 0) return;
    const updatedTables = [...currentRoom.tables.filter(t => t.id !== table.id), ...origin];
    const remapped = [...updatedTables]
      .sort((a, b) => a.id - b.id)
      .map((t, i) => ({ ...t, id: i + 1, label: `Tavolo ${i + 1}` }));
    const next = rooms.map(r => r.id === currentRoom.id ? { ...r, tables: remapped } : r);
    saveRooms(next);
    setSelectedId(null);
  };

  const onCanvasMouseUp = () => {
    dragInfo.current = null;
    mergeOverlapsIfAny();
    setLastDraggedId(null);
  };

  return (
    <Page>
      <Header>
        <Title>Gestione Sale</Title>
        <Toolbar>
          <Button onClick={() => setMode('create')}>Crea Sala</Button>
          <Button variant="secondary" onClick={() => setMode('edit')}>Modifica</Button>
          <Button variant="danger" onClick={() => setMode('delete')}>Elimina</Button>
        </Toolbar>
      </Header>

      <CanvasWrapper>
        <CanvasArea>
          {currentRoom && (
            <svg
              viewBox={`0 0 ${currentRoom.width} ${currentRoom.height}`}
              width="100%"
              height="100%"
              style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}
              onClick={onCanvasClick}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
            >
              {currentRoom.tables.map(t => (
                t.type === 'rect' ? (
                  <g key={t.id} onMouseDown={(e) => onTableMouseDown(t.id, e)}>
                    <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={8} ry={8} fill={colorForStatus(t.status)} opacity={0.15} stroke={colorForStatus(t.status)} strokeWidth={2} />
                    <text x={t.x + t.w / 2} y={t.y + t.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#374151">{t.label || 'Tavolo'}</text>
                  </g>
                ) : (
                  <g key={t.id} onMouseDown={(e) => onTableMouseDown(t.id, e)}>
                    <circle cx={t.x + t.w / 2} cy={t.y + t.h / 2} r={Math.min(t.w, t.h) / 2} fill={colorForStatus(t.status)} opacity={0.15} stroke={colorForStatus(t.status)} strokeWidth={2} />
                    <text x={t.x + t.w / 2} y={t.y + t.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#374151">{t.label || 'Tondo'}</text>
                  </g>
                )
              ))}
              {selectedId && (
                (() => {
                  const s = currentRoom.tables.find(x => x.id === selectedId)!;
                  return (
                    <rect x={s.x - 4} y={s.y - 4} width={s.w + 8} height={s.h + 8} fill="none" stroke="#3b82f6" strokeDasharray="4 4" />
                  );
                })()
              )}
            </svg>
          )}
        </CanvasArea>
        <SidePanel>
          <Row>
            <PanelTitle>Gestione sale</PanelTitle>
          </Row>
          {mode === 'create' && (
            <>
              <Input label="Nome sala" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Es. Sala Interna" fullWidth />
              <Button onClick={addRoom}>Crea Sala</Button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Select value={currentRoomId ?? ''} onChange={(e) => setCurrentRoomId(Number(e.target.value))}>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
              {currentRoom && (
                roomNameEditing ? (
                  <>
                    <Input label="Nome sala" value={roomNameDraft} onChange={(e) => setRoomNameDraft(e.target.value)} fullWidth />
                    <Row>
                      <Button variant="secondary" onClick={() => { setRoomNameEditing(false); setRoomNameDraft(''); }}>Annulla</Button>
                      <Button onClick={() => { const name = roomNameDraft.trim(); if (name) renameRoom(name); setRoomNameEditing(false); }}>Salva</Button>
                    </Row>
                  </>
                ) : (
                  <>
                    <Input label="Nome sala" value={currentRoom.name} disabled fullWidth />
                    <Button variant="secondary" onClick={() => { requestConfirm('Modifica nome sala', 'Vuoi modificare il nome della sala?', () => { setRoomNameDraft(currentRoom.name); setRoomNameEditing(true); }); }}>Modifica nome</Button>
                  </>
                )
              )}
            </>
          )}
          {mode === 'delete' && (
            <>
              <Select value={currentRoomId ?? ''} onChange={(e) => setCurrentRoomId(Number(e.target.value))}>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
              <Button variant="danger" onClick={deleteRoom} disabled={rooms.length <= 1}>Elimina Sala</Button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Row>
                <PanelTitle>Strumenti</PanelTitle>
              </Row>
              <ToolGroup>
                <ToolToggle isActive={tool === 'select'} onClick={() => setTool('select')} title="Seleziona">
                  <ToolIcon>🖱️</ToolIcon>
                  Seleziona
                </ToolToggle>
                <ToolToggle isActive={tool === 'add_rect'} onClick={() => setTool('add_rect')} title="Aggiungi tavolo rettangolare">
                  <ToolIcon>▭</ToolIcon>
                  Tavolo rett.
                </ToolToggle>
                <ToolToggle isActive={tool === 'add_round'} onClick={() => setTool('add_round')} title="Aggiungi tavolo tondo">
                  <ToolIcon>◯</ToolIcon>
                  Tavolo tondo
                </ToolToggle>
              </ToolGroup>
              <PanelDivider />
              <Row>
                <PanelTitle>Proprietà</PanelTitle>
              </Row>
              {selectedId && currentRoom && (
                (() => {
                  const t = currentRoom.tables.find(x => x.id === selectedId)!;
                  const toNum = (v: string | number) => {
                    const s = String(v);
                    return Number(s.replace(',', '.'));
                  };
                  return (
                    <>
                      <FieldRow>
                        <Input label="Etichetta" value={t.label || ''} onChange={(e) => setTable(t.id, { label: e.target.value })} fullWidth />
                        <Field>
                          <FieldLabel>Capacità</FieldLabel>
                          <Input type="number" step={1} min={0} value={String(t.capacity)} onChange={(e) => setTable(t.id, { capacity: Math.max(0, Math.round(toNum(e.target.value))) })} fullWidth />
                        </Field>
                      </FieldRow>
                      <FieldRow>
                        <Field>
                          <FieldLabel>Altezza</FieldLabel>
                          <Input type="number" step={1} min={1} value={String(t.h)} onChange={(e) => setTable(t.id, { h: Math.max(1, Math.round(toNum(e.target.value))) })} fullWidth />
                        </Field>
                        <Field>
                          <FieldLabel>Larghezza</FieldLabel>
                          <Input type="number" step={1} min={1} value={String(t.w)} onChange={(e) => setTable(t.id, { w: Math.max(1, Math.round(toNum(e.target.value))) })} fullWidth />
                        </Field>
                      </FieldRow>
                      <Row>
                        <Button variant="danger" onClick={() => removeTable(t.id)}>Rimuovi Tavolo</Button>
                        {(t as any).mergedFrom && <Button variant="secondary" onClick={splitSelected}>Dividi Tavolo</Button>}
                      </Row>
                    </>
                  );
                })()
              )}
            </>
          )}
        </SidePanel>
      </CanvasWrapper>
      {confirmOpen && (
        <ConfirmOverlay>
          <ConfirmModal>
            <ModalHeader>
              <ModalTitle>{confirmTitle}</ModalTitle>
              <CloseButton onClick={() => setConfirmOpen(false)}>×</CloseButton>
            </ModalHeader>
            <div style={{ color: '#374151' }}>{confirmMessage}</div>
            <ModalActions>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Annulla</Button>
              <Button onClick={() => { const fn = confirmOk.current; setConfirmOpen(false); confirmOk.current = null; if (fn) fn(); }}>Conferma</Button>
            </ModalActions>
          </ConfirmModal>
        </ConfirmOverlay>
      )}
    </Page>
  );
};

export default Hall;
const ToolbarColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;