import { Err, None, Ok, Option, Result, Some } from '../../../src';
import { eq } from '../../util';

describe('Ok.transpose', () => {
    test('should success transpose Ok(Some(number)) -> Some(Ok(number))', () => {
        const ok = Ok(Some(90));
        const okTransposed = ok.transpose();
        expect(okTransposed.unwrap()).toMatchResult(Ok(90));
        expect(okTransposed.isSome()).toBe(true);
        eq<typeof okTransposed, Option<Result<number, never>>>(true);
    });
    test('should success transpose Ok(None) -> None', () => {
        const ok = Ok(None<number>());
        const okTransposed = ok.transpose();
        expect(okTransposed).toMatchOption(None<number>());
        expect(okTransposed.isNone()).toBe(true);
        eq<typeof okTransposed, Option<Result<number, never>>>(true);
    });
    test('should success transpose Ok(v) -> Some(Ok(v)) where v isnt an option.', () => {
        const ok = Ok(5);
        const okTransposed = ok.transpose();
        expect(okTransposed).toMatchOption(Some(Ok(5)));
        expect(okTransposed.isSome()).toBe(true);
        eq<typeof okTransposed, Option<Result<number, never>>>(true);
    });
    test('should success transpose Ok(Some(v)) -> Some(Ok(v)) -> Ok(Some(v)) -> Some(Ok(v)) back and forth multiple times should preserve types.', () => {
        const ok1 = Ok<Some<number>, string>(Some(5));
        const someTransposed1 = ok1.transpose();
        const okTransposed2 = someTransposed1.transpose();
        const someTransposed2 = okTransposed2.transpose();

        //===
        expect(someTransposed1).toMatchOption(Some(Ok(5)));
        expect(someTransposed1).toMatchOption(someTransposed2);
        //===
        expect(okTransposed2).toMatchResult(Ok(Some(5)));
        expect(okTransposed2).toMatchResult(ok1);

        //===
        eq<typeof okTransposed2, Result<Option<number>, string>>(true);
        eq<typeof okTransposed2, typeof ok1>(true);
        //===
        eq<typeof someTransposed1, Option<Result<number, string>>>(true);
        eq<typeof someTransposed2, typeof someTransposed1>(true);
    });
});

describe('Err.transpose', () => {
    test('should success transpose Err(v) -> Some(Err(v)) where v must not be an option.', () => {
        const err = Err(5);
        const errTransposed = err.transpose();
        expect(errTransposed).toMatchOption(Some(Err(5)));
        expect(errTransposed.isSome()).toBe(true);
        eq<typeof errTransposed, Option<Result<never, number>>>(true);
    });

    test('should success transpose Err(v) -> Some(Err(v)) -> Err(Some(v)) -> Some(Err(v)) back and forth multiple times should preserve types.', () => {
        const err1 = Err<string, Option<number>>('error');
        const someTransposed1 = err1.transpose();
        const errTransposed2 = someTransposed1.transpose();
        const someTransposed2 = errTransposed2.transpose();

        //===
        expect(someTransposed1).toMatchOption(Some(Err('error')));
        expect(someTransposed1).toMatchOption(someTransposed2);
        //===
        expect(errTransposed2).toMatchResult(Err('error'));
        expect(errTransposed2).toMatchResult(err1);

        //===
        eq<typeof errTransposed2, Result<Option<number>, string>>(true);
        eq<typeof errTransposed2, typeof err1>(true);
        //===
        eq<typeof someTransposed1, Option<Result<number, string>>>(true);
        eq<typeof someTransposed2, typeof someTransposed1>(true);
    });
});
