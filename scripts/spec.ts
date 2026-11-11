// The subset of OpenAPI 3.1 / JSON Schema that Alpaca's specs use, as far as the generator reads it.

export interface Schema {
  $ref?: string;
  type?: string | string[];
  format?: string;
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  additionalProperties?: boolean | Schema;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  discriminator?: { propertyName: string; mapping?: Record<string, string> };
  nullable?: boolean;
  "x-nullable"?: boolean;
  description?: string;
  title?: string;
}

export interface Parameter {
  $ref?: string;
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: Schema;
  style?: string;
  explode?: boolean;
}

export interface MediaType {
  schema?: Schema;
}

export interface ResponseObject {
  $ref?: string;
  description?: string;
  content?: Record<string, MediaType>;
}

export interface RequestBody {
  $ref?: string;
  required?: boolean;
  content?: Record<string, MediaType>;
}

export interface Operation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseObject>;
}

export type Method = "get" | "put" | "post" | "delete" | "patch" | "options";

export type PathItem = Partial<Record<Method, Operation>> & { parameters?: Parameter[] };

export interface Spec {
  openapi: string;
  paths: Record<string, PathItem>;
  components: {
    schemas: Record<string, Schema>;
    parameters?: Record<string, Parameter>;
    responses?: Record<string, ResponseObject>;
    requestBodies?: Record<string, RequestBody>;
  };
}

export const methods: Method[] = ["get", "put", "post", "delete", "patch", "options"];
