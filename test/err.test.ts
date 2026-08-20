import { assert } from 'conditional-type-checks';
import { Err, ErrImpl, None, Ok, Result, Some } from '../src/index.js';
import { eq, expect_never } from './util.js';

test('Constructable & Callable', () => {
    const a = Err(3);
    expect(a).toBeInstanceOf(ErrImpl);
    eq<typeof a, ErrImpl<number>>(true);

    const b = Err(3);
    expect(b).toBeInstanceOf(ErrImpl);
    eq<typeof b, ErrImpl<number>>(true);

    function mapper<T>(fn: (val: string) => T): T {
        return fn('hi');
    }
    const mapped = mapper(Err);
    expect(mapped).toMatchResult(Err('hi'));

    // TODO: This should work!
    // eq<typeof mapped, ErrImpl<string>>(true);

    // @ts-expect-error ErrImpl<string> is not assignable to ErrImpl<number>
    mapper<ErrImpl<number>>(Err);
});

test('ok, err, and val', () => {
    const err = Err(32);
    expect(err.isErr()).toBe(true);

    expect(err.isOk()).toBe(false);

    expect(err.error).toBe(32);
    eq<typeof err.error, number>(true);
});

test('static EMPTY', () => {
    expect(ErrImpl.EMPTY).toBeInstanceOf(ErrImpl);
    expect(ErrImpl.EMPTY.error).toBe(undefined);
    eq<typeof ErrImpl.EMPTY, ErrImpl<void>>(true);
});

test('unwrapOr', () => {
    const e2 = Err(3).unwrapOr(false);
    expect(e2).toBe(false);
    eq<false, typeof e2>(true);
});

test('expect', () => {
    try {
        const err = Err(true).expect('should fail!');
        expect_never(err, true);
        throw Error('Unreachable');
    } catch (e) {
        expect((e as Error).message).toMatch('should fail!');
        expect((e as Error).cause).toEqual(true);
    }
});

test('expectErr', () => {
    const err = Err(true).expectErr('should fail!');
    expect(err).toBe(true);
    eq<boolean, typeof err>(true);
});

test('unwrap', () => {
    try {
        const err = Err({ message: 'bad error' }).unwrap();
        expect_never(err, true);
        throw Error('Unreachable');
    } catch (e) {
        expect((e as Error).message).toMatch('{"message":"bad error"}');
        expect((e as Error).cause).toEqual({ message: 'bad error' });
    }
});

test('unwrapErr', () => {
    const err = Err(1).unwrapErr();
    expect(err).toBe(1);
    eq<number, typeof err>(true);
});

test('map', () => {
    const err = Err(3).map((x: any) => Symbol());
    expect(err).toMatchResult(Err(3));
    eq<typeof err, ErrImpl<number>>(true);
});

test('andThen', () => {
    const err = Err('Err').andThen(() => Ok(3));
    expect(err).toMatchResult(Err('Err'));
    eq<typeof err, Result<number, unknown>>(true);
});

test('mapErr', () => {
    const err = Err('32').mapErr((x) => +x);
    expect(err).toMatchResult(Err(32));
    eq<typeof err, ErrImpl<number>>(true);
});

test('mapOr / mapOrElse', () => {
    expect(Err('Some error').mapOr(1, () => -1)).toEqual(1);
    expect(
        Err('Some error').mapOrElse(
            (error) => error.length,
            () => -1,
        ),
    ).toEqual(10);
});

test('iterable', () => {
    for (const item of Err([123])) {
        expect_never(item, true);
        throw Error('Unreachable, Err@@iterator should emit no value and return');
    }
});

test('to string', () => {
    expect(`${Err(1)}`).toEqual('Err(1)');
    expect(`${Err({ name: 'George' })}`).toEqual('Err({"name":"George"})');
});

test('stack trace', () => {
    function first(): ErrImpl<number> {
        return second();
    }

    function second(): ErrImpl<number> {
        return Err(1);
    }

    const err = first();
    expect(err.stack).toMatch(/at second/);
    expect(err.stack).toMatch(/at first/);
    expect(err.stack).toMatch(/err\.test\.ts/);
    expect(err.stack).toMatch(/Err\(1\)/);
    expect(err.stack).not.toMatch(/ErrImpl/);

    const err2 = Err(Error('inner error'));
    expect(err2.stack).toMatch(/Err\(Error: inner error\)/);
});

test('Err.isOkAnd', () => {
    expect(Err('Failure ').isOkAnd()).toBe(false);
});
test('Err.isErrAnd', () => {
    expect(Err('Failure').isErrAnd((e) => e === 'Failure')).toBe(true);
    expect(Err('Failure').isErrAnd((e) => e === 'Success')).toBe(false);
});

test('Err.toError', () => {
    expect(Err(55).toError()).toEqual(Some(55));
    expect(Err(55).toError()).not.toBe(None);
});
