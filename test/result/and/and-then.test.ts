import { Err, Ok, Result } from '../../../src';
import { eq } from '../../util';

describe('Ok.andThen', () => {
    test('should successfully return the mapped Result value.', () => {
        const ok = Ok(90);
        const andThenOk = ok.andThen((n) => Ok(`${n} is a number`));
        expect(andThenOk).toMatchResult(Ok('90 is a number'));
        expect(andThenOk).not.toMatchResult(Ok(90));
        eq<typeof andThenOk, Result<string, never>>(true);
    });

    test('should successfully return the mapped Err value.', () => {
        const ok = Ok<number, string>(90);
        const andThenErr = ok.andThen((n) => Err(`error for ${n}`));
        expect(andThenErr).toMatchResult(Err('error for 90'));
        expect(andThenErr).not.toMatchResult(Ok(90));
        eq<typeof andThenErr, Result<never, string>>(true);
    });
});

describe('Err.andThen', () => {
    test('should successfully discard the provided Ok mapper result.', () => {
        const err = Err(90);
        const andThenOk = err.andThen((n) => Ok('hello'));
        expect(andThenOk).toMatchResult(Err(90));
        expect(andThenOk).not.toMatchResult(Ok('hello'));
        eq<typeof andThenOk, Result<string, number>>(true);
    });

    test('should successfully discard the provided Err mapper result.', () => {
        const err = Err(90);
        const andThenErr = err.andThen((n) => Err(50));
        expect(andThenErr).toMatchResult(Err(90));
        expect(andThenErr).not.toMatchResult(Err(50));
        eq<typeof andThenErr, Result<never, number>>(true);
    });
});
