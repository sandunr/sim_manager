local:
docker build -t sandunr/simmanager .
docker run -p 8000:8000 --name simmanager -d sandunr/simmanager
docker push sandunr/simmanager:latest

droplet:
docker run -p 8000:8000 --net=host -d sandunr/simmanager