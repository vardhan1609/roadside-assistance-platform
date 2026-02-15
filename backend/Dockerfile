FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]


# docker build -t my-node-backend .
# docker run -p 5000:5000 my-node-backend
