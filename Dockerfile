FROM node:iron-trixie-slim

RUN apt-get update

RUN apt-get install git -y

RUN git clone https://github.com/Adammantium/AMP-Discord-Bot.git /usr/src/app

WORKDIR /usr/src/app

RUN git fetch
RUN git pull

RUN npm install

RUN apt-get install dirmngr ca-certificates gnupg -y
RUN gpg --homedir /tmp --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/mono-official-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
RUN chmod +r /usr/share/keyrings/mono-official-archive-keyring.gpg
RUN "deb [signed-by=/usr/share/keyrings/mono-official-archive-keyring.gpg] https://download.mono-project.com/repo/debian stable-buster main" | tee /etc/apt/sources.list.d/mono-official-stable.list

RUN apt-get update
RUN apt-get install mono-complete nano -y

RUN mkdir /usr/src/app/serverfiles

EXPOSE 20000-20500

CMD [ "node", "index.js" ]
