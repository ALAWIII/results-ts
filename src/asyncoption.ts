import { AsyncResult } from './asyncresult.js';
import { None, Option, Some } from './option.js';

/**
 * An async-aware `Option` counterpart.
 *
 * Can be combined with asynchronous code without having to ``await`` anything right until
 * the moment when you're ready to extract the final ``Option`` out of it.
 *
 * Can also be combined with synchronous code for convenience.
 */
export class AsyncOption<T> {
    /**
     * A promise that resolves to a synchronous ``Option``.
     *
     * You can await it to convert `AsyncOption<T>` to `Option<T>`, but prefer
     * awaiting `AsyncOption` directly (see: `then()`). Only use this property
     * if you need the underlying Promise for specific use cases.
     */
    promise: Promise<Option<T>>;

    /**
     * Constructs an `AsyncOption` from an `Option` or a `Promise` of an `Option`.
     *
     * @example
     * ```typescript
     * const option = new AsyncOption(Promise.resolve(Some('username')))
     * ```
     */
    constructor(start: Option<T> | Promise<Option<T>>) {
        this.promise = Promise.resolve(start);
    }
    /**
     * Returns `other` if this `AsyncOption` is `Some`, otherwise returns `None`.
     *
     * This is the eager counterpart of `andThen`: it does not take a function,
     * just another `Option`-like value to use when the current option is `Some`.
     *
     * - `Some(a).and(other)` → `other`
     * - `None.and(other)` → `None`
     *
     * @example
     * ```typescript
     * const some = Some(1).toAsyncOption();
     * const none = None.toAsyncOption();
     *
     * await some.and(Some('ok'));        // Some('ok')
     * await some.and(None);              // None
     * await none.and(Some('ok'));        // None
     *
     * // Works with AsyncOption and Promise<Option>
     * await some.and(new AsyncOption(Some(42)));   // Some(42)
     * await some.and(Promise.resolve(Some('hi'))); // Some('hi')
     * ```
     */
    and<U>(other: Option<U> | AsyncOption<U> | Promise<Option<U>>): AsyncOption<U> {
        return this.andThen(() => other);
    }
    /**
     * Calls `mapper` if the option is `Some`, otherwise keeps the `None` value intact.
     * This function can be used for control flow based on `Option` values.
     *
     * @example
     * ```typescript
     * let hasValue = Some(1).toAsyncOption()
     * let noValue = None.toAsyncOption()
     *
     * await hasValue.andThen(async (value) => Some(value * 2)).promise // Some(2)
     * await hasValue.andThen(async (value) => None).promise // None
     * await noValue.andThen(async (value) => Some(value * 2)).promise // None
     * ```
     */
    andThen<U>(mapper: (val: T) => Option<U> | Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
        return this.thenInternal(async (option) => {
            if (option.isNone()) {
                return option as unknown as Option<U>;
            }
            const mapped = mapper(option.value);
            return mapped instanceof AsyncOption ? mapped.promise : mapped;
        });
    }

    /**
     * Maps an `AsyncOption<T>` to `AsyncOption<U>` by applying a function to a contained
     * `Some` value, leaving a `None` value untouched.
     *
     * This function can be used to compose the results of two functions.
     *
     * @example
     * ```typescript
     * let hasValue = Some(1).toAsyncOption()
     * let noValue = None.toAsyncOption()
     *
     * await hasValue.map(async (value) => value * 2).promise // Some(2)
     * await noValue.map(async (value) => value * 2).promise // None
     * ```
     */
    map<U>(mapper: (val: T) => U | Promise<U>): AsyncOption<U> {
        return this.thenInternal(async (option) => {
            if (option.isNone()) {
                return option as unknown as Option<U>;
            }
            return Some(await mapper(option.value));
        });
    }
    /**
     * Returns `Some(value)` if this `AsyncOption` is `Some(value)` and `predicate(value)` is truthy;
     * otherwise returns `None`.
     *
     * - `Some(v).filter(p)` → `Some(v)` if `p(v)` is true, else `None`
     * - `None.filter(p)` → `None` (predicate is not called)
     *
     * The predicate may be synchronous or asynchronous.
     *
     * @example
     * ```ts
     * const some = Some(4).toAsyncOption();
     * const none = None.toAsyncOption();
     *
     * await some.filter(v => v % 2 === 0); // Some(4)
     * await some.filter(v => v > 10);      // None
     * await none.filter(v => v > 0);       // None
     *
     * // Async predicate
     * await some.filter(async v => {
     *   await delay(10);
     *   return v > 0;
     * });               // Some(4)
     * ```
     */
    filter(predicate: (value: T) => boolean | Promise<boolean>): AsyncOption<T> {
        return this.thenInternal(async (option) => {
            if (option.isNone()) return option;
            return (await predicate(option.value)) ? option : None();
        });
    }
    /**
     * Returns the value from `other` if this `AsyncOption` contains `None`, otherwise returns self.
     *
     * If `other` is a result of a function call consider using `orElse` instead, it will
     * only evaluate the function when needed.
     *
     * @example
     * ```
     * const noValue = new AsyncOption(None)
     * const hasValue = new AsyncOption(Some(1))
     *
     * await noValue.or(Some(123)).promise // Some(123)
     * await hasValue.or(Some(123)).promise // Some(1)
     * ```
     */
    or<U>(other: Option<U> | AsyncOption<U> | Promise<Option<U>>): AsyncOption<T | U> {
        return this.orElse(() => other);
    }

    /**
     * Returns the value obtained by calling `other` if this `AsyncOption` contains `None`, otherwise
     * returns self.
     *
     * @example
     * ```
     * const noValue = new AsyncOption(None)
     * const hasValue = new AsyncOption(Some(1))
     *
     * await noValue.orElse(() => Some(123)).promise // Some(123)
     * await hasValue.orElse(() => Some(123)).promise // Some(1)
     * ```
     */
    orElse<U>(other: () => Option<U> | AsyncOption<U> | Promise<Option<U>>): AsyncOption<T | U> {
        return this.thenInternal(async (option): Promise<Option<T | U>> => {
            if (option.isSome()) {
                return option;
            }
            const otherValue = other();
            return otherValue instanceof AsyncOption ? otherValue.promise : otherValue;
        });
    }

    /**
     * Converts an `AsyncOption<T>` to an `AsyncResult<T, E>` so that `None` is converted to
     * `Err(error)` and `Some` is converted to `Ok`.
     */
    toResult<E>(error: E): AsyncResult<T, E> {
        return new AsyncResult(this.promise.then((option) => option.okOr(error)));
    }

    /**
     * Makes `AsyncOption` awaitable by implementing the thenable interface.
     * This allows you to use `await` directly on `AsyncOption` instances.
     *
     * See the [Promise.then() documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)
     * for details on the thenable interface.
     *
     * @example
     * ```typescript
     * const asyncOption = new AsyncOption(Some(42))
     * const option = await asyncOption // Returns Option<number>
     *
     * // Equivalent to:
     * const option2 = await asyncOption.promise
     * ```
     */
    then<TResult1 = Option<T>, TResult2 = never>(
        onfulfilled?: ((value: Option<T>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    private thenInternal<T2>(mapper: (option: Option<T>) => Promise<Option<T2>>): AsyncOption<T2> {
        return new AsyncOption(this.promise.then(mapper));
    }
}
