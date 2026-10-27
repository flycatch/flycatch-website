import { describe, expect, it } from 'vitest';
import {
  attachmentFor,
  friendlyError,
  isShown,
  shapeAnswers,
  shapeStandard,
} from '../../src/lib/careers-form';

describe('shapeStandard', () => {
  it('sends the numeric standard fields as numbers and trims the rest', () => {
    expect(
      shapeStandard({ name: ' Imran Khan ', exp: '6', ctc: '96000', skills: 'AutoCAD', company: '  ' }),
    ).toEqual({ name: 'Imran Khan', exp: 6, ctc: 96000, skills: 'AutoCAD' });
  });
});

describe('shapeAnswers', () => {
  it('keeps numbers numeric, multi-selects as arrays, and drops empty and file answers', () => {
    expect(
      shapeAnswers([
        { id: 'gcc', type: 'number', value: '4' },
        { id: 'edu', type: 'select', value: 'B.Tech / B.E.' },
        { id: 'tags', type: 'multiselect', value: ['a', 'b'] },
        { id: 'none', type: 'multiselect', value: [] },
        { id: 'blank', type: 'text', value: '  ' },
        { id: 'cv', type: 'file', value: 'x' },
      ]),
    ).toEqual({ gcc: 4, edu: 'B.Tech / B.E.', tags: ['a', 'b'] });
  });
});

describe('attachmentFor', () => {
  it('marks identity documents so interviewers never see them', () => {
    expect(attachmentFor('Iqama copy', 'iqamaScan')).toEqual({ field: 'iqamaScan', kind: 'Iqama copy', identity: true });
    expect(attachmentFor('Portfolio', 'work')).toEqual({ field: 'work', kind: 'Portfolio' });
  });
});

describe('isShown', () => {
  it('shows a question only when its condition holds', () => {
    expect(isShown(undefined, undefined)).toBe(true);
    expect(isShown({ field: 'inKsa', equals: 'Yes' }, 'Yes')).toBe(true);
    expect(isShown({ field: 'inKsa', equals: 'Yes' }, 'No')).toBe(false);
    expect(isShown({ field: 'inKsa', equals: 'Yes' }, undefined)).toBe(false);
    expect(isShown({ field: 'tags', equals: 'a' }, ['a', 'b'])).toBe(true);
  });
});

describe('friendlyError', () => {
  it('maps each stable code to wording and carries field messages through', () => {
    expect(friendlyError({ status: 422, code: 'VALIDATION_FAILED', fields: { exp: 'Too high' } }).fields).toEqual({ exp: 'Too high' });
    expect(friendlyError({ status: 409, code: 'ALREADY_APPLIED' }).alreadyApplied).toBe(true);
    expect(friendlyError({ status: 429, code: 'RATE_LIMITED', retryAfterSeconds: 90 }).message).toContain('2 minutes');
    expect(friendlyError({ status: 413 }).message).toContain('25 MB');
    expect(friendlyError({ status: 0 }).message).toContain('Something went wrong');
  });
});
