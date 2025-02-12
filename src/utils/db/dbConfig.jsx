import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
const sql = neon(
  "postgresql://hellobhai_owner:adNA9i5uPrkm@ep-flat-shape-a5k1shjy.us-east-2.aws.neon.tech/hellobhai?sslmode=require"
);
export const db = drizzle(sql, { schema });
