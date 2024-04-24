FROM gillian:latest

LABEL maintaner "Karthik Ambu"

WORKDIR /app/Gillian/

RUN esy

RUN esy release

RUN npm remove -g gillian-platform

RUN npm install -g _release/