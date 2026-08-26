import { AsyncOption } from './asyncoption.js';
import { toString } from './utils.js';
import { Result, Ok, Err } from './result.js';
//===============================
type IsNever<T> = [T] extends [never] ? true : false;
//=========== used on transpose.
type TransposeOption<T> =
    IsNever<T> extends false
        ? T extends Result<infer U, infer E>
            ? Result<Option<U>, E>
            : Result<Option<T>, never>
        : Result<Option<T>, never>;

//====== used on flatten and collapse

type DeepFlatten<T> =
    IsNever<T> extends false
        ? T extends Option<infer U>
            ? IsNever<U> extends false
                ? DeepFlatten<U>
                : Option<U>
            : Option<T>
        : Option<T>;
type CollapseOption<T> = DeepFlatten<T>;
//======
type ReachedDepthCondintion<L extends number, D extends number> = L extends D ? true : false;
type DeepFlattenN<T, D extends number, Acc extends unknown[] = []> =
    ReachedDepthCondintion<Acc['length'], D> extends false
        ? IsNever<T> extends false
            ? T extends Option<infer U>
                ? DeepFlattenN<U, D, [...Acc, unknown]>
                : // if T isnt Option
                  Option<T>
            : // if T is never
              Option<T>
        : // if the depth was reached
          Option<T>;

type IsNonPositive<D extends number> = `${D}` extends `-${string}` ? true : D extends 0 ? true : false;
type CollapseOptionN<T, D extends number> = IsNonPositive<D> extends true ? Option<T> : DeepFlattenN<T, D>;
//=================================================
abstract class BaseOption<T> implements Iterable<T> {
    abstract [Symbol.iterator](): any;
    /** `true` when the Option is Some */
    abstract isSome(): this is SomeImpl<T>;
    /**
     * @returns `true` if the `option` is a `Some` and the value inside of it matches a `predicate`.
     * @example
     * const some = Some(5);
     * some.isSomeAnd((v) => v > 4); // true
     * some.isSomeAnd((v) => v < 0); // false
     *
     * const none = None;
     * none.isSomeAnd(); // false
     * none.isSomeAnd(() => true); //false
     */
    abstract isSomeAnd(f: (v: T) => boolean): boolean;
    /** `true` when the Option is None */
    abstract isNone(): boolean;
    /**
     * @returns `true` if the `option` is a `None` or the value inside of it matches a `predicate`.
     * @example
     * const some = Some(5);
     * some.isNoneOr((v) => v > 4); // true
     * some.isNoneOr((v) => v < 0); // false
     *
     * const none = None;
     * none.isNoneOr(); // true
     * none.isNoneOr(() => false); // true
     *
     */
    abstract isNoneOr(f: (v: T) => boolean): boolean;
    /**
     * Returns the contained `Some` value, if exists.  Throws an error if not.
     *
     * If you know you're dealing with `Some` and the compiler knows it too (because you tested
     * `isSome()` or `isNone()`) you should use `value` instead. While `Some`'s `expect()` and `value` will
     * both return the same value using `value` is preferable because it makes it clear that
     * there won't be an exception thrown on access.
     *
     * @param msg the message to throw if no Some value.
     */
    abstract expect(msg: string): any;

    /**
     * Returns the contained `Some` value.
     * Because this function may throw, its use is generally discouraged.
     * Instead, prefer to handle the `None` case explicitly.
     *
     * If you know you're dealing with `Some` and the compiler knows it too (because you tested
     * `isSome()` or `isNone()`) you should use `value` instead. While `Some`'s `unwrap()` and `value` will
     * both return the same value using `value` is preferable because it makes it clear that
     * there won't be an exception thrown on access.
     *
     * Throws if the value is `None`.
     */
    abstract unwrap(): T;

    /**
     * Returns the contained `Some` value or a provided default.
     *
     *  (This is the `unwrap_or` in rust)
     */
    abstract unwrapOr(val: T): any;

    /**
     * Returns the contained `Some` value or computes a value with a provided function.
     *
     * The function is called at most one time, only if needed.
     *
     * @example
     * ```
     * Some('OK').unwrapOrElse(
     *     () => { console.log('Called'); return 'UGH'; }
     * ) // => 'OK', nothing printed
     *
     * None.unwrapOrElse(() => 'UGH') // => 'UGH'
     * ```
     */
    abstract unwrapOrElse(f: () => T): any;

    /**
     * Calls `mapper` if the Option is `Some`, otherwise returns `None`.
     * This function can be used for control flow based on `Option` values.
     */
    abstract andThen<T2>(mapper: (val: T) => Option<T2>): Option<T2>;
    /**
     * @returns `None` if the Option is `None`.
     * @returns `optb` if the Option is `Some`.
     */
    abstract and<U>(optb: Option<U>): Option<U>;
    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained `Some` value,
     * leaving a `None` value untouched.
     *
     * This function can be used to compose the Options of two functions.
     */
    abstract map<U>(mapper: (val: T) => U): Option<U>;

    /**
     * Maps an `Option<T>` to `Option<U>` by either converting `T` to `U` using `mapper` (in case
     * of `Some`) or using the `default_` value (in case of `None`).
     *
     * If `default` is a result of a function call consider using `mapOrElse()` instead, it will
     * only evaluate the function when needed.
     */
    abstract mapOr<U>(default_: U, mapper: (val: T) => U): U;

    /**
     * Maps an `Option<T>` to `Option<U>` by either converting `T` to `U` using `mapper` (in case
     * of `Some`) or producing a default value using the `default` function (in case of `None`).
     */
    abstract mapOrElse<U>(default_: () => U, mapper: (val: T) => U): U;

    /**
     * Returns `Some()` if we have a value, otherwise returns `other`.
     *
     * `other` is evaluated eagerly. If `other` is a result of a function
     * call try `orElse()` instead – it evaluates the parameter lazily.
     *
     * @example
     *
     * Some(1).or(Some(2)) // => Some(1)
     * None.or(Some(2)) // => Some(2)
     */
    abstract or(other: Option<T>): Option<T>;

    /**
     * Returns `Some()` if we have a value, otherwise returns the result
     * of calling `other()`.
     *
     * `other()` is called *only* when needed.
     *
     * @example
     *
     * Some(1).orElse(() => Some(2)) // => Some(1)
     * None.orElse(() => Some(2)) // => Some(2)
     */
    abstract orElse(other: () => Option<T>): Option<T>;
    /**
     *
     * @returns `None` if the option is `None`.
     *
     * Otherwise calls predicate with the wrapped value and:
     * @returns `Some(t)` if predicate returns `true` (where t is the wrapped value)
     * @returns `None` if predicate returns `false`.
     * @example
     * ```typescript
     * const isEven = (v:number)=> n % 2 == 0 ;
     * const noneFilter = None.filter(isEven); // evaluates to `None` because Option is None.
     * const someFilter1 = Some(3).filter(isEven) // evaluates to `None` because filter calculates to `false`.
     * const someFilter2 = Some(4).filter(isEven) // evaluates to `Some(4)` because Option is Some and filter calculates to `true`.
     * ```
     */
    abstract filter(f: (v: T) => boolean): any;

    /**
     * Converts from `Option<Option<T>>` to `Option<T>`.
     * @returns `None` if `this` is `None`, `Some(None)`.
     * @returns `Some(T)` if `this` is `Some(T)` or `Some(Some(T))`.
     * @example
     *```typescript
     * const none1 = None.flatten(); // evaluates to None.
     * const none2 = Some(None).flatten(); // evaluates to None.
     * const none3 = Some(5).flatten(); // evaluates to Some(5).
     *
     * const some1 = Some(Some(4)); // evaluates to Some(4).
     * const some2 = Some(Some(Some(4))); // evaluates to Some(Some(4)).
     * ```
     */
    flatten(): CollapseOptionN<T, 1> {
        return this.collapse(1);
    }
    /**
     * Recursively flattens nested `Option` types to a specified depth or completely.
     *
     * Unlike `flatten()` which only removes one layer of nesting, `collapse()` can remove
     * multiple layers at once, making it useful for working with deeply nested optional values.
     *
     * @param depth - Number of nesting levels to remove (default: `Infinity`)
     *   - If `depth = 0`, returns `this` unchanged
     *   - If `depth = 1`, equivalent to `flatten()`
     *   - If `depth` is omitted or `Infinity`, flattens all layers completely
     *   - Negative depths return `this` unchanged
     *
     * @returns `Option<U>` where `U` is the innermost non-`Option` type
     *
     * @example
     * // Basic flattening
     * const nested = Some(Some(Some(5)));
     * nested.collapse()     // Some(5) - flattens all layers
     * nested.collapse(1)    // Some(Some(5)) - one layer removed
     * nested.collapse(2)    // Some(5) - two layers removed
     *
     * @example
     * // Handling None values
     * Some(None).collapse()       // None
     * Some(Some(None)).collapse() // None
     * Some(Some(None)).collapse(1) // Some(None) - partial flatten
     *
     * @example
     * // Non-nested values become None (flatten removes the only layer)
     * Some(42).collapse()    // None
     * Some(42).collapse(0)   // Some(42) - preserve with depth 0
     *
     * @example
     * // Type inference for chaining
     * const result = Some(Some(Some(10)))
     *   .collapse()
     *   .map(x => x * 2);     // x inferred as number ✅
     * // result: Some(20)
     *
     * @example
     * // Infinite depth (default behavior)
     * const deeplyNested = Some(Some(Some(Some(Some("hello")))));
     * deeplyNested.collapse() // Some("hello")
     *
     * @example
     * // Works with mixed types - stops at first non-Option
     * const mixed = Some(Some({ value: 5 }));
     * mixed.collapse()  // Some({ value: 5 }) - stops because object is not Option
     * mixed.collapse(1) // Some({ value: 5 }) - same result
     *
     * @see flatten - Removes only one layer of nesting
     * @see andThen - For chaining operations that return Options
     */
    collapse(): CollapseOption<T>;
    collapse<D extends number>(depth: D): CollapseOptionN<T, D>;
    collapse(depth: number = Infinity): any {
        if (depth <= 0 || !this.isSome() || !Option.isOption(this.unwrap())) return this;
        let result = this as any;
        let remaining = depth;
        while (remaining > 0 && result.isSome() && Option.isOption(result.unwrap())) {
            result = result.unwrap();
            remaining--;
        }
        return result;
    }

    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.
     * @example
     * Some(4).okOr('err'); // evaluates to Ok(4).
     * None.okOr('your error'); // evaluates to Err('your error').
     */
    abstract okOr<E>(err: E): Result<T, E>;
    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
     * @example
     * const errFun = ()=> 'your error';
     *
     * const some = Some(6).okOrElse(errFun); // evaluates to Ok(6)
     *
     * const none = None.okOrElse(errFun); // evaluates to Err('err')
     *
     */
    abstract okOrElse<E>(err: () => E): Result<T, E>;
    /**
     * Returns `Some` if exactly one of `self` or `other` is `Some`, otherwise returns `None`.
     *
     * This is the logical exclusive-or (XOR) operation for Options.
     *
     * @param other - The other Option to compare with
     * @returns `Some` containing the value if exactly one Option is `Some`, otherwise `None`
     *
     * @example
     * // Both are Some → returns None
     * Some(6).xor(Some(4)); // => None
     *
     * @example
     * // Self is Some, other is None → returns self
     * Some(6).xor(None); // => Some(6)
     *
     * @example
     * // Both are None → returns None
     * None.xor(None); // => None
     *
     * @example
     * // Self is None, other is Some → returns other
     * None.xor(Some(5)); // => Some(5)
     *
     *
     * @see {@link and} - Returns None if self is None, otherwise returns other
     * @see {@link or} - Returns self if Some, otherwise returns other
     */
    abstract xor(other: Option<T>): Option<T>;
    /**
     * Transposes an `Option` of a `Result` into a `Result` of an `Option`.
     *
     * If the `Option` is `None`, returns `Ok(None)`.
     * If the `Option` is `Some` containing a `Result`:
     *   - `Some(Ok(value))` → `Ok(Some(value))`
     *   - `Some(Err(error))` → `Err(error)`
     * If the `Option` is `Some` containing a non-`Result` value, returns `Ok(Some(value))`.
     *
     * @typeParam U - The success type of the inner Result (if T is a Result)
     * @typeParam E - The error type of the inner Result (if T is a Result)
     * @returns `Result<Option<T | U>, E>` - transposed Result containing an Option
     *
     * @example
     * // Option of Ok Result → Ok(Some(value))
     * const x = Some(Ok(5));
     * const result = x.transpose(); // => Ok(Some(5))
     *
     * @example
     * // Option of Err Result → Err(error)
     * const x = Some(Err("failed"));
     * const result = x.transpose(); // => Err("failed")
     *
     * @example
     * // None → Ok(None)
     * const result = None.transpose(); // => Ok(None)
     *
     * @example
     * // Some with non-Result value → Ok(Some(value))
     * const x = Some(42);
     * const result = x.transpose(); // => Ok(Some(42))
     *
     * @example
     * // Useful for collecting Results from Options
     * // Before: Option<Result<number, string>>
     * // After:  Result<Option<number>, string>
     *
     * function parseNumber(s: string): Result<number, string> {
     *   const num = parseInt(s);
     *   return isNaN(num) ? Err(`Invalid: ${s}`) : Ok(num);
     * }
     *
     * const opt = Some(parseNumber("123"));
     * const result = opt.transpose(); // => Ok(Some(123))
     *
     * @see {@link Result.transpose} - Inverse operation (Result<Option<T>, E> → Option<Result<T, E>>)
     */
    transpose(): TransposeOption<T>;
    transpose(): any {
        if (this.isSome()) {
            const someValue = this.unwrap() as T;
            if (Result.isResult(someValue)) {
                if (someValue.isOk()) {
                    return Ok(Some(someValue.value));
                }
                return someValue;
            }
            return Ok(Some(someValue));
        }
        return this;
    }
    /**
     * Creates an `AsyncOption` based on this `Option`.
     *
     * Useful when you need to compose results with asynchronous code.
     */
    abstract toAsyncOption(): any;
}

/**
 * Contains the None value
 */
export class NoneImpl<T> extends BaseOption<T> {
    isSome(): this is SomeImpl<never> {
        return false;
    }
    isNone(): this is NoneImpl<T> {
        return true;
    }
    isSomeAnd(_f?: (v: T) => boolean): boolean {
        return false;
    }
    isNoneOr(_f?: (v: T) => boolean): boolean {
        return true;
    }
    [Symbol.iterator](): Iterator<never, never, any> {
        return {
            next(): IteratorResult<never, never> {
                return { done: true, value: undefined! };
            },
        };
    }

    unwrapOr(val: T): T {
        return val;
    }

    unwrapOrElse(f: () => T): T {
        return f();
    }

    expect(msg: string): T {
        throw new Error(`${msg}`);
    }

    unwrap(): never {
        throw new Error(`Tried to unwrap None`);
    }

    map<U>(_mapper?: (val: T) => U): Option<U> {
        return None();
    }

    mapOr<U>(default_: U, _mapper?: (val: T) => U): U {
        return default_;
    }

    mapOrElse<U>(default_: () => U, _mapper?: (val: T) => U): U {
        return default_();
    }

    or(other: Option<T>): Option<T> {
        return other;
    }

    orElse(other: () => Option<T>): Option<T> {
        return other();
    }

    andThen<U>(_mapper?: (val: T) => Option<U>): Option<U> {
        return None();
    }
    and<U>(_optb?: Option<U>): Option<U> {
        return None();
    }
    filter(_f?: (v: T) => boolean): Option<T> {
        return None();
    }

    okOr<E>(error: E): Result<T, E> {
        return Err(error);
    }
    okOrElse<E>(err: () => E): Result<T, E> {
        return Err(err());
    }
    xor(other: Option<T>): Option<T> {
        return other;
    }

    toString(): string {
        return 'None';
    }

    toAsyncOption(): AsyncOption<T> {
        return new AsyncOption<T>(None<T>());
    }
}

// Export None as a singleton, then freeze it so it can't be modified
export type None<T = never> = Option<T>;

export function None<T = never>(): Option<T> {
    return new NoneImpl<T>();
}
/**
 * Contains the success value
 */
export class SomeImpl<T> extends BaseOption<T> {
    /**
     * An empty Some
     *
     * @example
     * ```typescript
     * const x: Option<void> = Some.EMPTY
     * ```
     */
    static readonly EMPTY = new SomeImpl<void>(undefined);
    readonly value!: T;

    [Symbol.iterator](): Iterator<T> {
        return [this.value][Symbol.iterator]();
    }

    constructor(val: T) {
        super();
        this.value = val;
    }

    isSome(): this is SomeImpl<T> {
        return true;
    }
    isSomeAnd(f: (v: T) => boolean): boolean {
        return f(this.value);
    }
    isNone(): this is NoneImpl<T> {
        return false;
    }
    isNoneOr(f: (v: T) => boolean): boolean {
        return f(this.value);
    }

    unwrapOr(_val?: T): T {
        return this.value;
    }

    unwrapOrElse(_f?: () => T): T {
        return this.value;
    }

    unwrap(): T {
        return this.value;
    }
    expect(_msg?: string): T {
        return this.value;
    }

    map<U>(mapper: (val: T) => U): Option<U> {
        return Some(mapper(this.value));
    }

    mapOr<U>(_default_: U, mapper: (val: T) => U): U {
        return mapper(this.value);
    }

    mapOrElse<U>(_default_: () => U, mapper: (val: T) => U): U {
        return mapper(this.value);
    }

    or(_other?: Option<T>): Option<T> {
        return this;
    }

    orElse(_other?: () => Option<T>): Option<T> {
        return this;
    }

    andThen<U>(mapper: (val: T) => Option<U>): Option<U> {
        return mapper(this.value);
    }
    and<U>(optb: Option<U>): Option<U> {
        return optb;
    }
    filter(f: (v: T) => boolean): Option<T> {
        return f(this.value) ? this : None();
    }

    okOr<E>(_error?: E): Result<T, E> {
        return Ok(this.value);
    }
    okOrElse<E>(_err?: () => E): Result<T, E> {
        return Ok(this.value);
    }
    xor(other: Option<T>): Option<T> {
        return other.isNone() ? this : None();
    }
    toAsyncOption(): AsyncOption<T> {
        return new AsyncOption<T>(this);
    }

    toString(): string {
        return `Some(${toString(this.value)})`;
    }
}

export type Some<T> = Option<T>;
export function Some<T>(val: T): Option<T> {
    return new SomeImpl(val);
}
export type Option<T> = SomeImpl<T> | NoneImpl<T>;

export type OptionSomeType<T extends Option<any>> = T extends SomeImpl<infer U> ? U : never;

export type OptionSomeTypes<T extends Option<any>[]> = {
    [key in keyof T]: T[key] extends Option<any> ? OptionSomeType<T[key]> : never;
};

export namespace Option {
    /**
     * Parse a set of `Option`s, returning an array of all `Some` values.
     * Short circuits with the first `None` found, if any.
     *
     * @example
     * ```typescript
     * let options: Option<number>[] = [Some(1), Some(2), Some(3)];
     * Option.all(options); // Some([1, 2, 3]), type: Option<number[]>
     *
     * // Short-circuits on first None
     * let optionsWithNone: Option<number>[] = [Some(1), None, Some(3)];
     * Option.all(optionsWithNone); // None, type: Option<number[]>
     * ```
     */
    export function all<const T extends Option<any>[]>(options: T): Option<OptionSomeTypes<T>>;
    /**
     * Parse a set of `Option`s, returning an array of all `Some` values.
     * Short circuits with the first `None` found, if any.
     *
     * @deprecated Pass an array instead of using spread arguments. This overload
     * will be removed in a future version.
     */
    export function all<T extends Option<any>[]>(...options: T): Option<OptionSomeTypes<T>>;
    export function all<T extends Option<any>[]>(
        first?: T | T[number],
        ...rest: Option<any>[]
    ): Option<OptionSomeTypes<T>> {
        const options: Option<any>[] = first === undefined ? [] : Array.isArray(first) ? first : [first, ...rest];

        const someOption = [];
        for (let option of options) {
            if (option.isSome()) {
                someOption.push(option.value);
            } else {
                return option as None;
            }
        }

        return Some(someOption as OptionSomeTypes<T>);
    }

    /**
     * Parse a set of `Option`s, short-circuits when an input value is `Some`.
     * If no `Some` is found, returns `None`.
     *
     * @example
     * ```typescript
     * let options: Option<number>[] = [None, Some(1), Some(2)];
     * Option.any(options); // Some(1), type: Option<number>
     *
     * Option.any([None, None, Some(3)]); // Some(3), type: Option<number>
     * Option.any([None, None, None]); // None, type: Option<never>
     * ```
     */
    export function any<const T extends Option<any>[]>(options: T): Option<OptionSomeTypes<T>[number]>;
    /**
     * Parse a set of `Option`s, short-circuits when an input value is `Some`.
     * If no `Some` is found, returns `None`.
     *
     * @deprecated Pass an array instead of using spread arguments. This overload
     * will be removed in a future version.
     */
    export function any<T extends Option<any>[]>(...options: T): Option<OptionSomeTypes<T>[number]>;
    export function any<T extends Option<any>[]>(
        first?: T | T[number],
        ...rest: Option<any>[]
    ): Option<OptionSomeTypes<T>[number]> {
        const options: Option<any>[] = first === undefined ? [] : Array.isArray(first) ? first : [first, ...rest];

        // short-circuits
        for (const option of options) {
            if (option.isSome()) {
                return option as SomeImpl<OptionSomeTypes<T>[number]>;
            } else {
                continue;
            }
        }

        // it must be None
        return None();
    }

    export function isOption<T = any>(value: unknown): value is Option<T> {
        return value instanceof SomeImpl || value instanceof NoneImpl;
    }

    /**
     * Converts a nullable value to an {@link Option}.
     * Returns {@link None} if the value is `null`, otherwise returns {@link SomeImpl} containing the value.
     *
     * See also {@link fromOptional} for `T | undefined` and {@link fromNullish} for `T | null | undefined`.
     *
     * @example
     * ```typescript
     * const value: string | null = 'hello';
     * Option.fromNullable(value); // Some('hello'), type: Option<string>
     *
     * const missing: string | null = null;
     * Option.fromNullable(missing); // None, type: Option<string>
     * ```
     */
    export function fromNullable<T>(value: T): Option<Exclude<T, null>> {
        return (value === null ? None() : Some(value)) as Option<Exclude<T, null>>;
    }

    /**
     * Converts an optional value to an {@link Option}.
     * Returns {@link None} if the value is `undefined`, otherwise returns {@link SomeImpl} containing the value.
     *
     * See also {@link fromNullable} for `T | null` and {@link fromNullish} for `T | null | undefined`.
     *
     * @example
     * ```typescript
     * const value: string | undefined = 'hello';
     * Option.fromOptional(value); // Some('hello'), type: Option<string>
     *
     * const missing: string | undefined = undefined;
     * Option.fromOptional(missing); // None, type: Option<string>
     * ```
     */
    export function fromOptional<T>(value: T): Option<Exclude<T, undefined>> {
        return (value === undefined ? None() : Some(value)) as Option<Exclude<T, undefined>>;
    }

    /**
     * Converts a nullish value to an {@link Option}.
     * Returns {@link None} if the value is `null` or `undefined`, otherwise returns {@link SomeImpl} containing the value.
     *
     * Prefer {@link fromNullable} for `T | null` or {@link fromOptional} for `T | undefined`.
     * Use this method only when the value is already both nullable and optional and you genuinely
     * want `null` and `undefined` to be treated the same.
     *
     * @example
     * ```typescript
     * const value: string | null | undefined = 'hello';
     * Option.fromNullish(value); // Some('hello'), type: Option<string>
     *
     * const missing: string | null | undefined = null;
     * Option.fromNullish(missing); // None, type: Option<string>
     * ```
     */
    export function fromNullish<T>(value: T): Option<NonNullable<T>> {
        return value === null || value === undefined ? None() : Some(value);
    }
}
