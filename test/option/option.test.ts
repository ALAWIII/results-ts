import { None, NoneImpl, Option, OptionSomeType, Some, SomeImpl } from '../src/index.js';
import { eq } from './util.js';

const someString = Some('foo');
const someNum = Some(10);

test('basic invariants', () => {
    expect(someString.isSome()).toBeTruthy();
    expect(someNum.isSome()).toBeTruthy();
    expect(None()).toEqual(None());
    expect(someString.unwrap()).toBe('foo');
    expect(someNum.unwrap()).toBe(10);

    expect(Option.isOption(someString)).toBe(true);
    expect(Option.isOption(someNum)).toBe(true);
    expect(Option.isOption(None())).toBe(true);
    expect(Option.isOption('foo')).toBe(false);

    expect(None().isSome()).toBe(false);
    expect(None().isNone()).toBe(true);
    expect(someNum.isSome()).toBe(true);
    expect(someNum.isNone()).toBe(false);
});

test('type narrowing', () => {
    const opt = None<string>();
    if (opt.isSome()) {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    } else {
        eq<typeof opt, NoneImpl<string>>(true);
    }

    if (!opt.isSome()) {
        eq<typeof opt, NoneImpl<string>>(true);
    } else {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    }

    if (opt.isNone()) {
        eq<typeof opt, NoneImpl<string>>(true);
    } else {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    }

    if (!opt.isNone()) {
        eq<typeof opt, SomeImpl<string>>(true);
        eq<typeof opt.value, string>(true);
    } else {
        eq<typeof opt, NoneImpl<string>>(true);
    }

    expect(someString).toBeInstanceOf(SomeImpl);
    expect(None).toEqual(None);
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
    const all2 = Option.all([some0, None<never>()]);
    expect(all2).toEqual(None());
    eq<typeof all2, Option<[number, never]>>(true);

    const all2Spread = Option.all(some0, None());
    expect(all2Spread).toEqual(None());
    eq<typeof all2Spread, Option<[number, never]>>(true);

    // Dynamic array
    const all3 = Option.all([] as Option<string>[]);
    eq<typeof all3, Option<string[]>>(true);

    const all3Spread = Option.all(...([] as Option<string>[]));
    eq<typeof all3Spread, Option<string[]>>(true);

    // Multiple with None in middle
    const all4 = Option.all([some0, some1, some2, None<never>()]);
    expect(all4).toMatchOption(None());
    eq<typeof all4, Option<[number, boolean, string, never]>>(true);

    const all4Spread = Option.all(some0, some1, some2, None());
    expect(all4Spread).toMatchOption(None());
    eq<typeof all4Spread, Option<[number, boolean, string, never]>>(true);
});

test('Option.any', () => {
    const some0: Option<number> = Some(3);
    const some1: Option<boolean> = Some(true);
    const some2: Option<string> = Some('hello');

    // Empty cases
    const any0 = Option.any([]);
    expect(any0).toEqual(None());
    eq<typeof any0, Option<never>>(true);

    const any0Spread = Option.any();
    expect(any0Spread).toEqual(None());
    eq<typeof any0Spread, Option<never>>(true);

    // All Some - returns first
    const any1 = Option.any([some0, some1]);
    expect(any1).toEqual(Some(3));
    eq<typeof any1, Option<number | boolean>>(true);

    const any1Spread = Option.any(some0, some1);
    expect(any1Spread).toEqual(Some(3));
    eq<typeof any1Spread, Option<number | boolean>>(true);

    // All None
    const any2 = Option.any([None<never>(), None<never>()]);
    expect(any2).toEqual(None());
    eq<typeof any2, Option<never>>(true);

    const any2Spread = Option.any(None(), None());
    expect(any2Spread).toEqual(None());
    eq<typeof any2Spread, Option<never>>(true);

    // Dynamic array
    const any3 = Option.any([] as Option<string>[]);
    eq<typeof any3, Option<string>>(true);

    const any3Spread = Option.any(...([] as Option<string>[]));
    eq<typeof any3Spread, Option<string>>(true);

    // None then Some
    const any4 = Option.any([None(), None(), some2, some0]);
    expect(any4).toEqual(Some('hello'));
    eq<typeof any4, Option<string | number>>(true);

    const any4Spread = Option.any(None(), None(), some2, some0);
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
    expect(`${None()}`).toEqual('None');
});

test('toAsyncOption()', async () => {
    expect(await Some(1).toAsyncOption().promise).toEqual(Some(1));
    expect(await None().toAsyncOption().promise).toEqual(None());
});

test('iteration', () => {
    const iterator = (Some(1) as Option<number>)[Symbol.iterator]();
    eq<Iterator<number>, typeof iterator>(true);

    expect(Array.from(Some(1))).toEqual([1]);
    expect(Array.from(None())).toEqual([]);
});

test('fromNullable', () => {
    const value = 'hello' as string | null;
    const result = Option.fromNullable(value);
    expect(result).toEqual(Some('hello'));
    eq<Option<string>, typeof result>(true);

    const missing = null as string | null;
    const resultMissing = Option.fromNullable(missing);
    expect(resultMissing).toEqual(None());
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
    expect(resultMissing).toEqual(None());
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
    expect(resultNull).toEqual(None());
    eq<Option<string>, typeof resultNull>(true);

    const missingUndefined = undefined as string | null | undefined;
    const resultUndefined = Option.fromNullish(missingUndefined);
    expect(resultUndefined).toEqual(None());
    eq<Option<string>, typeof resultUndefined>(true);

    // Falsy but non-nullish values → Some
    const zero = Option.fromNullish(0 as number | null | undefined);
    expect(zero).toEqual(Some(0));
    eq<Option<number>, typeof zero>(true);
});
