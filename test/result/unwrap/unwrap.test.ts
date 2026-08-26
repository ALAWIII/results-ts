import { Err, Ok } from '../../../src';

describe('Ok.unwrap()', () => {
    test('it should return the value of an Ok', () => {
        const ok = Ok(312);
        expect(ok.unwrap()).toBe(312);
    });
});
describe('Err.unwrap()', () => {
    test('it should throw error when unwrapping Err', () => {
        const err = Err(312);
        try {
            err.unwrap();
        } catch (e) {
            expect(e).toBe(312);
        }
    });
});
