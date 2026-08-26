import { Err, Ok } from '../../../src/index.js';

describe('Err.isErrAnd', () => {
    test('should return true because its Err and the closure evaluates to true.', () => {
        const err = Err(34);
        expect(err.isErrAnd((v: number) => v === 34)).toBe(true);
    });
    test('should return false because the closure itself returns false.', () => {
        const err = Err(34);
        expect(err.isErrAnd((v: number) => v > 50)).toBe(false);
    });
});

describe('Ok.isErrAnd', () => {
    test('should return false because ok is Ok not Err, descards the value of closure.', () => {
        const ok = Ok(34);
        expect(ok.isErrAnd((v: number) => v === 34)).toBe(false);
    });
    test('should return false because ok is Ok not Err.', () => {
        const ok = Ok(34);
        expect(ok.isErrAnd((v: number) => v > 34)).toBe(false);
    });
});
