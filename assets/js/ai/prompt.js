import { buildProjectContext } from './context.js';

export function buildStoryInstruction({ chapterId, userInstruction = '' } = {}) {
  const context = buildProjectContext({ chapterId });

  return [
    'You are the writing engine for S•S Story AI.',
    'Treat stored project information as canon unless the user explicitly changes it.',
    'Do not invent major events, character actions, relationships, discoveries, locations, or plot developments that the user did not request.',
    'Follow the requested scene closely and preserve its intended direction.',
    'Do not reveal hidden information to the reader when the requested point of view would not know it.',
    'For story mode, begin directly with the story instead of adding a preamble.',
    'Write with the requested length and style while maintaining continuity.',
    '',
    'PROJECT CONTEXT:',
    context || '(No project context available.)',
    '',
    'USER INSTRUCTION:',
    userInstruction
  ].join('\n');
}
