import { Err, ErrImpl, Ok, OkImpl, Result } from '../../../src/index.js';
import { eq } from '../../util.js';

describe('Ok.isOk', () => {
    test('should return true when Ok object invokes isOk.', () => {
        const ok = Ok(34);
        expect(ok).toBeInstanceOf(OkImpl);
        expect(ok).not.toBeInstanceOf(ErrImpl);
        expect(ok.isOk()).toBe(true);
        expect(ok).toMatchResult(Ok(34));
        eq<typeof ok, Result<number, never>>(true);
    });
});

describe('Err.isOk', () => {
    test('should return false when Err object invokes isOk', () => {
        const err = Err(34);
        expect(err).toBeInstanceOf(ErrImpl);
        expect(err).not.toBeInstanceOf(OkImpl);
        expect(err.isOk()).toBe(false);
        expect(err).toMatchResult(Err(34));
        eq<typeof err, Result<never, number>>(true);
    });
});
