local:
docker build -t sandunr/simmanager .
docker run -p 8000:8000 --name simmanager -d sandunr/simmanager
docker push sandunr/simmanager:latest

droplet:
docker run -p 8000:8000 --net=host -d sandunr/simmanager


// https://geko.cloud/en/nginx-letsencrypt-certbot-docker-alpine/
// https://gock.net/blog/2017/lets-encrypt-nginx-web-server-webroot-plugin/