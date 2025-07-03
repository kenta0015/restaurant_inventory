// api-server/server.ts
import express from 'express';
import cors from 'cors';
import ocrRouter from './ocr'; // ✅ default import

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/ocr', ocrRouter); // ✅ Router をマウント

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});
