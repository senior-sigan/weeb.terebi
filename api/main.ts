import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/ongoing', (c) => {
  return c.text('LOL2')
});

export default app
