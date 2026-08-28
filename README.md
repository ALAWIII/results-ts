# results-ts

Rust-style `Result<T, E>` and `Option<T>` types for TypeScript — explicit, type-safe error and absence handling without exceptions or `null`/`undefined` checks scattered through your code.

<details>
<summary><strong>Table of contents</strong></summary>

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick start](#quick-start)
    - [Option quick start](#option-quick-start)
    - [Result quick start](#result-quick-start)
- [Core concepts](#core-concepts)
    - [Result<T, E>](#resultt-e)
    - [Option<T>](#optiont)
    - [Type narrowing](#type-narrowing)
    - [Mapping and chaining](#mapping-and-chaining)
    - [Converting between Option and Result](#converting-between-option-and-result)
    - [Collapsing and flattening nested values](#collapsing-and-flattening-nested-values)
    - [Transpose](#transpose)
    - [Async variants: AsyncOption and AsyncResult](#async-variants-asyncoption-and-asyncresult)
    - [Iteration](#iteration)
- [Examples](#examples)
    - [Combining multiple Results/Options](#combining-multiple-resultsoptions)
    - [Partitioning results](#partitioning-results)
    - [Wrapping throwing code](#wrapping-throwing-code)
    - [Building from nullable/optional values](#building-from-nullableoptional-values)
- [API reference](#api-reference)
    - [Option constructors and statics](#option-constructors-and-statics)
    - [Option instance methods](#option-instance-methods)
    - [Result constructors and statics](#result-constructors-and-statics)
    - [Result instance methods](#result-instance-methods)
    - [AsyncOption](#asyncoption-api)
    - [AsyncResult](#asyncresult-api)
- [Typing notes and common pitfalls](#typing-notes-and-common-pitfalls)
- [License](#license)

</details>

## Introduction

`results-ts` brings Rust's `Result<T, E>` and `Option<T>` types to TypeScript. Instead of throwing exceptions or relying on `null`/`undefined` and hoping every caller remembers to check for them, you model success/failure and presence/absence explicitly in the type system.

This library is for TypeScript developers who want:

- Compile-time guarantees that errors and missing values are handled.
- A fluent, chainable API (`map`, `andThen`, `orElse`, `unwrapOr`, …) instead of nested `try/catch` and `if (x != null)` checks.
- First-class async support (`AsyncOption`, `AsyncResult`) for chaining across `Promise`-based code.
- Full type narrowing, so `if (result.isOk())` actually narrows the type in your editor.

## Installation

```bash
npm install @allawiii/results-ts
```

```bash
yarn add @allawiii/results-ts
```

```bash
pnpm add @allawiii/results-ts
```

## Quick start

### Option quick start

```typescript
import { Some, None, Option } from '@allawiii/results-ts';

const someNumber = Some(10);
const empty = None<number>();

someNumber.isSome(); // true
empty.isNone(); // true

someNumber.unwrap(); // 10
empty.unwrapOr(0); // 0

Option.isOption(someNumber); // true
Option.isOption('foo'); // false
```

### Result quick start

```typescript
import { Ok, Err, Result } from '@allawiii/results-ts';

function getStatus(payload: boolean): Result<boolean, Error> {
    if (payload) {
        return Ok(payload);
    }
    return Err(new Error('Payload is false'));
}

const result = getStatus(true);

if (result.isOk()) {
    console.log(result.unwrap()); // true
} else {
    console.error(result.unwrapErr());
}
```

## Core concepts

### Result<T, E>

A `Result<T, E>` represents either success (`Ok<T>`) or failure (`Err<E>`). It's constructed with the `Ok()` and `Err()` factory functions:

```typescript
const ok = Ok(90); // Result<number, never>
const err = Err('oops'); // Result<never, string>
```

### Option<T>

An `Option<T>` represents a value that may or may not be present, replacing `null`/`undefined`. It's constructed with `Some()` and `None()`:

```typescript
const some = Some('foo'); // Option<string>
const none = None<string>(); // Option<string>
```

### Type narrowing

Calling `isSome()`, `isNone()`, `isOk()`, or `isErr()` narrows the TypeScript type of the value, so the compiler knows which variant you're working with:

```typescript
const opt = None<string>();

if (opt.isSome()) {
    // opt is narrowed to SomeImpl<string>; opt.value: string
} else {
    // opt is narrowed to NoneImpl<string>
}
```

### Mapping and chaining

Both types support `map` (transform the contained value), `mapOr`/`mapOrElse` (transform with a fallback), and `andThen`/`orElse` (chain operations that themselves return an `Option`/`Result`):

```typescript
Some(5).map((v) => v + 5); // Some(10)
None().map((v) => 5 + 5); // None()

Some(9).andThen((v) => Some(`${v + 6}`)); // Some('15')
None<number>().orElse(() => Some(10)); // Some(10)

Ok(90).andThen((n) => Ok(`${n} is a number`)); // Ok('90 is a number')
Err(90).andThen((n) => Ok('hello')); // Err(90) — unaffected
```

`mapOr` and `mapOrElse` collapse a `Some`/`None` (or `Ok`/`Err`) directly into a plain value:

```typescript
Some(5).mapOr('0', (v) => `${v + 5}`); // '10'
None().mapOr('0', (v) => `5`); // '0'

Ok('Hello').mapOrElse(
    (e) => 'default when error',
    (v) => `${v} World`,
); // 'Hello World'
```

### Converting between Option and Result

`okOr`/`okOrElse` turn an `Option<T>` into a `Result<T, E>`, and `.ok()`/`.err()` turn a `Result<T, E>` into an `Option`:

```typescript
Some(12).okOr('error'); // Ok(12)
None<number>().okOr('error'); // Err('error')

Ok(23).ok(); // Some(23)
Err(23).ok(); // None()
Err(23).err(); // Some(23)
Ok(23).err(); // None()
```

### Collapsing and flattening nested values

`flatten()` removes one level of nesting; `collapse(depth?)` removes many levels at once (default: fully collapse):

```typescript
Some(Some(Some(43))).flatten(); // Some(Some(43))  — one level
Some(Some(Some(43))).collapse(); // Some(43)        — fully collapsed
Some(Some(Some(43))).collapse(1); // Some(Some(43))  — up to depth 1

Ok(Ok(Ok(Err(5)))).collapse(); // Err(5) — collapses through nested Ok to the first Err
```

`collapse(0)` or a negative depth is a no-op.

### Transpose

`transpose()` swaps a `Result<Option<T>, E>` and `Option<Result<T, E>>` inside out — handy when a function returns "maybe a value, and that operation can fail":

```typescript
Some(Ok(4)).transpose(); // Ok(Some(4))
Some(Err('error')).transpose(); // Err('error')
None<number>().transpose(); // Ok(None())

Ok(Some(90)).transpose(); // Some(Ok(90))
Ok(None<number>()).transpose(); // None()
Err(5).transpose(); // Some(Err(5))
```

Calling `transpose()` twice returns you to (a value equal to) the original.

### Async variants: AsyncOption and AsyncResult

`AsyncOption<T>` and `AsyncResult<T, E>` wrap a `Promise` of an `Option`/`Result` and expose the same chainable API, awaitable directly:

```typescript
import { AsyncOption, Some, None } from '@allawiii/results-ts';

const hasValue = new AsyncOption(Some(1));

await hasValue.map((v) => v * 2); // Some(2)
await hasValue.andThen((v) => Some(v * 3)); // Some(3)
await hasValue; // Some(1) — directly awaitable
```

```typescript
import { AsyncResult, Ok, Err } from '@allawiii/results-ts';

const goodResult = new AsyncResult(Ok(100));

await goodResult.map((value) => Promise.resolve(value * 2)); // Ok(200)
await goodResult.mapErr((e) => `Error is ${e}`); // Ok(100), mapper skipped
await goodResult.ok(); // Some(100)
```

Any `Option`/`Result` can be converted to its async counterpart with `.toAsyncOption()` / `.toAsyncResult()`:

```typescript
Some(1).toAsyncOption();
Ok(1).toAsyncResult();
```

### Iteration

`Some`, `Ok`, and `Err` are iterable, matching Rust's semantics — `Some`/`Ok` yield exactly one value, `None`/`Err` yield none:

```typescript
Array.from(Some(1)); // [1]
Array.from(None()); // []

Array.from(Ok('hello')); // ['hello']
for (const item of Err([123])) {
    // never runs
}
```

## Examples

### Combining multiple Results/Options

`Option.all` / `Result.all` succeed only if every input succeeds, short-circuiting on the first failure. `Option.any` / `Result.any` succeed as soon as one input succeeds:

```typescript
Option.all([Some(3), Some(true), Some('hello')]);
// Some([3, true, 'hello'])

Option.all([Some(3), None()]);
// None()

Option.any([None(), None(), Some('hello'), Some(3)]);
// Some('hello') — first Some found

Result.all([Ok(3), Ok(true)]);
// Ok([3, true])

Result.all([Err(Symbol()), Err(new Error())]);
// Err(<first error>)
```

`Result.all` also accepts an object of `Result`s, returning either the first error or (with `{ errors: 'all' }`) every error keyed by property:

```typescript
Result.all({ a: Ok(3), b: Err('bad'), c: Ok(true) });
// Err({ key: 'b', error: 'bad' })

Result.all({ a: Ok(3), b: Err('bad') }, { errors: 'all' });
// Err({ b: 'bad' })
```

`Result.any` collects the errors of every failed input if all fail:

```typescript
Result.any([Err('a'), Err('b')]);
// Err(['a', 'b'])

Result.any([Err('a'), Ok(8)]);
// Ok(8)
```

### Partitioning results

`Result.partition` splits a list of `Result`s into a tuple of `[okValues, errValues]`:

```typescript
Result.partition([Ok(3), Ok(true), Err(Symbol()), Err(new Error())]);
// [[3, true], [<symbol>, <error>]]
```

### Wrapping throwing code

`Result.wrap` / `Result.wrapAsync` catch exceptions and turn them into an `Err`:

```typescript
Result.wrap(() => 1); // Ok(1)

Result.wrap<number, CustomError>(() => {
    throw new CustomError();
}); // Err(CustomError)

await Result.wrapAsync(async () => 1); // Ok(1)
```

### Building from nullable/optional values

`Option.fromNullable`, `Option.fromOptional`, and `Option.fromNullish` convert values that may be `null`, `undefined`, or either into an `Option`:

```typescript
Option.fromNullable('hello' as string | null); // Some('hello')
Option.fromNullable(null); // None()
Option.fromNullable(0); // Some(0) — falsy but not null

Option.fromOptional('hello' as string | undefined); // Some('hello')
Option.fromOptional(undefined); // None()
Option.fromOptional(null); // Some(null) — null isn't undefined

Option.fromNullish('hello' as string | null | undefined); // Some('hello')
Option.fromNullish(null); // None()
Option.fromNullish(undefined); // None()
```

## API reference

### Option constructors and statics

| API                                              | Description                                                          | Example                                         |
| ------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| `Some(value)`                                    | Creates an `Option` containing a value.                              | `Some(10)`                                      |
| `None<T>()`                                      | Creates an empty `Option`.                                           | `None<number>()`                                |
| `Option.isOption(x)`                             | Type guard: returns `true` if `x` is a `Some`/`None`.                | `Option.isOption(Some(1)) // true`              |
| `Option.all(options)` / `Option.all(...options)` | `Some([...])` if every option is `Some`, otherwise the first `None`. | `Option.all([Some(1), Some(2)]) // Some([1,2])` |
| `Option.any(options)` / `Option.any(...options)` | The first `Some` found, or `None` if all are `None`.                 | `Option.any([None(), Some(3)]) // Some(3)`      |
| `Option.fromNullable(v)`                         | `Some(v)` unless `v === null`.                                       | `Option.fromNullable(0) // Some(0)`             |
| `Option.fromOptional(v)`                         | `Some(v)` unless `v === undefined`.                                  | `Option.fromOptional(null) // Some(null)`       |
| `Option.fromNullish(v)`                          | `Some(v)` unless `v` is `null` or `undefined`.                       | `Option.fromNullish(undefined) // None()`       |

### Option instance methods

| Method                     | Description                                             | Example                                              |
| -------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `isSome()`                 | Narrows to `SomeImpl`; `true` if a value is present.    | `Some(1).isSome() // true`                           |
| `isNone()`                 | Narrows to `NoneImpl`; `true` if empty.                 | `None().isNone() // true`                            |
| `isSomeAnd(fn)`            | `true` if `Some` and predicate holds.                   | `Some('hi').isSomeAnd(v => v === 'hi') // true`      |
| `isNoneOr(fn)`             | `true` if `None`, or if `Some` and predicate holds.     | `None().isNoneOr(() => false) // true`               |
| `unwrap()`                 | Returns the value or throws.                            | `Some(8).unwrap() // 8`                              |
| `expect(msg)`              | Returns the value or throws `Error(msg)`.               | `None().expect('missing') // throws`                 |
| `unwrapOr(default)`        | Returns the value, or `default` if `None`.              | `None<number>().unwrapOr(7) // 7`                    |
| `unwrapOrElse(fn)`         | Returns the value, or the result of `fn()` if `None`.   | `None<number>().unwrapOrElse(() => 7) // 7`          |
| `map(fn)`                  | Transforms the contained value.                         | `Some(5).map(v => v + 5) // Some(10)`                |
| `mapOr(default, fn)`       | Transforms, or returns `default` if `None`.             | `None().mapOr('0', () => '5') // '0'`                |
| `mapOrElse(defaultFn, fn)` | Transforms, or calls `defaultFn()` if `None`.           | `Some(5).mapOrElse(() => '0', v => \`${v}\`) // '5'` |
| `and(other)`               | Returns `other` if `Some`, else `None`.                 | `Some(9).and(Some('hi')) // Some('hi')`              |
| `andThen(fn)`              | Chains a function returning an `Option`.                | `Some(9).andThen(v => Some(v+1)) // Some(10)`        |
| `or(other)`                | Returns self if `Some`, else `other`.                   | `None().or(Some(10)) // Some(10)`                    |
| `orElse(fn)`               | Returns self if `Some`, else calls `fn()`.              | `None().orElse(() => Some(10)) // Some(10)`          |
| `xor(other)`               | `Some` only if exactly one of self/other is `Some`.     | `Some(5).xor(Some(10)) // None()`                    |
| `filter(predicate)`        | Keeps `Some` only if predicate holds.                   | `Some(44).filter(v => v > 0) // Some(44)`            |
| `okOr(err)`                | Converts to `Result`, using `err` for `None`.           | `Some(12).okOr('e') // Ok(12)`                       |
| `okOrElse(fn)`             | Converts to `Result`, calling `fn()` for `None`.        | `None().okOrElse(() => 'e') // Err('e')`             |
| `flatten()`                | Removes one level of `Option` nesting.                  | `Some(Some(1)).flatten() // Some(1)`                 |
| `collapse(depth?)`         | Removes many/all levels of `Option` nesting.            | `Some(Some(Some(1))).collapse() // Some(1)`          |
| `transpose()`              | Swaps `Option<Result<T,E>>` into `Result<Option<T>,E>`. | `Some(Ok(4)).transpose() // Ok(Some(4))`             |
| `toAsyncOption()`          | Wraps into an `AsyncOption`.                            | `Some(1).toAsyncOption()`                            |
| `[Symbol.iterator]`        | Yields the value once (`Some`) or nothing (`None`).     | `[...Some(1)] // [1]`                                |
| `toString()`               | String representation.                                  | `\`${Some(1)}\` // 'Some(1)'`                        |

### Result constructors and statics

| API                         | Description                                                         | Example                                                     |
| --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `Ok(value)`                 | Creates a successful `Result`.                                      | `Ok(90)`                                                    |
| `Err(error)`                | Creates a failed `Result`.                                          | `Err('oops')`                                               |
| `Result.all(results)`       | `Ok([...])` if all succeed, else the first (or object-keyed) error. | `Result.all([Ok(1), Ok(2)]) // Ok([1,2])`                   |
| `Result.all(obj, opts?)`    | Object form; `{ errors: 'all' }` collects every error.              | `Result.all({a: Err('x')}, {errors:'all'}) // Err({a:'x'})` |
| `Result.any(results)`       | First `Ok`, or an `Err` collecting all errors.                      | `Result.any([Err(1), Ok(2)]) // Ok(2)`                      |
| `Result.partition(results)` | Splits into `[okValues, errValues]`.                                | `Result.partition([Ok(1), Err(2)]) // [[1],[2]]`            |
| `Result.wrap(fn)`           | Runs `fn`, catching thrown errors into `Err`.                       | `Result.wrap(() => 1) // Ok(1)`                             |
| `Result.wrapAsync(fn)`      | Async version of `wrap`.                                            | `await Result.wrapAsync(async () => 1)`                     |

### Result instance methods

| Method                     | Description                                                | Example                                    |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `isOk()`                   | Narrows to `OkImpl`; `true` if successful.                 | `Ok(1).isOk() // true`                     |
| `isErr()`                  | Narrows to `ErrImpl`; `true` if failed.                    | `Err(1).isErr() // true`                   |
| `isOkAnd(fn)`              | `true` if `Ok` and predicate holds.                        | `Ok(34).isOkAnd(v => v === 34) // true`    |
| `isErrAnd(fn)`             | `true` if `Err` and predicate holds.                       | `Err(34).isErrAnd(v => v === 34) // true`  |
| `unwrap()`                 | Returns the value or throws the error.                     | `Ok(312).unwrap() // 312`                  |
| `unwrapErr()`              | Returns the error or throws the value.                     | `Err(312).unwrapErr() // 312`              |
| `expect(msg)`              | Returns the value or throws `Error('msg: <err>')`.         | `Err(5).expect('failed') // throws`        |
| `expectErr(msg)`           | Returns the error or throws `Error('msg: <val>')`.         | `Ok(5).expectErr('bad') // throws`         |
| `unwrapOr(default)`        | Returns the value, or `default` if `Err`.                  | `Err(32).unwrapOr(234) // 234`             |
| `unwrapOrElse(fn)`         | Returns the value, or `fn(error)` if `Err`.                | `Err(32).unwrapOrElse(v => v+1) // 33`     |
| `map(fn)`                  | Transforms the `Ok` value.                                 | `Ok(12).map(v => v+12) // Ok(24)`          |
| `mapErr(fn)`               | Transforms the `Err` value.                                | `Err(12).mapErr(v => v+12) // Err(24)`     |
| `mapOr(default, fn)`       | Transforms `Ok`, or returns `default` for `Err`.           | `Err('e').mapOr('d', v => v) // 'd'`       |
| `mapOrElse(defaultFn, fn)` | Transforms `Ok`, or calls `defaultFn(error)`.              | `Ok('Hi').mapOrElse(() => 'd', v => v)`    |
| `and(other)`               | Returns `other` if `Ok`, else self.                        | `Ok(90).and(Ok('hi')) // Ok('hi')`         |
| `andThen(fn)`              | Chains a function returning a `Result`.                    | `Ok(90).andThen(n => Ok(\`${n}\`))`        |
| `or(other)`                | Returns self if `Ok`, else `other`.                        | `Err(90).or(Ok('hi')) // Ok('hi')`         |
| `orElse(fn)`               | Returns self if `Ok`, else calls `fn(error)`.              | `Err('e').orElse(e => Ok(\`recovered\`))`  |
| `inspect(fn)`              | Calls `fn(value)` for `Ok`, no-op for `Err`; returns self. | `Ok('Hi').inspect(v => console.log(v))`    |
| `inspectErr(fn)`           | Calls `fn(error)` for `Err`, no-op for `Ok`; returns self. | `Err('e').inspectErr(e => console.log(e))` |
| `ok()`                     | Converts to `Option`, discarding the error.                | `Ok(23).ok() // Some(23)`                  |
| `err()`                    | Converts to `Option`, discarding the value.                | `Err(23).err() // Some(23)`                |
| `flatten()`                | Removes one level of `Result` nesting.                     | `Ok(Ok(44)).flatten() // Ok(44)`           |
| `collapse(depth?)`         | Removes many/all levels of `Result` nesting.               | `Ok(Ok(Ok(5))).collapse() // Ok(5)`        |
| `transpose()`              | Swaps `Result<Option<T>,E>` into `Option<Result<T,E>>`.    | `Ok(Some(90)).transpose() // Some(Ok(90))` |
| `toAsyncResult()`          | Wraps into an `AsyncResult`.                               | `Ok(1).toAsyncResult()`                    |
| `[Symbol.iterator]`        | Yields the value once (`Ok`) or nothing (`Err`).           | `[...Ok(1)] // [1]`                        |

### AsyncOption API

| Method                         | Description                                                                           | Example                                  |
| ------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| `new AsyncOption(option)`      | Wraps an `Option` (or a `Promise<Option>`).                                           | `new AsyncOption(Some(1))`               |
| `.map(fn)`                     | Async-aware `map`; `fn` may return a value or a `Promise`.                            | `await hasValue.map(v => v * 2)`         |
| `.andThen(fn)`                 | Async-aware `andThen`; `fn` may return `Option`, `Promise<Option>`, or `AsyncOption`. | `await hasValue.andThen(v => Some(v*3))` |
| `.or(other)`                   | Falls back to `other` (`Option`, `Promise`, or `AsyncOption`) if `None`.              | `await noValue.or(Some(200))`            |
| `.orElse(fn)`                  | Falls back to `fn()`'s result if `None`.                                              | `await noValue.orElse(() => Some(200))`  |
| `.and(other)`                  | Returns `other` if `Some`, else `None`.                                               | `await some.and(Some('ok'))`             |
| `.filter(predicate)`           | Async-aware `filter`.                                                                 | `await some.filter(v => v % 2 === 0)`    |
| `.okOr(err)` / `.okOrElse(fn)` | Convert to `Result`/`AsyncResult`.                                                    | `await none.okOr('missing')`             |
| `.xor(other)`                  | Async-aware `xor`.                                                                    | `await some1.xor(none)`                  |
| `await asyncOption`            | Directly awaitable to the underlying `Option`.                                        | `await hasValue // Some(1)`              |

### AsyncResult API

| Method                             | Description                                                                | Example                                        |
| ---------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| `new AsyncResult(result)`          | Wraps a `Result` (or a `Promise<Result>`).                                 | `new AsyncResult(Ok(100))`                     |
| `.map(fn)`                         | Async-aware `map` on the `Ok` value.                                       | `await goodResult.map(v => v * 2)`             |
| `.mapErr(fn)`                      | Async-aware `mapErr`, sync or async callback.                              | `await badResult.mapErr(e => \`Error: ${e}\`)` |
| `.andThen(fn)`                     | Chains a function returning `Result`, `Promise<Result>`, or `AsyncResult`. | `await goodResult.andThen(v => Ok(v*2))`       |
| `.and(other)`                      | Returns `other` if `Ok`, else the original `Err`.                          | `await goodResult.and(Ok(200))`                |
| `.or(other)` / `.orElse(fn)`       | Fallback if `Err`.                                                         | `await badResult.or(Ok(200))`                  |
| `.ok()` / `.err()`                 | Convert to `AsyncOption` equivalent (`Some`/`None`).                       | `await result.ok() // Some(1)`                 |
| `.inspect(fn)` / `.inspectErr(fn)` | Side-effect hooks, sync or async.                                          | `await goodResult.inspect(v => log(v))`        |
| `await asyncResult`                | Directly awaitable to the underlying `Result`.                             | `await goodResult // Ok(42)`                   |

## Typing notes and common pitfalls

- **Empty inputs still type-check.** `Option.all([])` returns `Option<[]>`, and `Result.all([])` returns `Result<[], never>` — the empty case is handled without special-casing.
- **`Option.all`/`Result.all` and `.any` accept both an array argument and a spread of arguments** — `Option.all([a, b])` and `Option.all(a, b)` are equivalent.
- **`None()` and `Err()` need an explicit type parameter when TypeScript can't infer it**, e.g. `None<number>()` or `Err<string, number>('error')`, especially when used in isolation before being combined with a typed value.
- **`fromNullable`, `fromOptional`, and `fromNullish` are not interchangeable.** They differ in exactly what counts as "missing": `fromNullable` only treats `null` as absent (so `undefined` becomes `Some(undefined)`), `fromOptional` only treats `undefined` as absent (so `null` becomes `Some(null)`), and `fromNullish` treats both as absent.
- **`collapse()` on a `Result` stops at the first `Err`.** `Ok(Ok(Ok(Err(5)))).collapse()` yields `Err(5)`, not a further-nested `Ok`.
- **`collapse(0)` or a negative depth is always a no-op**, returning the original value unchanged (same reference-equal type).
- **`transpose()` is self-inverse.** Applying it twice returns you to an equivalent value/type as the original — useful when chaining `Result<Option<T>, E>` and `Option<Result<T, E>>` back and forth.
- **`andThen`/`orElse` unify error/value types.** For example, `Ok<number, string>(90).andThen(n => Err('e'))` produces `Result<never, string>` — TypeScript will widen the error/value union across the chain, so annotate generics explicitly if inference produces a wider type than expected.
- **`unwrap()` on `Err` throws the raw error value**, not an `Error` instance — use `expect(msg)` if you want a proper `Error` with a custom message.
- **Iterating an `Option`/`Result` only ever yields zero or one item** (`Some`/`Ok` → one, `None`/`Err` → zero), matching Rust's `IntoIterator` semantics — don't expect array-like behavior beyond that.

## License

See the [repository](https://github.com/ALAWIII/results-ts) for license details.
