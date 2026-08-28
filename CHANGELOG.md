## 8.0.0

### Breaking Changes

- **Package rename**: Package renamed from `ts-results-es` to `@allawiii/results-ts`.
- **`None` is now a factory function** (`None()` instead of `None` constant). This ensures consistent type inference and prevents shared mutable state.
- **Removed `Result.toOption()`** — replaced by explicit `Result.ok()` (discards error) and `Result.err()` (discards success). This removes ambiguity.
- **Removed `AsyncResult.toOption()`** — use `AsyncResult.ok()` instead.
- **Removed `Option.toResult(error)`** — replaced by `Option.okOr(error)` and `Option.okOrElse(() => error)` for clarity and consistency with Rust.
- **`Err.unwrap()` now throws the error value directly** instead of wrapping it in an `Error` object with a stack trace. This makes behavior consistent with Rust and simplifies error handling.
- **`Err.expect(msg)` now throws `new Error(\`${msg}: ${error}\`)**` instead of using the previous stack-aware formatting.
- **`Ok.expectErr(msg)` now throws `new Error(\`${msg}: ${value}\`)**`for consistency with`Err.expect`.
- **`Ok.unwrapErr()` throws the success value directly** (instead of wrapping it in an `Error`).

### Added

#### `Result<T, E>` extensions

- **`Result.isOkAnd(predicate)`** — returns `true` if `Ok` and value satisfies predicate.
- **`Result.isErrAnd(predicate)`** — returns `true` if `Err` and error satisfies predicate.
- **`Result.and(res)`** — eager version of `andThen`; returns `res` if `Ok`, otherwise returns self.
- **`Result.inspect(fn)`** — calls `fn` with the `Ok` value (if any), then returns self. Useful for side effects like logging.
- **`Result.inspectErr(fn)`** — calls `fn` with the `Err` value (if any), then returns self.
- **`Result.flatten()`** — collapses `Result<Result<T, E>, E>` into `Result<T, E>` (single level).
- **`Result.collapse(depth?)`** — recursively flattens nested `Result`s up to the specified depth (default: `Infinity`). Depth `0` or negative leaves the `Result` unchanged.
- **`Result.transpose()`** — converts `Result<Option<T>, E>` to `Option<Result<T, E>>` (swaps the layers).
- **`Result.ok()`** — converts `Result<T, E>` to `Option<T>`, discarding the error.
- **`Result.err()`** — converts `Result<T, E>` to `Option<E>`, discarding the success value.

#### `Option<T>` extensions

- **`Option.isSomeAnd(predicate)`** — returns `true` if `Some` and value satisfies predicate.
- **`Option.isNoneOr(predicate)`** — returns `true` if `None` or if `Some` and value satisfies predicate.
- **`Option.and(optb)`** — eager version of `andThen`; returns `optb` if `Some`, otherwise `None`.
- **`Option.filter(predicate)`** — returns `Some(v)` if `Some(v)` and `predicate(v)` is truthy, otherwise `None`.
- **`Option.flatten()`** — collapses `Option<Option<T>>` into `Option<T>` (single level).
- **`Option.collapse(depth?)`** — recursively flattens nested `Option`s up to the specified depth (default: `Infinity`). Depth `0` or negative leaves the `Option` unchanged.
- **`Option.transpose()`** — converts `Option<Result<T, E>>` to `Result<Option<T>, E>` (swaps the layers).
- **`Option.okOr(error)`** — converts `Option<T>` to `Result<T, E>`, mapping `None` to `Err(error)`.
- **`Option.okOrElse(() => error)`** — converts `Option<T>` to `Result<T, E>`, lazily computing the error for `None`.
- **`Option.xor(other)`** — returns `Some` if exactly one of `self` or `other` is `Some`, otherwise `None` (exclusive-or).

#### `AsyncResult<T, E>` extensions

- **`AsyncResult.inspect(fn)`** — async-aware `Result.inspect`.
- **`AsyncResult.inspectErr(fn)`** — async-aware `Result.inspectErr`.
- **`AsyncResult.and(res)`** — async-aware `Result.and`.
- **`AsyncResult.ok()`** — async-aware `Result.ok`.
- **`AsyncResult.err()`** — async-aware `Result.err`.

#### `AsyncOption<T>` extensions

- **`AsyncOption.and(optb)`** — async-aware `Option.and`.
- **`AsyncOption.filter(predicate)`** — async-aware `Option.filter`.
- **`AsyncOption.okOr(error)`** — async-aware `Option.okOr`.
- **`AsyncOption.okOrElse(() => error)`** — async-aware `Option.okOrElse`.
- **`AsyncOption.xor(other)`** — async-aware `Option.xor`.

### Changed

- **`Result.andThen`** now preserves the same error type `E` instead of unioning `E | E2`. To use a different error type, call `.mapErr` before or after.
- **`AsyncResult.andThen`** now preserves error type `E` (same as `Result.andThen`).
- **`Option.andThen`** and **`AsyncOption.andThen`** now preserve type consistency.
- **`Result.map` / `Result.mapErr` / `Option.map`** now preserve types more accurately when transforming to `never` or switching between `Ok` and `Err`.
- **Package manager**: switched from `npm` to `pnpm` for faster installs and deterministic lockfiles.
- **Test runner**: migrated from `Jest` to `Vitest` (faster, better TypeScript integration, modern ESM support).

### Fixed

- **Type inference** for deeply nested `Result` and `Option` chains is now more reliable (thanks to improved conditional types).
- **`AsyncResult` and `AsyncOption`** are now fully awaitable as thenables (no need to access `.promise` in many cases).
- **`Option.isOption`** and **`Result.isResult`** now correctly identify instances created via factory functions (`Some()`, `None()`, `Ok()`, `Err()`).
- **`Result.partition`** now works correctly with arrays of mixed `Result` types.
- **`Result.all`** now correctly preserves the order of keys/values in object mode.

### Removed

- `Result.toOption()` — use `Result.ok()` or `Result.err()` instead.
- `Option.toResult(error)` — use `Option.okOr(error)` or `Option.okOrElse(() => error)` instead.
- `AsyncResult.toOption()` — use `AsyncResult.ok()` instead.
- `AsyncOption.toResult(error)` — use `AsyncOption.okOr(error)` or `AsyncOption.okOrElse(() => error)` instead.
- **Jest** configuration and `package-lock.json` (replaced by `pnpm-lock.yaml` and Vitest config).

### Docs

- Updated all JSDoc comments to include clearer examples and more complete API coverage.
- Added examples for all new methods (`flatten`, `collapse`, `transpose`, `inspect`, `okOr`, `xor`, etc.).
- Improved type-level documentation for conditional types (`TransposeOption`, `CollapseOption`, `CollapseResult`, etc.).

### Internal & Tooling

- **TypeScript target**: upgraded from `ES5` to `ES2022` for better performance and modern JavaScript features.
- **Module system**: switched from UMD to ESM/CJS dual packaging (via `tsconfig-cjs.json` and `tsconfig-esm.json`).
- **Code structure**: reorganized tests into logical folders (`option/`, `result/`) for better maintainability.
- **Coverage**: added Vitest coverage reporting (v8 provider) with `test:coverage` script.
- **Lockfile**: added `pnpm-lock.yaml` for deterministic dependency management.
- **TypeScript version**: upgraded to `5.8.3` and added `@types/node` for better Node.js integration.
- **Prettier**: ensured all code and config files are consistently formatted.
- **Gitignore**: added `dev-docs/` folder to ignore local development documentation.

---

**Migration guide** (from `ts-results-es@7.x`):

1. Replace `None` with `None()` everywhere.
2. Replace `Option.toResult(error)` with `Option.okOr(error)` or `Option.okOrElse(() => error)`.
3. Replace `Result.toOption()` with `Result.ok()` (if you want the success value) or `Result.err()` (if you want the error).
4. Replace `AsyncResult.toOption()` with `AsyncResult.ok()` or `AsyncResult.err()`.
5. Replace `AsyncOption.toResult(error)` with `AsyncOption.okOr(error)` or `AsyncOption.okOrElse(() => error)`.
6. Update imports from `'ts-results-es'` to `'@allawiii/results-ts'`.
7. If you relied on `Err.unwrap()` throwing an `Error` object with a stack trace, adapt your error handling to catch the raw error value directly.

# 7.1.0

Release date: 2026-07-01.

Added:

- Added object overload for `Result.all`, accepting any object type with
  `Result` values (preserving per-key types). By default, it short-circuits
  with the first error and returns the property name and error. Passing
  `{ errors: 'all' }` collects all errors.

# 7.0.0

Release date: 2026-02-16.

Backwards incompatible:

- Removed the `Result.else` method, use `Result.unwrapOr` instead.
- Removed the `Some.safeUnwrap` and `Ok.safeUnwrap` methods, use the
  `value` property instead.

Added:

- Added `Option.fromNullable`, `Option.fromOptional`, and `Option.fromNullish`
  static methods for converting nullable, optional, and nullish values to
  `Option`.
- Added array parameter overloads for `Option.all` and `Option.any`,
  allowing `Option.all([a, b, c])` instead of `Option.all(a, b, c)`.

Deprecated:

- The parameter spread variants of `Option.all` and `Option.any` are now
  deprecated. Use the new array parameter overloads instead.

# 6.0.0

Backwards incompatible:

- Fixed `Result`'s `andThen` and `orElse` signatures to fix situations where they
  couldn't be called (`This expression is not callable`). That comes at the cost of:

    1. Reduced type narrowing when the input type is known to be `Ok` or `Err`.
    2. Reduced type narrowing when the mapper function always returns `Ok` or
       always returns `Err`. Possible workaround: use more appropriate methods like
       `map` and `mapErr`.
    3. Type inference failure when the mapper function is generic. The failure is visible
       the `Ok` type being inferred as `unknown`. Workaround: instead of
       `andThen(someGenericFunction)` use `andThen((v) => someGenericFunction(v))`.

Added:

- Made `AsyncOption` and `AsyncResult` awaitable - you can now use `await asyncResult`
  instead of `await asyncResult.promise`.

# 5.0.1

Fixed:

- Fixed the regression introduced in 5.0.0 as part of the `AsyncResult.andThen` fix. The fix
  is completely reverted for now.

# 5.0.0

Backwards incompatible:

- Changed `Option` and `Result` iterator behavior such that iterating `Some` and `Ok` will
  instead produce only one result – the wrapped value. Previously the iteration depended on
  the type of the wrapped value (iteratable or not) and produced results obtained by iterating
  the wrapped values.

    For example:

    ```
    const o: Option<number[]> = Some([1, 2, 3])
    const rs = Array.from(o)
    // Previously: rs was [1, 2, 3]
    // Now: rs equals [[1, 2, 3]]
    ```

    Iterating `None` and `Err` is not affected and continues to produce no results.

- Removed the parameter spread variants of `Result.all` and `Result.any`. Both of these
  methods now only take a single array parameter (the array parameter has already been
  supported for a while).

Fixed:

- Fixed `Result.or` and `Result.orElse` method types to actually be callable and return
  reasonable types when called.
- Attempted to fix `AsyncResult.andThen` to return the correct type when the provided callback
  always returns an `Ok`.
  This attempt has been (for now) reverted in 5.0.1 as it created other problems.
- Fixed the `Result.partition` signature.

Added:

- `Option.unwrapOrElse`
- `Result.unwrapOrElse`

# 4.2.0

Added:

- Added a non-spread (you can pass an array as a single parameter) variant of `Result.all`
- Added a new `Result.partition` convenience method

# 4.1.0

- A whole bunch of documentation changes
- Introduced `AsyncResult` to allow composing results with asynchronous code
- Introduced `AsyncOption` as well
- Fixed `Option.any` behavior
- Fixed an edge case in using `ts-results-es` in CommonJS projects

# 4.0.0

- Improved the documentation
- Fixed the rxjs-operators submodules type declarations for CommonJS code
- Changed `Result.orElse()` and `Result.mapOrElse()` error-handling callback to take
  the error as an argument (consistent with the original Rust methods)

Backwards incompatible:

- A bunch of renames:
    - `Some.val` -> `Some.value`
    - `Result.val` -> `Ok.value` and `Err.error`
    - `Option.some` -> `Option.isSome()`
    - `Option.none` -> `Option.isNone()`
    - `Result.ok` -> `Result.isOk()`
    - `Result.err` -> `Result.isErr()`

# 3.6.1

- Improved the documentation a little bit
- Fixed rxjs-operators module imports, thanks to Jacob Nguyen

# 3.6.0

- Added `or()` and `orElse()` methods to both `Option` and `Result`

# 3.5.0

- Added `andThen()` documentation, thanks to Drew De Ponte
- Added the `expectErr()` method to `Result`, thanks to TheDudeFromCI
- Added `mapOr()` and `mapOrElse()` to both `Option` and `Result`

# 3.4.0

- Fixed some type errors that prevented the package from being built with recent
  TypeScript versions
- Fixed ESM compatibility so that client code can use named imports without resorting
  to workarounds (fixes https://github.com/vultix/ts-results/issues/37)

# 3.3.0

Big thank you to [@petehunt](https://github.com/petehunt) for all his work adding stack traces to `Err`.

- Added a `stack` property to all `Err` objects. Can be used to pull a stack trace
- Added `toOption` and `toResult` methods for converting between `Option` and `Result` objects

# v3.2.1

- Fix regression found in [Issue#24](https://github.com/vultix/ts-results/issues/24)

# v3.2.0

- Fixes for Typescript 4.2

# v3.1.0

Big thank you to [@petehunt](https://github.com/petehunt) for all his work adding the `Option` type.

### New Features

- Added new `Option<T>`, `Some<T>`, and `None` types!

    - You should feel at home if you're used to working with Rust:

        ```typescript
        import { Option, Some, None } from 'ts-results';

        const optionalNum: Option<number> = Some(3).map((num) => num * 2);

        if (optionalNum.some) {
            console.log(optionalNum.val === 6); // prints `true`
        }

        const noneNum: Option<number> = None;

        if (noneNum.some) {
            // You'll never get in here
        }
        ```

- Added new `Option.isOption` and `Result.isResult` helper functions.

### Other Improvements

- Got to 100% test coverage on all code!
- Removed uses of `@ts-ignore`

# v3.0.0

Huge shout out to [@Jack-Works](https://github.com/Jack-Works) for helping get this release out. Most of the work was
his, and it would not have happened without him.

### New Features

- `Ok<T>` and `Err<T>` are now callable without `new`!
- No longer breaks when calling from node
- Tree-shakable when using tools like rollup or webpack
- Fully unit tested
- Added these helper functions:
    - `Result.all(...)` - Same as `Results` from previous releases. Collects all `Ok` values, or returns the first `Err`
      value.
    - `Results.any(...)` - Returns the first `Ok` value, or all of the `Err` values.
    - `Result.wrap<T, E>(() => ...)` - Wraps an operation that may throw an error, uses try / catch to return
      a `Result<T, E>`
    - `Result.wrapAsync<T, E>(() => ...)` - Same as the above, but async
- Deprecated `else` in favor of `unwrapOr` to prefer api parity with Rust

# v2.0.1

### New Features

- **core:** Added `reaonly static EMPTY: Ok<void>;` to `Ok` class.
- **core:** Added `reaonly static EMPTY: Err<void>;` to `Err` class.

# v2.0.0

This release features a complete rewrite of most of the library with one focus in mind: simpler types.

The entire library now consists of only the following:

- Two classes: `Ok<T>` and `Err<E>`.
- A `Result<T, E>` type that is a simple or type between the two classes.
- A simple `Results` function that allows combining multiple results.

### New Features

- **core:** much simpler Typescript types
- **rxjs:** added new `filterResultOk` and `filterResultErr` operators
- **rxjs:** added new `resultMapErrTo` operator

### Breaking Changes

- **core:** `Err` and `Ok` now require `new`:
    - **Before:** `let result = Ok(value); let error = Err(message);`
    - **After:** `let result = new Ok(value); let error = new Err(message);`
- **core:** `map` function broken into two functions: `map` and `mapErr`
    - **before**: `result.map(value => "new value", error => "new error")`
    - **after**: `result.map(value => "newValue").mapError(error => "newError")`
- **rxjs:** `resultMap` operator broken into two operators: `resultMap` and `resultMapErr`
    - **before**: `obs.pipe(resultMap(value => "new value", error => "new error"))`
    - **after**: `result.pipe(resultMap(value => "newValue"), resultMapError(error => "newError"))`
