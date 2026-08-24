import { getMemory, updateMemory } from './memory-manager.js';
import { getMemoryChangeRequests, resolveMemoryChangeRequest, CHANGE_REQUEST_STATUS } from './memory-change-requests.js';

export function approveMemoryChange(project, requestId) {
  const request = getMemoryChangeRequests(project, { status: CHANGE_REQUEST_STATUS.PENDING })
    .find(item => item.id === requestId);

  if (!request) return null;

  const memory = getMemory(project, request.memoryId);
  if (!memory) {
    resolveMemoryChangeRequest(requestId, CHANGE_REQUEST_STATUS.CANCELLED);
    return null;
  }

  const updated = updateMemory(request.memoryId, request.proposedChanges, 'user');
  if (!updated) return null;

  return resolveMemoryChangeRequest(requestId, CHANGE_REQUEST_STATUS.APPROVED);
}

export function rejectMemoryChange(requestId) {
  return resolveMemoryChangeRequest(requestId, CHANGE_REQUEST_STATUS.REJECTED);
}

export function cancelMemoryChange(requestId) {
  return resolveMemoryChangeRequest(requestId, CHANGE_REQUEST_STATUS.CANCELLED);
}
