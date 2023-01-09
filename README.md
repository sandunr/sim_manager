local:
docker build -t sandunr/simmanager .
docker run -p 8000:8000 -d sandunr/simmanager
docker push sandunr/simmanager:latest

droplet:
docker run -p 8000:8000 -d sandunr/simmanager