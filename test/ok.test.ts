import { assert } from 'conditional-type-checks';
import { Err, ErrImpl, None, Ok, OkImpl, Option, Result, Some, SomeImpl } from '../src/index.js';
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
//=============== Result.flatten
describe('Ok.flatten', () => {
    test('should correctly infer the types after invoking flatten on Ok', () => {
        const ok = Ok(Ok(42)).flatten();
        expect(ok).toMatchResult(Ok(42));
        eq<Ok<number>, typeof ok>(true);
    });
    test('should preserve generic types regardless if the user provided the wrong one.', () => {
        const ok = Ok(Ok(42));
        const flattened = ok.flatten<string>();
        eq<OkImpl<number>, typeof flattened>(true);
    });
    test('should automatically infer and preserve the generic types when calling flatten more than it accomodates (Identity)', () => {
        const ok = Ok(Ok(42));
        const flattened = ok.flatten().flatten().flatten().flatten().flatten();
        eq<Ok<number>, typeof flattened>(true);
    });
    test("should attach provided generic types on stack of Ok's", () => {
        const ok = Ok(Ok(42));
        const flattened = ok.flatten<number, string>();
        eq<Result<number, string>, typeof flattened>(true);
    });
    test("should attach provided generic types on stack of Ok's ends with Err", () => {
        const ok = Ok(Err('hello'));
        const flattened = ok.flatten<number, string>();
        eq<Result<number, string>, typeof flattened>(true);
    });

    test('should automatically infer the generic types after invoking flatten multiple times as chanin on stack of Ok ends with Err.', () => {
        const ok1 = Ok(Ok(Ok(Err('deep fail')))).flatten();
        eq<typeof ok1, OkImpl<OkImpl<Err<string>>>>(true);
        const ok2 = ok1.flatten();
        eq<typeof ok2, Ok<Err<string>>>(true);
        const ok3 = ok2.flatten().flatten();
        eq<typeof ok3, Err<string>>(true);
    });

    test('should automatically infer the generic types after invoking flatten 2 times as chanin on stack of Ok ends with Err.', () => {
        const ok1 = Ok(Ok(Ok(Ok(Err('deep fail')))))
            .flatten()
            .flatten();
        eq<typeof ok1, Ok<Ok<ErrImpl<string>>>>(true);
    });
    test('should ignore wrong attached types for Err and rely on the infered once.', () => {
        const ok1 = Ok(Ok(Err('deep fail')));
        const flattened = ok1.flatten<number, number>(); // inferred Err<string> has higer priority over the wrongly provided once.
        eq<typeof flattened, Result<Err<string>, number>>(true);
        eq<typeof flattened, Result<Err<number>, number>>(false);
    });
    test('should ignore wrong attached types for Ok and rely on the infered once.', () => {
        const ok1 = Ok(Ok(Ok('hello')));
        const flattened = ok1.flatten<number, string>();
        eq<typeof flattened, Result<Ok<string>, string>>(true);
        eq<typeof flattened, Result<Ok<number>, string>>(false);
    });
    test('should return inner Ok value when Ok contains Ok', () => {
        const ok = Ok(Ok(42)).flatten();
        expect(ok).toMatchResult(Ok(42));
    });

    test('should return inner Err when Ok contains Err', () => {
        const ok = Ok(Err('fail')).flatten();
        expect(ok).toMatchResult(Err('fail'));
    });

    test('should return Ok of value when Ok contains non-Result', () => {
        const ok = Ok(42).flatten();
        expect(ok).toMatchResult(Ok(42));
    });

    test('should return Ok of string when Ok contains string', () => {
        const ok = Ok('hello').flatten();
        expect(ok).toMatchResult(Ok('hello'));
    });

    test('should return Ok of object when Ok contains object', () => {
        const obj = { a: 1, b: 2 };
        const ok = Ok(obj).flatten();
        expect(ok).toMatchResult(Ok(obj));
    });

    test('should handle nested Ok multiple levels deep', () => {
        const ok = Ok(Ok(Ok(42))).flatten();
        expect(ok).toMatchResult(Ok(Ok(42)));
    });

    test('should work with mixed nested types', () => {
        const ok = Ok(Ok(Err('deep fail')))
            .flatten()
            .flatten();
        expect(ok).toMatchResult(Err('deep fail'));
    });
});

//=============

describe('Ok.collapse', () => {
    test('should return Ok directly when non-Result value', () => {
        const ok = Ok(42).collapse();
        expect(ok).toMatchResult(Ok(42));
    });
    test('should correctly infer the type after success flatten', () => {
        const ok = Ok(Ok(Ok(Ok(42)))).collapse(2);
        expect(ok).toMatchResult(Ok(Ok(42)));
        eq<Result<Ok<number>, never>, typeof ok>(true);
    });

    test('should flatten single level with depth 0', () => {
        const ok = Ok(Ok(42)).collapse(0);
        expect(ok).toMatchResult(Ok(Ok(42)));
    });

    test('should flatten single level with depth 1', () => {
        const ok = Ok(Ok(42)).collapse(1);
        expect(ok).toMatchResult(Ok(42));
    });

    test('should flatten multiple levels with default depth', () => {
        const ok = Ok(Ok(Ok(Ok(42)))).collapse();
        expect(ok).toMatchResult(Ok(42));
    });

    test('should flatten exactly N levels with depth parameter', () => {
        const ok = Ok(Ok(Ok(Ok(42))));
        const result = ok.collapse(2);
        expect(result.isOk()).toBe(true);
        expect(Result.isResult(result.unwrap())).toBe(true);
        const inner = result.unwrap();
        expect(inner.unwrap()).toBe(42);
    });

    test('should stop at Err when encountered', () => {
        const ok = Ok(Ok(Ok(Err('stop here'))));
        const result = ok.collapse(5);
        expect(result).toMatchResult(Err('stop here'));
    });

    test('should preserve generic types', () => {
        const ok = Ok(Ok(Ok(42)));
        const result = ok.collapse<number, string>(2);
        expect(result.unwrap()).toBe(42);
    });

    test('should handle mixed nested types', () => {
        const ok = Ok(Ok(Ok(Err('deep error'))));
        const result = ok.collapse(3);
        expect(result).toMatchResult(Err('deep error'));
    });

    test('should return original Ok when depth is negative', () => {
        const ok = Ok(Ok(42)).collapse(-1);
        expect(ok).toMatchResult(Ok(Ok(42)));
    });

    test('should handle Infinity depth', () => {
        const ok = Ok(Ok(Ok(Ok(Ok(42)))));
        const result = ok.collapse();
        expect(result).toMatchResult(Ok(42));
    });

    test('should stop when reached non-Result value', () => {
        const ok = Ok(Ok(Ok(42)));
        const result = ok.collapse(10);
        expect(result).toMatchResult(Ok(42));
    });

    test('should work with complex nested structures', () => {
        const nested = Ok(Ok(Ok(Ok({ data: 'test' }))));
        const result = nested.collapse();
        expect(result.unwrap()).toEqual({ data: 'test' });
    });

    test('should handle nested Result with different types', () => {
        type Outer = string;
        type Inner = number;
        const ok = Ok(Ok(Ok(42)));
        const result = ok.collapse<Inner, string>(2);
        expect(result.unwrap()).toBe(42);
    });
    test('should handle nested Result with negative depth values.', () => {
        const ok = Ok(Ok(Ok(42)));
        const result = ok.collapse(-1);
        expect(result).toMatchResult(ok);
    });
});
//====

describe('OkImpl.transpose', () => {
    test('Ok(Some(value)) -> Some(Ok(value))', () => {
        const ok = Ok(Some(42));
        const result = ok.transpose();
        expect(result).toBeInstanceOf(SomeImpl);
        expect(result.unwrap()).toBeInstanceOf(OkImpl);
        expect(result.unwrap()).toMatchResult(Ok(42));
    });
    test('check inference after transpose Ok(Some(Some(val))) -> Some(Ok(Some(val)))', () => {
        const ok = Ok(Some(Some(4)));
        const tok = ok.transpose();
        eq<typeof tok, Option<Result<SomeImpl<number>, never>>>(true);
    });
    test('Ok(None) -> None', () => {
        const ok = Ok(None);
        const result = ok.transpose();
        expect(result).toBe(None);
    });

    test('preserves inner value type', () => {
        const ok = Ok(Some('hello'));
        const result = ok.transpose();
        expect(result.unwrap()).toMatchResult(Ok('hello'));
    });

    test('is idempotent when inner is Some', () => {
        const ok = Ok(Some(5));
        const first = ok.transpose(); // Some(Ok(5))
        const inner = first.unwrap(); // Ok(5)
        const second = ok.transpose();
        expect(second).toEqual(first);
    });
});
