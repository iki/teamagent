import { Schema } from "effect";
export class ChannelError extends Schema.TaggedError<ChannelError>()("ChannelError", {
  code: Schema.Literals([
    "invalid",
    "unauthorized",
    "conflict",
    "busy",
    "capacity",
    "processing",
    "storage",
    "cancelled",
  ]),
  message: Schema.String.check(Schema.isMaxLength(1000)),
}) {}
