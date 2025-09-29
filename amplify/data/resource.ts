import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Action: a
    .model({
      // Basic action info
      name: a.string().required(),
      description: a.string(),
      
      // Action type (encourage/avoid)
      type: a.enum(['ENCOURAGE', 'AVOID']),
      
              // Progress tracking
              progressPoints: a.integer(),
              targetCount: a.integer(),
              frequency: a.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONETIME']),
      
      // Completion tracking
      completed: a.boolean(),
      completedAt: a.datetime(),
      
      // Time of day preference
      timeOfDay: a.enum(['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING']),
      
      // Ordering and organization
      orderIndex: a.integer().default(0),
      
      // Timestamps
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  DailyLog: a
    .model({
      // Reference to the action
      actionId: a.string().required(),
      
      // Daily progress tracking
      count: a.integer().required(),
      points: a.integer().required(),
      
      // Date for this log entry
      date: a.string().required(), // YYYY-MM-DD format
      
      // Timestamps
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
