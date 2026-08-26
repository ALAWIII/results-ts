import { Err, Ok } from '../../../src';

describe('Ok.expect()', () => {
    test('it should return the value of an Ok and not throw error.', () => {
        const ok = Ok(312);
        expect(ok.expect('hello')).toBe(312);
    });
});
describe('Err.expect()', () => {
    test('it should throw error when invoking expect on Err', () => {
        const err = Err(312);
        try {
            err.expect('Fail with message');
        } catch (e) {
            expect(e).toEqual(new Error('Fail with message: 312'));
        }
    });
});
