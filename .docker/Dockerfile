FROM node:12-alpine

WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src
RUN npm ci --quiet && npm run build
#RUN npm install
RUN ls
#RUN npm run build
#COPY ./dist/ .


#RUN apt-get update && apt-get install -y cron
#RUN mkdir -p /usr/src/app
#COPY ./.docker/crontab /tmp/crontab
#RUN touch /etc/cron.d/my-cron-job
#RUN chmod 0644 /etc/cron.d/my-cron-job
#RUN touch /var/log/cron.log
#COPY ./.docker/setupCron.sh /tmp/setupCron.sh
#RUN chmod +x /tmp/setupCron.sh
#CMD ["/tmp/setupCron.sh"]