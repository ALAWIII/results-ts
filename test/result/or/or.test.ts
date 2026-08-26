import { Err, Ok, Result } from '../../../src';
import { eq } from '../../util';

describe('Ok.or', () => {
    test('should successfully return the original Ok value, discarding the provided Ok.', () => {
        const ok = Ok(90);
        const orOk = ok.or(Ok(123));
        expect(orOk).toMatchResult(Ok(90));
        expect(orOk).not.toMatchResult(Ok(123));
        eq<typeof orOk, Result<number, never>>(true);
    });

    test('should successfully return the original Ok value, discarding the provided Err.', () => {
        const ok = Ok<number, string>(90);
        const orErr = ok.or(Err('ignored error'));
        expect(orErr).toMatchResult(Ok(90));
        expect(orErr).not.toMatchResult(Err('ignored error'));
        eq<typeof orErr, Result<number, string>>(true);
    });
});

describe('Err.or', () => {
    test('should successfully return the provided Ok value.', () => {
        const err = Err<number, string>(90);
        const orOk = err.or(Ok('hello'));
        expect(orOk).toMatchResult(Ok('hello'));
        expect(orOk).not.toMatchResult(Err(90));
        eq<typeof orOk, Result<string, never>>(true);
    });

    test('should successfully return the provided Err value.', () => {
        const err = Err(90);
        const orErr = err.or(Err('new error'));
        expect(orErr).toMatchResult(Err('new error'));
        expect(orErr).not.toMatchResult(Err(90));
        eq<typeof orErr, Result<never, string>>(true);
    });
});
