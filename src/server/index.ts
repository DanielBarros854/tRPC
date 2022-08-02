import * as trpc from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express';
import express from 'express';
import { z } from 'zod'
import { Users } from '../data'

const appRouter = trpc
.router()
.query('', {
  resolve() {
    return { message: 'Server is Running!' };
  }
})
.query('getUsers', {
  // validation without lib
  // input: (val?: unknown) => {
  //   if (typeof val === 'string' || typeof val === 'undefined') return val
  //   throw new Error(`Invalid input: ${typeof val}`)
  // },
  input: z.string(),
  async resolve(req) {
    const id: string | undefined = req?.input;

    if (id) {
      const user = Users.find((user) => user.id === id);

      if (user) {
        return user;
      }

      throw new Error('User Not Found')
    }

    return Users
  },
})
.mutation('createUser', {
  input: z.object({
    name: z.string().min(5)
  }),
  async resolve({ input }) {
    Users.push(
      {
        id: (Users.length + 1).toString(),
        name: input.name,
      }
    )

    return Users[Users.length - 1]
  }
})
.mutation('updateUser', {
  input: z.object({
    id: z.string(),
    fields: z.object({
      name: z.string().min(5)
    })
  }),
  async resolve({ input }) {
    const user = Users.find((user) => user.id === input.id)

    if (user) {
      user.name = input.fields.name
      return user
    }
    
    throw new Error('User Not Found')
  }
})
.mutation('deleteUser', {
  input: z.object({ id: z.string() }),
  async resolve({ input }) {
    const index = Users.findIndex((user) => user.id === input.id)

    if (index > -1) {
      Users.splice(index, 1)
      return { removed: true }
    } 

    throw new Error('User Not Found')
  }
})

const app = express();

const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({})

type Context = trpc.inferAsyncReturnType<typeof createContext>;

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(4000)

console.log(`Server is running at port: http://localhost:4000/trpc`);

export type AppRouter = typeof appRouter;
