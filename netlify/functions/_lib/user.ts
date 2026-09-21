import { eq } from 'drizzle-orm'

import { db } from './db'
import { users } from './schema'
import { emailSchema } from './validators'

export async function getRequestUser(request: Request) {
  const email = emailSchema.parse(request.headers.get('x-user-email') ?? 'demo@neverachef.local')
  const [user] = await db
    .insert(users)
    .values({ email, name: email === 'demo@neverachef.local' ? 'Chef invitado' : email.split('@')[0] })
    .onConflictDoUpdate({ target: users.email, set: { name: users.name } })
    .returning({ id: users.id })
  return user
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) })
}