FROM node:20-alpine

WORKDIR /app


COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "VITE_API_URL=http://host.docker.internal:5000 npm run dev -- --host 0.0.0.0"]
