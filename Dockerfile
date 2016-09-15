FROM quentinlc/jessie-lxc:latest

MAINTAINER Quent Laporte-Chabasse

RUN apt-get update && \
  curl -sL https://deb.nodesource.com/setup_4.x | bash - && \
  apt-get install -y nodejs

RUN npm install sigver -g


EXPOSE 8000

CMD ["sigver"]
