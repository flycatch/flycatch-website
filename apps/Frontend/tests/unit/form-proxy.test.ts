import { describe, expect, it } from 'vitest';
import {
  conversionEvent,
  fieldErrorsFromBody,
  messageKeyForField,
  safeReturnTo,
} from '../../src/lib/form-proxy';

describe('form proxy helpers', () => {
  it('maps backend field errors to message keys', () => {
    expect(messageKeyForField('public.bot_detected')).toBe('form.error.bot');
    expect(
      fieldErrorsFromBody({
        detail: { fields: { email: { message_key: 'admin.field.invalid' } } },
      }),
    ).toEqual({ email: 'form.error.invalid' });
  });

  it('rejects unsafe return paths', () => {
    expect(safeReturnTo('https://evil.example/phish', '/contact-us')).toBe('/contact-us');
    expect(safeReturnTo('//evil.example', '/')).toBe('/');
    expect(safeReturnTo('/company/resources', '/')).toBe('/company/resources');
  });

  it('emits conversion events without personal data', () => {
    const event = conversionEvent('contact', { contact_type: 'GENERAL_ENQUIRY' });
    expect(event).toEqual({
      event: 'form_submit',
      form_id: 'contact',
      contact_type: 'GENERAL_ENQUIRY',
    });
    expect(JSON.stringify(event)).not.toMatch(/@|phone|name/i);
  });
});
