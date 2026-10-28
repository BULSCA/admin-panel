import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordInput from '@/components/PasswordInput.vue';

describe('password input', () => {
    it('keeps entered text while toggling visibility and exposes an accessible action', async () => {
        const wrapper = mount(PasswordInput, {
            attrs: {
                modelValue: 'example-password',
                name: 'password',
                autocomplete: 'current-password',
            },
        });
        const input = wrapper.get('input');
        expect(input.attributes('type')).toBe('password');
        expect(input.attributes('name')).toBe('password');
        expect(input.attributes('autocomplete')).toBe('current-password');
        await wrapper
            .get('button[aria-label="Show password"]')
            .trigger('click');
        expect(input.attributes('type')).toBe('text');
        expect((input.element as HTMLInputElement).value).toBe(
            'example-password',
        );
        await wrapper
            .get('button[aria-label="Hide password"]')
            .trigger('click');
        expect(input.attributes('type')).toBe('password');
        expect((input.element as HTMLInputElement).value).toBe(
            'example-password',
        );
        expect(wrapper.get('button').attributes('type')).toBe('button');
        wrapper.unmount();
    });

    it('forwards field validation and disabled attributes to the native input', () => {
        const wrapper = mount(PasswordInput, {
            attrs: {
                disabled: true,
                required: true,
                'aria-invalid': 'true',
                'aria-describedby': 'password-error',
            },
        });
        const input = wrapper.get('input');
        expect(input.attributes('disabled')).toBeDefined();
        expect(input.attributes('required')).toBeDefined();
        expect(input.attributes('aria-invalid')).toBe('true');
        expect(input.attributes('aria-describedby')).toBe('password-error');
        wrapper.unmount();
    });
});
