FROM node:10.0
# RUN mkdir -p /LAPAN/api-mt/api-mtV2/node_modules && chown -R node:node /LAPAN/api-mt/api-mtV2
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
RUN git clone http://kresno:Enigm4777@scm.lapan.go.id/kresno/api-gatewayV2.git
RUN rm -rf /var/lib/apt/lists/* 
# WORKDIR /LAPAN/api-mt/api-mtV2 
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
CMD npm run dev
