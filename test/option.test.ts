import { Err, None, Ok, Option, OptionSomeType, Result, Some, SomeImpl } from '../src/index.js';
import { eq, notSupposedToBeCalled } from './util.js';

const someString = Some('foo');
const someNum = Some(10);

test('basic invariants', () => {
    expect(someString.isSome()).toBeTruthy();
    expect(someNum.isSome()).toBeTruthy();
    expect(None).toBe(None);
    expect(someString.value).toBe('foo');
    expect(someNum.value).toBe(10);

    expect(Option.isOption(someString)).toBe(true);
    expect(Option.isOption(someNum)).toBe(true);
    expect(Option.isOption(None)).toBe(true);
    expect(Option.isOption('foo')).toBe(false);

    expect(None.isSome()).toBe(false);
    expect(None.isNone()).toBe(true);
    expect(someNum.isSome()).toBe(true);
    expect(someNum.isNone()).toBe(false);
});

test('type narrowing', () => {
    const opt = None as Option<string>;
    if (opt.isSome()) {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    } else {
        eq<typeof opt, None>(true);
    }

    if (!opt.isSome()) {
        eq<typeof opt, None>(true);
    } else {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    }

    if (opt.isNone()) {
        eq<typeof opt, None>(true);
    } else {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    }

    if (!opt.isNone()) {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    } else {
        eq<typeof opt, None>(true);
    }

    expect(someString).toBeInstanceOf(SomeImpl);
    expect(None).toEqual(None);
});

test('unwrap', () => {
    expect(() => someString.unwrap()).not.toThrow();
    expect(someString.unwrap()).toBe('foo');
    expect(someString.expect('msg')).toBe('foo');
    expect(someString.unwrapOr('bar')).toBe('foo');
    expect(() => None.unwrap()).toThrow(/Tried to unwrap None/);
    expect(() => None.expect('foobar')).toThrow(/foobar/);
    expect(None.unwrapOr('honk')).toBe('honk');
});

test('unwrapOrElse', () => {
    expect(Some('1').unwrapOrElse(notSupposedToBeCalled)).toEqual('1');
    expect(None.unwrapOrElse(() => '2')).toEqual('2');
});

test('map / andThen', () => {
    expect(None.map(() => 1)).toBe(None);
    expect(None.andThen(() => 1)).toBe(None);
    expect(None.andThen(() => Some(1))).toBe(None);

    expect(someString.map(() => 1)).toEqual(Some(1));
    // @ts-expect-error
    someString.andThen(() => 1);
    expect(someString.andThen(() => Some(1))).toEqual(Some(1));

    const mapped = (someString as Option<string>).andThen((val) => Some(!!val));
    expect(mapped).toEqual(Some(true));
    eq<typeof mapped, Option<boolean>>(true);
});

test('mapOr / mapOrElse', () => {
    expect(None.mapOr(1, () => -1)).toEqual(1);
    expect(
        None.mapOrElse(
            () => 1,
            () => -1,
        ),
    ).toEqual(1);

    expect(Some(11).mapOr(1, (val) => val * 2)).toEqual(22);
    expect(
        Some(11).mapOrElse(
            () => {
                throw new Error('Should not happen');
            },
            (val) => val * 2,
        ),
    ).toEqual(22);
});

test('Option.all', () => {
    const some0: Option<number> = Some(3);
    const some1: Option<boolean> = Some(true);
    const some2: Option<string> = Some('hello');

    // Empty cases
    const all0 = Option.all([]);
    expect(all0).toEqual(Some([]));
    eq<typeof all0, Option<[]>>(true);

    const all0Spread = Option.all();
    expect(all0Spread).toEqual(Some([]));
    eq<typeof all0Spread, Option<[]>>(true);

    // All Some
    const all1 = Option.all([some0, some1]);
    expect(all1).toEqual(Some([3, true]));
    eq<typeof all1, Option<[number, boolean]>>(true);

    const all1Spread = Option.all(some0, some1);
    expect(all1Spread).toEqual(Some([3, true]));
    eq<typeof all1Spread, Option<[number, boolean]>>(true);

    // With None
    const all2 = Option.all([some0, None]);
    expect(all2).toEqual(None);
    eq<typeof all2, Option<[number, never]>>(true);

    const all2Spread = Option.all(some0, None);
    expect(all2Spread).toEqual(None);
    eq<typeof all2Spread, Option<[number, never]>>(true);

    // Dynamic array
    const all3 = Option.all([] as Option<string>[]);
    eq<typeof all3, Option<string[]>>(true);

    const all3Spread = Option.all(...([] as Option<string>[]));
    eq<typeof all3Spread, Option<string[]>>(true);

    // Multiple with None in middle
    const all4 = Option.all([some0, some1, some2, None]);
    expect(all4).toEqual(None);
    eq<typeof all4, Option<[number, boolean, string, never]>>(true);

    const all4Spread = Option.all(some0, some1, some2, None);
    expect(all4Spread).toEqual(None);
    eq<typeof all4Spread, Option<[number, boolean, string, never]>>(true);
});

test('Option.any', () => {
    const some0: Option<number> = Some(3);
    const some1: Option<boolean> = Some(true);
    const some2: Option<string> = Some('hello');

    // Empty cases
    const any0 = Option.any([]);
    expect(any0).toEqual(None);
    eq<typeof any0, Option<never>>(true);

    const any0Spread = Option.any();
    expect(any0Spread).toEqual(None);
    eq<typeof any0Spread, Option<never>>(true);

    // All Some - returns first
    const any1 = Option.any([some0, some1]);
    expect(any1).toEqual(Some(3));
    eq<typeof any1, Option<number | boolean>>(true);

    const any1Spread = Option.any(some0, some1);
    expect(any1Spread).toEqual(Some(3));
    eq<typeof any1Spread, Option<number | boolean>>(true);

    // All None
    const any2 = Option.any([None, None]);
    expect(any2).toEqual(None);
    eq<typeof any2, Option<never>>(true);

    const any2Spread = Option.any(None, None);
    expect(any2Spread).toEqual(None);
    eq<typeof any2Spread, Option<never>>(true);

    // Dynamic array
    const any3 = Option.any([] as Option<string>[]);
    eq<typeof any3, Option<string>>(true);

    const any3Spread = Option.any(...([] as Option<string>[]));
    eq<typeof any3Spread, Option<string>>(true);

    // None then Some
    const any4 = Option.any([None, None, some2, some0]);
    expect(any4).toEqual(Some('hello'));
    eq<typeof any4, Option<string | number>>(true);

    const any4Spread = Option.any(None, None, some2, some0);
    expect(any4Spread).toEqual(Some('hello'));
    eq<typeof any4Spread, Option<string | number>>(true);
});

test('Type Helpers', () => {
    eq<OptionSomeType<Option<string>>, string>(true);
    eq<OptionSomeType<SomeImpl<string>>, string>(true);
    eq<OptionSomeType<None>, never>(true);
});

test('to string', () => {
    expect(`${Some(1)}`).toEqual('Some(1)');
    expect(`${Some({ name: 'George' })}`).toEqual('Some({"name":"George"})');
    expect(`${None}`).toEqual('None');
});

test('to result', () => {
    const option = Some(1) as Option<number>;
    const result = option.okOr('error');
    eq<typeof result, Result<number, string>>(true);

    expect(result).toMatchResult(Ok(1));

    const option2 = None as Option<number>;
    const result2 = option2.okOr('error');
    eq<typeof result2, Result<number, string>>(true);

    expect(result2).toMatchResult(Err('error'));
});

test('or / orElse', () => {
    expect(None.or(Some(1))).toEqual(Some(1));
    expect(None.orElse(() => Some(1))).toEqual(Some(1));

    expect(Some(1).or(Some(2))).toEqual(Some(1));
    expect(
        Some(1).orElse(() => {
            throw new Error('Call unexpected');
        }),
    ).toEqual(Some(1));
});

test('toAsyncOption()', async () => {
    expect(await Some(1).toAsyncOption().promise).toEqual(Some(1));
    expect(await None.toAsyncOption().promise).toEqual(None);
});

test('iteration', () => {
    const iterator = (Some(1) as Option<number>)[Symbol.iterator]();
    eq<Iterator<number>, typeof iterator>(true);

    expect(Array.from(Some(1))).toEqual([1]);
    expect(Array.from(None)).toEqual([]);
});

test('fromNullable', () => {
    const value = 'hello' as string | null;
    const result = Option.fromNullable(value);
    expect(result).toEqual(Some('hello'));
    eq<Option<string>, typeof result>(true);

    const missing = null as string | null;
    const resultMissing = Option.fromNullable(missing);
    expect(resultMissing).toEqual(None);
    eq<Option<string>, typeof resultMissing>(true);

    // Falsy but non-null values → Some
    const zero = Option.fromNullable(0 as number | null);
    expect(zero).toEqual(Some(0));
    eq<Option<number>, typeof zero>(true);

    // undefined is NOT null → Some(undefined)
    const undef = Option.fromNullable(undefined as undefined | null);
    expect(undef).toEqual(Some(undefined));
    eq<Option<undefined>, typeof undef>(true);
});

test('fromOptional', () => {
    const value = 'hello' as string | undefined;
    const result = Option.fromOptional(value);
    expect(result).toEqual(Some('hello'));
    eq<Option<string>, typeof result>(true);

    const missing = undefined as string | undefined;
    const resultMissing = Option.fromOptional(missing);
    expect(resultMissing).toEqual(None);
    eq<Option<string>, typeof resultMissing>(true);

    // Falsy but non-undefined values → Some
    const zero = Option.fromOptional(0 as number | undefined);
    expect(zero).toEqual(Some(0));
    eq<Option<number>, typeof zero>(true);

    // null is NOT undefined → Some(null)
    const nul = Option.fromOptional(null as null | undefined);
    expect(nul).toEqual(Some(null));
    eq<Option<null>, typeof nul>(true);
});

test('fromNullish', () => {
    const value = 'hello' as string | null | undefined;
    const result = Option.fromNullish(value);
    expect(result).toEqual(Some('hello'));
    eq<Option<string>, typeof result>(true);

    const missingNull = null as string | null | undefined;
    const resultNull = Option.fromNullish(missingNull);
    expect(resultNull).toEqual(None);
    eq<Option<string>, typeof resultNull>(true);

    const missingUndefined = undefined as string | null | undefined;
    const resultUndefined = Option.fromNullish(missingUndefined);
    expect(resultUndefined).toEqual(None);
    eq<Option<string>, typeof resultUndefined>(true);

    // Falsy but non-nullish values → Some
    const zero = Option.fromNullish(0 as number | null | undefined);
    expect(zero).toEqual(Some(0));
    eq<Option<number>, typeof zero>(true);
});
test('None.and', () => {
    const noneAnd = None;
    expect(noneAnd.and()).toBe(noneAnd);
    expect(noneAnd.and(Some(7))).toBe(noneAnd);
});
test('Some.and', () => {
    const some = Some(8);
    expect(some.and(Some(8))).toEqual(Some(8));
    expect(some.and(None)).toBe(None);
});
test('Option.and', () => {
    const optionNone = None as Option<number>;
    expect(optionNone.and(Some(8))).toBe(None);
    expect(optionNone.and(None)).toBe(None);
});

test('None.filter', () => {
    const isEven = (v: number) => v % 2 === 0;

    const noneFilter = None.filter(isEven);
    expect(noneFilter).toBe(None);
});
test('Some.filter', () => {
    const isEven = (v: number) => v % 2 === 0;
    const someFilter1 = Some(3).filter(isEven);
    expect(someFilter1).toBe(None);
    const someFilter2 = Some(4).filter(isEven);
    expect(someFilter2).toEqual(Some(4));
});
test('flatten removes one layer from Some(Some(T))', () => {
    const some = Some(Some(4));
    expect(some.flatten()).toEqual(Some(4));
});

test('flatten removes one layer from Some(Some(Some(4)))', () => {
    const some = Some(Some(Some(4)));
    expect(some.flatten()).toEqual(Some(Some(4)));
});

test('flatten converts Some(None) to None', () => {
    const some = Some(None);
    expect(some.flatten()).toBe(None);
});

test('flatten on non-nested Some returns Some', () => {
    const some = Some(5);
    expect(some.flatten()).toEqual(Some(5));
});

test('flatten on None returns None', () => {
    expect(None.flatten()).toBe(None);
});
//=================== collapse

// Basic flattening
test('collapse with no depth flattens all layers', () => {
    const some = Some(Some(Some(4)));
    expect(some.collapse()).toEqual(Some(4));
});

test('collapse with depth 0 returns original', () => {
    const some = Some(Some(4));
    expect(some.collapse(0)).toEqual(Some(Some(4)));
});

test('collapse with depth 1 flattens one layer', () => {
    const some = Some(Some(Some(4)));
    expect(some.collapse(1)).toEqual(Some(Some(4)));
});

test('collapse with depth 2 flattens two layers', () => {
    const some = Some(Some(Some(4)));
    expect(some.collapse(2)).toEqual(Some(4));
});

// None handling
test('collapse on None returns None', () => {
    expect(None.collapse()).toBe(None);
    expect(None.collapse(5)).toBe(None);
    expect(None.collapse(0)).toBe(None);
});

// Some(None) cases
test('collapse flattens Some(None) to None', () => {
    const some = Some(None);
    expect(some.collapse()).toBe(None);
    expect(some.collapse(1)).toBe(None);
});

test('collapse Some(Some(None)) to None', () => {
    const some = Some(Some(None));
    expect(some.collapse()).toBe(None);
    expect(some.collapse(1)).toEqual(Some(None));
});

// Non-nested values
test('collapse on non-nested Some returns Some', () => {
    const some = Some(5);
    expect(some.collapse()).toEqual(Some(5));
    expect(some.collapse(1)).toEqual(Some(5));
});

test('collapse on Some(undefined) returns itself', () => {
    const some = Some(undefined);
    expect(some.collapse()).toEqual(Some(undefined));
});

test('collapse on Some(null) returns itself', () => {
    const some = Some(null);
    expect(some.collapse()).toEqual(Some(null));
});

// Deep nesting
test('collapse flattens deeply nested options', () => {
    const some = Some(Some(Some(Some(Some(5)))));
    expect(some.collapse()).toEqual(Some(5));
});

test('collapse with depth greater than nesting levels', () => {
    const some = Some(Some(4));
    expect(some.collapse(10)).toEqual(Some(4));
});

// Mixed types
test('collapse stops at non-Option value', () => {
    const some = Some(Some({ value: 5 }));
    expect(some.collapse()).toEqual(Some({ value: 5 }));
});

test('collapse with depth stops at non-Option', () => {
    const some = Some(Some({ value: 5 }));
    expect(some.collapse(1)).toEqual(Some({ value: 5 }));
});

// Edge cases
test('collapse with negative depth throws or handles gracefully', () => {
    const some = Some(Some(4));
    expect(some.collapse(-1)).toEqual(some); // or throw
});

test('collapse with Infinity depth', () => {
    const some = Some(Some(Some(4)));
    expect(some.collapse(Infinity)).toEqual(Some(4));
});

// Chainability
test('collapse returns Option type for chaining', () => {
    const result = Some(Some(Some(4)))
        .collapse()
        .map((x) => x * 2);
    expect(result).toEqual(Some(8));
});

// Identity
test('collapse on already flat Some returns None', () => {
    const some = Some(Some(4)).collapse(); // Some(4)
    expect(some.collapse()).toEqual(Some(4)); // Not Some(4)!
});
//==================== isNoneOr

test('Option.isNoneOr called on None should be true', () => {
    const none = None;
    expect(none.isNoneOr()).toBe(true);
    expect(none.isNoneOr(() => false)).toBe(true);
});
test('Option.isNoneOr called on Some(T)', () => {
    const some = Some(5);
    expect(some.isNoneOr((v) => v > 4)).toBe(true);
    expect(some.isNoneOr((v) => v < 0)).toBe(false);
});
//==================== isSomeAnd

test('Option.isSomeAnd called on None should be false', () => {
    const none = None;
    expect(none.isSomeAnd()).toBe(false);
    expect(none.isSomeAnd(() => true)).toBe(false);
});
test('Option.isSomeAnd called on Some(T)', () => {
    const some = Some(5);
    expect(some.isSomeAnd((v) => v > 4)).toBe(true);
    expect(some.isSomeAnd((v) => v < 0)).toBe(false);
});
//=============== okOrElse

test('Option.okOrElse called on Some should return Ok.', () => {
    expect(Some(6).okOrElse(() => 'err')).toMatchResult(Ok(6));
});

test('Option.okOrElse called on None should return Err.', () => {
    expect(None.okOrElse(() => 'err')).toMatchResult(Err('err'));
});
//=============== xor

test('Some.xor accepts Some return None', () => {
    expect(Some(5).xor(Some(6))).toBe(None);
});
test('Some.xor accepts None return Some', () => {
    expect(Some(5).xor(None)).toEqual(Some(5));
});
test('None.xor accepts None return None', () => {
    expect(None.xor(None)).toBe(None);
});
test('None.xor accepts Some return Some', () => {
    expect(None.xor(Some(5))).toEqual(Some(5));
});

test('Option.xor accepts None return Some', () => {
    const some = Some(5) as Option<number>;
    expect(some.xor(None)).toEqual(Some(5));
});
//==============

// transpose tests
describe('Option.transpose', () => {
    // None case
    test('None.transpose() should return Ok(None)', () => {
        const result = None.transpose();
        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toBe(None);
    });

    // Some with Ok result
    test('Some(Ok(value)).transpose() should return Ok(Some(value))', () => {
        const opt = Some(Ok(42));
        const result = opt.transpose<number, string>();
        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toBeInstanceOf(SomeImpl);
        expect(result.unwrap()).toEqual(Some(42));
    });

    // Some with Err result
    test('Some(Err(error)).transpose() should return Err(error)', () => {
        const error = 'something went wrong';
        const opt = Some(Err(error));
        const result = opt.transpose<number, string>();
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr()).toBe(error);
    });

    // Some with non-Result value
    test('Some(nonResult).transpose() should return Ok(Some(nonResult))', () => {
        const opt = Some(42);
        const result = opt.transpose<string>();
        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toBeInstanceOf(SomeImpl);
        expect(result.unwrap()).toEqual(Some(42));
    });

    test('Some("hello").transpose() should return Ok(Some("hello"))', () => {
        const opt = Some('hello');
        const result = opt.transpose<number>();
        expect(result.isOk()).toBe(true);
        expect(result.unwrap().unwrap()).toBe('hello');
    });
});
