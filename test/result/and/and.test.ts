import { Err, Ok, Result } from '../../../src';
import { eq } from '../../util';
describe('Ok.and', () => {
    test('should successfully return the provided value.', () => {
        const ok = Ok(90);
        const andOk = ok.and(Ok('hello'));
        expect(andOk).toMatchResult(Ok('hello'));
        expect(andOk).not.toMatchResult(Ok(90));
        eq<typeof andOk, Result<string, never>>(true);
    });
    test('should successfully return the provided Err value.', () => {
        const ok = Ok<number, string>(90);
        const andErr = ok.and(Err('hello'));
        expect(andErr).toMatchResult(Err('hello'));
        expect(andErr).not.toMatchResult(Ok(90));
        eq<typeof andErr, Result<never, string>>(true);
    });
});
describe('Err.and', () => {
    test('should successfully discard the provided Ok value.', () => {
        const err = Err(90);
        const andOk = err.and(Ok('hello'));
        expect(andOk).toMatchResult(Err(90));
        expect(andOk).not.toMatchResult(Ok('hello'));
        eq<typeof andOk, Result<string, number>>(true);
    });
    test('should successfully discard the provided Err value.', () => {
        const err = Err(90);
        const andErr = err.and(Err(50));
        expect(andErr).toMatchResult(Err(90));
        expect(andErr).not.toMatchResult(Err(50));
        eq<typeof andErr, Result<never, number>>(true);
    });
});
