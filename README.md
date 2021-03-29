# Nest.js Custom TCP Client

## The Problematic

[Nest.js]() microservices can communicate with each other using different transports. Nest.js has its own
implementations for a server and client and there is no example of how to send messages NOT using Nest.js.

But what if we have the ~~legacy~~ current codebase, and we're not ready to rewrite it with Nest.js yet?

## Description

This repository contains custom TCP client which can communicate with the Nest.js TCP server written using TypeScript and Node.js.

> It's not perfect, I think of it as proof of concept.

## Useful Notes

Reverse engineering showed that Nest.js uses the following TCP message format:

```bash
# {length}{delimiter}{data}

75#{"pattern":"example","data":{},"id":"ce51ebd3-32b1-4ae6-b7ef-e018126c4cc4"}
```

ID `data.id` is used for message pattern strategy _(MessagePattern)_, without it Nest.js treats the message as an event _(EventPattern)_.

## Credits

- [Nest.js](https://nestjs.com/)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
