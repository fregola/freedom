import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from '../common/Button';
import Input from '../common/Input';
import { userService } from '../../services/api';
import { User } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: white;
  width: 90vw;
  max-width: 900px;
  max-height: 85vh;
  border-radius: 10px;
  box-shadow: 0 16px 32px rgba(0,0,0,0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #111827;
`;

const Body = styled.div`
  padding: 12px 16px;
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th, td { border-bottom: 1px solid #f3f4f6; padding: 6px; text-align: left; }
  th { color: #6b7280; font-weight: 600; }
  min-width: 680px;
`;

const RowActions = styled.div`
  display: flex;
  gap: 6px;
`;

const StatusBadge = styled.span<{$active: boolean}>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
  color: ${p => p.$active ? '#065f46' : '#7c2d12'};
  background: ${p => p.$active ? '#d1fae5' : '#fee2e2'};
`;

const InlineForm = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const [emailEdits, setEmailEdits] = useState<Record<number, string>>({});
  const [passwordEdits, setPasswordEdits] = useState<Record<number, string>>({});
  const [roleEdits, setRoleEdits] = useState<Record<number, 'admin' | 'cook' | 'waiter'>>({});
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.list();
      const list: User[] = res?.data?.users || [];
      setUsers(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore nel caricamento utenti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const toggleActive = async (u: User) => {
    try {
      setError(null); setSuccess(null);
      const current = typeof u.is_active === 'number' ? u.is_active === 1 : !!u.is_active;
      const res = await userService.setActive(u.id, !current);
      setSuccess(res?.message || 'Stato aggiornato');
      await fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore aggiornamento stato');
    }
  };

  const saveEmail = async (u: User) => {
    const nextEmail = emailEdits[u.id];
    if (!nextEmail) return;
    try {
      setError(null); setSuccess(null);
      const res = await userService.updateEmail(u.id, nextEmail);
      setSuccess(res?.message || 'Email aggiornata');
      await fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore aggiornamento email');
    }
  };

  const savePassword = async (u: User) => {
    const nextPass = passwordEdits[u.id];
    if (!nextPass) return;
    try {
      setError(null); setSuccess(null);
      const res = await userService.updatePassword(u.id, nextPass);
      setSuccess(res?.message || 'Password aggiornata');
      setPasswordEdits(prev => ({ ...prev, [u.id]: '' }));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore aggiornamento password');
    }
  };

  const saveRole = async (u: User) => {
    const nextRole = roleEdits[u.id] ?? (u.role as 'admin' | 'cook' | 'waiter');
    try {
      setError(null); setSuccess(null);
      const res = await userService.updateRole(u.id, nextRole);
      setSuccess(res?.message || 'Ruolo aggiornato');
      await fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore aggiornamento ruolo');
    }
  };

  const saveRow = async (u: User) => {
    try {
      setLoading(true);
      setError(null); setSuccess(null);
      const promises: Promise<any>[] = [];
      const emailChanged = (emailEdits[u.id] ?? u.email) !== u.email;
      const roleChanged = (roleEdits[u.id] ?? (u.role as 'admin' | 'cook' | 'waiter')) !== (u.role as 'admin' | 'cook' | 'waiter');
      if (emailChanged) {
        promises.push(userService.updateEmail(u.id, emailEdits[u.id] ?? u.email));
      }
      if (roleChanged) {
        promises.push(userService.updateRole(u.id, roleEdits[u.id] ?? (u.role as 'admin' | 'cook' | 'waiter')));
      }
      if (promises.length) {
        await Promise.all(promises);
        setSuccess('Modifiche salvate');
        await fetchUsers();
      } else {
        setSuccess('Nessuna modifica da salvare');
      }
      setEditingRow(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore salvataggio modifiche');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Backdrop>
      <Modal>
        <Header>
          <Title>Gestione utenti</Title>
          <Button variant="secondary" size="small" onClick={onClose}>Chiudi</Button>
        </Header>
        <Body>
          {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
          {success && <div style={{ color: '#065f46', marginBottom: 8 }}>{success}</div>}
          {loading ? (
            <div>Caricamento...</div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const active = typeof u.is_active === 'number' ? u.is_active === 1 : !!u.is_active;
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        {editingRow === u.id ? (
                          <Input
                            value={emailEdits[u.id] ?? u.email}
                            onChange={e => setEmailEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                            placeholder="email"
                          />
                        ) : (
                          <span>{u.email}</span>
                        )}
                      </td>
                      <td>
                        {editingRow === u.id ? (
                          <InlineForm>
                            <select
                              value={roleEdits[u.id] ?? (u.role as 'admin' | 'cook' | 'waiter')}
                              onChange={e => setRoleEdits(prev => ({ ...prev, [u.id]: e.target.value as 'admin' | 'cook' | 'waiter' }))}
                              style={{ padding: '5px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
                            >
                              <option value="admin">Admin</option>
                              <option value="cook">Cuoco</option>
                              <option value="waiter">Cameriere</option>
                            </select>
                          </InlineForm>
                        ) : (
                          <span>{(u.role === 'admin' && 'Admin') || (u.role === 'cook' && 'Cuoco') || (u.role === 'waiter' && 'Cameriere')}</span>
                        )}
                      </td>
                      <td><StatusBadge $active={active}>{active ? 'Attivo' : 'Disattivo'}</StatusBadge></td>
                      <td>
                        <RowActions>
                          {editingRow === u.id ? (
                            <>
                              <Button size="small" onClick={() => saveRow(u)}>Salva</Button>
                              <Button variant="secondary" size="small" onClick={() => setEditingRow(null)}>Annulla</Button>
                            </>
                          ) : (
                            <Button size="small" onClick={() => { setEditingRow(u.id); setEmailEdits(prev => ({ ...prev, [u.id]: u.email })); setRoleEdits(prev => ({ ...prev, [u.id]: u.role as 'admin' | 'cook' | 'waiter' })); }}>Modifica</Button>
                          )}
                          <Button variant="secondary" size="small" onClick={() => toggleActive(u)}>
                            {active ? 'Disattiva' : 'Attiva'}
                          </Button>
                          <InlineForm>
                            <Input
                              type="password"
                              value={passwordEdits[u.id] ?? ''}
                              onChange={e => setPasswordEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                              placeholder="Nuova password"
                            />
                            <Button size="small" onClick={() => savePassword(u)}>Imposta</Button>
                          </InlineForm>
                        </RowActions>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Body>
      </Modal>
    </Backdrop>
  );
};

export default AdminUsersModal;