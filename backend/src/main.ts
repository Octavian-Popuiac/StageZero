import express from 'express';
import type { Express, Response, Request} from 'express';

import dotenv from 'dotenv';

import router from './router';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use('/', router());
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API is working'
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});