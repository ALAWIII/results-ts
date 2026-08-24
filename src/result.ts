import { toString } from './utils.js';
import { Option, None, Some } from './option.js';
import { AsyncResult } from './asyncresult.js';

//========================= flatten related types.
/**
 * used in flatten implementation.
 */
type IsNever<V> = [V] extends [never] ? true : false;

/**
 * if `V` is never then return Res otherwise Fallback
 * - used to clean unneeded `never` branches preventing them from stacking and auto collapse to unknown
 * - this trick is used to solve typing problem, over time when calling multiple `flatten` chain, it fallbacks to `any` becomes impossible to infer the type correctly.
 * @example
 *
 */
type Clean<V, Res, Fallback> = IsNever<V> extends true ? Res : Fallback;

/**
 * if `T` is `Ok` then check if user provided custome error type `E2`  then attach it and return `Result<U,E2>`, othewise return inner `Ok<U>` of `T` .
 *
 * if `T` is `Err` then check if user provided custome value type `T2` then attach it and return `Result<T2,E>`, otherwise return inner `Err<E>` of `T`.
 *
 * if `T` is not `Result` then if user provided custome error type `E2` then attach it and return `Result<T,E2>`, otherwise return OkImpl<T> directly
 */
type FlattenOk<T, T2 = never, E2 = never> = [T] extends [OkImpl<infer U>]
    ? Clean<E2, OkImpl<U>, Result<U, E2>>
    : [T] extends [ErrImpl<infer E>]
      ? Clean<T2, ErrImpl<E>, Result<T2, E>>
      : Clean<E2, OkImpl<T>, Result<T, E2>>;

/**
 * this used to check if `E` is `Err` then if user proides `T2` attach it and return `Result< T2, E=ErrImpl<M>>`, otherwise just return `E=ErrImpl<M>`, or if `E` isnt `Err` return `E`.
 */
type FlattenErr<E, T2 = never> = [E] extends [ErrImpl<infer M>] ? Clean<T2, ErrImpl<M>, Result<T2, M>> : E;
// ============= collapse related types helpers
/**
 * Checks if the given depth `D` is positive, used in collapse implementations.
 */
type IsNonPositive<D extends number> = `${D}` extends `-${string}` ? true : D extends 0 ? true : false;
/**
 *  Full flatten (no depth bound) — used when no depth arg is given
 *  - if `T` is `Ok` then obtain its value `InnerT` and pass it again down.
 *  - if `T` is `Err` then obtain its value `E` and check if `T2` was provided if yes then return `Result<T2,E>` otherwise return `ErrImpl<E>`.
 *  - otherwise check if `E2` was provided , if yes then return `Result<T,E2>` otherwise return `OkImpl<T>`.
 */
type DeepInner<T, T2 = never, E2 = never> = [T] extends [OkImpl<infer InnerT>]
    ? DeepInner<InnerT, T2, E2>
    : [T] extends [ErrImpl<infer E>]
      ? Clean<T2, ErrImpl<E>, Result<T2, E>>
      : Clean<E2, OkImpl<T>, Result<T, E2>>;
// Bounded flatten — recursion count tracked in the Acc tuple, mirrors the runtime loop
type DeepInnerN<T, D extends number, T2 = never, E2 = never> =
    IsNonPositive<D> extends true ? T : CollapseResult<T, D, T2, E2>;

/**
 * - check if `T` is `OkImpl` if yes then if `E2` was provided return `Result<FinalT,E2>` otherwise fallback and return `OkImpl<FinalT>`
 * - check if `T` is `ErrImpl` if yes then if `T2` was provided return `Result<T2,FinalE>` otherwise fallback and return `OkImpl<FinalE>`
 * - othewise return T.
 */
type ReachedDepthCondition<T, T2 = never, E2 = never> = [T] extends [OkImpl<infer FinalT>]
    ? Clean<E2, OkImpl<FinalT>, Result<FinalT, E2>>
    : [T] extends [ErrImpl<infer FinalE>]
      ? Clean<T2, ErrImpl<FinalE>, Result<T2, FinalE>>
      : T;
/**
 * - check recursively if `Acc` reached depth if yes then invoke `ReachedDepthCondition`,
 * - othewise: if `T` is `OkImpl` then extract its `InnerT` and pass it down again to `CollapseResult`
 * - otherwise: if `T` is `ErrImpl` then extract its `E` and then check if `T2` was provided then return `Result<T2,E>` otherwise just return `ErrImpl<E>`
 * - if `T` is not `Result` then check if `E2` was provided if yes then wrap `T` with `OkImpl` and return `Result<T,E2>` otherwise just return `OkImpl<T>`.
 */
type CollapseResult<T, D extends number, T2 = never, E2 = never, Acc extends unknown[] = []> = Acc['length'] extends D
    ? ReachedDepthCondition<T, T2, E2>
    : [T] extends [OkImpl<infer InnerT>]
      ? CollapseResult<InnerT, D, T2, E2, [...Acc, unknown]>
      : [T] extends [ErrImpl<infer E>]
        ? Clean<T2, ErrImpl<E>, Result<T2, E>>
        : Clean<E2, OkImpl<T>, Result<T, E2>>;
//=================================== transpose helpers
/**
 * used in transpose implementation.
 * - if `T` is `Some<U>` if yes then if `E` is provided return `Result<U, E>` otherwise return `OkImpl<U>`.
 * - if `T` is `None` return `None`
 * - otherwise: wrap `T` with `Some<OkImpl<U>>` or `Result<U,E>` and return it.
 */
type TransposeOkReturnType<T, E = never> = [T] extends [Some<infer U>]
    ? Some<Clean<E, OkImpl<U>, Result<U, E>>>
    : [T] extends [None]
      ? None
      : Some<Clean<E, ErrImpl<E>, Result<T, E>>>;
type TransposeErrReturnType<E, T = never> = Clean<T, Some<Err<E>>, Some<Result<T, E>>>;
//================ mapping helpers

type MapperOk<T, E = never> = Clean<E, OkImpl<T>, Result<T, E>>;
type MapperErr<E, T = never> = Clean<T, ErrImpl<E>, Result<T, E>>;
//======================= andThen, and, orElse, or
/**
 * Used in `OkImpl.and` | `ErrImpl.or`  and `OkImpl.andThen` | `ErrImpl.orElse` to correctly infer the types returned.
 */
type AndOrResult<T2, E2, R = Result<T2, E2>> = [R] extends [OkImpl<infer O>]
    ? OkImpl<O>
    : [R] extends [ErrImpl<infer E>]
      ? ErrImpl<E>
      : R;

//=======================================================
interface BaseResult<T, E> extends Iterable<T> {
    /** `true` when the result is Ok */
    isOk(): this is OkImpl<T>;

    /**
     * Returns true if the result is Ok and the value inside of it matches a predicate
     */
    isOkAnd(f: (v: T) => boolean): boolean;
    /** `true` when the result is Err */
    isErr(): this is ErrImpl<E>;

    /**
     * Returns true if the result is Err and the value inside of it matches a predicate
     */
    isErrAnd(f: (e: E) => boolean): boolean;
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
    expect(msg: string): T;

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
    expectErr(msg: string): E;

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
    unwrap(): T;

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
    unwrapErr(): E;

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
    unwrapOr<T2>(val: T2): T | T2;

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
    unwrapOrElse<T2>(f: (error: E) => T2): T | T2;

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
    andThen(mapper: (val: T) => any): any;

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
    and(res: any): any;
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
    map<U = never, _E2 = never>(mapper: (val: T) => U): Result<U, E>;

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
    mapErr<F>(mapper: (val: E) => F): Result<T, F>;

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
    mapOr<U>(default_: U, mapper: (val: T) => U): U;

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
    mapOrElse<U>(default_: (error: E) => U, mapper: (val: T) => U): U;

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
    or(other: any): any;
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
    orElse(other: (error: E) => any): any;

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
    ok(): Option<T>;
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
    err(): Option<E>;
    /**
     * Creates an `AsyncResult` based on this `Result`.
     *
     * Useful when you need to compose results with asynchronous code.
     */
    toAsyncResult(): AsyncResult<T, E>;
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
    inspect(f: (v: T) => void): Result<T, E>;
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
    inspectErr(f: (v: E) => void): Result<T, E>;
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
    flatten(): any;
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
    collapse(): any;
    collapse(depth: number): any;
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
    transpose(): any;
}

/**
 * Contains the error value
 */
export class ErrImpl<E> implements BaseResult<never, E> {
    /**
     * An empty Err
     *
     * @example
     * ```typescript
     * const x: Result<string, void> = Err.EMPTY
     * ```
     */
    static readonly EMPTY = new ErrImpl<void>(undefined);
    readonly error!: E;

    constructor(val: E) {
        this.error = val;
    }
    [Symbol.iterator](): Iterator<never, never, any> {
        return {
            next(): IteratorResult<never, never> {
                return { done: true, value: undefined! };
            },
        };
    }
    isOk(): this is OkImpl<never> {
        return false;
    }
    isOkAnd(_f?: (v: never) => boolean): boolean {
        return false;
    }
    isErr(): this is ErrImpl<E> {
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
        // The cause casting required because of the current TS definition being overly restrictive
        // (the definition says it has to be an Error while it can be anything).
        // See https://github.com/microsoft/TypeScript/issues/45167
        throw new Error(`${msg} - Error: ${toString(this.error)}`, { cause: this.error as any });
    }

    expectErr(_msg?: string): E {
        return this.error;
    }

    andThen(_op?: unknown): ErrImpl<E> {
        return this;
    }
    and(_res?: unknown): ErrImpl<E> {
        return this;
    }
    map<U = never, _E2 = never>(_mapper?: (val: never) => U): MapperErr<E, U> {
        return this;
    }
    mapErr<U = never, E2 = never>(mapper: (val: E) => E2): MapperErr<E2, U> {
        return Err(mapper(this.error));
    }

    mapOr<U>(default_: U, _mapper: (val: never) => U): U {
        return default_;
    }

    mapOrElse<U>(default_: (error: E) => U, _mapper: (val: never) => U): U {
        return default_(this.error);
    }

    or<T2, E2, R extends Result<T2, E2> = Result<T2, E2>>(other: R): AndOrResult<T2, E2, R> {
        return other as AndOrResult<T2, E2, R>;
    }

    orElse<T2, E2, R extends Result<T2, E2> = Result<T2, E2>>(other: (error: E) => R): AndOrResult<T2, E2, R> {
        return other(this.error) as AndOrResult<T2, E2, R>;
    }

    ok(): Option<never> {
        return None;
    }
    err(): Option<E> {
        return Some(this.error);
    }
    toString(): string {
        return `Err(${toString(this.error)})`;
    }

    toAsyncResult(): AsyncResult<never, E> {
        return new AsyncResult(this);
    }
    inspect(_f?: (v: never) => void): Result<never, E> {
        return this;
    }
    inspectErr(f: (v: E) => void): Result<never, E> {
        f(this.error);
        return this;
    }
    flatten<T2 = never, _E2 = never>(): FlattenErr<ErrImpl<E>, T2> {
        return this as FlattenErr<ErrImpl<E>, T2>;
    }
    collapse<T2 = never, E2 = never>(): DeepInner<ErrImpl<E>, T2, E2>;
    collapse<D extends number, T2 = never, E2 = never>(depth: D): DeepInnerN<ErrImpl<E>, D, T2, E2>;
    collapse(_depth: number = Infinity): any {
        return this;
    }
    transpose<T2 = never, _E2 = E>(): TransposeErrReturnType<E, T2> {
        return Some(Err(this.error));
    }
}

export type Err<E> = ErrImpl<E>;
export function Err<E>(val: E): ErrImpl<E> {
    return new ErrImpl(val);
}

/**
 * Contains the success value
 */
export class OkImpl<T> implements BaseResult<T, never> {
    /**
     * An empty Ok
     *
     * @example
     * ```typescript
     * const x: Result<void, string> = Ok.EMPTY
     * ```
     */
    static readonly EMPTY = new OkImpl<void>(undefined);
    readonly value!: T;

    constructor(val: T) {
        this.value = val;
    }

    isOk(): this is OkImpl<T> {
        return true;
    }
    isOkAnd(f: (v: T) => boolean): boolean {
        return f(this.value);
    }
    isErr(): this is ErrImpl<never> {
        return false;
    }
    isErrAnd(_f?: (e: never) => boolean): boolean {
        return false;
    }
    [Symbol.iterator](): Iterator<T> {
        return [this.value][Symbol.iterator]();
    }

    unwrapOr(_val?: unknown): T {
        return this.value;
    }

    unwrapOrElse<T2>(_f?: (error: never) => T2): T {
        return this.value;
    }

    unwrap(): T {
        return this.value;
    }

    unwrapErr(): never {
        // The cause casting required because of the current TS definition being overly restrictive
        // (the definition says it has to be an Error while it can be anything).
        // See https://github.com/microsoft/TypeScript/issues/45167
        throw new Error(`Tried to unwrap Ok: ${toString(this.value)}`, { cause: this.value as any });
    }
    expect(_msg?: string): T {
        return this.value;
    }

    expectErr(msg: string): never {
        throw new Error(msg);
    }

    map<U, E2 = never>(mapper: (val: T) => U): MapperOk<U, E2> {
        return Ok(mapper(this.value));
    }
    mapErr<_U = never, E2 = never>(_mapper?: (val: never) => E2): MapperOk<T, E2> {
        return this;
    }

    mapOr<U>(_default_: U, mapper: (val: T) => U): U {
        return mapper(this.value);
    }

    mapOrElse<U>(_default_: (_error: never) => U, mapper: (val: T) => U): U {
        return mapper(this.value);
    }
    andThen<T2, E2, R extends Result<T2, E2> = Result<T2, E2>>(mapper: (val: T) => R): AndOrResult<T2, E2, R> {
        return mapper(this.value) as AndOrResult<T2, E2, R>;
    }
    and<T2, E2, R extends Result<T2, E2> = Result<T2, E2>>(res: R): AndOrResult<T2, E2, R> {
        return res as AndOrResult<T2, E2, R>;
    }

    or(_other?: unknown): OkImpl<T> {
        return this;
    }

    orElse(_other?: unknown): OkImpl<T> {
        return this;
    }

    ok(): Option<T> {
        return Some(this.value);
    }
    err(): Option<never> {
        return None;
    }
    toString(): string {
        return `Ok(${toString(this.value)})`;
    }

    toAsyncResult(): AsyncResult<T, never> {
        return new AsyncResult(this);
    }
    inspect(f: (v: T) => void): Result<T, never> {
        f(this.value);
        return this;
    }
    inspectErr(_f?: (v: never) => void): Result<T, never> {
        return this;
    }
    flatten<T2 = never, E2 = never>(): FlattenOk<T, T2, E2> {
        return Result.isResult(this.value)
            ? (this.value as FlattenOk<T, T2, E2>)
            : (new OkImpl(this.value) as FlattenOk<T, T2, E2>);
    }
    collapse<T2 = never, E2 = never>(): DeepInner<T, T2, E2>;
    collapse<D extends number, T2 = never, E2 = never>(depth: D): DeepInnerN<OkImpl<T>, D, T2, E2>;
    collapse(depth: number = Infinity): any {
        if (depth <= 0) return this;
        let result: Result<any, any> = this.flatten();
        let remaining = depth - 1;
        while (remaining > 0 && result.isOk() && Result.isResult(result.unwrap())) {
            result = result.flatten();
            remaining--;
        }
        return result;
    }

    transpose<_T2 = never, E2 = never>(): TransposeOkReturnType<T, E2> {
        if (!Option.isOption(this.value)) {
            // if the contained value wasnt option
            return Some(Ok(this.value)) as TransposeOkReturnType<T, E2>;
        }
        const opt = this.value;
        if (opt.isNone()) {
            return None as TransposeOkReturnType<T, E2>;
        }
        return Some(Ok(opt.unwrap())) as TransposeOkReturnType<T, E2>;
    }
}

export type Ok<T> = OkImpl<T>;

export function Ok<T>(val: T): OkImpl<T> {
    return new OkImpl(val);
}

export type Result<T, E> = OkImpl<T> | ErrImpl<E>;

/**
 * Extracts the Ok value type from a Result
 */
export type ResultOkType<T extends Result<any, any>> = T extends OkImpl<infer U> ? U : never;

/**
 * Extracts the Err value type from a Result
 */
export type ResultErrType<T> = T extends ErrImpl<infer U> ? U : never;

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
                    return result as ErrImpl<any>;
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
                return result as OkImpl<ResultOkTypes<T>[number]>;
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
            return Ok(op());
        } catch (e) {
            return Err<E>(e as E);
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
