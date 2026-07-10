import { listWorkspaces, upsertWorkspace } from '../services/workspace.js';

export function registerWorkspaceHandlers(socket: any) {
  const teamId: string | undefined = socket.data?.teamId;
  if (!teamId) return;

  void listWorkspaces(teamId).then((workspaces) => {
    socket.emit('workspace:snapshot', { workspaces });
  });

  socket.on('workspace:sync', async () => {
    const workspaces = await listWorkspaces(teamId);
    socket.emit('workspace:snapshot', { workspaces });
  });

  socket.on('workspace:update', async (payload: any) => {
    if (!payload?.problemId) return;
    const saved = await upsertWorkspace(teamId, payload);
    socket.emit('workspace:saved', saved);
  });
}
