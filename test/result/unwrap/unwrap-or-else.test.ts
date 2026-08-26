import { Err, Ok } from '../../../src';

describe('Ok.unwrapOrElse()', () => {
    test('it should return the original value of an Ok and discards the provided closure.', () => {
        const ok = Ok(312).unwrapOrElse((v) => 234);
        expect(ok).toBe(312);
        expect(ok).not.toBe(234);
    });
});
describe('Err.unwrapOrElse()', () => {
    test('it should return the value evaluated by the closure', () => {
        const err = Err<number, number>(32).unwrapOrElse((v) => v + 1);
        expect(err).toBe(33);
        expect(err).not.toBe(32);
    });
});
