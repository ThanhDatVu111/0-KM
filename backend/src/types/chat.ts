export interface Message {
  message_id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

// export interface TypedRequestBody<T> extends Express.Request {
//   body: T;
// }

// export interface TypedRequestQuery<T> extends Express.Request {
//   query: T;
// }

// export interface TypedRequestQueryWithBodyAndParams<Params, ReqBody> extends Express.Request {
//   body: ReqBody;
//   params: Params;
// }

// export interface TypedRequestQueryAndParams<Params, Query> extends Express.Request {
//   params: Params;
//   query: Query;
// }

// export interface TypedRequestQueryWithParams<Params> extends Express.Request {
//   params: Params;
// }

