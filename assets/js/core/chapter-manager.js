import { newId, updateProject } from '../storage.js';

export function createChapter(title = 'Untitled Chapter') {
  const chapter = {
    id: newId('chapter'),
    title,
    content: '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.chapters.push(chapter);
  });

  return chapter;
}

export function updateChapter(chapterId, changes = {}) {
  let updated = null;

  updateProject(project => {
    const chapter = project.chapters.find(item => item.id === chapterId);
    if (!chapter) return;

    Object.assign(chapter, changes, {
      updatedAt: new Date().toISOString()
    });
    updated = chapter;
  });

  return updated;
}

export function setActiveChapter(chapterId) {
  let projectResult = null;

  updateProject(project => {
    const exists = project.chapters.some(chapter => chapter.id === chapterId);
    if (!exists) return;

    project.activeChapterId = chapterId;
    projectResult = project;
  });

  return projectResult;
}

export function getActiveChapter(project) {
  if (!project) return null;
  return project.chapters?.find(chapter => chapter.id === project.activeChapterId) || null;
}
