import { toString } from './utils.js';
import { Option, None, Some } from './option.js';
import { AsyncResult } from './asyncresult.js';

//=================================== transpose helpers
/**
 * used in transpose implementation.
 * - if `T` is `Some<U>` if yes then if `E` is provided return `Result<U, E>` otherwise return `OkImpl<U>`.
 * - if `T` is `None` return `None`
 * - otherwise: wrap `T` with `Some<OkImpl<U>>` or `Result<U,E>` and return it.
 */
type TransposeResult<T, E> =
    IsNever<T> extends false
        ? T extends Option<infer U>
            ? Option<Result<U, E>>
            : Option<Result<T, E>>
        : Option<Result<T, E>>;
//========================= flatten related types.

/**
 * checks if a given value is never.
 */
type IsNever<V> = [V] extends [never] ? true : false;

//===========================
/**
 *  Full flatten (no depth bound) — used when no depth arg is given

 */
type DeepFlatten<T, E> =
    IsNever<T> extends false
        ? T extends Result<infer InnerT, infer InnerE>
            ? IsNever<InnerT> extends false
                ? DeepFlatten<InnerT, InnerE>
                : // if InnerT is never
                  Result<InnerT, InnerE>
            : // if T isn't never and Result
              Result<T, E>
        : // if T is never
          Result<T, E>;
type CollapseResult<T, E> = DeepFlatten<T, E>;

// Flatten up to depth D while maintaining pristine Result structures
type ReachedDepthCondintion<L extends number, D extends number> = L extends D ? true : false;
type DeepFlattenN<T, E, D extends number, Acc extends unknown[] = []> =
    ReachedDepthCondintion<Acc['length'], D> extends false
        ? IsNever<T> extends false
            ? T extends Result<infer InnerT, infer InnerE>
                ? DeepFlattenN<InnerT, InnerE, D, [...Acc, unknown]>
                : // if T isnt never neither Result
                  Result<T, E>
            : // if T is never
              Result<T, E>
        : // if the depth was reached
          Result<T, E>;

type IsNonPositive<D extends number> = `${D}` extends `-${string}` ? true : D extends 0 ? true : false;
type CollapseResultN<T, E, D extends number> = IsNonPositive<D> extends true ? Result<T, E> : DeepFlattenN<T, E, D>;

//=======================================================
abstract class BaseResult<T, E> implements Iterable<T> {
    abstract [Symbol.iterator](): any;
    /** `true` when the result is Ok */
    abstract isOk(): this is OkImpl<T, E>;

    /**
     * Returns true if the result is Ok and the value inside of it matches a predicate
     */
    abstract isOkAnd(f: (v: T) => boolean): boolean;
    /** `true` when the result is Err */
    abstract isErr(): this is ErrImpl<E, T>;

    /**
     * Returns true if the result is Err and the value inside of it matches a predicate
     */
    abstract isErrAnd(f: (e: E) => boolean): boolean;
    /**
     * Returns the contained `Ok` value, if exists.  Throws an error if not.
     *
     * The thrown error's
     * [`cause'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
     * is set to value contained in `Err`.
     *
     * If you know you're dealing with `Ok` and the compiler knows it too (because you tested
     * `isOk()` or `isErr()`) you should use `value` instead. While `Ok`'s `expect()` and `value` will
     * both return the same value using `value` is preferable because it makes it clear that
     * there won't be an exception thrown on access.
     *
     * @param msg the message to throw if no Ok value.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.expect('goodResult should be a number'); // 1
     * badResult.expect('badResult should be a number'); // throws Error("badResult should be a number - Error: something went wrong")
     * ```
     */
    abstract expect(msg: string): T;

    /**
     * Returns the contained `Err` value, if exists.  Throws an error if not.
     * @param msg the message to throw if no Err value.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.expectErr('goodResult should not be a number'); // throws Error("goodResult should not be a number")
     * badResult.expectErr('badResult should not be a number'); // new Error('something went wrong')
     * ```
     */
    abstract expectErr(msg: string): E;

    /**
     * Returns the contained `Ok` value.
     * Because this function may throw, its use is generally discouraged.
     * Instead, prefer to handle the `Err` case explicitly.
     *
     * If you know you're dealing with `Ok` and the compiler knows it too (because you tested
     * `isOk()` or `isErr()`) you should use `value` instead. While `Ok`'s `unwrap()` and `value` will
     * both return the same value using `value` is preferable because it makes it clear that
     * there won't be an exception thrown on access.
     *
     * Throws if the value is an `Err`, with a message provided by the `Err`'s value and
     * [`cause'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
     * set to the value.
     *
     * @example
     * ```typescript
     * let goodResult = new Ok(1);
     * let badResult = new Err(new Error('something went wrong'));
     *
     * goodResult.unwrap(); // 1
     * badResult.unwrap(); // throws Error("something went wrong")
     * ```
     */
    abstract unwrap(): T;

    /**
     * Returns the contained `Err` value.
     * Because this function may throw, its use is generally discouraged.
     * Instead, prefer to handle the `Ok` case explicitly and access the `error` property
     * directly.
     *
     * Throws if the value is an `Ok`, with a message provided by the `Ok`'s value and
     * [`cause'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
     * set to the value.
     *
     * @example
     * ```typescript
     * let goodResult = new Ok(1);
     * let badResult = new Err('something went wrong');
     *
     * goodResult.unwrapErr(); // throws an exception
     * badResult.unwrapErr(); // returns 'something went wrong'
     * ```
     */
    abstract unwrapErr(): E;

    /**
     * Returns the contained `Ok` value or a provided default.
     *
     *  (This is the `unwrap_or` in rust)
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.unwrapOr(5); // 1
     * badResult.unwrapOr(5); // 5
     * ```
     */
    abstract unwrapOr(val: T): T;

    /**
     * Returns the contained `Ok` value or computes a value with a provided function.
     *
     * The function is called at most one time, only if needed.
     *
     * @example
     *
     * ```typescript
     * Ok('OK').unwrapOrElse(
     *     (error) => { console.log(`Called, got ${error}`); return 'UGH'; }
     * ) // => 'OK', nothing printed
     *
     * Err('A03B').unwrapOrElse((error) => `UGH, got ${error}`) // => 'UGH, got A03B'
     * ```
     */
    abstract unwrapOrElse(f: (error: E) => T): T;

    /**
     * Calls `mapper` if the result is `Ok`, otherwise returns the `Err` value of self.
     * This function can be used for control flow based on `Result` values.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.andThen((num) => new Ok(num + 1)).unwrap(); // 2
     * badResult.andThen((num) => new Err(new Error('2nd error'))).unwrap(); // throws Error('something went wrong')
     * goodResult.andThen((num) => new Err(new Error('2nd error'))).unwrap(); // throws Error('2nd error')
     *
     * goodResult
     *     .andThen((num) => new Ok(num + 1))
     *     .mapErr((err) => new Error('mapped'))
     *     .unwrap(); // 2
     * badResult
     *     .andThen((num) => new Err(new Error('2nd error')))
     *     .mapErr((err) => new Error('mapped'))
     *     .unwrap(); // throws Error('mapped')
     * goodResult
     *     .andThen((num) => new Err(new Error('2nd error')))
     *     .mapErr((err) => new Error('mapped'))
     *     .unwrap(); // throws Error('mapped')
     * ```
     */
    abstract andThen<U>(mapper: (val: T) => Result<U, E>): any;

    /**
     * Returns `res` if the result is `Ok`, otherwise returns the `Err` value of self.
     *
     * @example
     * ```typescript
     * const err = Err(3);
     * const errAndErr= err.and(Err(8));
     * const errAndOk= err.and(Ok(9))
     * console.log(errAndOk,errAndErr) // prints Err(3),Err(3)
     * //===========
     * const ok = Ok(5);
     * const okAndErr= ok.and(Err(8));
     * console.log(okAndErr) // prints Err(8)
     * const okAndOk = ok.and(Ok(9));
     * console.log(okAndOk) // prints Ok(9)
     * ```
     */
    abstract and<U>(res: Result<U, E>): any;
    /**
     * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained `Ok` value,
     * leaving an `Err` value untouched.
     *
     * This function can be used to compose the results of two functions.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.map((num) => num + 1).unwrap(); // 2
     * badResult.map((num) => num + 1).unwrap(); // throws Error("something went wrong")
     * ```
     */
    abstract map<U>(mapper: (v: T) => U): any;

    /**
     * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained `Err` value,
     * leaving an `Ok` value untouched.
     *
     * This function can be used to pass through a successful result while handling an error.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult
     *     .map((num) => num + 1)
     *     .mapErr((err) => new Error('mapped'))
     *     .unwrap(); // 2
     * badResult
     *     .map((num) => num + 1)
     *     .mapErr((err) => new Error('mapped'))
     *     .unwrap(); // throws Error("mapped")
     * ```
     */
    abstract mapErr<F>(mapper: (val: E) => F): any;

    /**
     * Returns the mapped value `U` if `Ok`, using `mapper` on the contained value,
     * or returns `default_` if `Err`. Unlike `map`, this always returns a plain `U`,
     * not a `Result<U, E>`.
     *
     * If `default` is a result of a function call consider using `mapOrElse` instead, it will
     * only evaluate the function when needed.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.mapOr(0, (value) => -value) // -1
     * badResult.mapOr(0, (value) => -value) // 0
     * ```
     */
    abstract mapOr<U>(default_: U, mapper: (val: T) => U): U;

    /**
     * Returns a value of type `U` by:
     * - applying `mapper` to the contained value if this is `Ok(T)`, or
     * - applying `default_` to the error if this is `Err(E)`.
     *
     * Unlike `map` or `mapErr`, this method always returns a plain `U`, not a `Result<U, E>`.
     * Use this when you want to fully unwrap the `Result` and provide a fallback computed from the error.
     *
     * `default_` is called lazily, only when the result is `Err`.
     *
     * @example
     * ```typescript
     * let goodResult = Ok(1);
     * let badResult = Err(new Error('something went wrong'));
     *
     * goodResult.mapOrElse((_error) => 0, (value) => -value) // -1
     * badResult.mapOrElse((_error) => 0, (value) => -value) // 0
     * ```
     */
    abstract mapOrElse<U>(default_: (error: E) => U, mapper: (val: T) => U): U;

    /**
     * Returns `Ok()` if we have a value, otherwise returns `other`.
     *
     * `other` is evaluated eagerly. If `other` is a result of a function
     * call try `orElse()` instead – it evaluates the parameter lazily.
     *
     * @example
     *
     * Ok(1).or(Ok(2)) // => Ok(1)
     * Err('error here').or(Ok(2)) // => Ok(2)
     */
    abstract or<F>(other?: Result<T, F>): any;
    /**
     * Returns `Ok()` if we have a value, otherwise returns the result
     * of calling `other()`.
     *
     * `other()` is called *only* when needed and is passed the error value in a parameter.
     *
     * @example
     *
     * Ok(1).orElse(() => Ok(2)) // => Ok(1)
     * Err('error').orElse(() => Ok(2)) // => Ok(2)
     */
    abstract orElse<F>(other?: (error: E) => Result<T, F>): any;

    /**
     *  Converts from `Result<T, E>` to `Option<T>`, discarding the error if any
     *
     *  Similar to rust's `ok` method
     *
     * @example
     *
     * Ok(5).ok() // evaluates to Some(5)
     * Err('your error').ok() // evaluates to None
     */
    abstract ok(): Option<T>;
    /**
     *  Converts from `Result<T, E>` to `Option<E>`, discarding the value if any
     *
     *  Similar to rust's `err` method
     *
     * @example
     *
     * Err('your error').err() // evaluates to Some('your error')
     * Ok(5).err() // evaluates to None
     *
     */
    abstract err(): Option<E>;
    /**
     * Creates an `AsyncResult` based on this `Result`.
     *
     * Useful when you need to compose results with asynchronous code.
     */
    abstract toAsyncResult(): AsyncResult<T, E>;
    /**
     *
     * Calls a function with a reference to the contained value if `Ok`.
     *
     * @returns the original result
     *
     * @example
     * ```typescript
     * const ok  = Ok(5).inspect((v)=>console.log(v+1)); // accepts a mandatory closure parameter.
     * const err = Err('Failure').inspect(); // doesnt accept any parameter as its not intended to be used on `Err`.
     * const errResult = (Err('Failure') as Result<number,string>).inspect((v)=>console.log(v)); // since its of type Result it accepts the closure but its useless.
     * ```
     */
    abstract inspect(f: (v: T) => void): Result<T, E>;
    /**
     *
     * Calls a function with a reference to the contained value if `Err`.
     *
     * @returns the original result
     *
     * @example
     * ```typescript
     * const err = Err('Failure').inspectErr((e)=>console.log(e)); // accepts a mandatory closure parameter.
     * const ok  = Ok(5).inspectErr(); // doesnt accept any parameter as its not intended to be used on `Ok`.
     * const okResult = (Ok(5) as Result<number,string>).inspectErr((v)=>console.log(v)); // since its of type Result it accepts the closure but its useless.
     * ```
     */
    abstract inspectErr(f: (v: E) => void): Result<T, E>;
    /**
     * Flattens a nested Result structure.
     *
     * When a Result contains another Result as its value, `flatten()` extracts the inner Result,
     * effectively collapsing `Result<Result<T, E>, E>` into `Result<T, E>`.
     *
     * **Type Parameters:**
     * - `U = T`: The success type of the inner Result if it exists
     * - `E2 = E`: The error type of the inner Result if it exists
     *
     * **Returns:** `Result<U | T, E | E2>`
     * - If `Ok` contains another `Result`, returns the inner Result directly
     * - If `Ok` contains a non-Result value `T`, returns `Ok<T>`
     * - If `Err`, returns itself unchanged (Err is terminal)
     *
     * **Use Cases:**
     * - Working with APIs that return `Result` within `Result`
     * @example
     * // Basic flattening - Ok contains Ok
     * const result = Ok(Ok(42)).flatten();
     * console.log(result.unwrap()); // 42
     *
     * @example
     * // Flattening with nested Err
     * const result = Ok(Err('database error')).flatten();
     * console.log(result.unwrapErr()); // 'database error'
     *
     * @example
     * // No-op on non-nested values
     * const result = Ok(42).flatten();
     * console.log(result.unwrap()); // 42
     *
     * @example
     * // Err is returned unchanged
     * const result = Err('failure').flatten();
     * console.log(result.unwrapErr()); // 'failure'
     *
     * @see {@link andThen} for chaining operations without flattening
     * @see {@link map} for transforming the success value
     */
    flatten(): CollapseResultN<T, E, 1> {
        return this.collapse(1);
    }
    /**
     * Recursively flattens nested Results up to a specified depth.
     *
     * Unlike `flatten()` which only collapses one level, `collapse()` can flatten
     * multiple nested layers of `Result<Result<Result<T>>>` in one operation.
     *
     * **Type Parameters:**
     * - `U = T`: The success type of inner Results
     * - `E2 = E`: The error type of inner Results
     *
     * **Parameters:**
     * - `depth: number` (default: `Infinity`): Maximum number of levels to flatten
     *
     * **Returns:** `Result<U | T, E | E2>`
     * - Flattens `depth` levels of nested Results
     * - Stops early if a non-Result value or `Err` is encountered
     * - Depth of `0` returns the Result unchanged
     * - Negative depth returns the Result unchanged
     * - `Infinity` flattens all the way
     *
     * @example
     * // Flatten all levels (default)
     * Ok(Ok(Ok(42))).collapse()     // Ok(42)
     *
     * @example
     * // Flatten exactly 2 levels
     * Ok(Ok(Ok(Ok(42)))).collapse(2) // Ok(Ok(42))
     *
     * @example
     * // No flattening
     * Ok(Ok(42)).collapse(0)         // Ok(Ok(42))
     *
     * @example
     * // Stops at Err
     * Ok(Ok(Err('fail'))).collapse() // Err('fail')
     *
     * @example
     * // Stops at non-Result
     * Ok(Ok(42)).collapse(5)         // Ok(42) - 42 isn't a Result
     *
     * @example
     * // Mixed depths
     * const data = Ok(Ok(Ok(Ok({ id: 1 }))));
     * data.collapse(1) // Ok(Ok(Ok({ id: 1 })))
     * data.collapse(3) // Ok({ id: 1 })
     *
     * @see {@link flatten} - For single-level flattening
     * @see {@link andThen} - For chaining operations
     */
    collapse(): CollapseResult<T, E>;
    collapse<D extends number>(depth: D): CollapseResultN<T, E, D>;
    collapse(depth: number = Infinity): any {
        if (depth <= 0 || !this.isOk() || !Result.isResult(this.unwrap())) return this;
        let result = this as any;
        let remaining = depth;
        while (remaining > 0 && result.isOk() && Result.isResult(result.unwrap())) {
            result = result.unwrap();
            remaining--;
        }
        return result;
    }
    /**
     * Transposes a `Result` of an `Option` into an `Option` of a `Result`.
     *
     * This method swaps the layers of `Result` and `Option`:
     * - `Ok(Some(value))` → `Some(Ok(value))`
     * - `Ok(None)` → `None`
     * - `Err(error)` → `Some(Err(error))`
     *
     * For `Ok` variants that do not contain an `Option`, the operation is idempotent,
     * returning `Some(Ok(originalValue))`.
     *
     * @typeparam T2 - The inner success type extracted from `Option<T>`. If `T` is not an `Option`,
     *                 `T2` defaults to `T` to preserve idempotency.
     * @typeparam E2 - The error type, defaulting to `E`.
     * @returns An `Option` containing a `Result`:
     *          - `Some(Ok(value))` if the original was `Ok(Some(value))`
     *          - `None` if the original was `Ok(None)`
     *          - `Some(Err(error))` if the original was `Err(error)`
     *
     * @example
     * // Basic usage with Option
     * const result1 = Ok(Some(42));
     * const transposed1 = result1.transpose(); // Some(Ok(42))
     *
     * const result2 = Ok(None);
     * const transposed2 = result2.transpose(); // None
     *
     * const result3 = Err("error");
     * const transposed3 = result3.transpose(); // Some(Err("error"))
     *
     * @example
     * // Idempotency with non-Option values
     * const result = Ok("hello");
     * const transposed = result.transpose(); // Some(Ok("hello"))
     *
     * @example
     * // Chaining with other operations
     * const result = Ok(Some(10));
     * const value = result
     *   .transpose()           // Some(Ok(10))
     *   .unwrap()              // Ok(10)
     *   .map(x => x * 2)       // Ok(20)
     *   .unwrap();             // 20
     *
     * @example
     * // Handling errors
     * const result = Err("not found");
     * const opt = result.transpose(); // Some(Err("not found"))
     * if (opt.isSome()) {
     *   const errResult = opt.unwrap(); // Err("not found")
     *   console.error(errResult); // Err("not found")
     * }
     *
     */
    transpose(): TransposeResult<T, E>;
    transpose(): any {
        if (this.isErr()) return Some(this);
        const opt = this.unwrap();
        if (!Option.isOption(opt)) return Some(Ok(opt));
        return opt.isSome() ? Some(Ok(opt.unwrap())) : None();
    }
}

/**
 * Contains the error value
 */
export class ErrImpl<E, T> extends BaseResult<T, E> {
    /**
     * An empty Err
     *
     * @example
     * ```typescript
     * const x: Result<string, void> = Err.EMPTY
     * ```
     */
    static readonly EMPTY = new ErrImpl<void, void>(undefined);
    readonly error!: E;

    constructor(val: E) {
        super();
        this.error = val;
    }
    [Symbol.iterator](): Iterator<never, never, any> {
        return {
            next(): IteratorResult<never, never> {
                return { done: true, value: undefined! };
            },
        };
    }
    isOk(): this is OkImpl<T, E> {
        return false;
    }
    isOkAnd(_f?: (v: never) => boolean): boolean {
        return false;
    }
    isErr(): this is ErrImpl<E, T> {
        return true;
    }
    isErrAnd(f: (e: E) => boolean): boolean {
        return f(this.error);
    }

    unwrapOr<T2>(val: T2): T2 {
        return val;
    }
    unwrapOrElse<T2>(f: (error: E) => T2): T2 {
        return f(this.error);
    }

    unwrap(): never {
        throw this.error;
    }

    unwrapErr(): E {
        return this.error;
    }
    expect(msg: string): never {
        throw new Error(`${msg}: ${this.error}`);
    }

    expectErr(_msg?: string): E {
        return this.error;
    }

    andThen<U>(_mapper?: (val: T) => Result<U, E>): Result<U, E> {
        return this as unknown as Result<U, E>;
    }
    and<U>(_res?: Result<U, E>): Result<U, E> {
        return this as unknown as Result<U, E>;
    }
    map<U>(_mapper?: (v: T) => U): Result<U, E> {
        return this as unknown as Result<U, E>;
    }
    mapErr<F>(mapper: (val: E) => F): Result<T, F> {
        return Err(mapper(this.error));
    }

    mapOr<U>(default_: U, _mapper: (val: never) => U): U {
        return default_;
    }

    mapOrElse<U>(default_: (error: E) => U, _mapper: (val: never) => U): U {
        return default_(this.error);
    }

    or<F>(other: Result<T, F>): Result<T, F> {
        return other;
    }

    orElse<F>(other: (error: E) => Result<T, F>): Result<T, F> {
        return other(this.error);
    }
    ok(): Option<T> {
        return None();
    }
    err(): Option<E> {
        return Some(this.error);
    }
    toString(): string {
        return `Err(${toString(this.error)})`;
    }

    toAsyncResult(): AsyncResult<T, E> {
        return new AsyncResult(this);
    }
    inspect(_f?: (v: T) => void): Result<T, E> {
        return this;
    }
    inspectErr(f: (v: E) => void): Result<T, E> {
        if (typeof f === 'function') {
            f(this.error);
        }
        return this;
    }
}

export type Err<E, T = never> = Result<T, E>;
export function Err<E, T = never>(val: E): Result<T, E> {
    return new ErrImpl(val);
}

/**
 * Contains the success value
 */
export class OkImpl<T, E> extends BaseResult<T, E> {
    /**
     * An empty Ok
     *
     * @example
     * ```typescript
     * const x: Result<void, string> = Ok.EMPTY
     * ```
     */
    static readonly EMPTY = new OkImpl<void, void>(undefined);
    readonly value!: T;

    constructor(val: T) {
        super();
        this.value = val;
    }

    isOk(): this is OkImpl<T, E> {
        return true;
    }
    isOkAnd(f: (v: T) => boolean): boolean {
        return f(this.value);
    }
    isErr(): this is ErrImpl<E, T> {
        return false;
    }
    isErrAnd(_f?: (e: never) => boolean): boolean {
        return false;
    }
    [Symbol.iterator](): Iterator<T> {
        return [this.value][Symbol.iterator]();
    }

    unwrapOr(_val?: T): T {
        return this.value;
    }

    unwrapOrElse(_f?: (error: E) => T): T {
        return this.value;
    }

    unwrap(): T {
        return this.value;
    }

    unwrapErr(): E {
        throw this.value;
    }
    expect(_msg?: string): T {
        return this.value;
    }

    expectErr(msg: string): E {
        throw new Error(`${msg}: ${this.value}`);
    }

    map<U>(mapper: (val: T) => U): Result<U, E> {
        return Ok(mapper(this.value));
    }
    mapErr<F>(_mapper?: (val: E) => F): Result<T, F> {
        return this as unknown as Result<T, F>;
    }

    mapOr<U>(_default_: U, mapper: (val: T) => U): U {
        return mapper(this.value);
    }

    mapOrElse<U>(_default_: (_error: never) => U, mapper: (val: T) => U): U {
        return mapper(this.value);
    }
    andThen<U>(mapper: (val: T) => Result<U, E>): Result<U, E> {
        return mapper(this.value);
    }
    and<U>(res: Result<U, E>): Result<U, E> {
        return res;
    }

    or<F>(_other?: Result<T, F>): Result<T, F> {
        return this as unknown as Result<T, F>;
    }

    orElse<F>(_other?: (error: E) => Result<T, F>): Result<T, F> {
        return this as unknown as Result<T, F>;
    }
    ok(): Option<T> {
        return Some(this.value);
    }
    err(): Option<E> {
        return None();
    }
    toString(): string {
        return `Ok(${toString(this.value)})`;
    }

    toAsyncResult(): AsyncResult<T, E> {
        return new AsyncResult(this);
    }
    inspect(f: (v: T) => void): Result<T, E> {
        if (typeof f === 'function') {
            f(this.value);
        }

        return this;
    }
    inspectErr(_f?: (v: E) => void): Result<T, E> {
        return this;
    }
}

export type Ok<T, E = never> = Result<T, E>;

export function Ok<T, E = never>(val: T): Result<T, E> {
    return new OkImpl(val);
}

export type Result<T, E> = OkImpl<T, E> | ErrImpl<E, T>;

/**
 * Extracts the Ok value type from a Result
 */
export type ResultOkType<T extends Result<any, any>> = T extends OkImpl<infer U, infer _E> ? U : never;

/**
 * Extracts the Err value type from a Result
 */
export type ResultErrType<T> = T extends ErrImpl<infer E, infer _T> ? E : never;

/**
 * Extracts all Ok types from an array of Results
 */
export type ResultOkTypes<T extends Result<any, any>[]> = {
    [key in keyof T]: T[key] extends Result<infer _U, any> ? ResultOkType<T[key]> : never;
};

/**
 * Extracts all Err types from an array of Results
 */
export type ResultErrTypes<T extends Result<any, any>[]> = {
    [key in keyof T]: T[key] extends Result<infer _U, any> ? ResultErrType<T[key]> : never;
};

/**
 * A utility type that extracts the `Ok` value types from an object of `Result`s,
 * producing an object of the inner types.
 *
 * @example
 * ```typescript
 * type Input = { name: Result<string, Error>; age: Result<number, Error> }
 * type Output = ResultOkTypesRecord<Input> // { name: string; age: number }
 * ```
 */
export type ResultOkTypesRecord<T extends Record<string, Result<any, any>>> = {
    [key in keyof T]: ResultOkType<T[key]>;
};
/**
 * A utility type that extracts the `Err` value types from an object of `Result`s,
 * producing an object of the error types.
 *
 * @example
 * ```typescript
 * type Input = { name: Result<string, Error>; age: Result<number, TypeError> }
 * type Output = ResultErrTypesRecord<Input> // { name: Error; age: TypeError }
 * ```
 */
export type ResultErrTypesRecord<T extends Record<string, Result<any, any>>> = {
    [key in keyof T]: ResultErrType<T[key]>;
};

/**
 * Extracts the keyed first error returned when combining
 * an object of `Result`s.
 *
 * @example
 * ```typescript
 * type FormFields = {
 *     name: Result<string, NameError>;
 *     age: Result<number, AgeError>;
 * };
 *
 * type FieldError = ResultErrEntry<FormFields>;
 * // { key: 'name'; error: NameError } | { key: 'age'; error: AgeError }
 *
 * function messageFor(error: FieldError): string {
 *     switch (error.key) {
 *         case 'name':
 *             return formatNameError(error.error);
 *         case 'age':
 *             return formatAgeError(error.error);
 *     }
 * }
 * ```
 */
export type ResultErrEntry<T extends Record<string, Result<any, any>>> = {
    [key in keyof T]: ResultErrType<T[key]> extends never ? never : { key: key; error: ResultErrType<T[key]> };
}[keyof T];

export namespace Result {
    /**
     * Parse a set of `Result`s, returning an array of all `Ok` values.
     * Short circuits with the first `Err` found, if any
     *
     * @example
     * ```typescript
     * let results: Result<Topping, GetToppingsError>[] = pizzaToppingNames.map(name => getPizzaToppingByName(name));
     *
     * let result = Result.all(results); // Result<Topping[], GetToppingsError>
     *
     * let toppings = result.unwrap(); // toppings is an array of Topping.  Could throw GetToppingsError.
     * ```
     */
    export function all<const T extends Result<any, any>[]>(
        results: T,
    ): Result<ResultOkTypes<T>, ResultErrTypes<T>[number]>;
    /**
     * Parse an object of `Result`s, returning an object of all `Ok` values.
     * By default it short-circuits with the first `Err`, returning the property
     * name and error. When multiple inputs are `Err`, callers must not rely on
     * which `Err` is returned. Passing `{}` or `{ errors: 'first' }` makes the
     * default short-circuit behavior explicit. Passing `{ errors: 'all' }`
     * collects all errors into an object where only keys that were `Err` are
     * present.
     *
     * @example
     * ```typescript
     * const name: Result<string, NameError> = Ok('Alice');
     * const age: Result<number, AgeError> = Ok(36);
     *
     * const parsed = Result.all({
     *     name,
     *     age,
     * });
     * // Ok({ name: 'Alice', age: 36 })
     * // type: Result<
     * //     { name: string; age: number },
     * //     { key: 'name'; error: NameError } | { key: 'age'; error: AgeError }
     * // >
     *
     * const invalidName: Result<string, NameError> = Err(nameError);
     * const invalidAge: Result<number, AgeError> = Err(ageError);
     *
     * const firstError = Result.all({
     *     name: invalidName,
     *     age: invalidAge,
     * });
     * // Err({ key: 'name', error: nameError }) or
     * // Err({ key: 'age', error: ageError }); callers must not depend on
     * // which one is returned when multiple inputs are Err.
     * // type: Result<
     * //     { name: string; age: number },
     * //     { key: 'name'; error: NameError } | { key: 'age'; error: AgeError }
     * // >
     *
     * const sameFirstError = Result.all({
     *     name: invalidName,
     *     age: invalidAge,
     * }, { errors: 'first' });
     * // Same behavior and type as the default short-circuit call above.
     *
     * const omittedErrors = Result.all({
     *     name: invalidName,
     *     age: invalidAge,
     * }, {});
     * // Same behavior and type as the default short-circuit call above.
     *
     * const allErrors = Result.all({
     *     name: invalidName,
     *     age: invalidAge,
     * }, { errors: 'all' });
     * // Err({ name: nameError, age: ageError })
     * // type: Result<
     * //     { name: string; age: number },
     * //     Partial<{ name: NameError; age: AgeError }>
     * // >
     * ```
     */
    export function all<const T extends Record<string, Result<any, any>>>(
        results: T,
    ): Result<ResultOkTypesRecord<T>, ResultErrEntry<T>>;
    export function all<const T extends Record<string, Result<any, any>>>(
        results: T,
        options: { errors?: 'first' },
    ): Result<ResultOkTypesRecord<T>, ResultErrEntry<T>>;
    export function all<const T extends Record<string, Result<any, any>>>(
        results: T,
        options: { errors: 'all' },
    ): Result<ResultOkTypesRecord<T>, Partial<ResultErrTypesRecord<T>>>;
    // Options whose mode is not known at compile time are intentionally not
    // supported because the return error shape depends on that mode.
    export function all(
        results: Result<any, any>[] | Record<string, Result<any, any>>,
        options?: { errors?: 'first' | 'all' },
    ): Result<any, any> {
        if (Array.isArray(results)) {
            const okResult = [];
            for (const result of results) {
                if (result.isOk()) {
                    okResult.push(result.value);
                } else {
                    return result as ErrImpl<any, any>;
                }
            }
            return Ok(okResult);
        } else if (options !== undefined && options.errors === 'all') {
            const okResult: Record<string, any> = {};
            const errResult: Record<string, any> = {};
            let hasErr = false;
            for (const [key, result] of Object.entries(results)) {
                if (result.isOk()) {
                    okResult[key] = result.value;
                } else {
                    errResult[key] = result.error;
                    hasErr = true;
                }
            }
            return hasErr ? Err(errResult) : Ok(okResult);
        } else {
            const okResult: Record<string, any> = {};
            for (const [key, result] of Object.entries(results)) {
                if (result.isOk()) {
                    okResult[key] = result.value;
                } else {
                    return Err({ key, error: result.error });
                }
            }
            return Ok(okResult);
        }
    }

    /**
     * Parse a set of `Result`s, short-circuits when an input value is `Ok`.
     * If no `Ok` is found, returns an `Err` containing the collected error values
     *
     * @example
     * ```typescript
     * let connections: Array<Result<string, Error>> = [attempt1(), attempt2(), attempt3()];
     *
     * let results = Result.any(connections); // Result<string, Error[]>
     *
     * let url = results.unwrap(); // At least one attempt gave us a successful url
     * ```
     */
    export function any<const T extends Result<any, any>[]>(
        results: T,
    ): Result<ResultOkTypes<T>[number], ResultErrTypes<T>> {
        const errResult = [];

        // short-circuits
        for (const result of results) {
            if (result.isOk()) {
                return result as OkImpl<ResultOkTypes<T>[number], any>;
            } else {
                errResult.push(result.error);
            }
        }

        // it must be a Err
        return Err(errResult as ResultErrTypes<T>);
    }

    /**
     * Wrap an operation that may throw an Error (`try-catch` style) into checked exception style
     * @param op The operation function
     *
     * @example
     * ```typescript
     * Result.wrap(() => JSON.parse('{"valid": "json"}')) // Ok({ valid: 'json' }), type: Result<any, unknown>
     *
     * Result.wrap(() => JSON.parse('not json')) // Err(SyntaxError: ...), type: Result<any, unknown>
     * ```
     */
    export function wrap<T, E = unknown>(op: () => T): Result<T, E> {
        try {
            return Ok<T, E>(op());
        } catch (e) {
            return Err<E, T>(e as E);
        }
    }

    /**
     * Wrap an async operation that may throw an Error (`try-catch` style) into checked exception style
     * @param op The operation function
     *
     * @example
     * ```typescript
     * await Result.wrapAsync(() => fetch('/api/data').then(r => r.json())) // Ok(data) or Err(error), type: Result<any, unknown>
     * ```
     */
    export function wrapAsync<T, E = unknown>(op: () => Promise<T>): Promise<Result<T, E>> {
        try {
            return op()
                .then((val) => Ok(val))
                .catch((e) => Err(e));
        } catch (e) {
            return Promise.resolve(Err(e as E));
        }
    }

    /**
     * Partitions a set of results, separating the `Ok` and `Err` values.
     *
     * @example
     * ```typescript
     * let results: Result<number, string>[] = [Ok(1), Err('error1'), Ok(2), Err('error2')];
     *
     * let [numbers, errors] = Result.partition(results); // [ [1, 2], ['error1', 'error2'] ]
     * ```
     */
    export function partition<T extends Result<any, any>[]>(results: T): [ResultOkTypes<T>, ResultErrTypes<T>] {
        return results.reduce(
            ([oks, errors], v) =>
                v.isOk()
                    ? [[...oks, v.value] as ResultOkTypes<T>, errors]
                    : [oks, [...errors, v.error] as ResultErrTypes<T>],
            [[], []] as [ResultOkTypes<T>, ResultErrTypes<T>],
        );
    }

    export function isResult<T = any, E = any>(val: unknown): val is Result<T, E> {
        return val instanceof ErrImpl || val instanceof OkImpl;
    }
}
