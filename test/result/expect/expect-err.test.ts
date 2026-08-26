import { Err, Ok } from '../../../src';

describe('Err.expectErr', () => {
    test('it should return the value of an Err and not throw error', () => {
        const err = Err(312);
        expect(err.expectErr('hello')).toBe(312);
    });
});
describe('Ok.expectErr', () => {
    test('it should throw the value of an Ok with custom message when attempt to call expectErr on Ok.', () => {
        const ok = Ok(312);

        try {
            ok.expectErr('Fail with message');
        } catch (e) {
            expect(e).toEqual(new Error('Fail with message: 312'));
        }
    });
});
