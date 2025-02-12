FROM node:20-alpine

WORKDIR /src

COPY package.json package-lock.json ./
RUN npm install --force

COPY . .

EXPOSE 5734

CMD ["npm", "run", "dev"]
