import {
    Err,
    ErrImpl,
    None,
    Ok,
    OkImpl,
    Option,
    Result,
    ResultErrEntry,
    ResultErrType,
    ResultErrTypes,
    ResultErrTypesRecord,
    ResultOkType,
    ResultOkTypes,
    ResultOkTypesRecord,
    Some,
} from '../src/index.js';
import { eq, notSupposedToBeCalled } from './util.js';

test('ErrImpl<E> | OkImpl<T> should be Result<T, E>', () => {
    const r1 = Err(0);
    const r2 = Ok('');
    const r = Math.random() ? r1 : r2;

    expect(Result.isResult(r1)).toEqual(true);
    expect(Result.isResult(r2)).toEqual(true);
    expect(Result.isResult(Some(3))).toEqual(false);
    eq<typeof r, Result<string, number>>(true);
});

test('Type can be narrowed using ok & err', () => {
    const r1 = Ok(0) as Result<number, string>;
    if (r1.isOk()) {
        eq<OkImpl<number>, typeof r1>(true);
    } else {
        eq<ErrImpl<string>, typeof r1>(true);
    }

    if (r1.isErr()) {
        eq<ErrImpl<string>, typeof r1>(true);
    } else {
        eq<OkImpl<number>, typeof r1>(true);
    }
});

test('map', () => {
    const r = Err(0) as Result<string, number>;
    const r2 = r.map(Symbol);
    eq<typeof r2, Result<symbol, number>>(true);
});

test('andThen', () => {
    const result = Ok('Ok') as Result<string, boolean>;
    const then = result.andThen(() => Err('broke') as Result<boolean, string>);
    expect(then).toMatchResult(Err('broke'));
    function takesResult(result: Result<boolean, string | boolean>): void {}
    takesResult(then);
});

test('mapErr', () => {
    const r = Err(0) as Result<string, number>;
    const r2 = r.mapErr(Symbol);
    eq<typeof r2, Result<string, symbol>>(true);
});

test('Iterable', () => {
    const r1 = Ok([true, false]) as Result<boolean[], number>;
    const r1Iter = r1[Symbol.iterator]();
    eq<Iterator<boolean[]>, typeof r1Iter>(true);

    const r2 = Ok(32) as Result<number, string>;
    const r2Iter = r2[Symbol.iterator]();
    eq<Iterator<number>, typeof r2Iter>(true);
});

test('ResultOkType', () => {
    type a = ResultOkType<OkImpl<string>>;
    eq<string, a>(true);
    type b = ResultOkType<ErrImpl<string>>;
    eq<never, b>(true);
    type c = ResultOkType<Result<string, number>>;
    eq<string, c>(true);
});

test('ResultErrType', () => {
    type a = ResultErrType<OkImpl<string>>;
    eq<never, a>(true);
    type b = ResultErrType<ErrImpl<string>>;
    eq<string, b>(true);
    type c = ResultErrType<Result<string, number>>;
    eq<number, c>(true);
});

test('ResultOkTypes & ResultErrTypes', () => {
    type a = ResultOkTypes<
        [OkImpl<string>, ErrImpl<string>, Result<symbol, number>, Result<never, string>, OkImpl<32> | ErrImpl<boolean>]
    >;
    eq<[string, never, symbol, never, 32], a>(true);

    type b = ResultErrTypes<
        [OkImpl<string>, ErrImpl<string>, Result<symbol, number>, Result<never, symbol>, OkImpl<boolean> | ErrImpl<32>]
    >;
    eq<[never, string, number, symbol, 32], b>(true);
});

test('ResultOkTypesRecord & ResultErrTypesRecord', () => {
    type a = ResultOkTypesRecord<{ x: OkImpl<string>; y: ErrImpl<string>; z: Result<symbol, number> }>;
    eq<{ x: string; y: never; z: symbol }, a>(true);

    type b = ResultErrTypesRecord<{ x: OkImpl<string>; y: ErrImpl<string>; z: Result<symbol, number> }>;
    eq<{ x: never; y: string; z: number }, b>(true);
});

test('Result.all', () => {
    const ok0 = Ok(3);
    const ok1 = Ok(true);
    const ok2 = Ok(8 as const) as Result<8, boolean>;
    const err0 = Err(Symbol());
    const err1 = Err(Error());
    const err2 = Err(9 as const) as Result<boolean, 9>;

    const all0_array = Result.all([]);
    expect(all0_array).toMatchResult(Ok([]));
    eq<typeof all0_array, Result<[], never>>(true);

    const all1Array = Result.all([ok0, ok1]);
    expect(all1Array).toMatchResult(Ok([3, true]));
    eq<typeof all1Array, Result<[number, boolean], never>>(true);

    const all2Array = Result.all([err0, err1]);
    expect(all2Array).toMatchResult(Err(err0.error));
    eq<typeof all2Array, Result<[never, never], symbol | Error>>(true);

    const all3Array = Result.all([] as Result<string, number>[]);
    eq<typeof all3Array, Result<string[], number>>(true);

    const all4Array = Result.all([ok0, ok1, ok2, err2]);
    expect(all4Array).toMatchResult(Err(9));
    eq<typeof all4Array, Result<[number, boolean, 8, boolean], boolean | 9>>(true);
});

test('Result.all with object', () => {
    const sym = Symbol();
    const error = Error();
    const ok0 = Ok(3) as Result<number, string>;
    const ok1 = Ok(true) as Result<boolean, number>;
    const err0 = Err(sym) as Result<string, symbol>;
    const err1 = Err(error) as Result<number, Error>;

    // Empty object
    const all0 = Result.all({});
    expect(all0).toMatchResult(Ok({}));
    eq<typeof all0, Result<{}, never>>(true);

    const all0AllErrors = Result.all({}, { errors: 'all' });
    expect(all0AllErrors).toMatchResult(Ok({}));
    eq<typeof all0AllErrors, Result<{}, Partial<{}>>>(true);

    // All Ok
    const all1 = Result.all({ a: ok0, b: ok1 });
    expect(all1).toMatchResult(Ok({ a: 3, b: true }));
    eq<typeof all1, Result<{ a: number; b: boolean }, { key: 'a'; error: string } | { key: 'b'; error: number }>>(true);

    const all1KnownOk = Result.all({ a: Ok(3), b: Ok(true) });
    expect(all1KnownOk).toMatchResult(Ok({ a: 3, b: true }));
    eq<typeof all1KnownOk, Result<{ a: number; b: boolean }, never>>(true);

    const all1AllErrors = Result.all({ a: ok0, b: ok1 }, { errors: 'all' });
    expect(all1AllErrors).toMatchResult(Ok({ a: 3, b: true }));
    eq<typeof all1AllErrors, Result<{ a: number; b: boolean }, Partial<{ a: string; b: number }>>>(true);

    // All Err
    const all2 = Result.all({ a: err0, b: err1 });
    expect(all2).toMatchResult(
        Err({
            key: 'a',
            error: sym,
        }),
    );
    eq<typeof all2, Result<{ a: string; b: number }, { key: 'a'; error: symbol } | { key: 'b'; error: Error }>>(true);

    const all2AllErrors = Result.all({ a: err0, b: err1 }, { errors: 'all' });
    expect(all2AllErrors).toMatchResult(
        Err({
            a: sym,
            b: error,
        }),
    );
    eq<typeof all2AllErrors, Result<{ a: string; b: number }, Partial<{ a: symbol; b: Error }>>>(true);

    // Mixed
    const all3 = Result.all({ a: ok0, b: err0, c: ok1, d: err1 });
    expect(all3).toMatchResult(
        Err({
            key: 'b',
            error: sym,
        }),
    );
    eq<
        typeof all3,
        Result<
            { a: number; b: string; c: boolean; d: number },
            | { key: 'a'; error: string }
            | { key: 'b'; error: symbol }
            | { key: 'c'; error: number }
            | { key: 'd'; error: Error }
        >
    >(true);

    const all3FirstError = Result.all({ a: ok0, b: err0, c: ok1, d: err1 }, { errors: 'first' });
    expect(all3FirstError).toMatchResult(
        Err({
            key: 'b',
            error: sym,
        }),
    );
    eq<
        typeof all3FirstError,
        Result<
            { a: number; b: string; c: boolean; d: number },
            | { key: 'a'; error: string }
            | { key: 'b'; error: symbol }
            | { key: 'c'; error: number }
            | { key: 'd'; error: Error }
        >
    >(true);

    const all3OmittedErrors = Result.all({ a: ok0, b: err0, c: ok1, d: err1 }, {});
    expect(all3OmittedErrors).toMatchResult(
        Err({
            key: 'b',
            error: sym,
        }),
    );
    eq<
        typeof all3OmittedErrors,
        Result<
            { a: number; b: string; c: boolean; d: number },
            | { key: 'a'; error: string }
            | { key: 'b'; error: symbol }
            | { key: 'c'; error: number }
            | { key: 'd'; error: Error }
        >
    >(true);

    const all3KnownOk = Result.all({ a: Ok(3), b: err0, c: Ok(true), d: err1 });
    expect(all3KnownOk).toMatchResult(
        Err({
            key: 'b',
            error: sym,
        }),
    );
    eq<
        typeof all3KnownOk,
        Result<
            { a: number; b: string; c: boolean; d: number },
            { key: 'b'; error: symbol } | { key: 'd'; error: Error }
        >
    >(true);
    eq<
        ResultErrEntry<{ a: OkImpl<number>; b: typeof err0; c: OkImpl<boolean>; d: typeof err1 }>,
        { key: 'b'; error: symbol } | { key: 'd'; error: Error }
    >(true);

    const all3AllErrors = Result.all({ a: ok0, b: err0, c: ok1, d: err1 }, { errors: 'all' });
    expect(all3AllErrors).toMatchResult(
        Err({
            b: sym,
            d: error,
        }),
    );
    eq<
        typeof all3AllErrors,
        Result<{ a: number; b: string; c: boolean; d: number }, Partial<{ a: string; b: symbol; c: number; d: Error }>>
    >(true);
});

test('Result.all with object narrows first error by key', () => {
    function f(a: Result<string, number>, b: Result<number, boolean>): void {
        const all = Result.all({ a, b });
        eq<typeof all, Result<{ a: string; b: number }, { key: 'a'; error: number } | { key: 'b'; error: boolean }>>(
            true,
        );

        if (all.isErr()) {
            if (all.error.key === 'a') {
                eq<typeof all.error.error, number>(true);
            } else {
                eq<typeof all.error.error, boolean>(true);
            }
        }
    }

    f(Err(1), Err(false));
});

test('Result.any', () => {
    const ok0 = Ok(3);
    const ok1 = Ok(true);
    const ok2 = Ok(8 as const) as Result<8, boolean>;
    const err0 = Err(Symbol());
    const err1 = Err(Error());
    const err2 = Err(9 as const) as Result<boolean, 9>;

    const any0Array = Result.any([]);
    expect(any0Array).toMatchResult(Err([]));
    eq<typeof any0Array, Result<never, []>>(true);

    const any1Array = Result.any([ok0, ok1]);
    expect(any1Array).toMatchResult(Ok(3));
    eq<typeof any1Array, Result<number | boolean, [never, never]>>(true);

    const any2Array = Result.any([err0, err1]);
    expect(any2Array).toMatchResult(Err([err0.error, err1.error]));
    eq<typeof any2Array, Result<never, [symbol, Error]>>(true);

    const any3Array = Result.any([] as Result<string, number>[]);
    eq<typeof any3Array, Result<string, number[]>>(true);

    const any4Array = Result.any([err0, err1, err2, ok2]);
    expect(any4Array).toMatchResult(Ok(8));
    eq<typeof any4Array, Result<boolean | 8, [symbol, Error, 9, boolean]>>(true);
});

test('Result.wrap', () => {
    const a = Result.wrap(() => 1);
    expect(a).toMatchResult(Ok(1));
    eq<typeof a, Result<number, unknown>>(true);

    class CustomError {
        readonly message = 'hi';
    }
    const err = new CustomError();

    const b = Result.wrap<number, CustomError>(() => {
        throw err;
    });
    expect(b).toMatchResult(Err(err));
    eq<typeof b, Result<number, CustomError>>(true);
});

test('Result.wrapAsync', async () => {
    const a = await Result.wrapAsync(async () => 1);
    expect(a).toMatchResult(Ok(1));
    eq<typeof a, Result<number, unknown>>(true);

    class CustomError {
        readonly message = 'hi';
    }
    const err = new CustomError();

    const b = await Result.wrapAsync<number, CustomError>(async () => {
        throw err;
    });
    expect(b).toMatchResult(Err(err));
    eq<typeof b, Result<number, CustomError>>(true);

    const c = await Result.wrapAsync<number, string>(() => {
        throw 'thrown before promise';
        return Promise.resolve(3);
    });

    expect(c).toMatchResult(Err('thrown before promise'));
    eq<typeof c, Result<number, string>>(true);
});

test('Result.partition', async () => {
    const ok0 = Ok(3);
    const ok1 = Ok(true);
    const err0 = Err(Symbol());
    const err1 = Err(Error());
    const result0 = Ok(3) as unknown as Result<number, symbol>;
    const result1 = Ok(true) as unknown as Result<boolean, Error>;

    const all0 = Result.partition([]);
    expect(all0).toEqual([[], []]);
    eq<typeof all0, [never[], never[]]>(true);

    const all1 = Result.partition([ok0, ok1, err0, err1]);
    expect(all1).toEqual([
        [ok0.value, ok1.value],
        [err0.error, err1.error],
    ]);
    eq<typeof all1, [(number | boolean)[], (symbol | Error)[]]>(true);

    const all2 = Result.partition([ok0, ok1]);
    expect(all2).toEqual([[ok0.value, ok1.value], []]);
    eq<typeof all2, [(number | boolean)[], never[]]>(true);

    const all3 = Result.partition([err0, err1]);
    expect(all3).toEqual([[], [err0.error, err1.error]]);
    eq<typeof all3, [never[], (symbol | Error)[]]>(true);

    const all4 = Result.partition([1, 2, 3, 4].map((num) => Ok(num) as Result<number, Error>));
    expect(all4).toEqual([[1, 2, 3, 4], []]);
    eq<typeof all4, [number[], Error[]]>(true);

    const all5 = Result.partition([result0, result1]);
    expect(all5).toEqual([[(result0 as OkImpl<number>).value, (result1 as OkImpl<boolean>).value], []]);
    eq<typeof all5, [(number | boolean)[], (symbol | Error)[]]>(true);
});

test('Issue #24', () => {
    const getStatus = (payload: boolean): Result<boolean, Error> => {
        if (payload) {
            return Ok(payload);
        }
        return Err(new Error('Payload is false'));
    };

    // Changed while resolving https://github.com/lune-climate/ts-results-es/issues/197
    // Originally the return type here had Error in the Err position but that's an edge
    // case (attaching a mapper always returning Ok). It was difficult to maintain the
    // existing behavior while fixing the andThen/orElse problems that were much
    // more general and affecting actually idiomatic use of the library.
    const processStatus = (): Result<boolean, unknown> => {
        return getStatus(true)
            .andThen((result) => Ok(result))
            .map((data) => data);
    };
});

test('To option', () => {
    const result = Ok('hello') as Result<string, number>;
    const option = result.toOption();
    eq<typeof option, Option<string>>(true);
    expect(option).toEqual(Some('hello'));

    const result2: Result<string, number> = Err(32);
    const option2 = result2.toOption();
    expect(option2).toEqual(None);
});

test('or / orElse', () => {
    const result = Err('boo') as Result<number, string>;

    const afterOrElseAlwaysErr = result.orElse((error) => Err(error === 'boo'));
    eq<typeof afterOrElseAlwaysErr, Result<number | unknown, boolean>>(true);
    const afterOrElseAlwaysOk = result.orElse((_error) => Ok(1));
    eq<typeof afterOrElseAlwaysOk, Result<number | 1, unknown>>(true);
    const afterOrElseAnyResult = result.orElse((error) => (error === 'foo' ? Ok(1) : Err('bar')));
    eq<typeof afterOrElseAnyResult, Result<number | 1, string>>(true);

    const afterOrErr = result.or(Err(true));
    eq<typeof afterOrErr, Result<number, boolean>>(true);
    const afterOrOk = result.or(Ok(1));
    eq<typeof afterOrOk, Result<number, never>>(true);
    const afterOrResult = result.or(Err(true) as Result<number, boolean>);
    eq<typeof afterOrResult, Result<number, boolean>>(true);

    expect(Err('error').or(Ok(1))).toEqual(Ok(1));
    expect(Err('error').orElse((error) => Ok(error.length))).toEqual(Ok(5));

    expect(Ok(1).or(Ok(2))).toEqual(Ok(1));
    expect(
        Ok(1).orElse((_error) => {
            throw new Error('Call unexpected');
        }),
    ).toEqual(Ok(1));
});

test('toAsyncResult()', async () => {
    expect(await Ok(1).toAsyncResult().promise).toEqual(Ok(1));
    const err = Err('error');
    expect(await err.toAsyncResult().promise).toEqual(err);
});

test('unwrapOrElse', () => {
    expect(Ok({ data: 'user data' }).unwrapOrElse(notSupposedToBeCalled)).toEqual({ data: 'user data' });
    expect(Err('bad error').unwrapOrElse((error) => ({ error }))).toEqual({ error: 'bad error' });
});

test('andThen/orElse chaining regression', () => {
    // Based on this issue: https://github.com/lune-climate/ts-results-es/issues/197
    class T1 {
        name = 'T1' as const;
    }
    class T2 {
        name = 'T2' as const;
    }
    class T3 {
        name = 'T3' as const;
    }
    class E1 {
        name = 'E1' as const;
    }
    class E2 {
        name = 'E2' as const;
    }
    class E3 {
        name = 'E3' as const;
    }

    function foo1(): Result<T1, E1> {
        return Ok({ name: 'T1' });
    }
    function foo2(): Result<T2, E2> {
        return Ok({ name: 'T2' });
    }
    function foo3(): Result<T3, E3> {
        return Ok({ name: 'T3' });
    }

    // The orElse line used to produce this error:
    //
    // This expression is not callable.
    // Each member of the union type ... has signatures, but none of those signatures are compatible with each other. (ts 2349)
    const test1 = foo1()
        .andThen(() => foo2())
        .orElse(() => foo3());

    expect(test1).toEqual(Ok({ name: 'T2' }));
    eq<typeof test1, OkImpl<T2> | OkImpl<T3> | ErrImpl<E3>>(true);

    // Test the opposite order too just to be sure
    const test2 = foo1()
        .orElse(() => foo2())
        .andThen(() => foo3());

    expect(test2).toEqual(Ok({ name: 'T3' }));
    eq<typeof test2, OkImpl<T3> | ErrImpl<E3> | ErrImpl<E2 | E3>>(true);
});

test('Result.isOkAnd', () => {
    const errResult = Err('Failure') as Result<number, string>;
    const okResult = Ok(2) as Result<number, string>;
    expect(errResult.isOkAnd((v) => v > 1)).toBe(false);
    expect(okResult.isOkAnd((v) => v > 1)).toBe(true);
});
test('Result.isErrAnd', () => {
    const errResult = Err('Failure') as Result<number, string>;
    const okResult = Ok(2) as Result<number, string>;
    expect(errResult.isErrAnd((v) => v === 'Failure')).toBe(true);
    expect(okResult.isErrAnd((v) => v === 'Failure')).toBe(false);
});

test('Result.inspect', () => {
    const okResult = Ok(5) as Result<number, string>;
    let okSideEffect: number | undefined;
    const errResult = Err('x') as Result<number, string>;
    let errSideEffect: string | undefined;
    expect(
        okResult.inspect((v) => {
            okSideEffect = v + 1;
        }),
    ).toEqual(okResult);
    expect(
        errResult.inspect((v) => {
            errSideEffect = `${v}`;
        }),
    ).toEqual(errResult);

    expect(okSideEffect).toEqual(6);
    expect(errSideEffect).toBe(undefined);
});
