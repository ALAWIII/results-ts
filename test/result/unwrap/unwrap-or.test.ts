import { Err, Ok } from '../../../src';

describe('Ok.unwrapOr', () => {
    test('it should return the original value of an Ok and discards the provided one.', () => {
        const ok = Ok(312).unwrapOr(234);
        expect(ok).toBe(312);
        expect(ok).not.toBe(234);
    });
});
describe('Err.unwrapOr', () => {
    test('it should return the provided value as fallback.', () => {
        const err = Err<number, number>(32).unwrapOr(234);
        expect(err).toBe(234);
        expect(err).not.toBe(32);
    });
});
