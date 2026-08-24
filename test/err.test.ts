import { assert } from 'conditional-type-checks';
import { Err, ErrImpl, None, Ok, Option, Result, Some, SomeImpl } from '../src/index.js';
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
        const err = Err(new Error('bad error', { cause: 'error cause' })).unwrap();
        expect_never(err, true);
        throw Error('Unreachable');
    } catch (e) {
        expect((e as Error).message).toMatch('bad error');
        expect((e as Error).cause).toEqual('error cause');
    }
});

test('unwrapErr', () => {
    const err = Err(1).unwrapErr();
    expect(err).toBe(1);
    eq<number, typeof err>(true);
});

test('andThen', () => {
    const err = Err('Err').andThen(() => Ok(3));
    expect(err).toMatchResult(Err('Err'));
    eq<typeof err, Result<number, unknown>>(true);
});
test('map', () => {
    const err = Err(3).map((x: any) => Symbol());
    expect(err).toMatchResult(Err(3));
    eq<typeof err, Result<symbol, number>>(true);
    const err2 = Err(3).map();
    eq<typeof err2, ErrImpl<number>>(true);
});
test('mapErr', () => {
    const err = Err('32').mapErr((x) => +x);
    expect(err).toMatchResult(Err(32));
    eq<typeof err, ErrImpl<number>>(true);
});
test('mapErr and attach it with types', () => {
    const err = Err('32').mapErr<string, number>((x) => +x);
    expect(err).toMatchResult(Err(32));
    eq<typeof err, Result<string, number>>(true);
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

test('Err.isOkAnd', () => {
    expect(Err('Failure ').isOkAnd()).toBe(false);
});
test('Err.isErrAnd', () => {
    expect(Err('Failure').isErrAnd((e) => e === 'Failure')).toBe(true);
    expect(Err('Failure').isErrAnd((e) => e === 'Success')).toBe(false);
});

test('Err.err', () => {
    expect(Err(55).err()).toEqual(Some(55));
    expect(Err(55).err()).not.toBe(None);
});

test('Err.inspect', () => {
    const err = Err(55);
    expect(err.inspect()).toBe(err); // Same instance
    expect(err.inspect()).toEqual(err); // Same value
});
test('Err.inspectErr', () => {
    const err = Err(55);
    let called = false;
    let capturedValue = 0;

    const result = err.inspectErr((v) => {
        called = true;
        capturedValue = v;
    });

    expect(result).toBe(err);
    expect(called).toBe(true);
    expect(capturedValue).toBe(55);
});

test('Err.and', () => {
    const err = Err(2);
    expect(err.and(Ok(3)).err().unwrap()).toBe(2);
    expect(err.and(Err(4)).err().unwrap()).toBe(2);
    expect(err.and()).toBe(err);
});

describe('Err.flatten', () => {
    test('should return Err directly', () => {
        const err = Err('fail').flatten();
        expect(err).toMatchResult(Err('fail'));
    });

    test('should preserve error type when flattening', () => {
        const err = Err(42).flatten();
        expect(err.unwrapErr()).toBe(42);
    });

    test('should work with nested Err of different type', () => {
        const err = Err(Err(42));
        const flattened = err.flatten();
        expect(flattened.unwrapErr()).toMatchResult(Err(42));
    });

    test('should not flatten the error value', () => {
        const nested = Err(Err('deep'));
        const flattened = nested.flatten();
        expect(flattened).toMatchResult(nested);
        expect(flattened.isErr()).toBe(true);
        expect(flattened.unwrapErr().isErr()).toBe(true);
    });
});
//=================

describe('Err.collapse', () => {
    test('should return Err directly with depth 0', () => {
        const err = Err('fail').collapse(0);
        expect(err).toMatchResult(Err('fail'));
    });

    test('should return Err directly with depth 1', () => {
        const err = Err('fail').collapse(1);
        expect(err).toMatchResult(Err('fail'));
    });

    test('should return Err directly with default depth', () => {
        const err = Err('fail').collapse();
        expect(err).toMatchResult(Err('fail'));
    });

    test('should preserve error type when collapsing', () => {
        const err = Err(42).collapse<number, string>();
        expect(err.unwrapErr()).toBe(42);
    });

    test('should return Err unchanged when nested Err inside Ok', () => {
        const err = Ok(Err('fail')).collapse();
        expect(err).toMatchResult(Err('fail'));
    });

    test('should handle deeply nested Err with depth limit', () => {
        const nested = Ok(Ok(Ok(Err('deep'))));
        const result = nested.collapse(2);
        expect(result.isOk()).toBe(true);
        expect(Result.isResult(result.unwrap())).toBe(true);
        const inner = result.unwrap() as Result<unknown, string>;
        expect(inner.isErr()).toBe(true);
    });
});
//====
describe('ErrImpl.transpose', () => {
    test('check inference after transpose Ok(Some(Err(val))) -> Some(Ok(Err(val)))', () => {
        const ok = Ok(Some(Err(4)));
        const tok = ok.transpose();
        eq<typeof tok, Some<Ok<Err<number>>>>(true);
    });
    test('transposes Err to Some(Err)', () => {
        const err = Err('oops');
        const result = err.transpose();
        expect(result).toBeInstanceOf(SomeImpl);
        expect(result.unwrap()).toBeInstanceOf(ErrImpl);
        expect(result.unwrap()).toMatchResult(Err('oops'));
    });
    test('preserves error value and should prefer infered correct type over the wrong provided one.', () => {
        const err = Err(404);
        const result = err.transpose<string, string>();
        expect(result.unwrap()).toMatchResult(Err(404));
        eq<typeof result, Some<Result<string, number>>>(true);
    });

    test('is idempotent (calling again does nothing new)', () => {
        const err = Err('fail');
        const first = err.transpose(); // Some(Err('fail'))
        const second = first.unwrap().transpose(); // transpose on Err -> Some(Err('fail'))
        expect(second).toEqual(first); // same structure
    });
});
