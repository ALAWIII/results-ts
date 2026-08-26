import { Err, Ok, Result } from '../../../src';
import { eq } from '../../util';

describe('Ok.orElse', () => {
    test('should successfully return the original Ok value, ignoring the mapper.', () => {
        const ok = Ok(90);
        const orElseOk = ok.orElse((e) => {
            // This should never be called for Ok
            throw new Error('orElse mapper should not be called for Ok');
        });
        expect(orElseOk).toMatchResult(Ok(90));
        eq<typeof orElseOk, Result<number, unknown>>(true);
    });

    test('should successfully return the original Ok value even when mapper returns Err.', () => {
        const ok = Ok<number, string>(90);
        const orElseErr = ok.orElse((e) => Err(`error: ${e}`));
        expect(orElseErr).toMatchResult(Ok(90));
        expect(orElseErr).not.toMatchResult(Err('error: something'));
        eq<typeof orElseErr, Result<number, string>>(true);
    });
});

describe('Err.orElse', () => {
    test('should successfully return the mapped Ok value.', () => {
        const err = Err<string, string>('original error');
        const orElseOk = err.orElse((e) => Ok(`recovered from ${e}`));
        expect(orElseOk).toMatchResult(Ok('recovered from original error'));
        expect(orElseOk).not.toMatchResult(Err('original error'));
        eq<typeof orElseOk, Result<string, never>>(true);
    });

    test('should successfully return the mapped Err value.', () => {
        const err = Err('original error');
        const orElseErr = err.orElse((e) => Err(`new error: ${e}`));
        expect(orElseErr).toMatchResult(Err('new error: original error'));
        expect(orElseErr).not.toMatchResult(Err('original error'));
        eq<typeof orElseErr, Result<never, string>>(true);
    });

    test('should call the mapper with the original error value.', () => {
        const err = Err<number, string>(123);
        let captured: unknown;
        err.orElse((e) => {
            captured = e;
            return Ok('ignored');
        });
        expect(captured).toBe(123);
    });
});
