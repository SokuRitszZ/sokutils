# API Kit

[English](./README.md) | 简体中文

`@sokutils/api-kit` 是一个基于原生 Fetch API 的可组合请求配置工具。它通过
`config` 组合基础配置、鉴权和 endpoint，通过 `configPerFetchResolver`
生成每次请求所需的动态配置，并使用 Zod 校验最终响应。

## 安装

```bash
pnpm add @sokutils/api-kit
```

运行环境需要提供 `fetch`、`Response` 和 `URLSearchParams`。

## 快速开始

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

`user` 的类型由 `UserZod` 推导为：

```ts
{
  id: string;
  name: string;
}
```

## 创建可复用 API

`ApiKit` 返回的实例包含三个方法：

- `config(resolver)`：立即生成一份新的持久配置，并返回新的 API Kit 实例。
- `configPerFetchResolver(resolver)`：设置每次 `fetch()` 前执行的动态配置 resolver。
- `fetch()`：解析最终配置并发起请求。

每次 `config` 都返回新实例，不会修改原实例，因此基础配置可以安全复用：

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

## 定义 endpoint

使用 `ApiKitDefineConfigResolver` 定义可复用 endpoint。Resolver 应展开已有
`config`，只覆盖当前 endpoint 负责的字段：

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

配置顺序决定覆盖顺序，后执行的 resolver 可以覆盖前面的字段：

```ts
const request = api
  .config(WithAuthorization(token))
  .config(SearchUsers('Ada'));
```

## 组合 Headers

`GetHeaders` 支持同步或异步返回。扩展已有 Headers 时，应先等待并展开原
`GetHeaders` 的结果：

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

不要在 `Debug` 或错误处理器中输出 Authorization、Cookie 或其他敏感字段。

## 每次请求前生成动态配置

时间戳、签名、动态 token 等内容应通过
`ApiKitDefineConfigPerFetchResolver` 在每次 `fetch()` 前生成：

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

当前一个实例只保存一个 `configPerFetchResolver`。再次调用
`configPerFetchResolver` 会替换原 resolver；需要多个动态步骤时，在一个
resolver 内显式组合它们。

动态 resolver 不包含 `ResponseZod`。响应类型和 Zod schema 应通过
`config` 持久配置。

## 解析和校验响应

默认 `ResponseResolver` 调用 `response.json()`。解析结果随后交给
`ResponseZod` 校验：

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

如果没有提供 `ResponseZod`，当前实现使用 `z.any()`，不会对响应做结构校验。
推荐每个 endpoint 都提供明确 schema。

API Kit 当前不会自动检查 `response.ok`。需要把非 2xx 状态视为错误时，在
`ResponseResolver` 中显式处理：

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

## Body 和 Query

`Body` 当前类型为 `string`，发送 JSON 时由调用方负责序列化并设置
Content-Type：

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

`Query` 会通过 `URLSearchParams` 转为字符串。不要传入 `undefined`、`null`
或嵌套对象；请在 resolver 中先过滤空值并把复杂值编码为字符串。

`BaseURL` 和 `Path` 之间始终插入 `/`。推荐 `BaseURL` 不以 `/` 结尾，
`Path` 不以 `/` 开头：

```ts
ApiKit({ BaseURL: 'https://api.example.com' });

// 推荐
{ Path: 'users' }

// 避免生成双斜杠
{ Path: '/users' }
```

## Handlers 和调试

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

执行顺序：

1. 运行 `configPerFetchResolver`。
2. 生成 URL 和 Headers。
3. 调用 `Debug(config, headers, url)`。
4. 调用原生 `fetch`。
5. 运行 `ResponseResolver`。
6. 使用 `ResponseZod` 校验。
7. 依次调用 `ResponseHandlers`。
8. 返回解析并校验后的结果。

Fetch、响应解析、Zod 校验或 `ResponseHandlers` 抛出的错误会进入
`ErrorHandlers`，之后仍会继续向调用方抛出。Handlers 的异步返回值当前不会
被等待，适合执行同步通知；需要保证完成的异步逻辑应放在调用方。

在动态 resolver、`GetHeaders` 或 `Debug` 阶段抛出的错误发生在当前
`ErrorHandlers` 链之前，不会触发 `ErrorHandlers`。

## 配置字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `BaseURL` | `string` | API 基础地址 |
| `Path` | `string` | 当前 endpoint 路径 |
| `Method` | `string` | Fetch 请求方法 |
| `Body` | `string` | 原生 Fetch 请求体 |
| `Query` | `Record<string, any>` | 转为 URLSearchParams 的查询参数 |
| `GetHeaders` | `() => MaybePromise<Record<string, any>>` | 每次请求时生成 Headers |
| `ResponseResolver` | `(response: Response) => any` | 把原始 Response 转成待校验数据 |
| `ResponseZod` | `ZodMiniType<ResponseType>` | 校验响应并决定 `fetch()` 返回类型 |
| `ResponseHandlers` | `ApiKitResponseHandler<ResponseType>[]` | 响应成功解析和校验后的同步处理器 |
| `ErrorHandlers` | `ApiKitErrorHandler[]` | 请求链错误的同步处理器 |
| `Debug` | `(...messages: any[]) => void` | 请求发起前的调试回调 |

## 导出

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
