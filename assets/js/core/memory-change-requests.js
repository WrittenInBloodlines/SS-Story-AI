import { newId, updateProject } from '../storage.js';
import { canModifyMemory, requiresConfirmation } from './memory-policy.js';

export const CHANGE_REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
});

export function createMemoryChangeRequest(memory, changes = {}, actor = 'ai', reason = '') {
  if (!memory || actor !== 'ai' || !canModifyMemory(memory, actor, 'update')) return null;
  if (!requiresConfirmation(memory, actor)) return null;

  const request = {
    id: newId('memory_change_request'),
    memoryId: memory.id,
    proposedChanges: changes,
    reason: reason || 'The AI proposed a memory change.',
    status: CHANGE_REQUEST_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };

  updateProject(project => {
    project.memoryChangeRequests.push(request);
  });

  return request;
}

export function getMemoryChangeRequests(project, filters = {}) {
  if (!project) return [];

  return (project.memoryChangeRequests || []).filter(request => {
    if (filters.memoryId && request.memoryId !== filters.memoryId) return false;
    if (filters.status && request.status !== filters.status) return false;
    return true;
  });
}

export function resolveMemoryChangeRequest(requestId, status) {
  if (![CHANGE_REQUEST_STATUS.APPROVED, CHANGE_REQUEST_STATUS.REJECTED, CHANGE_REQUEST_STATUS.CANCELLED].includes(status)) {
    return null;
  }

  let resolved = null;

  updateProject(project => {
    const request = project.memoryChangeRequests?.find(item => item.id === requestId);
    if (!request || request.status !== CHANGE_REQUEST_STATUS.PENDING) return;

    request.status = status;
    request.resolvedAt = new Date().toISOString();
    resolved = request;
  });

  return resolved;
}
