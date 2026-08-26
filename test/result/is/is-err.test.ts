import { Err, ErrImpl, Ok, OkImpl, Result } from '../../../src/index.js';
import { eq } from '../../util.js';

describe('Err.isErr', () => {
    test('should return true when Err object invokes isErr', () => {
        const err = Err(34);
        expect(err).toBeInstanceOf(ErrImpl);
        expect(err).not.toBeInstanceOf(OkImpl);
        expect(err.isErr()).toBe(true);
        expect(err).toMatchResult(Err(34));
        eq<typeof err, Result<never, number>>(true);
    });
});

describe('Ok.isErr', () => {
    test('should return false when Ok object invokes isErr.', () => {
        const ok = Ok(34);
        expect(ok).toBeInstanceOf(OkImpl);
        expect(ok).not.toBeInstanceOf(ErrImpl);
        expect(ok.isErr()).toBe(false);
        expect(ok).toMatchResult(Ok(34));
        eq<typeof ok, Result<number, never>>(true);
    });
});
