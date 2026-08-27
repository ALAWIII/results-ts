import { Err, None, Ok, Option, Result, Some } from '../../src';
import { eq } from '../util';

describe('Some.transpose', () => {
    test('should successfully transpose Some(Ok(v)) -> Ok(Some(v)).', () => {
        const some = Some(Ok(4));
        const someTransposed = some.transpose();
        expect(someTransposed).toMatchResult(Ok(Some(4)));
        expect(someTransposed.unwrap().unwrap()).toBe(4);
        eq<typeof someTransposed, Result<Option<number>, never>>(true);
    });

    test('should successfully transpose Some(Err(v)) -> Err(v).', () => {
        const some = Some(Err('error'));
        const someTransposed = some.transpose();
        expect(someTransposed).toMatchResult(Err('error'));
        eq<typeof someTransposed, Result<Option<never>, string>>(true);
    });

    test('should successfully transpose Some(non-Result) -> Ok(Some(v)).', () => {
        const some = Some(42);
        const someTransposed = some.transpose();
        expect(someTransposed).toMatchResult(Ok(Some(42)));
        eq<typeof someTransposed, Result<Option<number>, never>>(true);
    });
});

describe('None.transpose', () => {
    test('should successfully transpose None -> None (no-op).', () => {
        const none = None<number>();
        const noneTransposed = none.transpose();
        expect(noneTransposed).toMatchResult(Ok(None()));
        expect(noneTransposed.isOk()).toBe(true);
        expect(noneTransposed.unwrap()).toEqual(None());
        eq<typeof noneTransposed, Result<Option<number>, never>>(true);
    });

    test('should preserve type when transposing None multiple times.', () => {
        const none = None<string>();
        const noneTransposed1 = none.transpose();
        const noneTransposed2 = noneTransposed1.transpose();
        const noneTransposed3 = noneTransposed2.transpose();
        //===
        expect(noneTransposed2).toMatchOption(None());
        eq<typeof noneTransposed2, Option<Result<string, never>>>(true);
        expect(noneTransposed2.isNone()).toBe(true);

        //===
        expect(noneTransposed1).toMatchResult(Ok(None()));
        expect(noneTransposed1.isOk()).toBe(true);

        expect(noneTransposed3).toMatchResult(noneTransposed1);
        eq<typeof noneTransposed1, Result<Option<string>, never>>(true);
        eq<typeof noneTransposed3, typeof noneTransposed1>(true);
    });
});
