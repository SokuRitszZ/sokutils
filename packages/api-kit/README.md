# API Kit

English | [简体中文](./README.zh-CN.md)

`@sokutils/api-kit` is a composable request configuration utility built on the
native Fetch API. It combines shared configuration, authentication, and
endpoints through `config`, produces dynamic request configuration through
`configPerFetchResolver`, and validates final responses with Zod.

## Installation

```bash
pnpm add @sokutils/api-kit
```

The runtime must provide `fetch`, `Response`, and `URLSearchParams`.

## Quick start

```ts
import {
  ApiKit,
  ApiKitDefineConfigResolver,
} from '@sokutils/api-kit';
import { z } from 'zod/v4-mini';

const UserZod = z.object({
  id: z.string(),
  name: z.string(),
});

const GetUser = (id: string) => {
  return ApiKitDefineConfigResolver(config => ({
    ...config,
    Method: 'GET',
    Path: `users/${encodeURIComponent(id)}`,
    ResponseZod: UserZod,
  }));
};

const api = ApiKit({
  BaseURL: 'https://api.example.com',
});

const user = await api
  .config(GetUser('user-1'))
  .fetch();
```

The type of `user` is inferred from `UserZod`:

```ts
{
  id: string;
  name: string;
}
```

## Creating a reusable API

An `ApiKit` instance exposes three methods:

- `config(resolver)` immediately produces persistent configuration and returns
  a new API Kit instance.
- `configPerFetchResolver(resolver)` sets the dynamic configuration resolver
  that runs before every `fetch()`.
- `fetch()` resolves the final configuration and sends the request.

Every `config` call returns a new instance without mutating the original one, so
base configuration can be reused safely:

```ts
const api = ApiKit({
  BaseURL: 'https://api.example.com',
});

const getUserApi = api.config(GetUser('user-1'));
const getTeamApi = api.config(GetTeam('team-1'));

const [user, team] = await Promise.all([
  getUserApi.fetch(),
  getTeamApi.fetch(),
]);
```

## Defining endpoints

Use `ApiKitDefineConfigResolver` to define reusable endpoints. A resolver should
spread the existing `config` and override only the fields owned by that
endpoint:

```ts
const SearchUsers = (keyword: string, page = 1) => {
  return ApiKitDefineConfigResolver(config => ({
    ...config,
    Method: 'GET',
    Path: 'users/search',
    Query: {
      keyword,
      page,
    },
    ResponseZod: z.object({
      items: z.array(UserZod),
      total: z.number(),
    }),
  }));
};

const result = await api
  .config(SearchUsers('Ada'))
  .fetch();
```

Configuration order determines override priority. A later resolver may override
fields produced by an earlier resolver:

```ts
const request = api
  .config(WithAuthorization(token))
  .config(SearchUsers('Ada'));
```

## Composing headers

`GetHeaders` may return synchronously or asynchronously. When extending existing
headers, await and spread the result of the previous `GetHeaders`:

```ts
const WithAuthorization = (token: string) => {
  return ApiKitDefineConfigResolver(config => ({
    ...config,
    GetHeaders: async () => ({
      ...await config.GetHeaders?.(),
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    }),
  }));
};
```

Do not print Authorization, Cookie, or other sensitive fields from `Debug` or
error handlers.

## Producing dynamic configuration per request

Generate timestamps, signatures, dynamic tokens, and similar values through
`ApiKitDefineConfigPerFetchResolver` before every `fetch()`:

```ts
import {
  ApiKitDefineConfigPerFetchResolver,
} from '@sokutils/api-kit';

const WithDynamicHeaders = () => {
  return ApiKitDefineConfigPerFetchResolver(config => {
    const timestamp = Date.now().toString();

    return {
      ...config,
      GetHeaders: async () => ({
        ...await config.GetHeaders?.(),
        'x-timestamp': timestamp,
        'x-signature': createSignature(timestamp),
      }),
    };
  });
};

const api = ApiKit({
  BaseURL: 'https://api.example.com',
}).configPerFetchResolver(WithDynamicHeaders());
```

An instance currently stores only one `configPerFetchResolver`. Calling
`configPerFetchResolver` again replaces the previous resolver. To apply several
dynamic steps, compose them explicitly inside one resolver.

The per-fetch configuration excludes `ResponseZod`. Define the response type and
Zod schema through persistent `config`.

## Resolving and validating responses

The default `ResponseResolver` calls `response.json()`. Its result is then
validated by `ResponseZod`:

```ts
const GetText = () => {
  return ApiKitDefineConfigResolver(config => ({
    ...config,
    Method: 'GET',
    Path: 'content',
    ResponseResolver: response => response.text(),
    ResponseZod: z.string(),
  }));
};
```

When `ResponseZod` is omitted, the current implementation uses `z.any()` and
does not validate the response structure. Define an explicit schema for every
endpoint whenever possible.

API Kit does not currently check `response.ok` automatically. If non-2xx
responses should fail, handle them explicitly in `ResponseResolver`:

```ts
const ResolveJSON = () => {
  return ApiKitDefineConfigResolver(config => ({
    ...config,
    ResponseResolver: async response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    },
  }));
};
```

## Body and query parameters

`Body` is currently typed as `string`. Serialize JSON and set Content-Type in
the caller:

```ts
const CreateUser = (input: { name: string }) => {
  return ApiKitDefineConfigResolver(config => ({
    ...config,
    Method: 'POST',
    Path: 'users',
    Body: JSON.stringify(input),
    GetHeaders: async () => ({
      ...await config.GetHeaders?.(),
      'Content-Type': 'application/json',
    }),
    ResponseZod: UserZod,
  }));
};
```

`Query` is converted through `URLSearchParams`. Do not pass `undefined`, `null`,
or nested objects. Filter empty values and encode complex values as strings in
the resolver.

API Kit always inserts `/` between `BaseURL` and `Path`. Prefer a `BaseURL`
without a trailing slash and a `Path` without a leading slash:

```ts
ApiKit({ BaseURL: 'https://api.example.com' });

// Preferred
{ Path: 'users' }

// Avoid producing a double slash
{ Path: '/users' }
```

## Handlers and debugging

```ts
const observableApi = api.config(config => ({
  ...config,
  ResponseHandlers: [
    response => console.log('response', response),
  ],
  ErrorHandlers: [
    error => console.error('request failed', error),
  ],
  Debug: (finalConfig, headers, url) => {
    console.log(finalConfig.Method, url, headers);
  },
}));
```

Execution order:

1. Run `configPerFetchResolver`.
2. Produce the URL and headers.
3. Call `Debug(config, headers, url)`.
4. Call native `fetch`.
5. Run `ResponseResolver`.
6. Validate with `ResponseZod`.
7. Call each `ResponseHandlers` entry.
8. Return the resolved and validated result.

Errors from Fetch, response resolution, Zod validation, or `ResponseHandlers`
enter `ErrorHandlers` and are then rethrown to the caller. Handler Promise
results are not currently awaited, so handlers are best suited to synchronous
notifications. Put asynchronous work that must complete in the caller.

Errors thrown by the per-fetch resolver, `GetHeaders`, or `Debug` occur before
the current `ErrorHandlers` chain and do not trigger `ErrorHandlers`.

## Configuration fields

| Field | Type | Description |
| --- | --- | --- |
| `BaseURL` | `string` | API base URL |
| `Path` | `string` | Current endpoint path |
| `Method` | `string` | Fetch request method |
| `Body` | `string` | Native Fetch request body |
| `Query` | `Record<string, any>` | Query parameters converted with URLSearchParams |
| `GetHeaders` | `() => MaybePromise<Record<string, any>>` | Produces headers for every request |
| `ResponseResolver` | `(response: Response) => any` | Converts the raw Response into data to validate |
| `ResponseZod` | `ZodMiniType<ResponseType>` | Validates the response and determines the `fetch()` result type |
| `ResponseHandlers` | `ApiKitResponseHandler<ResponseType>[]` | Synchronous handlers called after resolution and validation |
| `ErrorHandlers` | `ApiKitErrorHandler[]` | Synchronous handlers for errors in the request chain |
| `Debug` | `(...messages: any[]) => void` | Debug callback called before sending the request |

## Exports

```ts
ApiKit
ApiKitDefineConfigResolver
ApiKitDefineConfigPerFetchResolver

TApiKit
ApiKitConfig
ApiKitConfigPerFetch
ApiKitConfigResolver
ApiKitConfigPerFetchResolver
ApiKitResponseHandler
ApiKitErrorHandler
MaybePromise
```
