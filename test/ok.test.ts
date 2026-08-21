import { assert } from 'conditional-type-checks';
import { Err, None, Ok, OkImpl, Result, Some } from '../src/index.js';
import { eq, expect_never, expect_string } from './util.js';

test('Constructable & Callable', () => {
    const a = Ok(3);
    expect(a).toBeInstanceOf(OkImpl);
    eq<typeof a, OkImpl<number>>(true);

    const b = Ok(3);
    expect(b).toBeInstanceOf(OkImpl);
    eq<typeof b, OkImpl<number>>(true);

    function mapper<T>(fn: (val: string) => T): T {
        return fn('hi');
    }

    const mapped = mapper(Ok);
    expect(mapped).toMatchResult(Ok('hi'));

    // TODO: This should work!
    // eq<typeof mapped, OkImpl<string>>(true);

    // @ts-expect-error OkImpl<string> is not assignable to OkImpl<number>
    mapper<OkImpl<number>>(Ok);
});

test('ok, err, and val', () => {
    const err = Ok(32);
    expect(err.isErr()).toBe(false);

    expect(err.isOk()).toBe(true);

    expect(err.value).toBe(32);
    eq<typeof err.value, number>(true);
});

test('static EMPTY', () => {
    expect(OkImpl.EMPTY).toBeInstanceOf(OkImpl);
    expect(OkImpl.EMPTY.value).toBe(undefined);
    eq<typeof OkImpl.EMPTY, OkImpl<void>>(true);
});

test('unwrapOr', () => {
    const e2 = Ok(3).unwrapOr(false);
    expect(e2).toBe(3);
    eq<number, typeof e2>(true);
});

test('expect', () => {
    const val = Ok(true).expect('should not fail!');
    expect(val).toBe(true);
    eq<boolean, typeof val>(true);
});

test('expectErr', () => {
    expect(() => {
        const val = Ok(true).expectErr('should fail!');
        expect_never(val, true);
    }).toThrowError('should fail!');
});

test('unwrap', () => {
    const val = Ok(true).unwrap();
    expect(val).toBe(true);
    eq<boolean, typeof val>(true);
});

test('unwrapErr', () => {
    try {
        const err = Ok('boom').unwrapErr();
        expect_never(err, true);
        throw new Error('Unreachable');
    } catch (e) {
        expect((e as Error).message).toMatch('boom');
        expect((e as Error).cause).toEqual('boom');
    }
});

test('map', () => {
    const mapped = Ok(3).map((x) => x.toString(10)) as OkImpl<string>;
    expect(mapped).toMatchResult(Ok('3'));
    eq<typeof mapped, OkImpl<string>>(true);
});

test('andThen', () => {
    const ok = Ok('Ok').andThen(() => Ok(3));
    expect(ok).toMatchResult(Ok(3));
    eq<typeof ok, Result<number, unknown>>(true);

    const err = Ok('Ok').andThen(() => Err(false));
    expect(err).toMatchResult(Err(false));
    eq<typeof err, Result<unknown, boolean>>(true);
});

test('mapErr', () => {
    const ok = Ok('32').mapErr((x: any) => +x) as OkImpl<string>;
    expect(ok).toMatchResult(Ok('32'));
    eq<typeof ok, OkImpl<string>>(true);
});

test('mapOr / mapOrElse', () => {
    expect(Ok(11).mapOr(1, (val) => val * 2)).toEqual(22);
    expect(
        Ok(11).mapOrElse(
            (_error) => 1,
            (val) => val * 2,
        ),
    ).toEqual(22);
});

test('iterable', () => {
    expect(Array.from(Ok('hello'))).toEqual(['hello']);
    expect(Array.from(Ok([1, 2, 3]))).toEqual([[1, 2, 3]]);
    expect(Array.from(Ok(1))).toEqual([1]);
});

test('to string', () => {
    expect(`${Ok(1)}`).toEqual('Ok(1)');
    expect(`${Ok({ name: 'George' })}`).toEqual('Ok({"name":"George"})');
});

test('Ok.isOkAnd', () => {
    expect(Ok(1).isOkAnd((v) => v > 0)).toBe(true);
    expect(Ok(0).isOkAnd((v) => v > 1)).toBe(false);
});
test('Ok.isErrAnd', () => {
    expect(Ok(1).isErrAnd()).toBe(false);
});

test('Ok.err', () => {
    expect(Ok(55).err()).toBe(None);
    expect(Ok(55).err()).not.toEqual(Some(55));
});

test('Ok.inspect', () => {
    const ok = Ok(55);
    let called = false;
    let capturedValue = 0;

    const result = ok.inspect((v) => {
        called = true;
        capturedValue = v;
    });

    expect(result).toBe(ok);
    expect(called).toBe(true);
    expect(capturedValue).toBe(55);
});
test('Ok.inspectErr', () => {
    const err = Ok(55);
    expect(err.inspectErr()).toBe(err); // Same instance
    expect(err.inspectErr()).toEqual(err); // Same value
});
test('Ok.and', () => {
    const ok = Ok(2);
    expect(ok.and(Ok(3)).unwrap()).toBe(3);
    expect(ok.and(Err(4)).err().unwrap()).toBe(4);
});
