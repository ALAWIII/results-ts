import { Err, Ok } from '../../../src/index.js';

describe('Ok.isOkAnd', () => {
    test('should return true because ok is Ok and value of closure is true.', () => {
        const ok = Ok(34);
        expect(ok.isOkAnd((v: number) => v === 34)).toBe(true);
    });
    test('should return false.', () => {
        const ok = Ok(34);
        expect(ok.isOkAnd((v: number) => v > 34)).toBe(false);
    });
});

describe('Err.isOkAnd', () => {
    test('should return true even if the closure is true.', () => {
        const err = Err(34);
        expect(err.isOkAnd((v: number) => true)).toBe(false);
    });
    test('should return false regardless the value of the closure.', () => {
        const err = Err(34);
        expect(err.isOkAnd((v: number) => false)).toBe(false);
    });
});
